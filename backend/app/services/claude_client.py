from __future__ import annotations

import json
import re
from typing import Any

from app.core.config import settings
from app.services.gap_analysis import generate_gap_analysis as generate_gap_analysis_fallback

KNOWN_SKILLS = [
    "python",
    "sql",
    "react",
    "typescript",
    "javascript",
    "airflow",
    "fastapi",
    "postgresql",
    "power bi",
    "excel",
    "tableau",
    "aws",
    "azure",
    "docker",
    "git",
]


def _extract_json(payload: str) -> dict[str, Any]:
    cleaned = payload.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Fallback: grab the outer-most JSON object in the payload.
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        return json.loads(cleaned[start : end + 1])

    raise ValueError("Claude response did not include parseable JSON")


def _heuristic_resume_parse(resume_text: str) -> dict[str, Any]:
    text = resume_text or ""
    lower_text = text.lower()

    extracted_skills = [skill.title() for skill in KNOWN_SKILLS if re.search(rf"\b{re.escape(skill)}\b", lower_text)]
    years_match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs)", lower_text)
    experience_years = float(years_match.group(1)) if years_match else 0.0

    internship_hits = re.findall(r"\b(?:internship|intern|co-?op)\b", lower_text)
    internship_count = max(1, len(internship_hits)) if internship_hits else 0

    domains = []
    if any(skill in lower_text for skill in ["sql", "airflow", "tableau", "power bi", "excel"]):
        domains.append("data analytics")
    if any(skill in lower_text for skill in ["react", "typescript", "javascript", "fastapi"]):
        domains.append("web development")
    if any(skill in lower_text for skill in ["postgresql", "airflow", "etl"]):
        domains.append("data engineering")

    education = {
        "degree": "Unknown",
        "program": "Unknown",
        "university": "Unknown",
        "year": None,
    }
    if "university of calgary" in lower_text:
        education["university"] = "University of Calgary"
    if "software engineering" in lower_text:
        education["program"] = "Software Engineering"
    elif "computer science" in lower_text:
        education["program"] = "Computer Science"
    if any(token in lower_text for token in ["bsc", "bachelor"]):
        education["degree"] = "BSc"

    return {
        "skills": extracted_skills,
        "experience_years": experience_years,
        "internship_count": internship_count,
        "projects": [],
        "education": education,
        "domains": domains,
    }


def _anthropic_client():
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
    except Exception:
        return None

    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def parse_resume(resume_text: str) -> dict[str, Any]:
    client = _anthropic_client()
    if client is None:
        return _heuristic_resume_parse(resume_text)

    prompt = f"""
Parse this resume and return JSON in exactly this schema:
{{
  "skills": ["Python", "SQL"],
  "experience_years": 1.5,
  "internship_count": 1,
  "projects": [
    {{"name": "Project Name", "tech_stack": ["Python"], "domain": "data engineering"}}
  ],
  "education": {{
    "degree": "BSc",
    "program": "Software Engineering",
    "university": "University",
    "year": 3
  }},
  "domains": ["data engineering", "web development"]
}}

Resume text:
{resume_text}
"""

    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=1200,
        system="You are a resume parser. Return only valid JSON and no markdown.",
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        return _extract_json(message.content[0].text)
    except Exception:
        return _heuristic_resume_parse(resume_text)


def generate_gap_analysis(
    candidate: dict[str, Any],
    job: dict[str, Any],
    company: dict[str, Any] | None,
    scores: dict[str, float],
) -> dict[str, Any]:
    client = _anthropic_client()
    if client is None:
        return generate_gap_analysis_fallback(candidate, job, scores, company)

    prompt = f"""
Candidate scored {scores["overall"]}/100 for this role.
Candidate profile: {json.dumps(candidate)}
Job requirements: {json.dumps(job)}
Company profile: {json.dumps(company or {})}
Score breakdown: {json.dumps(scores)}

Return only JSON with:
{{
  "verdict": "strong_match|close_miss|significant_gap|not_a_fit",
  "verdict_explanation": "string",
  "gaps": [{{"gap": "string", "impact": "high|medium|low", "score_lost": 12, "fix": "string", "timeframe": "string"}}],
  "strengths": ["string"],
  "company_insight": "string",
  "apply_recommendation": true,
  "resume_tip": "string"
}}
"""

    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=1200,
        system="You are a career coach for tech internship hiring. Return only valid JSON and no markdown.",
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        return _extract_json(message.content[0].text)
    except Exception:
        return generate_gap_analysis_fallback(candidate, job, scores, company)

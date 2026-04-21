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
    "css",
    "node",
    "flask",
    "pandas",
    "numpy",
    "scikit-learn",
]

SECTION_BOUNDARIES = [
    "summary",
    "education",
    "experience",
    "work experience",
    "projects",
    "skills",
    "certifications",
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
    lines = [line.strip() for line in re.split(r"[\r\n]+", text) if line.strip()]

    extracted_skills = [skill.title() for skill in KNOWN_SKILLS if re.search(rf"\b{re.escape(skill)}\b", lower_text)]
    years_match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs)", lower_text)
    experience_years = float(years_match.group(1)) if years_match else 0.0

    internship_lines = [line for line in lines if re.search(r"\b(?:intern|internship|co-?op)\b", line, flags=re.IGNORECASE)]
    internship_count = len(internship_lines)
    if internship_count == 0:
        internship_hits = re.findall(r"\b(?:internship|intern|co-?op)\b", lower_text)
        internship_count = max(1, len(internship_hits)) if internship_hits else 0

    internship_skills = []
    for line in internship_lines:
        line_lower = line.lower()
        internship_skills.extend(
            skill.title()
            for skill in KNOWN_SKILLS
            if re.search(rf"\b{re.escape(skill)}\b", line_lower)
        )
    internship_skills = sorted(set(internship_skills))

    experience_items = []
    for line in internship_lines[:8]:
        line_clean = line.strip(" -•*")
        if not line_clean:
            continue
        experience_items.append(
            {
                "title": line_clean[:120],
                "company": "",
                "duration": "",
                "highlights": [],
            }
        )

    def _extract_project_lines() -> list[str]:
        in_projects = False
        project_lines: list[str] = []
        for line in lines:
            normalized = line.lower().strip(":")
            if normalized in ["projects", "project experience", "selected projects"]:
                in_projects = True
                continue
            if in_projects and normalized in SECTION_BOUNDARIES:
                break
            if in_projects:
                project_lines.append(line)
        return project_lines

    project_lines = _extract_project_lines()
    projects: list[dict[str, Any]] = []
    current_project: dict[str, Any] | None = None
    for line in project_lines:
        if line.startswith(("-", "•", "*")):
            if current_project:
                current_project.setdefault("description", "")
                current_project["description"] = f"{current_project['description']} {line.lstrip('-•* ').strip()}".strip()
            continue

        current_project = {"name": line[:120], "tech_stack": [], "domain": "unknown"}
        line_lower = line.lower()
        stack = [skill.title() for skill in KNOWN_SKILLS if re.search(rf"\b{re.escape(skill)}\b", line_lower)]
        current_project["tech_stack"] = sorted(set(stack))
        if any(skill in line_lower for skill in ["sql", "tableau", "power bi", "excel", "pandas"]):
            current_project["domain"] = "data analytics"
        elif any(skill in line_lower for skill in ["react", "javascript", "typescript", "css", "node"]):
            current_project["domain"] = "web development"
        elif any(skill in line_lower for skill in ["airflow", "postgresql", "etl"]):
            current_project["domain"] = "data engineering"

        projects.append(current_project)

    if not projects:
        projects = []

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

    merged_skills = sorted(set(extracted_skills + internship_skills))

    return {
        "skills": merged_skills,
        "experience_years": experience_years,
        "internship_count": internship_count,
        "experience_items": experience_items,
        "projects": projects,
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
  "experience_items": [
    {{"title": "Software Developer Intern", "company": "Example", "duration": "May 2025 - Aug 2025", "highlights": ["Built API"]}}
  ],
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

    try:
        message = client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=1200,
            system="You are a resume parser. Return only valid JSON and no markdown.",
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception:
        return _heuristic_resume_parse(resume_text)

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

    try:
        message = client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=1200,
            system="You are a career coach for tech internship hiring. Return only valid JSON and no markdown.",
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception:
        return generate_gap_analysis_fallback(candidate, job, scores, company)

    try:
        return _extract_json(message.content[0].text)
    except Exception:
        return generate_gap_analysis_fallback(candidate, job, scores, company)

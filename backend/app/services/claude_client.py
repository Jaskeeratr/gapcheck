from __future__ import annotations

import json
import re
from typing import Any

from app.core.config import settings
from app.services.gap_analysis import generate_gap_analysis as generate_gap_analysis_fallback
from app.services.skill_normalization import normalize_skill_name

KNOWN_SKILLS = [
    "python",
    "sql",
    "react",
    "typescript",
    "javascript",
    "airflow",
    "fastapi",
    "postgresql",
    "postgres",
    "power bi",
    "excel",
    "tableau",
    "aws",
    "aws s3",
    "azure",
    "docker",
    "git",
    "css",
    "html5",
    "node",
    "node.js",
    "express",
    "flask",
    "pandas",
    "numpy",
    "scikit-learn",
    "snowflake",
    "mysql",
    "rest apis",
    "claude api",
]

SECTION_BOUNDARIES = [
    "summary",
    "education",
    "technical skills",
    "skills",
    "experience",
    "work experience",
    "projects",
    "project experience",
    "selected projects",
    "leadership",
    "certifications",
]

PROJECT_STACK_HINTS = set(KNOWN_SKILLS) | {"etl", "ml", "dashboard", "backend", "frontend"}
PROJECT_BULLET_RE = re.compile(r"\s*[•]\s*")


def _extract_json(payload: str) -> dict[str, Any]:
    cleaned = payload.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start >= 0 and end > start:
        return json.loads(cleaned[start : end + 1])

    raise ValueError("Claude response did not include parseable JSON")


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").replace("â€¢", "•")).strip()


def _resume_lines(resume_text: str) -> list[str]:
    return [_clean_text(line) for line in re.split(r"[\r\n]+", resume_text or "") if _clean_text(line)]


def _section_map(lines: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current = "header"
    headers = {header.lower() for header in SECTION_BOUNDARIES}
    for line in lines:
        normalized = line.lower().strip(":")
        if normalized in headers:
            if normalized in {"technical skills", "skills"}:
                current = "skills"
            elif normalized in {"project experience", "selected projects", "projects"}:
                current = "projects"
            elif normalized == "work experience":
                current = "experience"
            else:
                current = normalized
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(line)
    return sections


def _split_skill_values(raw_value: str) -> list[str]:
    normalized = raw_value.replace("·", ",").replace("|", ",")
    return [value.strip() for value in normalized.split(",") if value.strip()]


def _extract_skills_from_skills_section(skills_lines: list[str], full_text: str) -> list[str]:
    values: list[str] = []
    for line in skills_lines:
        raw_values = line.split(":", 1)[1] if ":" in line else line
        values.extend(_split_skill_values(raw_values))

    lower_blob = f"{' '.join(skills_lines)} {full_text}".lower()
    for skill in KNOWN_SKILLS:
        if re.search(rf"\b{re.escape(skill)}\b", lower_blob):
            values.append(skill)

    normalized = [normalize_skill_name(value.title() if value.islower() else value) for value in values]
    return sorted(dict.fromkeys(skill for skill in normalized if skill))


def _domain_for_text(text: str) -> str:
    lower = text.lower()
    if any(token in lower for token in ["airflow", "etl", "pipeline", "postgresql", "snowflake", "data pipeline"]):
        return "data engineering"
    if any(token in lower for token in ["power bi", "analytics", "dashboard", "scikit-learn", "prediction", "ml"]):
        return "data analytics"
    if any(token in lower for token in ["react", "node", "frontend", "full-stack", "fastapi", "web"]):
        return "web development"
    return "software engineering"


def _looks_like_stack_line(line: str) -> bool:
    if line.startswith(("•", "-", "*")):
        return False
    if line.endswith((".", ",")):
        return False
    lower = line.lower()
    return " · " in line or sum(1 for hint in PROJECT_STACK_HINTS if re.search(rf"\b{re.escape(hint)}\b", lower)) >= 2


def _looks_like_project_title(line: str) -> bool:
    if line.startswith(("•", "-", "*")):
        return False
    lower = line.lower().strip(":")
    if lower in {header.lower() for header in SECTION_BOUNDARIES}:
        return False
    if _looks_like_stack_line(line):
        return False
    if len(line) > 140 or line.endswith((".", ",")):
        return False
    if not line[:1].isupper():
        return False
    if re.match(r"^(?:and|or|with|from|for|to|in|on|candidate|proportionally|close)\b", lower):
        return False
    if not re.search(r"\s+[—-]\s+", line):
        return False
    return True


def _extract_projects(project_lines: list[str]) -> list[dict[str, Any]]:
    projects: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    last_was_bullet = False

    for line in project_lines:
        if _looks_like_project_title(line):
            if current:
                projects.append(current)
            name = re.split(r"\s+[—-]\s+", line, maxsplit=1)[0].strip()
            current = {"name": name[:120], "tech_stack": [], "domain": _domain_for_text(line), "description": ""}
            last_was_bullet = False
            continue

        if current is None:
            continue

        if _looks_like_stack_line(line):
            stack_part = line
            bullet_part = ""
            bullet_split = PROJECT_BULLET_RE.split(line, maxsplit=1)
            if len(bullet_split) == 2:
                stack_part, bullet_part = bullet_split
            stack = [normalize_skill_name(value) for value in _split_skill_values(stack_part)]
            current["tech_stack"] = sorted(dict.fromkeys(skill for skill in stack if skill))
            current["domain"] = _domain_for_text(f"{current['domain']} {line}")
            if bullet_part:
                current["description"] = f"{current.get('description', '')} {bullet_part.strip()}".strip()
                last_was_bullet = True
            else:
                last_was_bullet = False
            continue

        if line.startswith(("•", "-", "*")):
            bullet = line.lstrip("•-* ").strip()
            current["description"] = f"{current.get('description', '')} {bullet}".strip()
            current["domain"] = _domain_for_text(f"{current['domain']} {bullet}")
            last_was_bullet = True
            continue

        if last_was_bullet:
            current["description"] = f"{current.get('description', '')} {line}".strip()
            current["domain"] = _domain_for_text(f"{current['domain']} {line}")

    if current:
        projects.append(current)
    return projects[:8]


def _parse_experience_header(line: str) -> dict[str, Any]:
    duration_match = re.search(
        r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[–-]\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4}))",
        line,
        flags=re.IGNORECASE,
    )
    duration = duration_match.group(1) if duration_match else ""
    title_company = line[: duration_match.start()].strip() if duration_match else line
    parts = re.split(r"\s+[—-]\s+", title_company, maxsplit=1)
    return {"title": parts[0].strip()[:120], "company": parts[1].strip()[:120] if len(parts) > 1 else "", "duration": duration, "highlights": []}


def _extract_experience_items(experience_lines: list[str]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for line in experience_lines:
        if line.startswith(("•", "-", "*")):
            if current:
                current.setdefault("highlights", []).append(line.lstrip("•-* ").strip())
            continue
        if " · " in line and current:
            continue
        if re.search(r"\b(?:intern|developer|engineer|specialist|analyst|contract|co-?op)\b", line, flags=re.IGNORECASE):
            if current:
                items.append(current)
            current = _parse_experience_header(line)
    if current:
        items.append(current)
    return items[:6]


def _extract_education(education_lines: list[str], lower_text: str) -> dict[str, Any]:
    education = {"degree": "", "program": "", "university": "", "year": None}
    education_blob = " ".join(education_lines)
    if "university of calgary" in lower_text:
        education["university"] = "University of Calgary"
    elif education_lines:
        education["university"] = education_lines[0].split("—")[0].strip()
    if "software engineering" in lower_text:
        education["program"] = "Software Engineering"
    elif "computer science" in lower_text:
        education["program"] = "Computer Science"
    if any(token in lower_text for token in ["bachelor", "bsc", "b.sc"]):
        education["degree"] = "Bachelor of Science"
    if match := re.search(r"expected\s+\w+\s+(\d{4})", education_blob, flags=re.IGNORECASE):
        education["year"] = int(match.group(1))
    return education


def _heuristic_resume_parse(resume_text: str) -> dict[str, Any]:
    text = resume_text or ""
    lower_text = text.lower()
    lines = _resume_lines(text)
    sections = _section_map(lines)

    skills = _extract_skills_from_skills_section(sections.get("skills", []), text)
    years_match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs)", lower_text)
    experience_years = float(years_match.group(1)) if years_match else 0.0
    experience_items = _extract_experience_items(sections.get("experience", []))
    internship_count = sum(
        1 for item in experience_items if re.search(r"\b(?:intern|internship|co-?op)\b", str(item.get("title", "")), flags=re.IGNORECASE)
    )
    projects = _extract_projects(sections.get("projects", []))

    domains = []
    if any(skill in lower_text for skill in ["sql", "airflow", "tableau", "power bi", "excel", "pandas"]):
        domains.append("data analytics")
    if any(skill in lower_text for skill in ["react", "typescript", "javascript", "fastapi", "node"]):
        domains.append("web development")
    if any(skill in lower_text for skill in ["postgresql", "airflow", "etl", "snowflake"]):
        domains.append("data engineering")

    return {
        "skills": skills,
        "experience_years": experience_years,
        "internship_count": internship_count,
        "experience_items": experience_items,
        "projects": projects,
        "education": _extract_education(sections.get("education", []), lower_text),
        "domains": sorted(dict.fromkeys(domains)),
    }


def _sanitize_parsed_profile(parsed: dict[str, Any], resume_text: str) -> dict[str, Any]:
    fallback = _heuristic_resume_parse(resume_text)

    def list_or_fallback(key: str, max_items: int | None = None) -> list[Any]:
        value = parsed.get(key)
        if not isinstance(value, list) or not value:
            value = fallback.get(key) or []
        if max_items is not None:
            value = value[:max_items]
        return value

    skills = [normalize_skill_name(str(skill)) for skill in list_or_fallback("skills") if str(skill).strip()]
    projects = [project for project in list_or_fallback("projects", 8) if isinstance(project, dict) and project.get("name")]
    if not projects or len(projects) > 8:
        projects = fallback["projects"]
    for project in projects:
        project.setdefault("description", "")
        project["tech_stack"] = sorted(dict.fromkeys(normalize_skill_name(str(skill)) for skill in (project.get("tech_stack") or []) if str(skill).strip()))
        project["domain"] = project.get("domain") or _domain_for_text(f"{project.get('name', '')} {project.get('description', '')}")

    experience_items = [item for item in list_or_fallback("experience_items", 6) if isinstance(item, dict) and item.get("title")]
    education = parsed.get("education") if isinstance(parsed.get("education"), dict) else fallback["education"]
    domains = parsed.get("domains") if isinstance(parsed.get("domains"), list) and parsed.get("domains") else fallback["domains"]

    return {
        "skills": sorted(dict.fromkeys(skills)),
        "experience_years": float(parsed.get("experience_years") or fallback.get("experience_years") or 0),
        "internship_count": int(parsed.get("internship_count") or fallback.get("internship_count") or 0),
        "experience_items": experience_items,
        "projects": projects,
        "education": education,
        "domains": sorted(dict.fromkeys(str(domain).strip().lower() for domain in domains if str(domain).strip())),
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
Parse this resume and return JSON in exactly this schema. Do not turn bullet points into separate projects; only top-level project names are projects.
{{
  "skills": ["Python", "SQL"],
  "experience_years": 1.5,
  "internship_count": 1,
  "experience_items": [
    {{"title": "Software Developer Intern", "company": "Example", "duration": "May 2025 - Aug 2025", "highlights": ["Built API"]}}
  ],
  "projects": [
    {{"name": "Project Name", "tech_stack": ["Python"], "domain": "data engineering", "description": "short summary"}}
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
            max_tokens=1800,
            system="You are a resume parser. Return only valid JSON and no markdown.",
            messages=[{"role": "user", "content": prompt}],
        )
        return _sanitize_parsed_profile(_extract_json(message.content[0].text), resume_text)
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

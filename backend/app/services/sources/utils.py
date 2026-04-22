from __future__ import annotations

import re
from typing import Any

SKILL_KEYWORDS: list[tuple[str, float, list[str]]] = [
    ("Python", 0.16, ["python"]),
    ("SQL", 0.16, ["sql", "postgresql", "mysql", "sqlite"]),
    ("React", 0.13, ["react", "react.js", "reactjs"]),
    ("TypeScript", 0.12, ["typescript"]),
    ("JavaScript", 0.11, ["javascript", "node", "nodejs"]),
    ("Docker", 0.08, ["docker", "container"]),
    ("AWS", 0.08, ["aws", "amazon web services"]),
    ("Tableau", 0.06, ["tableau"]),
    ("Power BI", 0.06, ["power bi", "powerbi"]),
    ("Git", 0.06, ["git", "github"]),
    ("Airflow", 0.08, ["airflow"]),
    ("FastAPI", 0.06, ["fastapi"]),
]


def strip_html(text: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", text or "")
    return re.sub(r"\s+", " ", without_tags).strip()


def infer_required_skills(text: str, limit: int = 6) -> list[dict[str, Any]]:
    raw_text = (text or "").lower()
    matches: list[tuple[str, float]] = []
    for skill, weight, aliases in SKILL_KEYWORDS:
        for alias in aliases:
            if re.search(rf"\b{re.escape(alias)}\b", raw_text):
                matches.append((skill, weight))
                break

    if not matches:
        return [
            {"skill": "Communication", "weight": 0.2},
            {"skill": "Problem Solving", "weight": 0.2},
            {"skill": "Python", "weight": 0.2},
            {"skill": "SQL", "weight": 0.2},
            {"skill": "Teamwork", "weight": 0.2},
        ]

    deduped: dict[str, float] = {}
    for skill, weight in matches[:limit]:
        deduped[skill] = max(deduped.get(skill, 0.0), weight)

    total = sum(deduped.values()) or 1.0
    return [{"skill": skill, "weight": round(weight / total, 6)} for skill, weight in deduped.items()]


def infer_role_type(title: str, description: str) -> str:
    blob = f"{title} {description}".lower()
    if "co-op" in blob or "coop" in blob:
        return "co-op"
    if "intern" in blob or "internship" in blob:
        return "internship"
    if "new grad" in blob or "graduate" in blob or "entry level" in blob or "junior" in blob:
        return "entry-level"
    return "entry-level"


def infer_domain(title: str, description: str) -> str:
    blob = f"{title} {description}".lower()
    if any(token in blob for token in ["data engineer", "etl", "pipeline", "warehouse", "airflow"]):
        return "data engineering"
    if any(token in blob for token in ["analyst", "tableau", "power bi", "dashboard", "business intelligence"]):
        return "data analytics"
    if any(token in blob for token in ["frontend", "react", "ui", "web"]):
        return "web development"
    if any(token in blob for token in ["cloud", "aws", "azure", "gcp", "platform engineer"]):
        return "cloud engineering"
    if any(token in blob for token in ["backend", "api", "distributed", "software"]):
        return "software engineering"
    return "software engineering"


def infer_experience_required(description: str) -> float:
    lowered = (description or "").lower()
    match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years|yrs)", lowered)
    if not match:
        return 0.0
    try:
        return float(match.group(1))
    except Exception:
        return 0.0


def is_student_friendly(title: str, description: str) -> bool:
    blob = f"{title} {description}".lower()
    positive_tokens = [
        "intern",
        "internship",
        "co-op",
        "coop",
        "new grad",
        "graduate",
        "entry level",
        "junior",
    ]
    return any(token in blob for token in positive_tokens)


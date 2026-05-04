from __future__ import annotations

import re
from html import unescape
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
    ("Excel", 0.08, ["excel", "spreadsheet"]),
    ("Salesforce", 0.08, ["salesforce", "crm"]),
    ("Figma", 0.08, ["figma", "wireframe", "prototype"]),
    ("Analytics", 0.08, ["analytics", "metrics", "reporting"]),
    ("Project Management", 0.08, ["project management", "roadmap", "stakeholder"]),
    ("Customer Support", 0.08, ["customer support", "customer success", "support"]),
    ("Marketing", 0.08, ["marketing", "campaign", "seo", "content"]),
    ("Finance", 0.08, ["finance", "accounting", "budget", "forecast"]),
    ("Operations", 0.08, ["operations", "process", "logistics", "supply chain"]),
]


def strip_html(text: str) -> str:
    decoded = unescape(text or "")
    without_tags = re.sub(r"<[^>]+>", " ", decoded)
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
    title_blob = (title or "").lower()
    blob = f"{title} {description}".lower()
    if "co-op" in title_blob or "coop" in title_blob:
        return "co-op"
    if "intern" in title_blob or "internship" in title_blob:
        return "internship"
    if "new grad" in title_blob or "graduate" in title_blob or "entry level" in title_blob or "junior" in title_blob:
        return "entry-level"
    if any(token in title_blob for token in ["manager", "lead", "senior", "director", "principal"]):
        return "experienced"
    if any(token in blob for token in ["0-2 years", "early career", "entry level"]):
        return "entry-level"
    return "general"


def infer_domain(title: str, description: str) -> str:
    title_blob = (title or "").lower()
    blob = f"{title} {description}".lower()

    title_domain_rules = [
        ("data engineering", ["data engineer", "etl", "pipeline", "warehouse"]),
        ("data analytics", ["data analyst", "business analyst", "analytics", "bi analyst"]),
        ("web development", ["frontend", "front end", "web developer", "javascript"]),
        ("cloud engineering", ["cloud", "platform engineer", "devops", "site reliability"]),
        ("software engineering", ["backend", "software engineer", "developer", "full stack", "security engineer"]),
        ("product", ["product manager", "product analyst", "product owner"]),
        ("marketing", ["marketing", "content", "seo", "brand", "growth"]),
        ("finance", ["finance", "accounting", "payroll", "financial"]),
        ("operations", ["operations", "logistics", "supply chain", "procurement", "coordinator"]),
        ("design", ["designer", "design", "ux", "ui/ux", "visual"]),
        ("sales", ["sales", "account executive", "business development", "customer success"]),
        ("people", ["human resources", "recruiter", "talent", "people operations"]),
        ("support", ["support", "help desk", "customer service", "service desk"]),
    ]
    for domain, tokens in title_domain_rules:
        if any(token in title_blob for token in tokens):
            return domain

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
    if any(token in blob for token in ["product manager", "product analyst", "product owner", "roadmap"]):
        return "product"
    if any(token in blob for token in ["marketing", "content", "seo", "brand", "growth"]):
        return "marketing"
    if any(token in blob for token in ["finance", "accounting", "bookkeeper", "payroll", "fp&a", "financial"]):
        return "finance"
    if any(token in blob for token in ["operations", "logistics", "supply chain", "procurement", "coordinator"]):
        return "operations"
    if any(token in blob for token in ["designer", "design", "ux", "ui/ux", "visual"]):
        return "design"
    if any(token in blob for token in ["sales", "account executive", "business development", "customer success"]):
        return "sales"
    if any(token in blob for token in ["human resources", "recruiter", "talent", "people operations"]):
        return "people"
    if any(token in blob for token in ["support", "help desk", "customer service", "service desk"]):
        return "support"
    return "general"


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

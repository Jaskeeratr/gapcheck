from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from app.schemas.gap_analysis import MissingSkill, SkillCategory
from app.services.scorer import normalized_required_skills


@dataclass(frozen=True)
class SkillDefinition:
    name: str
    category: SkillCategory
    aliases: tuple[str, ...]


SKILL_DEFINITIONS: tuple[SkillDefinition, ...] = (
    SkillDefinition("Python", "Technology", ("python",)),
    SkillDefinition("JavaScript", "Technology", ("javascript", "js", "node", "node.js", "nodejs")),
    SkillDefinition("TypeScript", "Technology", ("typescript", "ts")),
    SkillDefinition("Java", "Technology", ("java",)),
    SkillDefinition("C++", "Technology", ("c++", "cpp")),
    SkillDefinition("Go", "Technology", ("golang", "go")),
    SkillDefinition("React", "Framework", ("react", "react.js", "reactjs")),
    SkillDefinition("Next.js", "Framework", ("next.js", "nextjs", "next js")),
    SkillDefinition("FastAPI", "Framework", ("fastapi", "fast api")),
    SkillDefinition("Django", "Framework", ("django",)),
    SkillDefinition("Flask", "Framework", ("flask",)),
    SkillDefinition("Express", "Framework", ("express", "express.js", "expressjs")),
    SkillDefinition("Tailwind CSS", "Framework", ("tailwind", "tailwind css")),
    SkillDefinition("Spring Boot", "Framework", ("spring boot",)),
    SkillDefinition("AWS", "Cloud", ("aws", "amazon web services")),
    SkillDefinition("AWS S3", "Cloud", ("aws s3", "s3", "amazon s3")),
    SkillDefinition("Azure", "Cloud", ("azure", "microsoft azure")),
    SkillDefinition("Google Cloud", "Cloud", ("google cloud", "gcp")),
    SkillDefinition("PostgreSQL", "Database", ("postgresql", "postgres", "postgre sql")),
    SkillDefinition("MySQL", "Database", ("mysql", "my sql")),
    SkillDefinition("MongoDB", "Database", ("mongodb", "mongo db", "mongo")),
    SkillDefinition("Redis", "Database", ("redis",)),
    SkillDefinition("SQLite", "Database", ("sqlite", "sql lite")),
    SkillDefinition("SQL", "Database", ("sql",)),
    SkillDefinition("Docker", "DevOps", ("docker", "containerization", "containers")),
    SkillDefinition("Kubernetes", "DevOps", ("kubernetes", "k8s")),
    SkillDefinition("GitHub Actions", "DevOps", ("github actions", "github action", "gh actions")),
    SkillDefinition("CI/CD", "DevOps", ("ci/cd", "ci cd", "cicd", "ci/cd pipelines", "deployment pipeline")),
    SkillDefinition("Terraform", "DevOps", ("terraform",)),
    SkillDefinition("Git", "DevOps", ("git", "github")),
    SkillDefinition("Apache Airflow", "DevOps", ("airflow", "apache airflow")),
    SkillDefinition("REST APIs", "Technology", ("rest api", "rest apis", "restful api", "restful apis")),
    SkillDefinition("Power BI", "Technology", ("power bi", "powerbi")),
    SkillDefinition("Pandas", "Technology", ("pandas",)),
    SkillDefinition("NumPy", "Technology", ("numpy", "num py")),
    SkillDefinition("Scikit-learn", "Technology", ("scikit-learn", "scikit learn", "sklearn")),
    SkillDefinition("Snowflake", "Database", ("snowflake",)),
    SkillDefinition("HTML5", "Technology", ("html5", "html")),
    SkillDefinition("CSS3", "Technology", ("css3", "css")),
    SkillDefinition("Claude API", "Technology", ("claude api", "anthropic api")),
    SkillDefinition("Communication", "Soft Skill", ("communication", "communicate", "written communication")),
    SkillDefinition("Leadership", "Soft Skill", ("leadership", "mentoring", "mentor")),
    SkillDefinition("Teamwork", "Soft Skill", ("teamwork", "collaboration", "collaborate")),
    SkillDefinition("Problem Solving", "Soft Skill", ("problem solving", "troubleshooting", "debugging")),
    SkillDefinition("Project Management", "Soft Skill", ("project management", "stakeholder management", "roadmap")),
)

_ALIAS_TO_SKILL: dict[str, SkillDefinition] = {
    alias.lower(): definition
    for definition in SKILL_DEFINITIONS
    for alias in (definition.name, *definition.aliases)
}


def _clean(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("_", " ").replace("-", " ")).strip().lower()


def normalize_skill_name(raw_skill: str) -> str:
    cleaned = _clean(raw_skill)
    if cleaned in _ALIAS_TO_SKILL:
        return _ALIAS_TO_SKILL[cleaned].name

    compact = cleaned.replace(" ", "").replace("/", "")
    for alias, definition in _ALIAS_TO_SKILL.items():
        if compact == alias.replace(" ", "").replace("/", ""):
            return definition.name

    return raw_skill.strip()


def categorize_skill(raw_skill: str) -> SkillCategory:
    cleaned = _clean(normalize_skill_name(raw_skill))
    definition = _ALIAS_TO_SKILL.get(cleaned)
    if definition:
        return definition.category
    return "Technology"


def _contains_alias(text: str, alias: str) -> bool:
    escaped = re.escape(alias.lower()).replace("\\ ", r"\s+")
    return re.search(rf"(?<![a-z0-9+#.]){escaped}(?![a-z0-9+#.])", text) is not None


def extract_skill_mentions(text: str, base_confidence: float = 0.68) -> list[MissingSkill]:
    normalized_text = (text or "").lower()
    found: dict[str, MissingSkill] = {}
    for definition in SKILL_DEFINITIONS:
        aliases = (definition.name, *definition.aliases)
        if any(_contains_alias(normalized_text, alias) for alias in aliases):
            found[definition.name] = MissingSkill(
                name=definition.name,
                category=definition.category,
                confidence=round(base_confidence, 2),
            )
    return list(found.values())


def candidate_skill_names(candidate: dict[str, Any]) -> set[str]:
    values: list[str] = []
    values.extend(str(skill) for skill in (candidate.get("skills") or []) if skill)
    values.extend(str(domain) for domain in (candidate.get("domains") or []) if domain)

    for project in candidate.get("projects") or []:
        if not isinstance(project, dict):
            continue
        tech_stack = project.get("tech_stack") or []
        if isinstance(tech_stack, str):
            tech_stack = [tech_stack]
        values.extend(str(skill) for skill in tech_stack if skill)
        values.extend(str(skill.name) for skill in extract_skill_mentions(str(project.get("description") or ""), 0.6))

    for item in candidate.get("experience_items") or []:
        if not isinstance(item, dict):
            continue
        values.extend(str(skill.name) for skill in extract_skill_mentions(" ".join(str(v) for v in item.values()), 0.6))

    values.extend(str(skill.name) for skill in extract_skill_mentions(str(candidate.get("resume_text") or ""), 0.6))
    return {normalize_skill_name(value).lower() for value in values if str(value).strip()}


def extract_missing_skills(candidate: dict[str, Any], job: dict[str, Any]) -> list[MissingSkill]:
    candidate_names = candidate_skill_names(candidate)
    required_rows = normalized_required_skills(job.get("required_skills"))
    detected: dict[str, MissingSkill] = {}

    for row in required_rows:
        raw_name = str(row.get("skill") or "").strip()
        if not raw_name:
            continue
        name = normalize_skill_name(raw_name)
        confidence = round(min(0.98, max(0.72, 0.72 + float(row.get("weight") or 0) * 0.26)), 2)
        detected[name.lower()] = MissingSkill(name=name, category=categorize_skill(name), confidence=confidence)

    job_text = "\n".join(
        str(value)
        for value in [job.get("title"), job.get("domain"), job.get("role_type"), job.get("description")]
        if value
    )
    for mention in extract_skill_mentions(job_text, 0.68):
        key = mention.name.lower()
        existing = detected.get(key)
        if existing is None or mention.confidence > existing.confidence:
            detected[key] = mention

    missing = [
        skill
        for key, skill in detected.items()
        if key not in candidate_names
    ]
    missing.sort(key=lambda skill: (-skill.confidence, skill.category, skill.name))
    return missing

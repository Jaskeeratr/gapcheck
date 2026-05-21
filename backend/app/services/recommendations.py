from __future__ import annotations

from collections import defaultdict
from typing import Any

from app.schemas.gap_analysis import MissingSkill
from app.schemas.recommendation import ProjectRecommendation
from app.services.skill_normalization import categorize_skill, normalize_skill_name


SKILL_STACK_HINTS: dict[str, list[str]] = {
    "Docker": ["Docker", "Docker Compose"],
    "Kubernetes": ["Docker", "Kubernetes"],
    "GitHub Actions": ["GitHub Actions", "CI/CD"],
    "CI/CD": ["GitHub Actions", "pytest", "deployment checks"],
    "PostgreSQL": ["PostgreSQL", "SQLAlchemy", "Alembic"],
    "FastAPI": ["FastAPI", "Pydantic", "pytest"],
    "React": ["React", "TypeScript", "Vite"],
    "TypeScript": ["TypeScript", "React"],
    "AWS": ["AWS", "S3", "CloudWatch"],
    "AWS S3": ["AWS S3", "boto3"],
    "Power BI": ["Power BI", "SQL"],
    "Apache Airflow": ["Apache Airflow", "PostgreSQL"],
    "SQL": ["SQL", "PostgreSQL"],
    "Python": ["Python", "pytest"],
}


def _skill_names(missing_skills: list[MissingSkill | dict[str, Any] | str]) -> list[str]:
    names: list[str] = []
    for skill in missing_skills:
        if isinstance(skill, MissingSkill):
            raw_name = skill.name
        elif isinstance(skill, dict):
            raw_name = str(skill.get("name") or skill.get("skill") or "")
        else:
            raw_name = str(skill)

        name = normalize_skill_name(raw_name).strip()
        if name:
            names.append(name)
    return list(dict.fromkeys(names))


def _difficulty(skills: list[str]) -> str:
    advanced_markers = {"Kubernetes", "AWS", "AWS S3", "Apache Airflow", "CI/CD"}
    if len(skills) >= 4 or any(skill in advanced_markers for skill in skills):
        return "Advanced"
    if len(skills) >= 2:
        return "Intermediate"
    return "Beginner"


def _estimated_time(difficulty: str, skills: list[str]) -> str:
    if difficulty == "Advanced":
        return "2-3 weeks"
    if difficulty == "Intermediate":
        return "1-2 weeks"
    return "3-5 days"


def _stack_for(skills: list[str], job: dict[str, Any]) -> list[str]:
    stack: list[str] = []
    for skill in skills:
        stack.extend(SKILL_STACK_HINTS.get(skill, [skill]))

    domain = str(job.get("domain") or "").lower()
    if "data" in domain:
        stack.extend(["Python", "PostgreSQL", "dashboard"])
    elif "web" in domain or "frontend" in domain:
        stack.extend(["React", "TypeScript", "API integration"])
    elif "backend" in domain:
        stack.extend(["FastAPI", "PostgreSQL", "Docker"])

    return list(dict.fromkeys(stack))[:8]


def _project_title(category: str, skills: list[str], job: dict[str, Any]) -> str:
    role = str(job.get("title") or "target role").strip()
    if category == "DevOps":
        return "Production Deployment Pipeline for a Resume-Matching API"
    if category == "Database":
        return "Job Intelligence Database with Queryable Match Analytics"
    if category == "Cloud":
        return "Cloud-Hosted Career Intelligence Dashboard"
    if category == "Framework":
        return f"{role} Skills Demo with a Full-Stack Feature Slice"
    if category == "Soft Skill":
        return "Technical Product Case Study with Stakeholder Tradeoffs"
    if any(skill in {"Python", "SQL", "Power BI", "Apache Airflow"} for skill in skills):
        return "Automated Job Market Analytics Pipeline"
    return "Role-Targeted Portfolio Project"


def _impact(category: str, skills: list[str]) -> str:
    if category == "DevOps":
        return "Shows production maturity beyond classroom projects: deployment, reliability, and release automation."
    if category == "Database":
        return "Proves you can design, query, and operate persistent data systems that real products depend on."
    if category == "Cloud":
        return "Signals that you can ship software to real users instead of only running code locally."
    if category == "Framework":
        return "Creates direct keyword and project evidence for the frameworks recruiters screen for."
    if category == "Soft Skill":
        return "Turns soft skills into concrete evidence through decisions, tradeoffs, and outcomes."
    return f"Adds concrete resume proof for {', '.join(skills[:3])}."


def generate_project_recommendations(
    missing_skills: list[MissingSkill | dict[str, Any] | str],
    candidate: dict[str, Any],
    job: dict[str, Any],
    max_recommendations: int = 3,
) -> list[ProjectRecommendation]:
    names = _skill_names(missing_skills)
    if not names:
        return []

    grouped: dict[str, list[str]] = defaultdict(list)
    for name in names:
        grouped[categorize_skill(name)].append(name)

    # Prefer cohesive production-grade groups over one card per keyword.
    priority = ["DevOps", "Database", "Framework", "Cloud", "Technology", "Soft Skill"]
    recommendations: list[ProjectRecommendation] = []
    existing_project_names = {
        str(project.get("name") or "").lower()
        for project in candidate.get("projects") or []
        if isinstance(project, dict)
    }

    for category in priority:
        skills = grouped.get(category)
        if not skills:
            continue

        if category == "Technology":
            adjacent = []
            for adjacent_category in ("Database", "Framework", "Cloud"):
                adjacent.extend(grouped.get(adjacent_category, [])[:1])
            skills = list(dict.fromkeys([*skills, *adjacent]))[:5]

        title = _project_title(category, skills, job)
        if title.lower() in existing_project_names:
            title = f"Production Extension: {title}"

        difficulty = _difficulty(skills)
        recommendations.append(
            ProjectRecommendation(
                title=title,
                difficulty=difficulty,  # type: ignore[arg-type]
                estimated_time=_estimated_time(difficulty, skills),
                skills_covered=skills,
                recruiter_impact=_impact(category, skills),
                suggested_tech_stack=_stack_for(skills, job),
                why_this_project_helps=(
                    "This closes the highest-signal gaps from the match analysis and gives you resume bullets "
                    f"that directly map to {job.get('title') or 'the target role'} requirements."
                ),
            )
        )

    return recommendations[:max_recommendations]

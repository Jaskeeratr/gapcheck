from __future__ import annotations

from typing import Any

WEIGHTS = {
    "skills": 0.35,
    "experience": 0.25,
    "education": 0.15,
    "projects": 0.15,
    "domain": 0.10,
}

RESUME_BASELINE_WEIGHTS = {
    "skills_depth": 0.28,
    "projects_depth": 0.22,
    "internship_depth": 0.18,
    "experience_items_depth": 0.17,
    "education_completeness": 0.15,
    "experience_depth": 0.10,
}


def normalized_required_skills(raw_required_skills: Any) -> list[dict[str, float | str]]:
    """
    Accepts a few shapes and normalizes to:
    [{"skill": "python", "weight": 0.4}, ...] where all weights sum to 1.
    """
    normalized: list[dict[str, float | str]] = []

    if not raw_required_skills:
        return normalized

    if isinstance(raw_required_skills, dict):
        if "required_skills" in raw_required_skills:
            return normalized_required_skills(raw_required_skills["required_skills"])
        for skill, weight in raw_required_skills.items():
            if isinstance(skill, str):
                normalized.append({"skill": skill.strip(), "weight": float(weight or 0)})

    if isinstance(raw_required_skills, list):
        for item in raw_required_skills:
            if isinstance(item, str):
                normalized.append({"skill": item.strip(), "weight": 1.0})
                continue

            if isinstance(item, dict):
                skill = str(item.get("skill", "")).strip()
                if not skill:
                    continue
                weight = float(item.get("weight", 1.0) or 1.0)
                normalized.append({"skill": skill, "weight": weight})

    filtered = [row for row in normalized if row["skill"] and row["weight"] > 0]
    if not filtered:
        return []

    total_weight = sum(float(row["weight"]) for row in filtered)
    if total_weight <= 0:
        equal_weight = 1.0 / len(filtered)
        return [{"skill": row["skill"], "weight": equal_weight} for row in filtered]

    return [
        {
            "skill": row["skill"],
            "weight": round(float(row["weight"]) / total_weight, 6),
        }
        for row in filtered
    ]


def score_skills(candidate_skills: list[str], required_skills: Any) -> float:
    normalized = normalized_required_skills(required_skills)
    if not normalized:
        return 100.0

    candidate_set = {skill.lower().strip() for skill in candidate_skills or [] if skill}
    matched_weight = sum(
        float(row["weight"])
        for row in normalized
        if str(row["skill"]).lower().strip() in candidate_set
    )
    return round(matched_weight * 100, 2)


def score_experience(candidate_years: float | int | None, required_years: float | int | None) -> float:
    if not required_years:
        return 100.0

    candidate = float(candidate_years or 0)
    required = float(required_years)
    if required <= 0:
        return 100.0

    return round(min(candidate / required, 1.0) * 100, 2)


def score_education(candidate_education: dict[str, Any] | None, job: dict[str, Any]) -> float:
    required_text = " ".join(
        str(value)
        for value in [job.get("education_required"), job.get("description")]
        if value
    ).lower()

    if not required_text.strip():
        return 100.0

    if not candidate_education:
        return 25.0

    candidate_text = " ".join(str(value) for value in candidate_education.values() if value).lower()
    if not candidate_text:
        return 25.0

    if any(token in candidate_text for token in ["bsc", "b.eng", "bachelor", "software", "computer science", "data"]):
        if any(token in required_text for token in ["bsc", "bachelor", "software", "computer science", "related field"]):
            return 100.0

    if "related field" in required_text:
        return 85.0

    return 65.0


def score_projects(projects: list[dict[str, Any]] | None, job: dict[str, Any]) -> float:
    if not projects:
        return 20.0

    normalized = normalized_required_skills(job.get("required_skills"))
    if not normalized:
        return 85.0

    project_skills: set[str] = set()
    for project in projects:
        tech_stack = project.get("tech_stack", [])
        if isinstance(tech_stack, str):
            tech_stack = [tech_stack]
        for skill in tech_stack:
            if isinstance(skill, str):
                project_skills.add(skill.lower().strip())

    if not project_skills:
        return 50.0

    matched_weight = sum(
        float(row["weight"])
        for row in normalized
        if str(row["skill"]).lower().strip() in project_skills
    )
    return round(min(matched_weight, 1.0) * 100, 2)


def score_domain(candidate_domains: list[str] | None, job_domain: str | None) -> float:
    if not job_domain:
        return 100.0

    normalized_domains = {domain.lower().strip() for domain in (candidate_domains or []) if domain}
    if not normalized_domains:
        return 40.0

    domain = job_domain.lower().strip()
    if domain in normalized_domains:
        return 100.0

    # Partial match gives some credit for adjacent domains.
    if any(domain in candidate or candidate in domain for candidate in normalized_domains):
        return 80.0

    return 45.0


def score_resume_baseline(candidate: dict[str, Any]) -> float:
    """
    Resume quality score using a consistent rubric for all candidates.
    This represents "how complete/strong is the resume itself" independent of one job.
    """
    skills = candidate.get("skills") or []
    projects = candidate.get("projects") or []
    experience_items = candidate.get("experience_items") or []
    internship_count = int(candidate.get("internship_count") or 0)
    experience_years = float(candidate.get("experience_years") or 0)
    education = candidate.get("education") or {}

    skills_depth = min(len(skills) / 12, 1.0) * 100
    projects_depth = min(len(projects) / 4, 1.0) * 100
    internship_depth = min(internship_count / 2, 1.0) * 100
    experience_items_depth = min(len(experience_items) / 3, 1.0) * 100
    experience_depth = min(experience_years / 2.0, 1.0) * 100

    required_education_fields = ["degree", "program", "university"]
    present_education_fields = sum(1 for key in required_education_fields if education.get(key))
    education_completeness = (present_education_fields / len(required_education_fields)) * 100

    baseline_score = (
        skills_depth * RESUME_BASELINE_WEIGHTS["skills_depth"]
        + projects_depth * RESUME_BASELINE_WEIGHTS["projects_depth"]
        + internship_depth * RESUME_BASELINE_WEIGHTS["internship_depth"]
        + experience_items_depth * RESUME_BASELINE_WEIGHTS["experience_items_depth"]
        + education_completeness * RESUME_BASELINE_WEIGHTS["education_completeness"]
        + experience_depth * RESUME_BASELINE_WEIGHTS["experience_depth"]
    )

    return round(baseline_score, 2)


def compute_match(candidate: dict[str, Any], job: dict[str, Any]) -> dict[str, float]:
    dimension_scores = {
        "skills": score_skills(candidate.get("skills") or [], job.get("required_skills")),
        "experience": score_experience(
            candidate.get("experience_years"),
            job.get("experience_required"),
        ),
        "education": score_education(candidate.get("education"), job),
        "projects": score_projects(candidate.get("projects"), job),
        "domain": score_domain(candidate.get("domains"), job.get("domain")),
    }

    role_match_score = sum(dimension_scores[key] * WEIGHTS[key] for key in WEIGHTS)
    resume_baseline_score = score_resume_baseline(candidate)

    # Calibrated overall score:
    # job-specific role alignment remains dominant, while resume baseline adds consistency.
    overall = round(role_match_score * 0.85 + resume_baseline_score * 0.15, 2)
    return {
        "overall": overall,
        "resume_baseline": resume_baseline_score,
        "role_match": round(role_match_score, 2),
        **dimension_scores,
    }

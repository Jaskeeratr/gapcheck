from __future__ import annotations

from typing import Any

from app.services.scorer import normalized_required_skills


def _verdict_for_score(overall_score: float) -> str:
    if overall_score >= 75:
        return "strong_match"
    if overall_score >= 55:
        return "close_miss"
    if overall_score >= 35:
        return "significant_gap"
    return "not_a_fit"


def _impact_label(weight: float) -> str:
    if weight >= 0.25:
        return "high"
    if weight >= 0.12:
        return "medium"
    return "low"


def _verdict_explanation(verdict: str) -> str:
    explanations = {
        "strong_match": "You are competitive for this role today. Prioritize applying quickly and tailoring your resume to this job posting.",
        "close_miss": "You are within reach. Addressing the top 1-2 gaps can substantially improve your odds.",
        "significant_gap": "You have useful foundations, but several high-impact requirements are currently missing.",
        "not_a_fit": "This role is likely a stretch right now. Focus on narrower internship roles while building core skills.",
    }
    return explanations[verdict]


def generate_gap_analysis(
    candidate: dict[str, Any],
    job: dict[str, Any],
    scores: dict[str, float],
    company_profile: dict[str, Any] | None = None,
) -> dict[str, Any]:
    required_skills = normalized_required_skills(job.get("required_skills"))
    candidate_skills = {skill.lower().strip() for skill in (candidate.get("skills") or []) if skill}

    missing_skills = [
        row for row in required_skills if str(row["skill"]).lower().strip() not in candidate_skills
    ]
    missing_skills.sort(key=lambda row: float(row["weight"]), reverse=True)

    gaps: list[dict[str, Any]] = []
    for row in missing_skills[:4]:
        weight = float(row["weight"])
        skill = str(row["skill"])
        score_lost = round(weight * 100 * 0.35, 2)
        gaps.append(
            {
                "gap": f"{skill} is not listed on your profile",
                "impact": _impact_label(weight),
                "score_lost": score_lost,
                "fix": f"Add a project bullet proving {skill} and include the keyword explicitly in your resume.",
                "timeframe": "1-2 weeks",
            }
        )

    required_years = float(job.get("experience_required") or 0)
    candidate_years = float(candidate.get("experience_years") or 0)
    if required_years > 0 and candidate_years < required_years:
        gaps.append(
            {
                "gap": f"Experience level is below the role target ({candidate_years:.1f} vs {required_years:.1f} years)",
                "impact": "high" if required_years - candidate_years >= 1 else "medium",
                "score_lost": round((100 - scores.get("experience", 0)) * 0.25, 2),
                "fix": "Highlight internships, co-op terms, and project ownership with measurable outcomes.",
                "timeframe": "2-4 weeks",
            }
        )

    domain = str(job.get("domain") or "").strip()
    if domain and scores.get("domain", 0) < 80:
        gaps.append(
            {
                "gap": f"Limited evidence of {domain} domain alignment",
                "impact": "medium",
                "score_lost": round((100 - scores.get("domain", 0)) * 0.10, 2),
                "fix": f"Add one {domain}-relevant project bullet and move it near the top of your resume.",
                "timeframe": "1 week",
            }
        )

    matched_skills = [
        str(row["skill"])
        for row in required_skills
        if str(row["skill"]).lower().strip() in candidate_skills
    ]
    strengths = [f"Strong alignment on {skill}" for skill in matched_skills[:3]]
    if not strengths:
        strengths = ["You have foundational experience that can be reframed for this job."]

    verdict = _verdict_for_score(scores.get("overall", 0))
    top_gap = gaps[0]["gap"] if gaps else "No major blocking gaps detected."
    resume_tip = (
        f"Place evidence for '{top_gap.split(' is ')[0]}' near the top third of your resume."
        if gaps
        else "Move your strongest, role-relevant project to your first project bullet."
    )

    company_insight = (
        company_profile.get("hiring_notes")
        if company_profile and company_profile.get("hiring_notes")
        else "No company-specific inference profile yet. Start collecting outcomes to personalize this guidance."
    )

    return {
        "verdict": verdict,
        "verdict_explanation": _verdict_explanation(verdict),
        "gaps": gaps,
        "strengths": strengths,
        "company_insight": company_insight,
        "apply_recommendation": scores.get("overall", 0) >= 55,
        "resume_baseline_score": scores.get("resume_baseline"),
        "role_match_score": scores.get("role_match"),
        "resume_tip": resume_tip,
    }

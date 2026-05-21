from __future__ import annotations

from app.models.candidate_profile import CandidateProfile
from app.models.company_profile import CompanyProfile
from app.models.job import Job


def candidate_payload(profile: CandidateProfile) -> dict:
    return {
        "skills": profile.skills or [],
        "resume_text": profile.resume_text or "",
        "experience_years": float(profile.experience_years or 0),
        "internship_count": profile.internship_count or 0,
        "experience_items": profile.experience_items or [],
        "projects": profile.projects or [],
        "education": profile.education or {},
        "domains": profile.domains or [],
    }


def job_payload(job: Job) -> dict:
    return {
        "id": str(job.id),
        "title": job.title,
        "company": job.company,
        "description": job.description or "",
        "required_skills": job.required_skills or [],
        "experience_required": float(job.experience_required or 0),
        "domain": job.domain,
        "role_type": job.role_type,
    }


def company_payload(company_profile: CompanyProfile | None) -> dict | None:
    if not company_profile:
        return None
    return {
        "company_name": company_profile.company_name,
        "typical_skills": company_profile.typical_skills,
        "typical_exp_years": float(company_profile.typical_exp_years or 0),
        "common_programs": company_profile.common_programs,
        "hiring_notes": company_profile.hiring_notes,
    }

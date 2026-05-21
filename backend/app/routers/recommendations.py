from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.candidate_profile import CandidateProfile
from app.models.job import Job
from app.schemas.recommendation import RecommendationResponse
from app.services.payloads import candidate_payload, job_payload
from app.services.recommendations import generate_project_recommendations
from app.services.skill_normalization import extract_missing_skills

router = APIRouter()


@router.get("/{user_id}/{job_id}", response_model=RecommendationResponse)
def get_project_recommendations(user_id: UUID, job_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found for user")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidate = candidate_payload(profile)
    job_data = job_payload(job)
    missing_skills = extract_missing_skills(candidate, job_data)
    recommendations = generate_project_recommendations(missing_skills, candidate, job_data)
    return RecommendationResponse(job_id=str(job.id), recommendations=recommendations)

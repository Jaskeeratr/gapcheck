from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.candidate_profile import CandidateProfile
from app.models.company_profile import CompanyProfile
from app.models.job import Job
from app.models.match_score import MatchScore
from app.schemas.match_score import MatchScoreResponse, ScoreComputeRequest
from app.services.gap_analysis import generate_gap_analysis
from app.services.payloads import candidate_payload, company_payload, job_payload
from app.services.scorer import compute_match

router = APIRouter()


@router.post("/compute", response_model=MatchScoreResponse)
def compute_score(payload: ScoreComputeRequest, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == payload.user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found for user")

    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = (
        db.query(MatchScore)
        .filter(MatchScore.user_id == payload.user_id, MatchScore.job_id == payload.job_id)
        .first()
    )
    if existing and not payload.force_recompute and existing.gap_analysis:
        return existing

    candidate_data = candidate_payload(profile)
    job_data = job_payload(job)
    computed = compute_match(candidate_data, job_data)

    company_profile = (
        db.query(CompanyProfile)
        .filter(func.lower(CompanyProfile.company_name) == job.company.lower())
        .first()
    )
    company_data = company_payload(company_profile)

    gap_analysis = generate_gap_analysis(candidate_data, job_data, computed, company_data)

    score_record = existing or MatchScore(user_id=payload.user_id, job_id=payload.job_id)
    score_record.overall_score = computed["overall"]
    score_record.skills_score = computed["skills"]
    score_record.experience_score = computed["experience"]
    score_record.education_score = computed["education"]
    score_record.project_score = computed["projects"]
    score_record.domain_score = computed["domain"]
    score_record.gap_analysis = gap_analysis

    if not existing:
        db.add(score_record)

    db.commit()
    db.refresh(score_record)
    return score_record


@router.get("/by-user/{user_id}", response_model=list[MatchScoreResponse])
def list_scores_for_user(user_id: UUID, limit: int = 50, db: Session = Depends(get_db)):
    safe_limit = min(max(limit, 1), 200)
    return (
        db.query(MatchScore)
        .filter(MatchScore.user_id == user_id)
        .order_by(MatchScore.overall_score.desc())
        .limit(safe_limit)
        .all()
    )


@router.get("/{user_id}/{job_id}", response_model=MatchScoreResponse)
def get_score(user_id: UUID, job_id: UUID, db: Session = Depends(get_db)):
    score = db.query(MatchScore).filter(MatchScore.user_id == user_id, MatchScore.job_id == job_id).first()
    if not score:
        raise HTTPException(status_code=404, detail="Match score not found")
    return score

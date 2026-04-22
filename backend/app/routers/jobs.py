from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.models.candidate_profile import CandidateProfile
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse
from app.services.job_loader import ensure_minimum_jobs, ingest_live_jobs, seed_jobs

router = APIRouter()


@router.post("/", response_model=JobResponse)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    existing_job = db.query(Job).filter(Job.external_id == payload.external_id).first()
    if existing_job:
        raise HTTPException(status_code=400, detail="Job with this external_id already exists")

    job = Job(
        source=payload.source,
        external_id=payload.external_id,
        title=payload.title,
        company=payload.company,
        location=payload.location,
        description=payload.description,
        required_skills=payload.required_skills,
        experience_required=payload.experience_required,
        role_type=payload.role_type,
        domain=payload.domain,
    )

    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.get("", response_model=list[JobResponse])
@router.get("/", response_model=list[JobResponse])
def list_jobs(
    search: str | None = None,
    company: str | None = None,
    is_active: bool = True,
    limit: int = 100,
    auto_fill: bool = True,
    include_baseline: bool = True,
    source: str | None = None,
    user_id: UUID | None = None,
    use_profile_keywords: bool = False,
    keywords: str | None = None,
    db: Session = Depends(get_db),
):
    if settings.ENVIRONMENT == "development" and auto_fill and is_active:
        ensure_minimum_jobs(db, minimum_jobs=24)

    query = db.query(Job).filter(Job.is_active == is_active)
    if not include_baseline:
        query = query.filter((Job.source.is_(None)) | (Job.source != "baseline_seed"))
    if source:
        query = query.filter(Job.source == source)
    if company:
        query = query.filter(Job.company.ilike(f"%{company}%"))
    if search:
        query = query.filter(Job.title.ilike(f"%{search}%"))

    keyword_terms: list[str] = []
    if keywords:
        keyword_terms.extend([value.strip().lower() for value in keywords.split(",") if value.strip()])

    if use_profile_keywords and user_id:
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
        if profile:
            profile_domains = [str(value).strip().lower() for value in (profile.domains or []) if str(value).strip()]
            profile_skills = [str(value).strip().lower() for value in (profile.skills or []) if str(value).strip()]
            keyword_terms.extend(profile_domains)
            keyword_terms.extend(profile_skills)

    deduped_keywords = list(dict.fromkeys(keyword_terms))
    if deduped_keywords:
        keyword_filters = []
        for term in deduped_keywords:
            like_value = f"%{term}%"
            keyword_filters.extend(
                [
                    Job.title.ilike(like_value),
                    Job.company.ilike(like_value),
                    Job.domain.ilike(like_value),
                    Job.role_type.ilike(like_value),
                    Job.description.ilike(like_value),
                ]
            )
        query = query.filter(or_(*keyword_filters))

    safe_limit = min(max(limit, 1), 500)
    return query.order_by(Job.scraped_at.desc()).limit(safe_limit).all()


@router.post("/seed-demo")
def seed_demo_jobs(amount: int = 20, db: Session = Depends(get_db)):
    inserted = seed_jobs(db, amount=amount)
    return {"inserted": inserted}


@router.api_route("/ingest-live", methods=["GET", "POST"])
@router.api_route("/ingest-live/", methods=["GET", "POST"])
def ingest_live_listings(
    max_per_source: int | None = None,
    x_job_ingest_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if settings.JOB_INGEST_TOKEN and x_job_ingest_token != settings.JOB_INGEST_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid ingest token")
    return ingest_live_jobs(db, max_per_source=max_per_source)


@router.get("/ingest-status")
@router.get("/ingest-status/")
def ingest_status():
    return {
        "configured_greenhouse_boards": settings.GREENHOUSE_BOARDS,
        "configured_lever_companies": settings.LEVER_COMPANIES,
        "ingest_enable_remotive": settings.INGEST_ENABLE_REMOTIVE,
        "ingest_enable_arbeitnow": settings.INGEST_ENABLE_ARBEITNOW,
        "ingest_enable_remoteok": settings.INGEST_ENABLE_REMOTEOK,
        "ingest_student_only": settings.INGEST_STUDENT_ONLY,
        "job_ingest_token_required": bool(settings.JOB_INGEST_TOKEN),
        "timeout_seconds": settings.JOB_INGEST_TIMEOUT_SEC,
        "max_per_source": settings.JOB_INGEST_MAX_PER_SOURCE,
    }


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

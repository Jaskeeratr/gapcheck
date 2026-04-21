from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse
from app.services.job_loader import ensure_minimum_jobs, seed_jobs

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


@router.get("/", response_model=list[JobResponse])
def list_jobs(
    search: str | None = None,
    company: str | None = None,
    is_active: bool = True,
    limit: int = 100,
    auto_fill: bool = True,
    db: Session = Depends(get_db),
):
    if settings.ENVIRONMENT == "development" and auto_fill and is_active:
        ensure_minimum_jobs(db, minimum_jobs=24)

    query = db.query(Job).filter(Job.is_active == is_active)
    if company:
        query = query.filter(Job.company.ilike(f"%{company}%"))
    if search:
        query = query.filter(Job.title.ilike(f"%{search}%"))

    safe_limit = min(max(limit, 1), 500)
    return query.order_by(Job.scraped_at.desc()).limit(safe_limit).all()


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/seed-demo")
def seed_demo_jobs(amount: int = 20, db: Session = Depends(get_db)):
    inserted = seed_jobs(db, amount=amount)
    return {"inserted": inserted}

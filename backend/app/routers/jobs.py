from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse

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
def list_jobs(db: Session = Depends(get_db)):
    return db.query(Job).order_by(Job.scraped_at.desc()).all()
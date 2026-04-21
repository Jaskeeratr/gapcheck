from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationResponse, ApplicationStatus, ApplicationUpdate

router = APIRouter()


@router.post("/", response_model=ApplicationResponse)
def create_or_update_application(payload: ApplicationCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = (
        db.query(Application)
        .filter(Application.user_id == payload.user_id, Application.job_id == payload.job_id)
        .first()
    )

    application = existing or Application(user_id=payload.user_id, job_id=payload.job_id)
    application.status = payload.status
    application.notes = payload.notes

    if not existing:
        db.add(application)

    db.commit()
    db.refresh(application)
    return application


@router.get("/user/{user_id}", response_model=list[ApplicationResponse])
def list_user_applications(
    user_id: UUID,
    status: ApplicationStatus | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Application).filter(Application.user_id == user_id)
    if status:
        query = query.filter(Application.status == status)

    return query.order_by(Application.updated_at.desc()).all()


@router.patch("/{application_id}", response_model=ApplicationResponse)
def update_application(application_id: UUID, payload: ApplicationUpdate, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(application, key, value)

    db.commit()
    db.refresh(application)
    return application

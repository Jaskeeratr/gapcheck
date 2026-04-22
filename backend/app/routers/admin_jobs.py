from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_db
from app.services.job_loader import ingest_live_jobs

router = APIRouter()


@router.api_route("/ingest-live", methods=["GET", "POST"])
@router.api_route("/ingest-live/", methods=["GET", "POST"])
def ingest_live_listings_admin(
    max_per_source: int | None = None,
    x_job_ingest_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if settings.JOB_INGEST_TOKEN and x_job_ingest_token != settings.JOB_INGEST_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid ingest token")
    return ingest_live_jobs(db, max_per_source=max_per_source)


@router.get("/ingest-status")
@router.get("/ingest-status/")
def ingest_status_admin():
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

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.deps import get_db

router = APIRouter()


@router.get("/live")
def liveness():
    return {"status": "ok"}


@router.get("/ready")
def readiness(db: Session = Depends(get_db)):
    db.execute(text("select 1"))
    return {"status": "ready", "database": "ok"}

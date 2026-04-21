from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.post("/", response_model=UserResponse)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    user = User(
        email=payload.email,
        name=payload.name,
        university=payload.university,
        program=payload.program,
        grad_year=payload.grad_year,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("/dev-bootstrap", response_model=UserResponse)
def bootstrap_dev_user(db: Session = Depends(get_db)):
    """
    Creates or returns a deterministic local dev user so frontend can function
    before auth is fully integrated.
    """
    preferred_email = "demo@gapcheck.dev"
    legacy_email = "demo@gapcheck.local"

    user = db.query(User).filter(User.email == preferred_email).first()
    if user:
        return user

    legacy_user = db.query(User).filter(User.email == legacy_email).first()
    if legacy_user:
        existing_with_preferred = db.query(User).filter(User.email == preferred_email).first()
        if not existing_with_preferred:
            legacy_user.email = preferred_email
            db.commit()
            db.refresh(legacy_user)
        return legacy_user

    user = User(
        email=preferred_email,
        name="GapCheck Demo User",
        university="University of Calgary",
        program="Software Engineering",
        grad_year=2027,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: UUID, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

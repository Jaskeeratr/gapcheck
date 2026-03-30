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
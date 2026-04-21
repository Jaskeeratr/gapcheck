from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.candidate_profile import CandidateProfile
from app.models.user import User
from app.schemas.candidate_profile import CandidateProfileResponse, CandidateProfileUpdate
from app.services.claude_client import parse_resume

router = APIRouter()


def _extract_pdf_text(file_bytes: bytes) -> str:
    try:
        import pdfplumber
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="pdfplumber is required for resume parsing. Install backend dependencies first.",
        ) from exc

    try:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            return " ".join(page.extract_text() or "" for page in pdf.pages).strip()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read PDF text. Please upload a text-based PDF.") from exc


@router.post("/upload", response_model=CandidateProfileResponse)
async def upload_resume(
    user_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported")

    file_bytes = await file.read()
    resume_text = _extract_pdf_text(file_bytes)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text was empty. Try exporting your resume as a text PDF.")

    parsed = parse_resume(resume_text)

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if profile is None:
        profile = CandidateProfile(user_id=user_id)
        db.add(profile)

    profile.resume_text = resume_text
    profile.skills = parsed.get("skills") or []
    profile.experience_years = parsed.get("experience_years") or 0
    profile.internship_count = parsed.get("internship_count") or 0
    profile.experience_items = parsed.get("experience_items") or []
    profile.projects = parsed.get("projects") or []
    profile.education = parsed.get("education") or {}
    profile.domains = parsed.get("domains") or []

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{user_id}", response_model=CandidateProfileResponse)
def get_profile(user_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return profile


@router.patch("/{user_id}", response_model=CandidateProfileResponse)
def update_profile(user_id: UUID, payload: CandidateProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/{user_id}")
def delete_profile(user_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    db.delete(profile)
    db.commit()
    return {"status": "deleted"}

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def resume_status():
    return {"message": "Resume endpoint working"}
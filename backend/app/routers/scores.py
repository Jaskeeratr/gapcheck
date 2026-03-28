from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def scores_status():
    return {"message": "Scores endpoint working"}
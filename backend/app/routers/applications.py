from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def applications_status():
    return {"message": "Applications endpoint working"}
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import applications, gaps, jobs, resume, scores, users

app = FastAPI(title="GapCheck API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(resume.router, prefix="/resume", tags=["resume"])
app.include_router(scores.router, prefix="/scores", tags=["scores"])
app.include_router(gaps.router, prefix="/gaps", tags=["gaps"])
app.include_router(applications.router, prefix="/applications", tags=["applications"])


@app.get("/")
def root():
    return {"message": "GapCheck API is running"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import admin_jobs, applications, gaps, jobs, resume, scores, users

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
app.include_router(admin_jobs.router, prefix="/admin/jobs", tags=["admin-jobs"])
app.include_router(resume.router, prefix="/resume", tags=["resume"])
app.include_router(scores.router, prefix="/scores", tags=["scores"])
app.include_router(gaps.router, prefix="/gaps", tags=["gaps"])
app.include_router(applications.router, prefix="/applications", tags=["applications"])


@app.get("/")
def root():
    return {"message": "GapCheck API is running"}


@app.get("/__routecheck")
def routecheck():
    """Lightweight diagnostics endpoint to confirm deployed route map."""
    paths = sorted({getattr(route, "path", "") for route in app.router.routes})
    return {
        "has_jobs_ingest_live": "/jobs/ingest-live" in paths,
        "has_jobs_ingest_status": "/jobs/ingest-status" in paths,
        "has_admin_jobs_ingest_live": "/admin/jobs/ingest-live" in paths,
        "has_admin_jobs_ingest_status": "/admin/jobs/ingest-status" in paths,
        "paths_sample": [p for p in paths if "ingest" in p or p.startswith("/jobs") or p.startswith("/admin/jobs")],
    }

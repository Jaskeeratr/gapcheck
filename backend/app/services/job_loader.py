from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.job import Job
from app.services.sources import (
    fetch_arbeitnow_jobs,
    fetch_greenhouse_jobs,
    fetch_lever_jobs,
    fetch_remoteok_jobs,
    fetch_remotive_jobs,
)
from app.services.sources.base import NormalizedJobListing

BASELINE_ROLE_TEMPLATES = [
    {
        "external_key": "frontend_developer_intern",
        "title": "Frontend Developer Intern (Baseline)",
        "domain": "web development",
        "role_type": "internship",
        "experience_required": 0.5,
        "required_skills": [
            {"skill": "React", "weight": 0.34},
            {"skill": "TypeScript", "weight": 0.28},
            {"skill": "JavaScript", "weight": 0.22},
            {"skill": "CSS", "weight": 0.16},
        ],
    },
    {
        "external_key": "software_engineering_intern",
        "title": "Software Engineering Intern",
        "domain": "software engineering",
        "role_type": "internship",
        "experience_required": 1.0,
        "required_skills": [
            {"skill": "Python", "weight": 0.25},
            {"skill": "TypeScript", "weight": 0.25},
            {"skill": "React", "weight": 0.20},
            {"skill": "SQL", "weight": 0.15},
            {"skill": "Git", "weight": 0.15},
        ],
    },
    {
        "external_key": "backend_developer_intern",
        "title": "Backend Developer Intern (Baseline)",
        "domain": "software engineering",
        "role_type": "internship",
        "experience_required": 0.5,
        "required_skills": [
            {"skill": "Python", "weight": 0.30},
            {"skill": "FastAPI", "weight": 0.25},
            {"skill": "SQL", "weight": 0.25},
            {"skill": "Docker", "weight": 0.20},
        ],
    },
    {
        "external_key": "data_analyst_intern",
        "title": "Data Analyst Intern",
        "domain": "data analytics",
        "role_type": "internship",
        "experience_required": 0.5,
        "required_skills": [
            {"skill": "SQL", "weight": 0.35},
            {"skill": "Python", "weight": 0.30},
            {"skill": "Power BI", "weight": 0.20},
            {"skill": "Excel", "weight": 0.15},
        ],
    },
    {
        "external_key": "data_engineering_coop",
        "title": "Data Engineering Co-op",
        "domain": "data engineering",
        "role_type": "co-op",
        "experience_required": 1.0,
        "required_skills": [
            {"skill": "Python", "weight": 0.30},
            {"skill": "Airflow", "weight": 0.25},
            {"skill": "PostgreSQL", "weight": 0.25},
            {"skill": "Docker", "weight": 0.20},
        ],
    },
    {
        "external_key": "cloud_platform_intern",
        "title": "Cloud Platform Intern",
        "domain": "cloud engineering",
        "role_type": "internship",
        "experience_required": 0.5,
        "required_skills": [
            {"skill": "Python", "weight": 0.30},
            {"skill": "AWS", "weight": 0.30},
            {"skill": "Docker", "weight": 0.20},
            {"skill": "SQL", "weight": 0.20},
        ],
    },
    {
        "external_key": "product_analyst_intern",
        "title": "Product Analyst Intern (Baseline)",
        "domain": "data analytics",
        "role_type": "internship",
        "experience_required": 0.0,
        "required_skills": [
            {"skill": "SQL", "weight": 0.30},
            {"skill": "Excel", "weight": 0.25},
            {"skill": "Python", "weight": 0.25},
            {"skill": "Communication", "weight": 0.20},
        ],
    },
]


def _build_baseline_job(template: dict, index: int) -> Job:
    posted_at = datetime.now(timezone.utc) - timedelta(days=index)
    return Job(
        source="baseline_seed",
        external_id=f"baseline:{template['external_key']}",
        title=template["title"],
        company="GapCheck Baseline",
        location="Calgary, AB",
        description=(
            "Representative baseline role profile used for comparison and prep. "
            "Use this as a skills benchmark when live listings are sparse."
        ),
        required_skills=template["required_skills"],
        experience_required=template["experience_required"],
        role_type=template["role_type"],
        domain=template["domain"],
        posted_at=posted_at,
        is_active=True,
    )


def _cleanup_seed_duplicates(db: Session) -> int:
    changed = 0

    # Legacy random seeds should not appear once baseline mode is active.
    legacy_rows = db.query(Job).filter(Job.source == "auto_seed", Job.is_active.is_(True)).all()
    for row in legacy_rows:
        row.is_active = False
        changed += 1

    # Keep only one active baseline per logical role key (external_id).
    baseline_rows = (
        db.query(Job)
        .filter(Job.source == "baseline_seed")
        .order_by(Job.posted_at.desc(), Job.scraped_at.desc())
        .all()
    )
    seen_keys: set[str] = set()
    for row in baseline_rows:
        key = (row.external_id or "").strip().lower()
        if not key:
            key = f"title:{(row.title or '').strip().lower()}"

        if key in seen_keys:
            if row.is_active:
                row.is_active = False
                changed += 1
            continue

        seen_keys.add(key)
        if not row.is_active:
            row.is_active = True
            changed += 1

    if changed:
        db.commit()
    return changed


def ensure_minimum_jobs(db: Session, minimum_jobs: int = 24) -> int:
    _ = minimum_jobs
    _cleanup_seed_duplicates(db)
    inserted = 0
    for index, template in enumerate(BASELINE_ROLE_TEMPLATES):
        external_id = f"baseline:{template['external_key']}"
        existing = db.query(Job).filter(Job.external_id == external_id).first()
        if existing:
            continue
        db.add(_build_baseline_job(template, index=index))
        inserted += 1
    db.commit()
    return inserted


def seed_jobs(db: Session, amount: int = 20) -> int:
    _cleanup_seed_duplicates(db)
    safe_amount = max(1, min(amount, len(BASELINE_ROLE_TEMPLATES)))
    inserted = 0
    for index, template in enumerate(BASELINE_ROLE_TEMPLATES[:safe_amount]):
        external_id = f"baseline:{template['external_key']}"
        existing = db.query(Job).filter(Job.external_id == external_id).first()
        if existing:
            continue
        db.add(_build_baseline_job(template, index=index))
        inserted += 1
    db.commit()
    return inserted


def _upsert_live_listing(db: Session, listing: NormalizedJobListing) -> str:
    existing = db.query(Job).filter(Job.external_id == listing.external_id).first()
    if existing is None:
        db.add(
            Job(
                source=listing.source,
                external_id=listing.external_id,
                title=listing.title,
                company=listing.company,
                location=listing.location,
                description=listing.description,
                required_skills=listing.required_skills or [],
                experience_required=listing.experience_required or 0,
                role_type=listing.role_type,
                domain=listing.domain,
                posted_at=listing.normalized_posted_at(),
                is_active=True,
            )
        )
        return "inserted"

    existing.source = listing.source
    existing.title = listing.title
    existing.company = listing.company
    existing.location = listing.location
    existing.description = listing.description
    existing.required_skills = listing.required_skills or existing.required_skills
    existing.experience_required = listing.experience_required if listing.experience_required is not None else existing.experience_required
    existing.role_type = listing.role_type or existing.role_type
    existing.domain = listing.domain or existing.domain
    existing.posted_at = listing.normalized_posted_at()
    existing.is_active = True
    return "updated"


def ingest_live_jobs(db: Session, max_per_source: int | None = None) -> dict:
    safe_max = max_per_source or settings.JOB_INGEST_MAX_PER_SOURCE
    safe_max = max(20, min(int(safe_max), 300))
    student_only = settings.INGEST_STUDENT_ONLY

    greenhouse_boards = settings.GREENHOUSE_BOARDS or ["shopify", "hubspot"]
    lever_companies = settings.LEVER_COMPANIES or ["netlify", "postman"]
    source_errors: dict[str, str] = {}

    try:
        greenhouse_listings = fetch_greenhouse_jobs(greenhouse_boards, max_per_board=safe_max, student_only=student_only)
    except Exception as exc:
        greenhouse_listings = []
        source_errors["greenhouse"] = str(exc)

    try:
        lever_listings = fetch_lever_jobs(lever_companies, max_per_company=safe_max, student_only=student_only)
    except Exception as exc:
        lever_listings = []
        source_errors["lever"] = str(exc)

    try:
        remotive_listings = (
            fetch_remotive_jobs(max_items=safe_max, student_only=student_only) if settings.INGEST_ENABLE_REMOTIVE else []
        )
    except Exception as exc:
        remotive_listings = []
        source_errors["remotive"] = str(exc)

    try:
        arbeitnow_listings = (
            fetch_arbeitnow_jobs(max_items=safe_max, student_only=student_only) if settings.INGEST_ENABLE_ARBEITNOW else []
        )
    except Exception as exc:
        arbeitnow_listings = []
        source_errors["arbeitnow"] = str(exc)

    try:
        remoteok_listings = (
            fetch_remoteok_jobs(max_items=safe_max, student_only=student_only) if settings.INGEST_ENABLE_REMOTEOK else []
        )
    except Exception as exc:
        remoteok_listings = []
        source_errors["remoteok"] = str(exc)

    listings: list[NormalizedJobListing] = [
        *greenhouse_listings,
        *lever_listings,
        *remotive_listings,
        *arbeitnow_listings,
        *remoteok_listings,
    ]

    seen_external_ids: set[str] = set()
    inserted = 0
    updated = 0
    for listing in listings:
        if listing.external_id in seen_external_ids:
            continue
        seen_external_ids.add(listing.external_id)
        outcome = _upsert_live_listing(db, listing)
        if outcome == "inserted":
            inserted += 1
        else:
            updated += 1

    if inserted or updated:
        db.commit()

    return {
        "fetched": len(listings),
        "upserted": len(seen_external_ids),
        "inserted": inserted,
        "updated": updated,
        "greenhouse_fetched": len(greenhouse_listings),
        "lever_fetched": len(lever_listings),
        "remotive_fetched": len(remotive_listings),
        "arbeitnow_fetched": len(arbeitnow_listings),
        "remoteok_fetched": len(remoteok_listings),
        "student_only": student_only,
        "configured_greenhouse_boards": greenhouse_boards,
        "configured_lever_companies": lever_companies,
        "source_errors": source_errors,
    }

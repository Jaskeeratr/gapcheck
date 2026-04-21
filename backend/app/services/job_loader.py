from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.job import Job

CALGARY_COMPANIES = [
    "Suncor Energy",
    "Benevity",
    "ATB Financial",
    "Neo Financial",
    "Shaw-Rogers",
    "TC Energy",
    "Pason",
    "De Havilland Canada",
    "AltaML",
    "Arcurve",
    "Cenovus",
    "Enbridge",
]

ROLE_TEMPLATES = [
    {
        "title": "Software Engineering Intern",
        "domain": "software engineering",
        "role_type": "internship",
        "required_skills": [
            {"skill": "Python", "weight": 0.25},
            {"skill": "TypeScript", "weight": 0.25},
            {"skill": "React", "weight": 0.20},
            {"skill": "SQL", "weight": 0.15},
            {"skill": "Git", "weight": 0.15},
        ],
    },
    {
        "title": "Data Analyst Intern",
        "domain": "data analytics",
        "role_type": "internship",
        "required_skills": [
            {"skill": "SQL", "weight": 0.35},
            {"skill": "Python", "weight": 0.30},
            {"skill": "Power BI", "weight": 0.20},
            {"skill": "Excel", "weight": 0.15},
        ],
    },
    {
        "title": "Data Engineering Co-op",
        "domain": "data engineering",
        "role_type": "co-op",
        "required_skills": [
            {"skill": "Python", "weight": 0.30},
            {"skill": "Airflow", "weight": 0.25},
            {"skill": "PostgreSQL", "weight": 0.25},
            {"skill": "Docker", "weight": 0.20},
        ],
    },
    {
        "title": "Frontend Developer Intern",
        "domain": "web development",
        "role_type": "internship",
        "required_skills": [
            {"skill": "React", "weight": 0.35},
            {"skill": "TypeScript", "weight": 0.30},
            {"skill": "CSS", "weight": 0.20},
            {"skill": "JavaScript", "weight": 0.15},
        ],
    },
    {
        "title": "Cloud Platform Intern",
        "domain": "cloud engineering",
        "role_type": "internship",
        "required_skills": [
            {"skill": "Python", "weight": 0.30},
            {"skill": "AWS", "weight": 0.30},
            {"skill": "Docker", "weight": 0.20},
            {"skill": "SQL", "weight": 0.20},
        ],
    },
]


def _build_demo_job(index: int) -> Job:
    template = random.choice(ROLE_TEMPLATES)
    company = random.choice(CALGARY_COMPANIES)
    days_ago = random.randint(0, 13)
    posted_at = datetime.now(timezone.utc) - timedelta(days=days_ago)

    title = template["title"]
    domain = template["domain"]
    role_type = template["role_type"]
    required_skills = template["required_skills"]
    exp_required = random.choice([0.0, 0.5, 1.0, 1.5])

    return Job(
        source="auto_seed",
        external_id=f"auto-{index}-{uuid.uuid4().hex[:10]}",
        title=title,
        company=company,
        location="Calgary, AB",
        description=(
            f"{company} is hiring a {title} in Calgary. "
            f"Hands-on project experience with {', '.join(skill['skill'] for skill in required_skills[:3])} is preferred."
        ),
        required_skills=required_skills,
        experience_required=exp_required,
        role_type=role_type,
        domain=domain,
        posted_at=posted_at,
        is_active=True,
    )


def ensure_minimum_jobs(db: Session, minimum_jobs: int = 24) -> int:
    existing_count = db.query(Job).filter(Job.is_active.is_(True)).count()
    if existing_count >= minimum_jobs:
        return 0

    needed = minimum_jobs - existing_count
    for index in range(needed):
        db.add(_build_demo_job(index=index))

    db.commit()
    return needed


def seed_jobs(db: Session, amount: int = 20) -> int:
    safe_amount = max(1, min(amount, 200))
    for index in range(safe_amount):
        db.add(_build_demo_job(index=index))

    db.commit()
    return safe_amount

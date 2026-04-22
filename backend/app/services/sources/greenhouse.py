from __future__ import annotations

import json
from datetime import datetime
from urllib.request import urlopen

from app.core.config import settings
from app.services.sources.base import NormalizedJobListing
from app.services.sources.utils import (
    infer_domain,
    infer_experience_required,
    infer_required_skills,
    infer_role_type,
    is_student_friendly,
    strip_html,
)


def _to_datetime(raw_value: str | None) -> datetime | None:
    if not raw_value:
        return None
    try:
        return datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
    except Exception:
        return None


def fetch_greenhouse_jobs(
    board_tokens: list[str],
    max_per_board: int = 120,
    student_only: bool = True,
) -> list[NormalizedJobListing]:
    listings: list[NormalizedJobListing] = []
    for token in board_tokens:
        url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true"
        try:
            with urlopen(url, timeout=settings.JOB_INGEST_TIMEOUT_SEC) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception:
            continue

        jobs = payload.get("jobs") or []
        for row in jobs[:max_per_board]:
            title = str(row.get("title") or "").strip()
            if not title:
                continue
            content = strip_html(str(row.get("content") or "").strip())
            if student_only and not is_student_friendly(title, content):
                continue
            location_obj = row.get("location") or {}
            location = str(location_obj.get("name") or "Remote").strip()
            external_id = f"greenhouse:{token}:{row.get('id')}"
            apply_url = str(row.get("absolute_url") or "").strip() or None
            posted_at = _to_datetime(row.get("updated_at"))
            listings.append(
                NormalizedJobListing(
                    source="greenhouse",
                    external_id=external_id,
                    title=title,
                    company=token.replace("-", " ").title(),
                    location=location,
                    description=content,
                    apply_url=apply_url,
                    posted_at=posted_at,
                    role_type=infer_role_type(title, content),
                    domain=infer_domain(title, content),
                    required_skills=infer_required_skills(f"{title}\n{content}"),
                    experience_required=infer_experience_required(content),
                )
            )
    return listings

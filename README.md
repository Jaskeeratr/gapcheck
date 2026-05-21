# GapCheck

GapCheck is an AI-powered career intelligence platform for comparing a candidate resume against job postings. It parses resumes into structured profile data, scores fit against job requirements, identifies missing skills, and recommends portfolio projects that close the highest-impact gaps.

## What It Does

- Upload and parse PDF resumes into skills, experience, education, projects, and domains.
- Ingest jobs from baseline roles and live sources such as Greenhouse, Lever, Remotive, Arbeitnow, and RemoteOK.
- Compute weighted match scores across skills, experience, education, projects, and domain fit.
- Return structured gap analysis with missing skills and recruiter-facing improvement guidance.
- Generate portfolio project recommendations from missing skills.
- Track applications and revisit match details.

## Architecture Overview

```text
frontend/
  React + TypeScript + Vite UI
  Job board, resume profile, match verdict, tracker

backend/
  FastAPI application
  routers/        HTTP API layer
  services/       scoring, parsing, ingestion, recommendations
  schemas/        Pydantic request/response models
  models/         SQLAlchemy persistence models
  alembic/        database migrations

database/
  PostgreSQL in production
  SQLAlchemy models + Alembic migrations
```

## Key Backend Flows

1. Resume upload calls the resume parser.
2. Parser uses Claude API when available and deterministic heuristics as fallback.
3. Parsed profile is stored as structured candidate data.
4. Job listings are created manually, seeded as baselines, or ingested from live source adapters.
5. Score computation builds normalized candidate/job payloads.
6. Gap analysis identifies missing skills and weak dimensions.
7. Recommendation engine groups missing skills into realistic portfolio projects.

## Recommendation Engine

The Phase 1 recommendation engine is deterministic and production-safe. It uses structured missing skills from gap analysis and groups them by category:

- DevOps
- Database
- Cloud
- Framework
- Technology
- Soft Skill

Each recommendation returns:

- `title`
- `difficulty`
- `estimated_time`
- `skills_covered`
- `recruiter_impact`
- `suggested_tech_stack`
- `why_this_project_helps`

Example output:

```json
{
  "title": "Production Deployment Pipeline for a Resume-Matching API",
  "difficulty": "Advanced",
  "estimated_time": "2-3 weeks",
  "skills_covered": ["Docker", "CI/CD"],
  "recruiter_impact": "Shows production maturity beyond classroom projects.",
  "suggested_tech_stack": ["Docker", "Docker Compose", "GitHub Actions"],
  "why_this_project_helps": "This closes the highest-signal gaps from the match analysis."
}
```

## API Overview

- `GET /health/live` - liveness check.
- `GET /health/ready` - database readiness check.
- `POST /users/dev-bootstrap` - creates or returns a demo user.
- `GET /jobs` - lists jobs with filters.
- `POST /jobs/ingest-live` - runs live job ingestion.
- `POST /resume/{user_id}` - uploads and parses a resume PDF.
- `POST /scores/compute` - computes match score and gap analysis.
- `GET /recommendations/{user_id}/{job_id}` - returns project recommendations.
- `POST /applications` - tracks an application.

## Local Setup

### Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend default: `http://127.0.0.1:5173`

Backend default: `http://127.0.0.1:8000`

## Docker Setup

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

The backend container runs Alembic migrations before starting the API.

## Testing

Backend:

```powershell
cd backend
python -m pytest -q
```

Frontend:

```powershell
cd frontend
npm run build
```

CI runs backend compile/tests and frontend production build through GitHub Actions.

## Project Structure

```text
backend/app/core
  Config, database setup, portable DB types, logging, error handlers

backend/app/routers
  FastAPI route modules grouped by resource

backend/app/services
  Business logic for parsing, scoring, gap analysis, recommendations, job ingestion

backend/app/schemas
  Pydantic models for typed API inputs and outputs

frontend/src/pages
  Route-level React screens

frontend/src/components
  Reusable UI components
```

## Screenshots

Add screenshots here before using this as a public portfolio demo:

- Job board with scored listings
- Resume parser/profile page
- Match breakdown page
- Recommendation cards
- Application tracker

## Resume-Accurate Claims This Code Supports

- Dockerized FastAPI + React deployment.
- GitHub Actions CI for backend and frontend validation.
- Structured AI-assisted resume parsing with deterministic fallback.
- Weighted job compatibility scoring.
- Structured missing-skill extraction.
- Production-style recommendation engine for portfolio project generation.
- Multi-source job ingestion pipeline with adapter-style source modules.

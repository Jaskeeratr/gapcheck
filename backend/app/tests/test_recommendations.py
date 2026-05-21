from app.schemas.gap_analysis import MissingSkill
from app.services.recommendations import generate_project_recommendations


def test_generate_project_recommendations_groups_related_skills():
    missing_skills = [
        MissingSkill(name="Docker", category="DevOps", confidence=0.94),
        MissingSkill(name="CI/CD", category="DevOps", confidence=0.91),
        MissingSkill(name="PostgreSQL", category="Database", confidence=0.89),
        MissingSkill(name="FastAPI", category="Framework", confidence=0.86),
    ]
    candidate = {"projects": [], "skills": ["Python"]}
    job = {"title": "Backend Developer Intern", "domain": "backend engineering"}

    recommendations = generate_project_recommendations(missing_skills, candidate, job)

    assert recommendations
    first = recommendations[0]
    assert "Docker" in first.skills_covered
    assert "CI/CD" in first.skills_covered
    assert "GitHub Actions" in first.suggested_tech_stack
    assert first.recruiter_impact
    assert first.why_this_project_helps

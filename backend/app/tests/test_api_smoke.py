from fastapi.testclient import TestClient

from app.main import app


def test_liveness_endpoint():
    client = TestClient(app)

    response = client.get("/health/live")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_routecheck_includes_recommendation_routes():
    paths = {getattr(route, "path", "") for route in app.router.routes}

    assert "/recommendations/{user_id}/{job_id}" in paths
    assert "/health/live" in paths

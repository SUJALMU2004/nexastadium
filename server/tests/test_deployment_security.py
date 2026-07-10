"""Deployment and public-surface security tests for NexaStadium AI."""

from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


PROJECT_ROOT = Path(__file__).resolve().parents[2]
FORBIDDEN_EXTERNAL_DATABASE_MARKERS = (
    "SUPABASE",
    "VITE_SUPABASE",
    "supabaseUrl",
    "supabaseKey",
    "createClient",
    "from supabase import",
    "supabase==",
    "@supabase/",
)
FILES_SCANNED_FOR_EXTERNAL_DATABASE_SETUP = (
    "README.md",
    "SOLUTION_MAP.md",
    "server/README.md",
    "server/.env.example",
    "client/.env.example",
    "server/requirements.txt",
)


def test_public_evaluation_checklist_api_is_not_registered() -> None:
    """Verify evaluation-only checklist endpoints are not exposed in the live API.

    Args:
        None.

    Returns:
        None.
    """
    registered_route_paths = {
        getattr(application_route, "path", "")
        for application_route in app.routes
    }

    assert "/api/readiness/checklist" not in registered_route_paths
    assert "/health" in registered_route_paths


def test_health_endpoint_exposes_no_secret_material() -> None:
    """Verify deployment health output is useful but does not expose secrets.

    Args:
        None.

    Returns:
        None.
    """
    test_client = TestClient(app)
    health_response = test_client.get("/health")

    assert health_response.status_code == 200
    assert health_response.json() == {
        "status": "ok",
        "service": "nexastadium-ai",
        "environment": settings.ENVIRONMENT,
    }
    serialized_health_payload = str(health_response.json()).lower()
    assert "openrouter" not in serialized_health_payload
    assert "api_key" not in serialized_health_payload
    assert "secret" not in serialized_health_payload


def test_external_database_setup_is_not_configured() -> None:
    """Verify removed external database setup does not return through config or docs.

    Args:
        None.

    Returns:
        None.
    """
    files_to_scan = [
        PROJECT_ROOT / relative_file_path
        for relative_file_path in FILES_SCANNED_FOR_EXTERNAL_DATABASE_SETUP
    ]
    files_to_scan.extend((PROJECT_ROOT / "server" / "app").rglob("*.py"))
    files_to_scan.extend((PROJECT_ROOT / "client" / "src").rglob("*.*"))

    marker_hits: list[str] = []
    for file_path in files_to_scan:
        if not file_path.is_file():
            continue
        file_text = file_path.read_text(encoding="utf-8")
        for forbidden_marker in FORBIDDEN_EXTERNAL_DATABASE_MARKERS:
            if forbidden_marker in file_text:
                marker_hits.append(f"{file_path.relative_to(PROJECT_ROOT)} contains {forbidden_marker}")

    assert marker_hits == []

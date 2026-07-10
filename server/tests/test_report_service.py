"""Unit tests for deterministic operations report service."""

from app.models.report import OperationsSummaryRequest
from app.services.report_service import report_service


def test_operations_summary_returns_markdown() -> None:
    """Verify operations report includes structured fields and Markdown.

    Args:
        None.

    Returns:
        None.
    """
    report_response = report_service.generate_operations_summary(
        OperationsSummaryRequest(
            stadium_id="metlife-stadium",
            scenario_id="MATCH_ENTRY_SURGE",
            attendance_estimate=80000,
            incident_summary="Gate queues rising near the north plaza.",
            sustainability_focus="Waste sorting and public transit adoption",
            transport_status="Transit operating with managed queues",
        )
    )

    assert report_response.report_title
    assert report_response.operational_priorities
    assert report_response.staff_actions
    assert report_response.markdown.startswith("#")

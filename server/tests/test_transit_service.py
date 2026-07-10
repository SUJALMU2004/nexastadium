"""Unit tests for deterministic transit service workflows."""

from app.models.transit import EgressPlanRequest, RouteRecommendationRequest
from app.services.transit_service import transit_service


def test_egress_plan_returns_required_fields() -> None:
    """Verify egress planning returns the required response shape.

    Args:
        None.

    Returns:
        None.
    """
    egress_plan = transit_service.generate_egress_plan(
        EgressPlanRequest(
            stadium_id="metlife-stadium",
            crowd_intensity="Very busy",
            transport_mode="Metro / Train",
            accessibility_priority="Wheelchair access",
        )
    )

    assert egress_plan.exit_strategy
    assert egress_plan.recommended_gates
    assert egress_plan.transport_notes
    assert egress_plan.crowd_distribution_advice
    assert egress_plan.estimated_clearance_minutes > 0
    assert egress_plan.accessibility_note


def test_route_recommendation_returns_required_fields() -> None:
    """Verify route recommendations return the required response shape.

    Args:
        None.

    Returns:
        None.
    """
    route_recommendation = transit_service.generate_route_recommendation(
        RouteRecommendationRequest(
            stadium_id="metlife-stadium",
            starting_point_type="Transit hub",
            transport_mode="Metro / Train",
            arrival_preference="Lowest crowd",
        )
    )

    assert route_recommendation.recommended_route
    assert route_recommendation.steps
    assert route_recommendation.estimated_minutes > 0
    assert route_recommendation.crowd_level
    assert route_recommendation.accessibility_notes
    assert route_recommendation.carbon_note


def test_transport_alerts_are_stadium_specific() -> None:
    """Verify transport alerts include required stadium-specific fields.

    Args:
        None.

    Returns:
        None.
    """
    transport_alerts_response = transit_service.get_transport_alerts("metlife-stadium")

    assert transport_alerts_response.stadium_id == "metlife-stadium"
    assert transport_alerts_response.alerts
    for transport_alert in transport_alerts_response.alerts:
        assert transport_alert.title
        assert transport_alert.severity
        assert transport_alert.affected_transport_mode
        assert transport_alert.message
        assert transport_alert.recommended_action
        assert transport_alert.last_updated

"""Unit tests for deterministic stadium simulation service."""

from app.models.simulation import CrowdRiskRequest, FlowControlRequest, ScenarioComparisonRequest
from app.services.simulation_service import simulation_service


def test_crowd_risk_returns_required_fields() -> None:
    """Verify crowd risk calculation returns required values.

    Args:
        None.

    Returns:
        None.
    """
    crowd_risk_response = simulation_service.calculate_crowd_risk(
        CrowdRiskRequest(
            stadium_id="metlife-stadium",
            scenario_id="MATCH_ENTRY_SURGE",
            expected_attendance=82000,
            gate_open_minutes=90,
            weather_condition="Clear",
            transit_pressure="High",
            accessibility_demand="Elevated",
        )
    )

    assert 0 <= crowd_risk_response.risk_score <= 100
    assert crowd_risk_response.risk_level in {"low", "medium", "high", "critical"}
    assert crowd_risk_response.recommended_actions


def test_scenario_comparison_returns_two_items() -> None:
    """Verify scenario comparison returns both requested scenarios.

    Args:
        None.

    Returns:
        None.
    """
    comparison_response = simulation_service.compare_scenarios(
        ScenarioComparisonRequest(
            stadium_id="metlife-stadium",
            primary_scenario_id="MATCH_ENTRY_SURGE",
            comparison_scenario_id="POST_MATCH_EGRESS",
        )
    )

    assert len(comparison_response.comparison_items) == 2
    assert comparison_response.command_recommendation


def test_flow_control_returns_gate_and_transit_guidance() -> None:
    """Verify flow-control planner returns required operational guidance.

    Args:
        None.

    Returns:
        None.
    """
    flow_control_response = simulation_service.generate_flow_control(
        FlowControlRequest(
            stadium_id="metlife-stadium",
            scenario_id="POST_MATCH_EGRESS",
            inbound_rate_per_minute=2200,
            open_gate_count=5,
            transit_mode="Metro / Train",
            accessibility_priority="High",
        )
    )

    assert flow_control_response.recommended_gate_openings >= 5
    assert flow_control_response.crowd_distribution
    assert flow_control_response.transit_coordination_note

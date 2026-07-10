"""Deterministic crowd simulation service for FIFA World Cup 2026 operations."""

from math import ceil

from app.models.simulation import (
    CrowdRiskRequest,
    CrowdRiskResponse,
    FlowControlRequest,
    FlowControlResponse,
    ScenarioComparisonItem,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
)
from app.services.scenario_service import scenario_engine
from app.services.stadium_service import stadium_data_service


class SimulationService:
    """Calculates local crowd-risk, scenario comparison, and flow-control outputs."""

    def calculate_crowd_risk(self, crowd_risk_request: CrowdRiskRequest) -> CrowdRiskResponse:
        """Calculate deterministic crowd risk for a stadium scenario.

        Args:
            crowd_risk_request: Validated crowd risk request payload.

        Returns:
            Crowd risk score, level, and recommended operational actions.
        """
        stadium = stadium_data_service.get_stadium_by_id(crowd_risk_request.stadium_id)
        scenario = scenario_engine.set_scenario(crowd_risk_request.scenario_id)
        attendance_ratio = min(1.25, crowd_risk_request.expected_attendance / max(stadium.capacity, 1))
        gate_pressure_points = 12 if crowd_risk_request.gate_open_minutes < 90 else 4
        weather_points = 10 if crowd_risk_request.weather_condition.lower() not in {"clear", "mild"} else 0
        transit_points = 8 if crowd_risk_request.transit_pressure.lower() in {"high", "critical"} else 3
        accessibility_points = 6 if crowd_risk_request.accessibility_demand.lower() in {"elevated", "high"} else 2
        raw_score = round(
            scenario["crowd_density_percentage"] * 0.5
            + attendance_ratio * 28
            + gate_pressure_points
            + weather_points
            + transit_points
            + accessibility_points
        )
        risk_score = max(0, min(100, raw_score))
        risk_level = _risk_level_from_score(risk_score)

        return CrowdRiskResponse(
            risk_score=risk_score,
            risk_level=risk_level,
            contributing_factors=[
                f"{scenario['name']} density baseline is {scenario['crowd_density_percentage']}%.",
                f"Expected attendance is {crowd_risk_request.expected_attendance:,} against {stadium.capacity:,} capacity.",
                f"Gate opening window is {crowd_risk_request.gate_open_minutes} minutes.",
                f"Transit pressure is {crowd_risk_request.transit_pressure}; weather is {crowd_risk_request.weather_condition}.",
            ],
            recommended_actions=[
                "Open accessible assistance lanes before general overflow queues build.",
                "Move volunteers to perimeter gates, information desks, and the first affected concourse zone.",
                "Prepare a calm multilingual PA message if crowd movement slows below normal walking pace.",
            ],
            staffing_note=f"Stage supervisors in {', '.join(scenario['affected_zones'][:2])} at {stadium.name}.",
            accessibility_note=(
                "Keep elevators, accessible restrooms, and mobility assistance points clear before adjusting general fan flow."
            ),
        )

    def compare_scenarios(self, comparison_request: ScenarioComparisonRequest) -> ScenarioComparisonResponse:
        """Compare two operational scenarios for a selected stadium.

        Args:
            comparison_request: Validated scenario comparison request.

        Returns:
            Comparison response for command planning.
        """
        stadium = stadium_data_service.get_stadium_by_id(comparison_request.stadium_id)
        primary_scenario = scenario_engine.set_scenario(comparison_request.primary_scenario_id)
        comparison_scenario = scenario_engine.set_scenario(comparison_request.comparison_scenario_id)
        comparison_items = [
            _build_comparison_item(primary_scenario),
            _build_comparison_item(comparison_scenario),
        ]
        highest_density_item = max(
            comparison_items,
            key=lambda comparison_item: comparison_item.crowd_density_percentage,
        )

        return ScenarioComparisonResponse(
            stadium_id=stadium.id,
            stadium_name=stadium.name,
            comparison_items=comparison_items,
            command_recommendation=(
                f"Prioritize {highest_density_item.scenario_name} at {stadium.name}; it has the higher density signal "
                f"and should receive first staffing, PA, and accessibility route checks."
            ),
        )

    def generate_flow_control(self, flow_control_request: FlowControlRequest) -> FlowControlResponse:
        """Generate deterministic gate and transit flow-control recommendations.

        Args:
            flow_control_request: Validated flow-control planning request.

        Returns:
            Flow-control response for transit and gate operations.
        """
        stadium = stadium_data_service.get_stadium_by_id(flow_control_request.stadium_id)
        scenario = scenario_engine.set_scenario(flow_control_request.scenario_id)
        gate_capacity_per_minute = 275
        required_gate_count = max(1, ceil(flow_control_request.inbound_rate_per_minute / gate_capacity_per_minute))
        recommended_gate_openings = min(max(required_gate_count, flow_control_request.open_gate_count), 18)
        pressure_gap = max(0, flow_control_request.inbound_rate_per_minute - flow_control_request.open_gate_count * gate_capacity_per_minute)
        hold_release_minutes = min(12, ceil(pressure_gap / 300)) if pressure_gap else 0
        risk_level = _risk_level_from_score(min(100, scenario["crowd_density_percentage"] + hold_release_minutes * 4))

        return FlowControlResponse(
            risk_level=risk_level,
            recommended_gate_openings=recommended_gate_openings,
            hold_release_minutes=hold_release_minutes,
            crowd_distribution=[
                f"Route early arrivals toward {scenario['affected_zones'][0]} with visible volunteer support.",
                f"Use outer concourse loops at {stadium.name} when main concourse density rises.",
                "Hold the next release wave briefly if accessible corridors or elevator banks begin to crowd.",
            ],
            transit_coordination_note=(
                f"Coordinate {flow_control_request.transit_mode} dispatch timing before releasing the largest fan wave."
            ),
            accessibility_lane_note=(
                f"Treat {flow_control_request.accessibility_priority} accessibility priority as a protected path, not a general queue overflow lane."
            ),
        )


def _build_comparison_item(scenario: dict[str, object]) -> ScenarioComparisonItem:
    """Build a typed comparison item from scenario JSON.

    Args:
        scenario: Scenario dictionary loaded by ScenarioEngine.

    Returns:
        Scenario comparison row.
    """
    affected_zones = [str(zone_name) for zone_name in scenario.get("affected_zones", [])]
    recommended_focus = (
        f"Focus on {affected_zones[0]} first, then align volunteers, PA messaging, and accessibility support."
        if affected_zones
        else "Focus on command monitoring and staff confirmation."
    )
    return ScenarioComparisonItem(
        scenario_id=str(scenario["id"]),
        scenario_name=str(scenario["name"]),
        crowd_density_percentage=int(scenario["crowd_density_percentage"]),
        affected_zones=affected_zones,
        recommended_focus=recommended_focus,
    )


def _risk_level_from_score(risk_score: int) -> str:
    """Convert a numeric risk score into a visible text level.

    Args:
        risk_score: Risk score from 0 to 100.

    Returns:
        Low, medium, high, or critical risk label.
    """
    if risk_score >= 90:
        return "critical"
    if risk_score >= 75:
        return "high"
    if risk_score >= 45:
        return "medium"
    return "low"


simulation_service = SimulationService()

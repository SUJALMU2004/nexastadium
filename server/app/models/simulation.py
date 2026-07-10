"""Pydantic models for deterministic crowd simulation workflows."""

from pydantic import BaseModel, Field


class CrowdRiskRequest(BaseModel):
    """Crowd risk calculation request for a selected stadium and scenario."""

    stadium_id: str = Field(..., min_length=1)
    scenario_id: str = Field(..., min_length=1)
    expected_attendance: int = Field(..., ge=0)
    gate_open_minutes: int = Field(default=120, ge=0)
    weather_condition: str = Field(default="Clear")
    transit_pressure: str = Field(default="Medium")
    accessibility_demand: str = Field(default="Standard")


class CrowdRiskResponse(BaseModel):
    """Crowd risk score and operational recommendations."""

    risk_score: int = Field(ge=0, le=100)
    risk_level: str
    contributing_factors: list[str]
    recommended_actions: list[str]
    staffing_note: str
    accessibility_note: str


class ScenarioComparisonRequest(BaseModel):
    """Scenario comparison request for operations planning."""

    stadium_id: str = Field(..., min_length=1)
    primary_scenario_id: str = Field(..., min_length=1)
    comparison_scenario_id: str = Field(..., min_length=1)


class ScenarioComparisonItem(BaseModel):
    """Comparison row for one operational scenario."""

    scenario_id: str
    scenario_name: str
    crowd_density_percentage: int = Field(ge=0, le=100)
    affected_zones: list[str]
    recommended_focus: str


class ScenarioComparisonResponse(BaseModel):
    """Structured comparison between two operational scenarios."""

    stadium_id: str
    stadium_name: str
    comparison_items: list[ScenarioComparisonItem]
    command_recommendation: str


class FlowControlRequest(BaseModel):
    """Gate and transit flow-control planning request."""

    stadium_id: str = Field(..., min_length=1)
    scenario_id: str = Field(..., min_length=1)
    inbound_rate_per_minute: int = Field(default=1800, ge=0)
    open_gate_count: int = Field(default=6, ge=1)
    transit_mode: str = Field(default="Metro / Train")
    accessibility_priority: str = Field(default="Standard")


class FlowControlResponse(BaseModel):
    """Deterministic flow-control recommendation response."""

    risk_level: str
    recommended_gate_openings: int
    hold_release_minutes: int
    crowd_distribution: list[str]
    transit_coordination_note: str
    accessibility_lane_note: str

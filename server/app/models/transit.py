"""Pydantic models for transit and egress planning responses."""

from pydantic import BaseModel, Field


class TransitModeOption(BaseModel):
    """Single transportation mode available to fans at a stadium."""

    mode: str
    options: list[str]


class TransitOptionsResponse(BaseModel):
    """Transit response for a specific FIFA World Cup 2026 stadium."""

    stadium_id: str
    stadium_name: str
    modes: list[TransitModeOption]
    rideshare_dropoff: str
    service_notes: str


class EgressPlanRequest(BaseModel):
    """Post-match egress planning request payload."""

    stadium_id: str = Field(..., min_length=1)
    crowd_intensity: str = Field(..., min_length=1)
    transport_mode: str = Field(..., min_length=1)
    accessibility_priority: str = Field(default="None")


class EgressPlanResponse(BaseModel):
    """Structured post-match egress plan for a selected stadium."""

    exit_strategy: str
    recommended_gates: list[str]
    transport_notes: str
    crowd_distribution_advice: str
    estimated_clearance_minutes: int
    accessibility_note: str


class RouteRecommendationRequest(BaseModel):
    """Match-day route recommendation request payload."""

    stadium_id: str = Field(..., min_length=1)
    starting_point_type: str = Field(..., min_length=1)
    transport_mode: str = Field(..., min_length=1)
    arrival_preference: str = Field(..., min_length=1)


class RouteRecommendationResponse(BaseModel):
    """Structured route recommendation for stadium arrival or departure."""

    recommended_route: str
    steps: list[str]
    estimated_minutes: int
    crowd_level: str
    accessibility_notes: str
    carbon_note: str


class TransportAlert(BaseModel):
    """Stadium-specific transport alert for demo operations workflows."""

    title: str
    severity: str
    affected_transport_mode: str
    message: str
    recommended_action: str
    last_updated: str


class TransportAlertsResponse(BaseModel):
    """Collection of stadium-specific transport alerts."""

    stadium_id: str
    stadium_name: str
    alerts: list[TransportAlert]

"""Pydantic models for FIFA World Cup 2026 stadium data."""

from pydantic import BaseModel, Field


class StadiumZone(BaseModel):
    """Operational seating or concourse zone inside a stadium."""

    zone_id: str
    name: str
    section_range: str
    has_wheelchair_access: bool


class TransportOptions(BaseModel):
    """Public and venue-managed transportation options for a stadium."""

    metro: list[str]
    bus: list[str]
    parking_zones: list[str]
    rideshare_dropoff: str


class AccessibilityFeatures(BaseModel):
    """Accessibility services and support points available at a stadium."""

    wheelchair_access_points: list[str]
    hearing_loop_sections: list[str]
    visual_assistance_available: bool
    accessible_restroom_locations: list[str]


class FoodZone(BaseModel):
    """Food zone with dietary and local specialty offerings."""

    zone_name: str
    offerings: list[str]


class Stadium(BaseModel):
    """Complete static stadium record for local retrieval."""

    id: str
    name: str
    city: str
    country: str
    capacity: int
    zones: list[StadiumZone]
    transport_options: TransportOptions
    accessibility_features: AccessibilityFeatures
    food_zones: list[FoodZone]


class StadiumListResponse(BaseModel):
    """Response containing every supported World Cup 2026 stadium."""

    stadiums: list[Stadium]


class Scenario(BaseModel):
    """Crowd operations scenario used by the AI and ops portal."""

    id: str
    name: str
    description: str
    affected_zones: list[str]
    crowd_density_percentage: int = Field(ge=0, le=100)
    recommended_actions: list[str]
    suggested_announcement_templates: list[str]


class ScenarioListResponse(BaseModel):
    """Response containing all pre-defined crowd scenarios."""

    scenarios: list[Scenario]

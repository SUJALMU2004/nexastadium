"""Pydantic models for AI request and response contracts."""

from pydantic import AliasChoices, BaseModel, Field


class ChatRequest(BaseModel):
    """Fan assistant request payload."""

    message: str = Field(..., min_length=1, max_length=4000)
    language: str = Field(default="en")
    stadium_id: str = Field(..., min_length=1)
    context: str = Field(default="")


class OpsRequest(BaseModel):
    """Operations recommendation request payload."""

    scenario_id: str = Field(..., min_length=1)
    incident_type: str = Field(..., min_length=1)
    stadium_id: str = Field(..., min_length=1)
    severity: str = Field(default="medium")
    affected_zone: str = Field(default="")
    notes: str = Field(default="", max_length=1000)


class AnnouncementRequest(BaseModel):
    """PA announcement drafting request payload."""

    scenario_id: str = Field(..., min_length=1)
    language_codes: list[str] = Field(default_factory=lambda: ["en"])
    stadium_id: str = Field(..., min_length=1)
    announcement_purpose: str = Field(
        default="General safety reminder",
        validation_alias=AliasChoices("announcement_purpose", "purpose"),
    )
    tone: str = Field(default="Calm")


class NavigationGuidanceRequest(BaseModel):
    """Stadium navigation guidance request payload."""

    stadium_id: str = Field(..., min_length=1)
    from_location: str = Field(..., min_length=1)
    to_location: str = Field(..., min_length=1)
    accessibility_needs: str = Field(default="")
    language: str = Field(default="en")


class NavigationGuidanceResponse(BaseModel):
    """Structured stadium navigation guidance response."""

    steps: list[str]
    estimated_minutes: int
    accessibility_notes: str
    alternative_route: str | None


class OpsRecommendationResponse(BaseModel):
    """Structured response returned for operations incident planning."""

    recommended_actions: list[str]
    priority_level: str
    affected_zones: list[str]
    estimated_resolution_minutes: int
    staff_coordination_note: str
    safety_escalation_trigger: str


class AnnouncementResponse(BaseModel):
    """Localized PA announcement response contract."""

    announcements: dict[str, str]


class MatchDayBriefingRequest(BaseModel):
    """AI-assisted match-day briefing request payload."""

    stadium_id: str = Field(..., min_length=1)
    scenario_id: str = Field(..., min_length=1)
    language: str = Field(default="en")
    briefing_focus: str = Field(default="Operations readiness", max_length=200)
    expected_attendance: int = Field(default=0, ge=0)
    weather_condition: str = Field(default="Clear", max_length=100)
    notes: str = Field(default="", max_length=1000)


class MatchDayBriefingResponse(BaseModel):
    """Structured match-day briefing generated for stadium operations."""

    briefing_title: str
    executive_summary: str
    key_risks: list[str]
    recommended_actions: list[str]
    volunteer_coordination: str
    accessibility_focus: str
    transit_focus: str
    sustainability_focus: str


class SafetySupportPackRequest(BaseModel):
    """Multilingual fan safety support pack request payload."""

    stadium_id: str = Field(..., min_length=1)
    language_codes: list[str] = Field(default_factory=lambda: ["en"])
    support_focus: str = Field(default="General safety", max_length=200)
    current_location: str = Field(default="", max_length=200)
    accessibility_needs: str = Field(default="", max_length=200)
    notes: str = Field(default="", max_length=1000)


class SafetySupportPackContent(BaseModel):
    """Localized safety guidance content for one requested language."""

    title: str
    safety_steps: list[str]
    accessibility_note: str
    transport_note: str
    staff_help_message: str


class SafetySupportPackResponse(BaseModel):
    """Multilingual safety support pack response contract."""

    packs: dict[str, SafetySupportPackContent]


class ErrorResponse(BaseModel):
    """Human-readable API error response contract."""

    detail: str

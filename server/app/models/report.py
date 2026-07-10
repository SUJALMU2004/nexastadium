"""Pydantic models for operations report generation."""

from pydantic import BaseModel, Field


class OperationsSummaryRequest(BaseModel):
    """Request payload for a copyable match operations report."""

    stadium_id: str = Field(..., min_length=1)
    scenario_id: str = Field(..., min_length=1)
    attendance_estimate: int = Field(..., ge=0)
    incident_summary: str = Field(default="", max_length=1000)
    sustainability_focus: str = Field(default="Waste sorting and public transit adoption")
    transport_status: str = Field(default="Transit operating with managed queues")


class OperationsSummaryResponse(BaseModel):
    """Structured operations summary and markdown report."""

    report_title: str
    executive_summary: str
    operational_priorities: list[str]
    staff_actions: list[str]
    sustainability_notes: list[str]
    markdown: str

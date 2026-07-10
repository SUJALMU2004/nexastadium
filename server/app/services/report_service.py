"""Local operations report generation for NexaStadium AI."""

from app.core import prompt_guard
from app.models.report import OperationsSummaryRequest, OperationsSummaryResponse
from app.services.scenario_service import scenario_engine
from app.services.stadium_service import stadium_data_service


class ReportService:
    """Builds copyable Markdown reports without storing user input."""

    def generate_operations_summary(
        self,
        operations_summary_request: OperationsSummaryRequest,
    ) -> OperationsSummaryResponse:
        """Generate a deterministic operations summary and Markdown report.

        Args:
            operations_summary_request: Validated operations report request.

        Returns:
            Structured report response with copyable Markdown.
        """
        stadium = stadium_data_service.get_stadium_by_id(operations_summary_request.stadium_id)
        scenario = scenario_engine.set_scenario(operations_summary_request.scenario_id)
        sanitized_incident_summary = prompt_guard.sanitize_input(operations_summary_request.incident_summary)[:1000]
        operational_priorities = [
            f"Manage {scenario['name']} across {', '.join(scenario['affected_zones'][:3])}.",
            f"Plan for {operations_summary_request.attendance_estimate:,} fans against a listed capacity of {stadium.capacity:,}.",
            f"Keep transport status visible: {operations_summary_request.transport_status}.",
        ]
        staff_actions = [
            "Assign a command lead, volunteer coordinator, accessibility contact, and transport liaison.",
            "Prepare multilingual PA copy for any gate, concourse, or transit flow change.",
            "Escalate immediately if medical access or accessible egress corridors become blocked.",
        ]
        sustainability_notes = [
            f"Primary focus: {operations_summary_request.sustainability_focus}.",
            "Promote refill stations, cup returns, and staffed waste sorting during lower-density intervals.",
            "Use transit and walking recommendations to reduce post-match vehicle pressure.",
        ]
        executive_summary = (
            f"{stadium.name} is operating under {scenario['name']} for FIFA World Cup 2026. "
            f"The plan prioritizes crowd safety, accessibility, transport continuity, and clear staff coordination."
        )
        if sanitized_incident_summary:
            executive_summary = f"{executive_summary} Staff note: {sanitized_incident_summary}"

        markdown = _build_operations_markdown(
            report_title=f"{stadium.name} Operations Summary",
            executive_summary=executive_summary,
            operational_priorities=operational_priorities,
            staff_actions=staff_actions,
            sustainability_notes=sustainability_notes,
        )
        return OperationsSummaryResponse(
            report_title=f"{stadium.name} Operations Summary",
            executive_summary=executive_summary,
            operational_priorities=operational_priorities,
            staff_actions=staff_actions,
            sustainability_notes=sustainability_notes,
            markdown=markdown,
        )


def _build_operations_markdown(
    report_title: str,
    executive_summary: str,
    operational_priorities: list[str],
    staff_actions: list[str],
    sustainability_notes: list[str],
) -> str:
    """Build copyable Markdown for the operations summary.

    Args:
        report_title: Report heading.
        executive_summary: Summary paragraph.
        operational_priorities: Priority bullet points.
        staff_actions: Staff action bullet points.
        sustainability_notes: Sustainability bullet points.

    Returns:
        Markdown report string.
    """
    priority_lines = "\n".join(f"- {priority}" for priority in operational_priorities)
    action_lines = "\n".join(f"- {staff_action}" for staff_action in staff_actions)
    sustainability_lines = "\n".join(f"- {sustainability_note}" for sustainability_note in sustainability_notes)
    return (
        f"# {report_title}\n\n"
        f"## Executive Summary\n{executive_summary}\n\n"
        f"## Operational Priorities\n{priority_lines}\n\n"
        f"## Staff Actions\n{action_lines}\n\n"
        f"## Sustainability Notes\n{sustainability_lines}\n"
    )


report_service = ReportService()

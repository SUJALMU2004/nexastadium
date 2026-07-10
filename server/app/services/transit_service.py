"""Transit service boundary for deterministic FIFA World Cup 2026 mobility guidance."""

from app.models.transit import (
    EgressPlanRequest,
    EgressPlanResponse,
    RouteRecommendationRequest,
    RouteRecommendationResponse,
    TransitModeOption,
    TransitOptionsResponse,
    TransportAlert,
    TransportAlertsResponse,
)
from app.services.stadium_service import stadium_data_service


class TransitService:
    """Builds local transit, egress, route, and alert responses without external APIs."""

    def get_transit_options(self, stadium_id: str) -> TransitOptionsResponse:
        """Return local transit guidance for a stadium.

        Args:
            stadium_id: Stadium slug from the FIFA World Cup 2026 dataset.

        Returns:
            Transit options response for the requested stadium.

        Raises:
            ValueError: If the stadium ID is not known.
        """
        stadium = stadium_data_service.get_stadium_by_id(stadium_id)
        transport_options = stadium.transport_options
        return TransitOptionsResponse(
            stadium_id=stadium.id,
            stadium_name=stadium.name,
            modes=[
                TransitModeOption(mode="metro", options=transport_options.metro),
                TransitModeOption(mode="bus", options=transport_options.bus),
                TransitModeOption(mode="parking", options=transport_options.parking_zones),
            ],
            rideshare_dropoff=transport_options.rideshare_dropoff,
            service_notes=(
                "Phase 3 uses deterministic FIFA World Cup 2026 venue transport guidance. "
                "Live agency feeds can be connected later without changing the route contract."
            ),
        )

    def get_transit_options_for_stadium(self, stadium_id: str) -> TransitOptionsResponse:
        """Return local transit guidance through the compatibility method name.

        Args:
            stadium_id: Stadium slug from the FIFA World Cup 2026 dataset.

        Returns:
            Transit options response for the requested stadium.
        """
        return self.get_transit_options(stadium_id)

    def generate_egress_plan(self, egress_request: EgressPlanRequest) -> EgressPlanResponse:
        """Generate a deterministic post-match egress plan.

        Args:
            egress_request: Validated post-match egress planning payload.

        Returns:
            Structured egress plan for the selected stadium and conditions.
        """
        stadium = stadium_data_service.get_stadium_by_id(egress_request.stadium_id)
        crowd_intensity = egress_request.crowd_intensity.lower()
        transport_mode = egress_request.transport_mode
        accessibility_priority = egress_request.accessibility_priority
        clearance_minutes_by_intensity = {
            "normal": 35,
            "busy": 50,
            "very busy": 65,
            "critical": 85,
        }
        recommended_gates = [
            stadium.accessibility_features.wheelchair_access_points[0],
            stadium.accessibility_features.wheelchair_access_points[-1],
        ]

        return EgressPlanResponse(
            exit_strategy=(
                f"Release {stadium.name} seating sections in waves toward the nearest signed exits, "
                f"then direct {transport_mode.lower()} fans to dedicated post-match corridors."
            ),
            recommended_gates=recommended_gates,
            transport_notes=(
                f"Use {stadium.transport_options.rideshare_dropoff} for rideshare and "
                f"{stadium.transport_options.metro[0]} for rail-linked departures."
            ),
            crowd_distribution_advice=(
                "Hold upper-deck flows for five-minute intervals if concourse density exceeds safe walking pace."
            ),
            estimated_clearance_minutes=clearance_minutes_by_intensity.get(crowd_intensity, 50),
            accessibility_note=(
                f"Prioritize {accessibility_priority.lower()} support through accessible pickup points and keep elevator banks clear."
                if accessibility_priority.lower() != "none"
                else "Keep accessible pickup points, elevator banks, and guest services corridors clear throughout egress."
            ),
        )

    def generate_route_recommendation(
        self,
        route_request: RouteRecommendationRequest,
    ) -> RouteRecommendationResponse:
        """Generate a deterministic match-day route recommendation.

        Args:
            route_request: Validated route recommendation payload.

        Returns:
            Structured route recommendation for the selected stadium.
        """
        stadium = stadium_data_service.get_stadium_by_id(route_request.stadium_id)
        preference = route_request.arrival_preference.lower()
        crowd_level = "Low" if "lowest crowd" in preference else "Medium"
        estimated_minutes = 28 if "fastest" in preference else 38

        return RouteRecommendationResponse(
            recommended_route=(
                f"Use the signed FIFA World Cup 2026 route from {route_request.starting_point_type} "
                f"to {stadium.name} by {route_request.transport_mode}."
            ),
            steps=[
                f"Start from the {route_request.starting_point_type.lower()} and follow host-city tournament signs.",
                f"Transfer to {stadium.transport_options.metro[0]} when available for the lowest-friction stadium approach.",
                f"Enter through {stadium.accessibility_features.wheelchair_access_points[0]} if you need staff assistance or accessible routing.",
            ],
            estimated_minutes=estimated_minutes,
            crowd_level=crowd_level,
            accessibility_notes=(
                "Use accessible station exits, elevators, and the signed accessible entrance corridor."
                if "accessible" in preference or "accessible" in route_request.transport_mode.lower()
                else "Accessible support remains available at guest services and marked stadium entrances."
            ),
            carbon_note=(
                "This recommendation favors public transport and walking segments where practical to reduce match-day emissions."
            ),
        )

    def get_transport_alerts(self, stadium_id: str) -> TransportAlertsResponse:
        """Return deterministic stadium-specific transport alerts.

        Args:
            stadium_id: Stadium slug from the FIFA World Cup 2026 dataset.

        Returns:
            Stadium-specific transport alerts response.
        """
        stadium = stadium_data_service.get_stadium_by_id(stadium_id)
        alerts = [
            TransportAlert(
                title=f"High rideshare demand expected at {stadium.name}",
                severity="High",
                affected_transport_mode="Rideshare",
                message=f"Rideshare queues are expected near {stadium.transport_options.rideshare_dropoff} after full-time.",
                recommended_action="Use signed pedestrian routes and wait until the first exit wave clears before requesting pickup.",
                last_updated="Updated 15 minutes ago",
            ),
            TransportAlert(
                title="Lower-crowd transit route available",
                severity="Medium",
                affected_transport_mode="Metro / Train",
                message=f"Fans using {stadium.transport_options.metro[0]} should follow the north concourse signs for lower crowd flow.",
                recommended_action="Move calmly to the signed transit corridor and keep accessible lanes open.",
                last_updated="Updated 20 minutes ago",
            ),
            TransportAlert(
                title="Accessible shuttle support active",
                severity="Info",
                affected_transport_mode="Accessible transport",
                message=f"Accessible shuttle and restroom support are active near {stadium.accessibility_features.wheelchair_access_points[0]}.",
                recommended_action="Ask guest services or the nearest volunteer for escorted routing if needed.",
                last_updated="Updated 25 minutes ago",
            ),
        ]
        return TransportAlertsResponse(stadium_id=stadium.id, stadium_name=stadium.name, alerts=alerts)


transit_service = TransitService()

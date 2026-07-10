"""Transit routes for deterministic stadium mobility guidance."""

from fastapi import APIRouter, HTTPException, Request

from app.api.dependencies import limiter
from app.core.config import settings
from app.models.transit import (
    EgressPlanRequest,
    EgressPlanResponse,
    RouteRecommendationRequest,
    RouteRecommendationResponse,
    TransitOptionsResponse,
    TransportAlertsResponse,
)
from app.services.transit_service import transit_service


router = APIRouter()


@router.get("/options/{stadium_id}", response_model=TransitOptionsResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def get_transit_options(request: Request, stadium_id: str) -> TransitOptionsResponse:
    """Return static transit options for a FIFA World Cup 2026 stadium.

    Args:
        request: FastAPI request object required by slowapi.
        stadium_id: Stadium slug from the local stadium dataset.

    Returns:
        Transit options response.
    """
    _ = request
    try:
        return transit_service.get_transit_options_for_stadium(stadium_id)
    except ValueError as transit_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium was not found. Please select a valid FIFA World Cup 2026 stadium.",
        ) from transit_error


@router.post("/egress-plan", response_model=EgressPlanResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_egress_plan(
    request: Request,
    egress_request: EgressPlanRequest,
) -> EgressPlanResponse:
    """Generate a deterministic post-match egress plan.

    Args:
        request: FastAPI request object required by slowapi.
        egress_request: Validated egress plan request body.

    Returns:
        Structured post-match egress plan.
    """
    _ = request
    try:
        return transit_service.generate_egress_plan(egress_request)
    except ValueError as transit_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium was not found. Please select a valid FIFA World Cup 2026 stadium.",
        ) from transit_error


@router.post("/route-recommendation", response_model=RouteRecommendationResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_route_recommendation(
    request: Request,
    route_request: RouteRecommendationRequest,
) -> RouteRecommendationResponse:
    """Generate a deterministic stadium route recommendation.

    Args:
        request: FastAPI request object required by slowapi.
        route_request: Validated route recommendation request body.

    Returns:
        Structured route recommendation.
    """
    _ = request
    try:
        return transit_service.generate_route_recommendation(route_request)
    except ValueError as transit_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium was not found. Please select a valid FIFA World Cup 2026 stadium.",
        ) from transit_error


@router.get("/alerts/{stadium_id}", response_model=TransportAlertsResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def get_transport_alerts(request: Request, stadium_id: str) -> TransportAlertsResponse:
    """Return deterministic transport alerts for a stadium.

    Args:
        request: FastAPI request object required by slowapi.
        stadium_id: Stadium slug from the local stadium dataset.

    Returns:
        Stadium-specific transport alerts response.
    """
    _ = request
    try:
        return transit_service.get_transport_alerts(stadium_id)
    except ValueError as transit_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium was not found. Please select a valid FIFA World Cup 2026 stadium.",
        ) from transit_error

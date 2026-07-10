"""Simulation routes for crowd risk, scenario comparison, and flow control."""

from fastapi import APIRouter, HTTPException, Request

from app.api.dependencies import limiter
from app.core.config import settings
from app.models.simulation import (
    CrowdRiskRequest,
    CrowdRiskResponse,
    FlowControlRequest,
    FlowControlResponse,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
)
from app.services.simulation_service import simulation_service


router = APIRouter()


@router.post("/crowd-risk", response_model=CrowdRiskResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def calculate_crowd_risk(
    request: Request,
    crowd_risk_request: CrowdRiskRequest,
) -> CrowdRiskResponse:
    """Calculate deterministic crowd risk for a stadium scenario.

    Args:
        request: FastAPI request object required by slowapi.
        crowd_risk_request: Validated crowd risk payload.

    Returns:
        Crowd risk response.
    """
    _ = request
    try:
        return simulation_service.calculate_crowd_risk(crowd_risk_request)
    except ValueError as simulation_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium or scenario was not found. Please check the selected FIFA World Cup 2026 inputs.",
        ) from simulation_error


@router.post("/scenario-compare", response_model=ScenarioComparisonResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def compare_scenarios(
    request: Request,
    comparison_request: ScenarioComparisonRequest,
) -> ScenarioComparisonResponse:
    """Compare two operational scenarios for command planning.

    Args:
        request: FastAPI request object required by slowapi.
        comparison_request: Validated scenario comparison payload.

    Returns:
        Scenario comparison response.
    """
    _ = request
    try:
        return simulation_service.compare_scenarios(comparison_request)
    except ValueError as simulation_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium or scenario was not found. Please check the selected FIFA World Cup 2026 inputs.",
        ) from simulation_error


@router.post("/flow-control", response_model=FlowControlResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def generate_flow_control(
    request: Request,
    flow_control_request: FlowControlRequest,
) -> FlowControlResponse:
    """Generate gate and transit flow-control guidance.

    Args:
        request: FastAPI request object required by slowapi.
        flow_control_request: Validated flow-control payload.

    Returns:
        Flow-control response.
    """
    _ = request
    try:
        return simulation_service.generate_flow_control(flow_control_request)
    except ValueError as simulation_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium or scenario was not found. Please check the selected FIFA World Cup 2026 inputs.",
        ) from simulation_error

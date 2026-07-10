"""Stadium and scenario data routes backed by local JSON files."""

from fastapi import APIRouter, HTTPException, Request

from app.api.dependencies import limiter
from app.core.config import settings
from app.models.stadium import Scenario, ScenarioListResponse, Stadium, StadiumListResponse
from app.services.scenario_service import scenario_engine
from app.services.stadium_service import stadium_data_service


router = APIRouter()


@router.get("/list", response_model=StadiumListResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def list_stadiums(request: Request) -> StadiumListResponse:
    """Return every FIFA World Cup 2026 host stadium.

    Args:
        request: FastAPI request object required by slowapi.

    Returns:
        Stadium list response.
    """
    _ = request
    return StadiumListResponse(stadiums=stadium_data_service.list_stadiums())


@router.get("/scenarios", response_model=ScenarioListResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def list_scenarios(request: Request) -> ScenarioListResponse:
    """Return the predefined crowd operations scenarios.

    Args:
        request: FastAPI request object required by slowapi.

    Returns:
        Scenario list response.
    """
    _ = request
    scenarios = [
        Scenario.model_validate(scenario_record)
        for scenario_record in scenario_engine.list_scenarios()
    ]
    return ScenarioListResponse(scenarios=scenarios)


@router.get("/scenarios/list", response_model=ScenarioListResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def list_scenarios_alias(request: Request) -> ScenarioListResponse:
    """Return predefined scenarios through the compatibility route alias.

    Args:
        request: FastAPI request object required by slowapi.

    Returns:
        Scenario list response.
    """
    return await list_scenarios(request)


@router.get("/{stadium_id}", response_model=Stadium)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def get_stadium(request: Request, stadium_id: str) -> Stadium:
    """Return one FIFA World Cup 2026 host stadium by ID.

    Args:
        request: FastAPI request object required by slowapi.
        stadium_id: Stadium slug from the local stadium dataset.

    Returns:
        Stadium response for the requested ID.
    """
    _ = request
    try:
        return stadium_data_service.get_stadium_by_id(stadium_id)
    except ValueError as stadium_lookup_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium was not found. Please select a valid FIFA World Cup 2026 stadium.",
        ) from stadium_lookup_error

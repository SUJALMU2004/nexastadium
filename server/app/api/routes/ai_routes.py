"""AI route handlers for fan assistance and stadium operations support."""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.api.dependencies import limiter
from app.core import prompt_guard
from app.core.config import settings
from app.models.ai_request import (
    AnnouncementRequest,
    AnnouncementResponse,
    ChatRequest,
    MatchDayBriefingRequest,
    MatchDayBriefingResponse,
    NavigationGuidanceRequest,
    NavigationGuidanceResponse,
    OpsRecommendationResponse,
    OpsRequest,
    SafetySupportPackRequest,
    SafetySupportPackResponse,
)
from app.services.ai_service import ai_service
from app.services.knowledge_service import knowledge_service
from app.services.scenario_service import scenario_engine
from app.services.stadium_service import stadium_data_service


router = APIRouter()


@router.post("/fan-assistant")
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_fan_assistant_stream(
    request: Request,
    chat_request: ChatRequest,
) -> StreamingResponse:
    """Stream a fan assistant response from OpenRouter or fallback.

    Args:
        request: FastAPI request object required by slowapi.
        chat_request: Validated fan assistant request body.

    Returns:
        A Server-Sent Events streaming response.
    """
    _ = request
    if chat_request.language not in prompt_guard.SUPPORTED_LANGUAGE_CODES:
        raise HTTPException(
            status_code=400,
            detail="The requested language is not supported. Please choose one of en, es, fr, ar, pt, or de.",
        )
    if not prompt_guard.validate_ai_request(chat_request):
        raise HTTPException(
            status_code=400,
            detail="The AI request must include a non-empty stadium operations message.",
        )

    stadium_context = _build_stadium_context_or_404(chat_request.stadium_id)
    fan_assistant_stream = ai_service.get_fan_assistant_response(
        message=chat_request.message,
        language=chat_request.language,
        context=f"{stadium_context} Additional fan context: {chat_request.context}",
    )
    return StreamingResponse(fan_assistant_stream, media_type="text/event-stream")


@router.post("/ops-recommendation", response_model=OpsRecommendationResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_ops_recommendation(
    request: Request,
    ops_request: OpsRequest,
) -> OpsRecommendationResponse:
    """Create an operations action plan from OpenRouter or fallback.

    Args:
        request: FastAPI request object required by slowapi.
        ops_request: Validated operations request body.

    Returns:
        Structured operations recommendation response.
    """
    _ = request
    stadium_context = _build_stadium_context_or_404(ops_request.stadium_id)
    try:
        scenario_context = scenario_engine.get_ai_context_for_scenario(ops_request.scenario_id)
    except ValueError as scenario_error:
        raise HTTPException(
            status_code=404,
            detail="The requested operations scenario was not found. Please select a valid stadium scenario.",
        ) from scenario_error

    recommendation_response = await ai_service.get_ops_recommendation(
        scenario=scenario_context,
        incident_type=ops_request.incident_type,
        severity=ops_request.severity,
        affected_zone=ops_request.affected_zone,
        notes=ops_request.notes,
        stadium_context=stadium_context,
    )
    return OpsRecommendationResponse.model_validate(recommendation_response)


@router.post("/pa-announcement", response_model=AnnouncementResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_pa_announcement(
    request: Request,
    announcement_request: AnnouncementRequest,
) -> AnnouncementResponse:
    """Draft PA announcements from OpenRouter or fallback.

    Args:
        request: FastAPI request object required by slowapi.
        announcement_request: Validated announcement request body.

    Returns:
        Announcement response keyed by requested language code.
    """
    _ = request
    invalid_language_codes = [
        language_code
        for language_code in announcement_request.language_codes
        if language_code not in prompt_guard.SUPPORTED_LANGUAGE_CODES
    ]
    if invalid_language_codes:
        raise HTTPException(
            status_code=400,
            detail="The requested language is not supported. Please choose one of en, es, fr, ar, pt, or de.",
        )

    stadium_context = _build_stadium_context_or_404(announcement_request.stadium_id)
    try:
        scenario_context = scenario_engine.get_ai_context_for_scenario(announcement_request.scenario_id)
    except ValueError as scenario_error:
        raise HTTPException(
            status_code=404,
            detail="The requested operations scenario was not found. Please select a valid stadium scenario.",
        ) from scenario_error

    announcement_by_language = await ai_service.draft_pa_announcement(
        scenario=f"{scenario_context} Stadium ID: {announcement_request.stadium_id}.",
        language_codes=announcement_request.language_codes,
        announcement_purpose=announcement_request.announcement_purpose,
        tone=announcement_request.tone,
        stadium_context=stadium_context,
    )
    return AnnouncementResponse(announcements=announcement_by_language)


@router.post("/navigation-guidance", response_model=NavigationGuidanceResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_navigation_guidance(
    request: Request,
    navigation_request: NavigationGuidanceRequest,
) -> NavigationGuidanceResponse:
    """Create step-by-step stadium navigation guidance for fans.

    Args:
        request: FastAPI request object required by slowapi.
        navigation_request: Validated navigation request body.

    Returns:
        Structured route guidance response.
    """
    _ = request
    if navigation_request.language not in prompt_guard.SUPPORTED_LANGUAGE_CODES:
        raise HTTPException(
            status_code=400,
            detail="The requested language is not supported. Please choose one of en, es, fr, ar, pt, or de.",
        )

    stadium_context = _build_stadium_context_or_404(navigation_request.stadium_id)
    navigation_response = await ai_service.get_navigation_guidance(
        from_location=navigation_request.from_location,
        to_location=navigation_request.to_location,
        accessibility_needs=navigation_request.accessibility_needs,
        stadium_id=navigation_request.stadium_id,
        language=navigation_request.language,
        stadium_context=stadium_context,
    )
    return NavigationGuidanceResponse.model_validate(navigation_response)


@router.post("/match-day-briefing", response_model=MatchDayBriefingResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_match_day_briefing(
    request: Request,
    briefing_request: MatchDayBriefingRequest,
) -> MatchDayBriefingResponse:
    """Generate an AI-assisted match-day operations briefing.

    Args:
        request: FastAPI request object required by slowapi.
        briefing_request: Validated briefing request body.

    Returns:
        Structured match-day briefing response.
    """
    _ = request
    if briefing_request.language not in prompt_guard.SUPPORTED_LANGUAGE_CODES:
        raise HTTPException(
            status_code=400,
            detail="The requested language is not supported. Please choose one of en, es, fr, ar, pt, or de.",
        )

    stadium_context = _build_stadium_context_or_404(briefing_request.stadium_id)
    try:
        scenario_context = scenario_engine.get_ai_context_for_scenario(briefing_request.scenario_id)
    except ValueError as scenario_error:
        raise HTTPException(
            status_code=404,
            detail="The requested operations scenario was not found. Please select a valid stadium scenario.",
        ) from scenario_error

    knowledge_context = knowledge_service.build_ai_context(
        query=f"{briefing_request.briefing_focus} {briefing_request.weather_condition} {briefing_request.notes}",
        stadium_id=briefing_request.stadium_id,
    )
    briefing_response = await ai_service.generate_match_day_briefing(
        stadium_id=briefing_request.stadium_id,
        scenario_id=briefing_request.scenario_id,
        language=briefing_request.language,
        briefing_focus=briefing_request.briefing_focus,
        expected_attendance=briefing_request.expected_attendance,
        weather_condition=briefing_request.weather_condition,
        notes=briefing_request.notes,
        stadium_context=stadium_context,
        scenario_context=scenario_context,
        knowledge_context=knowledge_context,
        operations_rules_context=knowledge_service.get_operations_rules_context(),
    )
    return MatchDayBriefingResponse.model_validate(briefing_response)


@router.post("/safety-support-pack", response_model=SafetySupportPackResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def create_safety_support_pack(
    request: Request,
    safety_request: SafetySupportPackRequest,
) -> SafetySupportPackResponse:
    """Generate a multilingual fan safety support pack.

    Args:
        request: FastAPI request object required by slowapi.
        safety_request: Validated safety support request body.

    Returns:
        Multilingual safety support pack response.
    """
    _ = request
    invalid_language_codes = [
        language_code
        for language_code in safety_request.language_codes
        if language_code not in prompt_guard.SUPPORTED_LANGUAGE_CODES
    ]
    if invalid_language_codes:
        raise HTTPException(
            status_code=400,
            detail="The requested language is not supported. Please choose one of en, es, fr, ar, pt, or de.",
        )

    stadium_context = _build_stadium_context_or_404(safety_request.stadium_id)
    try:
        accessibility_context = knowledge_service.get_accessibility_context(safety_request.stadium_id)
    except ValueError as stadium_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium was not found. Please select a valid FIFA World Cup 2026 stadium.",
        ) from stadium_error

    safety_templates = knowledge_service.get_multilingual_safety_templates(safety_request.language_codes)
    knowledge_context = knowledge_service.build_ai_context(
        query=f"{safety_request.support_focus} {safety_request.current_location} {safety_request.accessibility_needs}",
        stadium_id=safety_request.stadium_id,
        category="safety",
    )
    safety_pack_response = await ai_service.generate_safety_support_pack(
        stadium_id=safety_request.stadium_id,
        language_codes=safety_request.language_codes,
        support_focus=safety_request.support_focus,
        current_location=safety_request.current_location,
        accessibility_needs=safety_request.accessibility_needs,
        notes=safety_request.notes,
        stadium_context=stadium_context,
        accessibility_context=accessibility_context,
        safety_templates=safety_templates,
        knowledge_context=knowledge_context,
    )
    return SafetySupportPackResponse.model_validate({"packs": safety_pack_response})


def _build_stadium_context_or_404(stadium_id: str) -> str:
    """Build compact stadium context or raise a human-readable 404.

    Args:
        stadium_id: Stadium slug from the local FIFA World Cup 2026 dataset.

    Returns:
        Compact venue context for AI prompts.

    Raises:
        HTTPException: When the stadium ID is unknown.
    """
    try:
        stadium = stadium_data_service.get_stadium_by_id(stadium_id)
    except ValueError as stadium_error:
        raise HTTPException(
            status_code=404,
            detail="The requested stadium was not found. Please select a valid FIFA World Cup 2026 stadium.",
        ) from stadium_error

    accessible_zones = [
        stadium_zone.name
        for stadium_zone in stadium.zones
        if stadium_zone.has_wheelchair_access
    ]
    return (
        f"{stadium.name} in {stadium.city}, {stadium.country}; capacity {stadium.capacity}; "
        f"accessible zones: {', '.join(accessible_zones)}; "
        f"transport: {', '.join(stadium.transport_options.metro + stadium.transport_options.bus)}; "
        f"rideshare: {stadium.transport_options.rideshare_dropoff}; "
        f"accessibility points: {', '.join(stadium.accessibility_features.wheelchair_access_points)}; "
        f"food zones: {', '.join(food_zone.zone_name for food_zone in stadium.food_zones)}."
    )

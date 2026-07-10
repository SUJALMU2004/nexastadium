"""FastAPI application entrypoint for NexaStadium AI."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
import json
import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import Response

from app.api.dependencies import limiter
from app.api.routes import (
    ai_routes,
    knowledge_routes,
    report_routes,
    simulation_routes,
    stadium_routes,
    transit_routes,
)
from app.core import prompt_guard
from app.core.config import settings


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Log clean startup and shutdown lifecycle events.

    Args:
        app: FastAPI application instance.

    Returns:
        Async iterator used by FastAPI lifespan management.
    """
    _ = app
    logger.info("NexaStadium AI starting up")
    if not settings.OPENROUTER_API_KEY:
        logger.warning("OPENROUTER_API_KEY is not set - AI endpoints will use deterministic Phase 3 fallback responses.")
    if not settings.OPENROUTER_MODEL:
        logger.warning("OPENROUTER_MODEL is empty; OpenRouter calls will use poolside/laguna-xs-2.1:free.")
    yield
    logger.info("NexaStadium AI shutting down")


app = FastAPI(
    title="NexaStadium AI - FIFA World Cup 2026 Operations Platform",
    description="GenAI-powered stadium operations and fan experience platform for FIFA World Cup 2026",
    lifespan=lifespan,
)

def _rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Return a human-readable rate limit response.

    Args:
        request: Request that exceeded the configured rate limit.
        exc: SlowAPI rate limit exception.

    Returns:
        JSON response describing the rate limit condition.
    """
    _ = request
    _ = exc
    response_body = {"detail": "Too many requests. Please wait a moment before trying again."}
    return Response(
        content=json.dumps(response_body),
        status_code=429,
        media_type="application/json",
    )


app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def sanitize_ai_request_body(request: Request, call_next: Any) -> Response:
    """Sanitize JSON string fields for POST requests targeting AI routes.

    Args:
        request: Incoming FastAPI request.
        call_next: Next ASGI callable in the middleware chain.

    Returns:
        Downstream response after optional AI body sanitization.
    """
    if request.method != "POST" or not request.url.path.startswith("/api/ai/"):
        return await call_next(request)

    request_body = await request.body()
    sanitized_request_body = request_body

    if request_body:
        try:
            request_payload = json.loads(request_body)
            sanitized_payload = _sanitize_json_strings(request_payload)
            sanitized_request_body = json.dumps(sanitized_payload).encode("utf-8")
        except json.JSONDecodeError:
            sanitized_request_body = request_body

    async def receive_sanitized_body() -> dict[str, Any]:
        """Return the sanitized request body to downstream handlers.

        Args:
            None.

        Returns:
            ASGI receive event containing the sanitized body.
        """
        return {"type": "http.request", "body": sanitized_request_body, "more_body": False}

    sanitized_request = Request(request.scope, receive_sanitized_body)
    return await call_next(sanitized_request)


def _sanitize_json_strings(payload: Any) -> Any:
    """Recursively sanitize string values inside a JSON-compatible payload.

    Args:
        payload: JSON-compatible request payload.

    Returns:
        Payload with all string values sanitized.
    """
    if isinstance(payload, str):
        return prompt_guard.sanitize_input(payload)
    if isinstance(payload, list):
        return [_sanitize_json_strings(payload_item) for payload_item in payload]
    if isinstance(payload, dict):
        return {
            payload_key: _sanitize_json_strings(payload_value)
            for payload_key, payload_value in payload.items()
        }
    return payload


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Return backend health and environment metadata.

    Args:
        None.

    Returns:
        Health status response.
    """
    return {
        "status": "ok",
        "service": "nexastadium-ai",
        "environment": settings.ENVIRONMENT,
    }


app.include_router(ai_routes.router, prefix="/api/ai", tags=["ai"])
app.include_router(stadium_routes.router, prefix="/api/stadium", tags=["stadium"])
app.include_router(transit_routes.router, prefix="/api/transit", tags=["transit"])
app.include_router(knowledge_routes.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(simulation_routes.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(report_routes.router, prefix="/api/reports", tags=["reports"])

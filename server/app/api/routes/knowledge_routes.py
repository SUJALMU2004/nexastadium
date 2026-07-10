"""Knowledge retrieval routes for local FIFA World Cup 2026 content."""

from fastapi import APIRouter, Request

from app.api.dependencies import limiter
from app.core.config import settings
from app.models.knowledge import KnowledgeSearchResponse
from app.services.knowledge_service import knowledge_service


router = APIRouter()


@router.get("/search", response_model=KnowledgeSearchResponse)
@limiter.limit(f"{settings.RATE_LIMIT_PER_MINUTE}/minute")
async def search_knowledge(
    request: Request,
    query: str,
    stadium_id: str | None = None,
    category: str | None = None,
    tags: str | None = None,
    minimum_priority: int = 1,
    limit: int = 5,
) -> KnowledgeSearchResponse:
    """Search local knowledge entries by text, stadium, category, and tags.

    Args:
        request: FastAPI request object required by slowapi.
        query: Search text.
        stadium_id: Optional stadium slug.
        category: Optional knowledge category.
        tags: Optional comma-separated tags.
        minimum_priority: Minimum entry priority from 1 to 5.
        limit: Maximum number of entries returned.

    Returns:
        Knowledge search response.
    """
    _ = request
    tag_filters = [tag_value.strip() for tag_value in tags.split(",") if tag_value.strip()] if tags else []
    knowledge_entries = knowledge_service.search_knowledge(
        query=query,
        stadium_id=stadium_id,
        category=category,
        tags=tag_filters,
        minimum_priority=minimum_priority,
        limit=limit,
    )
    return KnowledgeSearchResponse(
        query=query,
        stadium_id=stadium_id,
        category=category,
        results=knowledge_entries,
    )

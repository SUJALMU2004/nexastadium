"""Pydantic models for local FIFA World Cup 2026 knowledge retrieval."""

from pydantic import BaseModel, Field


class KnowledgeEntry(BaseModel):
    """Single local knowledge item used by RAG-style workflows."""

    id: str
    title: str
    category: str
    content: str
    stadium_ids: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    priority: int = Field(default=3, ge=1, le=5)


class KnowledgeSearchResponse(BaseModel):
    """Response containing matched local knowledge entries."""

    query: str
    stadium_id: str | None
    category: str | None
    results: list[KnowledgeEntry]

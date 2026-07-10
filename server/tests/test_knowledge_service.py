"""Unit tests for the Phase 3 local knowledge service."""

from app.services.knowledge_service import KnowledgeService


def test_search_knowledge_returns_stadium_operations_entries() -> None:
    """Verify local knowledge search returns FIFA World Cup 2026 entries.

    Args:
        None.

    Returns:
        None.
    """
    knowledge_service = KnowledgeService()

    search_results = knowledge_service.search_knowledge(
        query="accessible entry",
        stadium_id="metlife-stadium",
        category="accessibility",
    )

    assert search_results
    assert search_results[0].category == "accessibility"


def test_build_ai_context_returns_non_empty_text() -> None:
    """Verify AI context builder returns useful local context.

    Args:
        None.

    Returns:
        None.
    """
    knowledge_service = KnowledgeService()

    ai_context = knowledge_service.build_ai_context(
        query="crowd entry volunteers",
        stadium_id="metlife-stadium",
    )

    assert isinstance(ai_context, str)
    assert "World Cup" in ai_context or "crowd" in ai_context.lower()


def test_multilingual_safety_templates_filter_supported_languages() -> None:
    """Verify safety templates only include supported requested languages.

    Args:
        None.

    Returns:
        None.
    """
    knowledge_service = KnowledgeService()

    templates = knowledge_service.get_multilingual_safety_templates(["en", "es", "invalid"])

    assert set(templates.keys()) == {"en", "es"}

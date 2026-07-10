"""Local retrieval boundary for stadium knowledge base content."""

import json
from pathlib import Path
from typing import Any


class RAGService:
    """Retrieves local knowledge entries for stadium operations prompts."""

    def __init__(self, knowledge_base_path: Path | None = None) -> None:
        """Load the local FIFA World Cup 2026 knowledge base.

        Args:
            knowledge_base_path: Optional override path used by tests or tools.

        Returns:
            None.
        """
        self._knowledge_base_path = knowledge_base_path or Path(__file__).resolve().parents[1] / "data" / "knowledge_base.json"
        self._knowledge_entries = self._load_knowledge_entries()

    def _load_knowledge_entries(self) -> list[dict[str, Any]]:
        """Load local knowledge entries from JSON.

        Args:
            None.

        Returns:
            A list of knowledge base entries.
        """
        with self._knowledge_base_path.open(encoding="utf-8") as knowledge_base_file:
            knowledge_entries = json.load(knowledge_base_file)
        return knowledge_entries

    def search_knowledge_base(self, query: str) -> list[dict[str, Any]]:
        """Return local knowledge entries matching a simple text query.

        Args:
            query: Search text from a fan or operations workflow.

        Returns:
            Matching local knowledge entries.
        """
        normalized_query = query.lower().strip()
        if not normalized_query:
            return []

        return [
            knowledge_entry
            for knowledge_entry in self._knowledge_entries
            if normalized_query
            in (
                f"{knowledge_entry.get('topic', '')} "
                f"{knowledge_entry.get('title', '')} "
                f"{knowledge_entry.get('category', '')} "
                f"{knowledge_entry.get('content', '')} "
                f"{' '.join(knowledge_entry.get('tags', []))}"
            ).lower()
        ]


rag_service = RAGService()

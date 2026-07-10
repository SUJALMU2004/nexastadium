"""Cached local knowledge retrieval for NexaStadium AI Phase 3 workflows."""

import json
from pathlib import Path

from app.core import prompt_guard
from app.models.knowledge import KnowledgeEntry
from app.services.stadium_service import stadium_data_service


class KnowledgeService:
    """Loads local knowledge and playbook files once for deterministic retrieval."""

    def __init__(self, data_directory_path: Path | None = None) -> None:
        """Load local knowledge files into memory.

        Args:
            data_directory_path: Optional data directory override for tests.

        Returns:
            None.
        """
        self._data_directory_path = data_directory_path or Path(__file__).resolve().parents[1] / "data"
        self._knowledge_entries = self._load_knowledge_entries()
        self._emergency_playbooks = self._load_json_list("emergency_playbooks.json")
        self._accessibility_playbooks = self._load_json_list("accessibility_playbooks.json")
        self._operations_rules = self._load_json_list("venue_operations_rules.json")
        self._safety_templates = self._load_json_mapping("multilingual_safety_templates.json")

    def _load_knowledge_entries(self) -> list[KnowledgeEntry]:
        """Load and validate local knowledge entries.

        Args:
            None.

        Returns:
            Validated knowledge entries.
        """
        knowledge_records = self._load_json_list("knowledge_base.json")
        return [KnowledgeEntry.model_validate(knowledge_record) for knowledge_record in knowledge_records]

    def _load_json_list(self, file_name: str) -> list[dict[str, object]]:
        """Load a JSON list from the local data directory.

        Args:
            file_name: Local JSON file name.

        Returns:
            A list of dictionary records.
        """
        file_path = self._data_directory_path / file_name
        with file_path.open(encoding="utf-8") as json_file:
            loaded_records = json.load(json_file)
        return loaded_records if isinstance(loaded_records, list) else []

    def _load_json_mapping(self, file_name: str) -> dict[str, object]:
        """Load a JSON object from the local data directory.

        Args:
            file_name: Local JSON file name.

        Returns:
            A dictionary mapping loaded from JSON.
        """
        file_path = self._data_directory_path / file_name
        with file_path.open(encoding="utf-8") as json_file:
            loaded_mapping = json.load(json_file)
        return loaded_mapping if isinstance(loaded_mapping, dict) else {}

    def search_knowledge(
        self,
        query: str,
        stadium_id: str | None = None,
        category: str | None = None,
        tags: list[str] | None = None,
        minimum_priority: int = 1,
        limit: int = 5,
    ) -> list[KnowledgeEntry]:
        """Search local knowledge by query, stadium, category, tags, and priority.

        Args:
            query: User search text.
            stadium_id: Optional stadium slug filter.
            category: Optional knowledge category filter.
            tags: Optional tags that should appear in the entry.
            minimum_priority: Minimum priority from 1 to 5.
            limit: Maximum number of entries to return.

        Returns:
            Matched knowledge entries ordered by relevance and priority.
        """
        sanitized_query = prompt_guard.sanitize_input(query).lower()
        sanitized_category = prompt_guard.sanitize_input(category or "").lower()
        sanitized_stadium_id = prompt_guard.sanitize_input(stadium_id or "")
        normalized_tags = {
            prompt_guard.sanitize_input(tag_value).lower()
            for tag_value in (tags or [])
            if prompt_guard.sanitize_input(tag_value)
        }
        minimum_allowed_priority = max(1, min(5, minimum_priority))
        limited_result_count = max(1, min(20, limit))
        scored_entries: list[tuple[int, KnowledgeEntry]] = []

        for knowledge_entry in self._knowledge_entries:
            if knowledge_entry.priority < minimum_allowed_priority:
                continue
            if sanitized_category and knowledge_entry.category.lower() != sanitized_category:
                continue
            if sanitized_stadium_id and "all" not in knowledge_entry.stadium_ids and sanitized_stadium_id not in knowledge_entry.stadium_ids:
                continue
            entry_tags = {tag_value.lower() for tag_value in knowledge_entry.tags}
            if normalized_tags and not normalized_tags.intersection(entry_tags):
                continue

            searchable_text = (
                f"{knowledge_entry.title} {knowledge_entry.category} "
                f"{knowledge_entry.content} {' '.join(knowledge_entry.tags)}"
            ).lower()
            query_terms = [query_term for query_term in sanitized_query.split() if query_term]
            relevance_score = sum(1 for query_term in query_terms if query_term in searchable_text)
            if sanitized_query and relevance_score == 0:
                continue

            scored_entries.append((relevance_score + knowledge_entry.priority, knowledge_entry))

        scored_entries.sort(key=lambda scored_entry: scored_entry[0], reverse=True)
        return [knowledge_entry for _, knowledge_entry in scored_entries[:limited_result_count]]

    def build_ai_context(self, query: str, stadium_id: str, category: str | None = None) -> str:
        """Build compact local knowledge context for AI prompts.

        Args:
            query: Workflow topic or user question.
            stadium_id: Stadium slug for venue context.
            category: Optional category filter.

        Returns:
            Concise context paragraph for AI service prompts.
        """
        matching_entries = self.search_knowledge(query=query, stadium_id=stadium_id, category=category, limit=4)
        if not matching_entries:
            return "No local knowledge entry matched the request; use general FIFA World Cup 2026 stadium operations rules."

        return " ".join(
            f"{knowledge_entry.title}: {knowledge_entry.content}"
            for knowledge_entry in matching_entries
        )

    def get_stadium_context(self, stadium_id: str) -> str:
        """Build compact stadium context from the cached stadium dataset.

        Args:
            stadium_id: Stadium slug from the local dataset.

        Returns:
            Stadium context suitable for AI prompts.
        """
        stadium = stadium_data_service.get_stadium_by_id(stadium_id)
        accessible_zones = [
            stadium_zone.name
            for stadium_zone in stadium.zones
            if stadium_zone.has_wheelchair_access
        ]
        return (
            f"{stadium.name} in {stadium.city}, {stadium.country}; capacity {stadium.capacity}; "
            f"accessible zones: {', '.join(accessible_zones)}; "
            f"transport options: {', '.join(stadium.transport_options.metro + stadium.transport_options.bus)}; "
            f"rideshare: {stadium.transport_options.rideshare_dropoff}; "
            f"food zones: {', '.join(food_zone.zone_name for food_zone in stadium.food_zones)}."
        )

    def get_emergency_playbook(self, incident_type: str) -> dict[str, object]:
        """Return the best local emergency playbook for an incident type.

        Args:
            incident_type: Incident type from a workflow.

        Returns:
            Matching playbook record or the first fallback playbook.
        """
        normalized_incident_type = prompt_guard.sanitize_input(incident_type).lower()
        for emergency_playbook in self._emergency_playbooks:
            playbook_type = str(emergency_playbook.get("incident_type", "")).lower()
            if playbook_type and playbook_type in normalized_incident_type:
                return emergency_playbook
        return self._emergency_playbooks[0] if self._emergency_playbooks else {}

    def get_accessibility_context(self, stadium_id: str) -> str:
        """Build local accessibility context for a stadium.

        Args:
            stadium_id: Stadium slug from the local dataset.

        Returns:
            Concise accessibility guidance string.
        """
        stadium = stadium_data_service.get_stadium_by_id(stadium_id)
        playbook_guidance = " ".join(
            str(accessibility_playbook.get("guidance", ""))
            for accessibility_playbook in self._accessibility_playbooks
        )
        return (
            f"{stadium.name} accessibility points: "
            f"{', '.join(stadium.accessibility_features.wheelchair_access_points)}. "
            f"Accessible restrooms: {', '.join(stadium.accessibility_features.accessible_restroom_locations)}. "
            f"{playbook_guidance}"
        )

    def get_multilingual_safety_templates(self, language_codes: list[str]) -> dict[str, object]:
        """Return localized safety templates for requested language codes.

        Args:
            language_codes: Supported language codes requested by the frontend.

        Returns:
            Safety template mapping keyed by language code.
        """
        valid_language_codes = [
            language_code
            for language_code in language_codes
            if language_code in prompt_guard.SUPPORTED_LANGUAGE_CODES
        ] or ["en"]
        return {
            language_code: self._safety_templates.get(language_code, self._safety_templates.get("en", {}))
            for language_code in valid_language_codes
        }

    def get_operations_rules_context(self) -> str:
        """Return all local venue operations rules as prompt context.

        Args:
            None.

        Returns:
            Concise rules context string.
        """
        return " ".join(
            str(operations_rule.get("rule", ""))
            for operations_rule in self._operations_rules
        )


knowledge_service = KnowledgeService()

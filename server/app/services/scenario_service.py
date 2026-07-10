"""Crowd scenario engine for FIFA World Cup 2026 stadium operations."""

import json
from pathlib import Path
from typing import Any


class ScenarioEngine:
    """Loads and formats predefined operational scenarios for AI context."""

    def __init__(self, scenario_file_path: Path | None = None) -> None:
        """Load scenario definitions from local JSON.

        Args:
            scenario_file_path: Optional override path used by tests.

        Returns:
            None.
        """
        self._scenario_file_path = scenario_file_path or Path(__file__).resolve().parents[1] / "data" / "scenarios.json"
        self._scenarios = self._load_scenarios()
        self._active_scenario_id = "MATCH_ENTRY_SURGE"

    def _load_scenarios(self) -> dict[str, dict[str, Any]]:
        """Load scenario records and key them by scenario ID.

        Args:
            None.

        Returns:
            A dictionary keyed by scenario ID.
        """
        with self._scenario_file_path.open(encoding="utf-8") as scenario_file:
            scenario_records = json.load(scenario_file)
        return {scenario_record["id"]: scenario_record for scenario_record in scenario_records}

    def get_active_scenario(self) -> dict[str, Any]:
        """Return the currently active operations scenario.

        Args:
            None.

        Returns:
            The active scenario dictionary.
        """
        return self._scenarios[self._active_scenario_id]

    def list_scenarios(self) -> list[dict[str, Any]]:
        """Return every predefined crowd operations scenario.

        Args:
            None.

        Returns:
            A list of scenario dictionaries loaded at startup.
        """
        return list(self._scenarios.values())

    def set_scenario(self, scenario_id: str) -> dict[str, Any]:
        """Set and return the active operations scenario.

        Args:
            scenario_id: Scenario identifier from scenarios.json.

        Returns:
            The newly active scenario dictionary.

        Raises:
            ValueError: If the scenario ID is not known.
        """
        if scenario_id not in self._scenarios:
            raise ValueError(f"Unknown scenario ID: {scenario_id}")

        self._active_scenario_id = scenario_id
        return self._scenarios[scenario_id]

    def get_ai_context_for_scenario(self, scenario_id: str) -> str:
        """Format a scenario as concise context for the AI service.

        Args:
            scenario_id: Scenario identifier from scenarios.json.

        Returns:
            A descriptive paragraph containing scenario name, zones, and density.

        Raises:
            ValueError: If the scenario ID is not known.
        """
        if scenario_id not in self._scenarios:
            raise ValueError(f"Unknown scenario ID: {scenario_id}")

        scenario = self._scenarios[scenario_id]
        affected_zones = ", ".join(scenario["affected_zones"])
        recommended_actions = "; ".join(scenario["recommended_actions"])
        return (
            f"{scenario['name']} is active for FIFA World Cup 2026 operations. "
            f"Affected zones include {affected_zones}. "
            f"The current crowd density is {scenario['crowd_density_percentage']} percent. "
            f"Recommended actions: {recommended_actions}."
        )


scenario_engine = ScenarioEngine()

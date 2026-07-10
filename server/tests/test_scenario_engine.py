"""Unit tests for the scenario engine."""

import pytest

from app.services.scenario_service import ScenarioEngine


def test_all_six_scenarios_load() -> None:
    """Verify all required FIFA World Cup 2026 scenarios are loaded.

    Args:
        None.

    Returns:
        None.
    """
    scenario_engine = ScenarioEngine()

    assert set(scenario_engine._scenarios.keys()) == {
        "MATCH_ENTRY_SURGE",
        "HALFTIME_RUSH",
        "POST_MATCH_EGRESS",
        "MEDICAL_EMERGENCY",
        "VIP_ARRIVAL",
        "WEATHER_DISRUPTION",
    }


def test_ai_context_is_non_empty_string() -> None:
    """Verify scenario context is useful for AI prompt injection.

    Args:
        None.

    Returns:
        None.
    """
    scenario_engine = ScenarioEngine()

    scenario_context = scenario_engine.get_ai_context_for_scenario("MATCH_ENTRY_SURGE")

    assert isinstance(scenario_context, str)
    assert scenario_context
    assert "crowd" in scenario_context.lower() or "Match Entry Surge" in scenario_context


def test_invalid_scenario_raises_value_error() -> None:
    """Verify invalid scenario IDs raise a precise ValueError.

    Args:
        None.

    Returns:
        None.
    """
    scenario_engine = ScenarioEngine()

    with pytest.raises(ValueError):
        scenario_engine.set_scenario("NONEXISTENT_SCENARIO_ID")


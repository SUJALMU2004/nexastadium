"""Unit tests for the Phase 3 OpenRouter AI service layer."""

import asyncio
from collections.abc import AsyncGenerator
from unittest.mock import patch

from pytest import MonkeyPatch

from app.core.config import settings
from app.models.ai_request import AnnouncementRequest
from app.services.ai_service import AIService

BANNED_USER_VISIBLE_BACKUP_TERMS = (
    "fallback",
    "placeholder",
    "ai unavailable",
    "openrouter failed",
    "api key missing",
)


async def _collect_stream_chunks(stream: AsyncGenerator[str, None]) -> list[str]:
    """Collect async stream chunks into a list for assertions.

    Args:
        stream: Async generator returned by the fan assistant service.

    Returns:
        Stream chunks emitted by the service.
    """
    collected_stream_chunks: list[str] = []
    async for stream_chunk in stream:
        collected_stream_chunks.append(stream_chunk)
    return collected_stream_chunks


def _assert_polished_user_text(generated_text: str) -> None:
    """Assert generated text does not expose backend backup or provider wording.

    Args:
        generated_text: User-facing text returned by the AI service.

    Returns:
        None.
    """
    normalized_generated_text = generated_text.lower()
    for banned_term in BANNED_USER_VISIBLE_BACKUP_TERMS:
        assert banned_term not in normalized_generated_text
    assert generated_text.strip()


def test_fan_assistant_uses_fallback_without_openrouter_key(monkeypatch: MonkeyPatch) -> None:
    """Verify fan assistant streams deterministic fallback chunks without a key.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    ai_service = AIService()

    fan_assistant_stream = ai_service.get_fan_assistant_response(
        message="<b>Where is Gate C?</b>",
        language="en",
        context="MetLife Stadium",
    )
    stream_chunks = asyncio.run(_collect_stream_chunks(fan_assistant_stream))

    assert stream_chunks
    visible_stream_text = "".join(stream_chunks[:-1])
    _assert_polished_user_text(visible_stream_text)
    assert "Suggested next steps" in visible_stream_text
    assert stream_chunks[-1] == "data: [DONE]\n\n"


def test_fan_assistant_sanitizes_input(monkeypatch: MonkeyPatch) -> None:
    """Verify fan assistant requests sanitize user messages before streaming.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    ai_service = AIService()

    with patch("app.core.prompt_guard.sanitize_input", return_value="Where is Gate C?") as sanitize_input_mock:
        fan_assistant_stream = ai_service.get_fan_assistant_response(
            message="<b>Where is Gate C?</b>",
            language="en",
            context="MetLife Stadium",
        )

    assert fan_assistant_stream is not None
    sanitize_input_mock.assert_any_call("<b>Where is Gate C?</b>")


def test_navigation_guidance_response_has_required_fields(monkeypatch: MonkeyPatch) -> None:
    """Verify navigation guidance returns the required response shape.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    ai_service = AIService()

    navigation_guidance = asyncio.run(
        ai_service.get_navigation_guidance(
            from_location="Main Gate",
            to_location="Accessible Restroom",
            accessibility_needs="Wheelchair accessible route",
            stadium_id="metlife-stadium",
            language="en",
            stadium_context="MetLife Stadium context",
        )
    )

    assert set(navigation_guidance.keys()) == {
        "steps",
        "estimated_minutes",
        "accessibility_notes",
        "alternative_route",
    }
    assert navigation_guidance["steps"]
    assert navigation_guidance["accessibility_notes"]
    _assert_polished_user_text(" ".join(str(step) for step in navigation_guidance["steps"]))
    _assert_polished_user_text(str(navigation_guidance["accessibility_notes"]))


def test_ops_recommendation_returns_phase_2_fields(monkeypatch: MonkeyPatch) -> None:
    """Verify operations recommendations return the required response shape.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    ai_service = AIService()

    recommendation = asyncio.run(
        ai_service.get_ops_recommendation(
            scenario="MATCH_ENTRY_SURGE",
            incident_type="overcrowding",
            severity="high",
            affected_zone="Main concourse",
            notes="Queue pressure near Gate C.",
            stadium_context="MetLife Stadium context",
        )
    )

    assert set(recommendation.keys()) == {
        "recommended_actions",
        "priority_level",
        "affected_zones",
        "estimated_resolution_minutes",
        "staff_coordination_note",
        "safety_escalation_trigger",
    }
    assert recommendation["recommended_actions"]
    assert recommendation["affected_zones"]
    assert recommendation["staff_coordination_note"]
    assert recommendation["safety_escalation_trigger"]
    _assert_polished_user_text(" ".join(str(action) for action in recommendation["recommended_actions"]))


def test_pa_announcement_returns_requested_language_codes(monkeypatch: MonkeyPatch) -> None:
    """Verify announcement drafts include only requested language keys.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    ai_service = AIService()

    announcements = asyncio.run(
        ai_service.draft_pa_announcement(
            scenario="POST_MATCH_EGRESS",
            language_codes=["en", "es", "fr"],
            announcement_purpose="Post-match exit",
            tone="Calm",
            stadium_context="MetLife Stadium context",
        )
    )

    assert set(announcements.keys()) == {"en", "es", "fr"}


def test_pa_announcement_fallback_localizes_requested_languages(monkeypatch: MonkeyPatch) -> None:
    """Verify fallback PA announcements change language by requested code.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    ai_service = AIService()

    announcements = asyncio.run(
        ai_service.draft_pa_announcement(
            scenario="POST_MATCH_EGRESS",
            language_codes=["en", "es", "fr", "pt", "de"],
            announcement_purpose="Post-match exit",
            tone="Calm",
            stadium_context="MetLife Stadium context",
        )
    )

    assert announcements["en"].startswith("Attention please")
    assert announcements["es"].startswith("Atencion")
    assert announcements["fr"].startswith("Votre attention")
    assert announcements["pt"].startswith("Atencao")
    assert announcements["de"].startswith("Bitte beachten")
    assert len(set(announcements.values())) == 5
    for announcement_text in announcements.values():
        _assert_polished_user_text(announcement_text)


def test_announcement_request_accepts_purpose_alias() -> None:
    """Verify the PA route accepts the compatibility purpose field name.

    Args:
        None.

    Returns:
        None.
    """
    announcement_request = AnnouncementRequest(
        scenario_id="POST_MATCH_EGRESS",
        language_codes=["en"],
        stadium_id="metlife-stadium",
        purpose="Post-match exit guidance",
        tone="Calm",
    )

    assert announcement_request.announcement_purpose == "Post-match exit guidance"


def test_openrouter_json_parse_falls_back_on_invalid_json(monkeypatch: MonkeyPatch) -> None:
    """Verify invalid model JSON is rejected and deterministic fallback is used.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "test-key")
    ai_service = AIService()

    invalid_openrouter_payload = {
        "choices": [
            {
                "message": {
                    "content": "This is not valid JSON."
                }
            }
        ]
    }
    assert ai_service._parse_openrouter_json_response(invalid_openrouter_payload) is None

    async def fake_openrouter_json_call(*args: object, **kwargs: object) -> None:
        """Return invalid parsed output to force fallback.

        Args:
            *args: Ignored positional arguments.
            **kwargs: Ignored keyword arguments.

        Returns:
            None.
        """
        return None

    monkeypatch.setattr(ai_service, "_call_openrouter_json", fake_openrouter_json_call)

    recommendation = asyncio.run(
        ai_service.get_ops_recommendation(
            scenario="MATCH_ENTRY_SURGE",
            incident_type="overcrowding",
            severity="high",
            affected_zone="Main concourse",
            notes="",
            stadium_context="MetLife Stadium context",
        )
    )

    assert recommendation["priority_level"] == "high"
    assert recommendation["recommended_actions"]
    _assert_polished_user_text(" ".join(str(action) for action in recommendation["recommended_actions"]))


def test_openrouter_is_not_called_without_api_key(monkeypatch: MonkeyPatch) -> None:
    """Verify httpx is not instantiated when OpenRouter key is missing.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    ai_service = AIService()

    with patch("httpx.AsyncClient") as async_client_mock:
        navigation_guidance = asyncio.run(
            ai_service.get_navigation_guidance(
                from_location="Main Gate",
                to_location="Accessible Restroom",
                accessibility_needs="Wheelchair accessible route",
                stadium_id="metlife-stadium",
                language="en",
                stadium_context="MetLife Stadium context",
            )
        )

    assert navigation_guidance["steps"]
    async_client_mock.assert_not_called()


def test_match_day_briefing_fallback_returns_required_fields(monkeypatch: MonkeyPatch) -> None:
    """Verify match-day briefing fallback returns the Phase 3 response shape.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    ai_service = AIService()

    briefing_response = asyncio.run(
        ai_service.generate_match_day_briefing(
            stadium_id="metlife-stadium",
            scenario_id="MATCH_ENTRY_SURGE",
            language="en",
            briefing_focus="Operations readiness",
            expected_attendance=80000,
            weather_condition="Clear",
            notes="",
            stadium_context="MetLife Stadium context",
            scenario_context="Match Entry Surge context",
            knowledge_context="Crowd entry and accessibility context",
            operations_rules_context="Keep communications calm.",
        )
    )

    assert set(briefing_response.keys()) == {
        "briefing_title",
        "executive_summary",
        "key_risks",
        "recommended_actions",
        "volunteer_coordination",
        "accessibility_focus",
        "transit_focus",
        "sustainability_focus",
    }
    assert briefing_response["recommended_actions"]
    assert briefing_response["executive_summary"]
    assert briefing_response["volunteer_coordination"]
    _assert_polished_user_text(str(briefing_response["executive_summary"]))


def test_safety_support_pack_fallback_returns_requested_languages(monkeypatch: MonkeyPatch) -> None:
    """Verify safety support pack fallback returns all requested language packs.

    Args:
        monkeypatch: Pytest fixture for settings override.

    Returns:
        None.
    """
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    ai_service = AIService()

    safety_pack_response = asyncio.run(
        ai_service.generate_safety_support_pack(
            stadium_id="metlife-stadium",
            language_codes=["en", "es", "fr"],
            support_focus="General safety",
            current_location="Main concourse",
            accessibility_needs="Wheelchair accessible route",
            notes="",
            stadium_context="MetLife Stadium context",
            accessibility_context="Accessible entrance context",
            safety_templates={
                "en": {
                    "title": "Safety",
                    "steps": ["Move calmly"],
                    "accessibility_note": "Use accessible routes.",
                    "transport_note": "Use signed exits.",
                    "staff_help_message": "Ask staff for help.",
                },
                "es": {
                    "title": "Seguridad",
                    "steps": ["Avance con calma"],
                    "accessibility_note": "Use rutas accesibles.",
                    "transport_note": "Use salidas señalizadas.",
                    "staff_help_message": "Pida ayuda al personal.",
                },
                "fr": {
                    "title": "Sécurité",
                    "steps": ["Avancez calmement"],
                    "accessibility_note": "Utilisez les parcours accessibles.",
                    "transport_note": "Suivez les sorties indiquées.",
                    "staff_help_message": "Demandez de l'aide au personnel.",
                },
            },
            knowledge_context="Safety context",
        )
    )

    assert set(safety_pack_response.keys()) == {"en", "es", "fr"}
    assert safety_pack_response["en"]["safety_steps"]
    for safety_pack in safety_pack_response.values():
        assert safety_pack["title"]
        assert safety_pack["accessibility_note"]
        assert safety_pack["transport_note"]
        assert safety_pack["staff_help_message"]
        _assert_polished_user_text(" ".join(str(step) for step in safety_pack["safety_steps"]))

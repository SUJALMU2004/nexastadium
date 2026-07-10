"""OpenRouter-backed AI service layer for FIFA World Cup 2026 stadium operations."""

import json
import logging
import re
from collections.abc import AsyncGenerator
from typing import Any

import httpx

from app.core import prompt_guard
from app.core.config import settings


DEFAULT_OPENROUTER_MODEL = "poolside/laguna-xs-2.1:free"
OPENROUTER_REQUEST_TIMEOUT_SECONDS = 30
FAN_ASSISTANT_SYSTEM_PROMPT = """
You are NexaStadium AI for FIFA World Cup 2026 stadium operations and fan experience.
Use the provided stadium, accessibility, transit, and safety context. Do not invent live conditions.
Answer in the requested language with a calm, friendly, safety-first tone.
Start with one direct helpful answer, then give short steps or options, then end with a staff/signage reminder when useful.
Help only with stadium navigation, accessibility, food, transport, safety, venue services, and match-day operations.
Do not speculate about match results, players, politics, or unrelated topics.
"""
OPS_RECOMMENDATION_SYSTEM_PROMPT = """
You are NexaStadium AI for FIFA World Cup 2026 venue command teams.
Use the provided stadium, scenario, incident, accessibility, transit, and safety context.
Write like a calm operations command recommendation: priority summary, immediate actions, staff coordination, escalation trigger.
Do not claim live conditions unless provided. Do not speculate outside stadium operations.
Return valid JSON only.
Do not include markdown.
Do not include extra commentary.
Use exactly the required keys.
"""
PA_ANNOUNCEMENT_SYSTEM_PROMPT = """
You are NexaStadium AI for FIFA World Cup 2026 public address announcements.
Draft natural public announcements that are calm, brief, inclusive, and safety-first.
Use one clear fan instruction. Avoid blame, panic language, and technical operations terms.
Each JSON value must be written in the language represented by its key.
Use English for en, Spanish for es, French for fr, Arabic for ar, Portuguese for pt, and German for de.
Do not put English announcement text under non-English language keys.
Preserve venue names and "FIFA World Cup 2026" as official event text.
Return valid JSON only.
Do not include markdown.
Do not include extra commentary.
Use exactly the requested language code keys.
"""
NAVIGATION_GUIDANCE_SYSTEM_PROMPT = """
You are NexaStadium AI for FIFA World Cup 2026 stadium navigation.
Use the provided stadium, accessibility, transit, and safety context.
Return short practical route steps that reference signage, concourses, information desks, elevators, accessible entrances, or volunteers when relevant.
Do not claim live crowd conditions or exact gate status unless provided.
Return valid JSON only.
Do not include markdown.
Do not include extra commentary.
Use exactly the required keys.
"""
MATCH_DAY_BRIEFING_SYSTEM_PROMPT = """
You are NexaStadium AI for FIFA World Cup 2026 venue command teams.
Generate an executive-summary style match-day operations briefing using the provided local stadium, scenario, knowledge, and rules context.
Prioritize crowd safety, accessibility, volunteer coordination, transit readiness, sustainability, and calm communications.
Do not claim live conditions, match results, player details, politics, or unrelated information.
Return valid JSON only.
Do not include markdown.
Do not include extra commentary.
Use exactly the required keys.
"""
SAFETY_SUPPORT_PACK_SYSTEM_PROMPT = """
You are NexaStadium AI for FIFA World Cup 2026 fan safety support.
Generate short multilingual fan safety guidance using the requested language codes and provided local templates.
Keep messages friendly, practical, translatable, and suitable for fans inside or around a stadium.
Focus on safe movement, accessibility, transport, medical help, and where to find venue staff or volunteers.
Do not claim live conditions or make claims outside stadium operations.
Return valid JSON only.
Do not include markdown.
Do not include extra commentary.
Use exactly the requested language code keys and required nested keys.
"""

REQUIRED_OPS_RESPONSE_KEYS = {
    "recommended_actions",
    "priority_level",
    "affected_zones",
    "estimated_resolution_minutes",
    "staff_coordination_note",
    "safety_escalation_trigger",
}
REQUIRED_NAVIGATION_RESPONSE_KEYS = {
    "steps",
    "estimated_minutes",
    "accessibility_notes",
    "alternative_route",
}
REQUIRED_MATCH_DAY_BRIEFING_KEYS = {
    "briefing_title",
    "executive_summary",
    "key_risks",
    "recommended_actions",
    "volunteer_coordination",
    "accessibility_focus",
    "transit_focus",
    "sustainability_focus",
}
REQUIRED_SAFETY_PACK_CONTENT_KEYS = {
    "title",
    "safety_steps",
    "accessibility_note",
    "transport_note",
    "staff_help_message",
}
VALID_PRIORITY_LEVELS = {"low", "medium", "high", "critical"}
SUPPORTED_LANGUAGE_NAMES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "ar": "Arabic",
    "pt": "Portuguese",
    "de": "German",
}

logger = logging.getLogger(__name__)


class AIService:
    """Coordinates prompt sanitization, OpenRouter calls, and deterministic fallbacks."""

    def get_fan_assistant_response(
        self,
        message: str,
        language: str,
        context: str,
    ) -> AsyncGenerator[str, None]:
        """Return a streaming fan assistant response through OpenRouter or fallback chunks.

        Args:
            message: Fan question or request.
            language: Supported response language code.
            context: Stadium and scenario context to reference in the reply.

        Returns:
            An async generator yielding Server-Sent Event formatted text chunks.
        """
        sanitized_message = prompt_guard.sanitize_input(message)
        sanitized_context = prompt_guard.sanitize_input(context)
        sanitized_language = language if language in prompt_guard.SUPPORTED_LANGUAGE_CODES else "en"
        logger.info("fan_assistant_request")

        user_prompt = (
            "Context:\n"
            f"Stadium and venue context: {sanitized_context or 'General FIFA World Cup 2026 stadium operations'}\n"
            f"Requested language: {SUPPORTED_LANGUAGE_NAMES.get(sanitized_language, 'English')}\n\n"
            "Task:\n"
            f"Answer this fan request: {sanitized_message}\n\n"
            "Constraints:\n"
            "Keep it concise, practical, calm, accessible, and specific to stadium operations. "
            "Do not claim live crowd conditions unless the context provides them.\n\n"
            "Output format:\n"
            "One direct answer, then short steps or options, then a safety or staff-assistance note."
        )
        fallback_reply = self._get_deterministic_fallback_response(
            response_type="fan_assistant",
            message=sanitized_message,
            language=sanitized_language,
            stadium_context=sanitized_context,
        )

        async def fan_assistant_event_stream() -> AsyncGenerator[str, None]:
            """Yield OpenRouter or fallback assistant text as SSE chunks.

            Args:
                None.

            Returns:
                An async generator of encoded text event chunks.
            """
            async for response_chunk in self._stream_openrouter_response(
                system_prompt=FAN_ASSISTANT_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                fallback_text=str(fallback_reply),
            ):
                yield f"data: {response_chunk}\n\n"
            yield "data: [DONE]\n\n"

        return fan_assistant_event_stream()

    async def get_ops_recommendation(
        self,
        scenario: str,
        incident_type: str,
        severity: str = "medium",
        affected_zone: str = "",
        notes: str = "",
        stadium_context: str = "",
    ) -> dict[str, object]:
        """Return an operations action plan from OpenRouter or deterministic fallback.

        Args:
            scenario: Active scenario context from the scenario engine.
            incident_type: Incident type selected by stadium operations staff.
            severity: Staff-selected incident severity.
            affected_zone: Stadium zone affected by the incident.
            notes: Optional staff context, sanitized and never logged.
            stadium_context: Stadium context for venue-specific recommendations.

        Returns:
            A structured action plan dictionary with priority and timing metadata.
        """
        sanitized_scenario = prompt_guard.sanitize_input(scenario)
        sanitized_incident_type = prompt_guard.sanitize_input(incident_type)
        sanitized_severity = prompt_guard.sanitize_input(severity).lower()
        sanitized_affected_zone = prompt_guard.sanitize_input(affected_zone)
        sanitized_notes = prompt_guard.sanitize_input(notes)[:1000]
        sanitized_stadium_context = prompt_guard.sanitize_input(stadium_context)
        logger.info("ops_recommendation_request")

        fallback_response = self._get_deterministic_fallback_response(
            response_type="ops_recommendation",
            scenario=sanitized_scenario,
            incident_type=sanitized_incident_type,
            severity=sanitized_severity,
            affected_zone=sanitized_affected_zone,
            notes=sanitized_notes,
            stadium_context=sanitized_stadium_context,
        )
        user_prompt = (
            "Context:\n"
            f"Stadium context: {sanitized_stadium_context or 'Selected FIFA World Cup 2026 venue'}\n"
            f"Scenario: {sanitized_scenario}\n"
            f"Incident type: {sanitized_incident_type}\n"
            f"Severity: {sanitized_severity}\n"
            f"Affected zone: {sanitized_affected_zone or 'not specified'}\n"
            f"Sanitized staff notes: {sanitized_notes or 'none'}\n\n"
            "Task:\n"
            "Create a concise operations command recommendation for staff and volunteers.\n\n"
            "Constraints:\n"
            "Priority must be one of low, medium, high, or critical. Do not overstate risk or claim live conditions.\n\n"
            "Output format:\n"
            "Return valid JSON only with exactly these keys: recommended_actions, priority_level, affected_zones, "
            "estimated_resolution_minutes, staff_coordination_note, safety_escalation_trigger."
        )

        openrouter_response = await self._call_openrouter_json(
            system_prompt=OPS_RECOMMENDATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=700,
        )
        if self._is_valid_ops_response(openrouter_response):
            return openrouter_response

        logger.info("openrouter_fallback_used")
        return fallback_response

    async def draft_pa_announcement(
        self,
        scenario: str,
        language_codes: list[str],
        announcement_purpose: str = "General safety reminder",
        tone: str = "Calm",
        stadium_context: str = "",
    ) -> dict[str, str]:
        """Draft PA announcements from OpenRouter or deterministic fallback.

        Args:
            scenario: Active crowd or safety scenario context.
            language_codes: Language codes requested by operations staff.
            announcement_purpose: Reason the announcement is being drafted.
            tone: Operational tone selected by venue staff.
            stadium_context: Stadium context for venue-specific announcement copy.

        Returns:
            A mapping of requested language code to announcement text.
        """
        sanitized_scenario = prompt_guard.sanitize_input(scenario)
        sanitized_announcement_purpose = prompt_guard.sanitize_input(announcement_purpose)
        sanitized_tone = prompt_guard.sanitize_input(tone)
        sanitized_stadium_context = prompt_guard.sanitize_input(stadium_context)
        supported_language_codes = [
            language_code
            for language_code in language_codes
            if language_code in prompt_guard.SUPPORTED_LANGUAGE_CODES
        ] or ["en"]
        logger.info("pa_announcement_request")

        fallback_response = self._get_deterministic_fallback_response(
            response_type="pa_announcement",
            scenario=sanitized_scenario,
            language_codes=supported_language_codes,
            announcement_purpose=sanitized_announcement_purpose,
            tone=sanitized_tone,
            stadium_context=sanitized_stadium_context,
        )
        language_requirements = ", ".join(
            f"{language_code}={SUPPORTED_LANGUAGE_NAMES[language_code]}"
            for language_code in supported_language_codes
        )
        user_prompt = (
            "Context:\n"
            f"Stadium context: {sanitized_stadium_context or 'Selected FIFA World Cup 2026 venue'}\n"
            f"Scenario: {sanitized_scenario}\n"
            f"Purpose: {sanitized_announcement_purpose}\n"
            f"Tone: {sanitized_tone}\n"
            f"Languages: {language_requirements}\n\n"
            "Task:\n"
            "Draft one calm public address announcement for each requested language.\n\n"
            "Constraints:\n"
            "Each announcement must be 1 to 3 short sentences, suitable for a stadium PA system, and written in the language for its key.\n\n"
            "Output format:\n"
            f"Return valid JSON only with exactly these keys: {', '.join(supported_language_codes)}."
        )

        openrouter_response = await self._call_openrouter_json(
            system_prompt=PA_ANNOUNCEMENT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1800,
        )
        if self._is_valid_announcement_response(openrouter_response, supported_language_codes):
            return {
                language_code: str(openrouter_response[language_code])
                for language_code in supported_language_codes
            }

        logger.info("openrouter_fallback_used")
        return fallback_response

    async def get_navigation_guidance(
        self,
        from_location: str,
        to_location: str,
        accessibility_needs: str,
        stadium_id: str = "",
        language: str = "en",
        stadium_context: str = "",
    ) -> dict[str, object]:
        """Return stadium wayfinding guidance from OpenRouter or deterministic fallback.

        Args:
            from_location: Starting point inside or near the stadium.
            to_location: Destination inside or near the stadium.
            accessibility_needs: Mobility, sensory, or other access needs.
            stadium_id: Stadium slug for context.
            language: Supported response language code.
            stadium_context: Stadium context for venue-specific routing.

        Returns:
            A dictionary with steps, timing, accessibility notes, and an alternate route.
        """
        sanitized_from_location = prompt_guard.sanitize_input(from_location)
        sanitized_to_location = prompt_guard.sanitize_input(to_location)
        sanitized_accessibility_needs = prompt_guard.sanitize_input(accessibility_needs)
        sanitized_stadium_id = prompt_guard.sanitize_input(stadium_id)
        sanitized_language = language if language in prompt_guard.SUPPORTED_LANGUAGE_CODES else "en"
        sanitized_stadium_context = prompt_guard.sanitize_input(stadium_context)
        logger.info("navigation_request")

        fallback_response = self._get_deterministic_fallback_response(
            response_type="navigation_guidance",
            from_location=sanitized_from_location,
            to_location=sanitized_to_location,
            accessibility_needs=sanitized_accessibility_needs,
            stadium_id=sanitized_stadium_id,
            language=sanitized_language,
            stadium_context=sanitized_stadium_context,
        )
        user_prompt = (
            "Context:\n"
            f"Stadium ID: {sanitized_stadium_id or 'selected stadium'}\n"
            f"Stadium context: {sanitized_stadium_context or 'Selected FIFA World Cup 2026 venue'}\n"
            f"From: {sanitized_from_location}\n"
            f"To: {sanitized_to_location}\n"
            f"Accessibility needs: {sanitized_accessibility_needs or 'none provided'}\n"
            f"Requested language: {SUPPORTED_LANGUAGE_NAMES.get(sanitized_language, 'English')}\n\n"
            "Task:\n"
            "Generate step-by-step stadium wayfinding guidance.\n\n"
            "Constraints:\n"
            "Do not claim exact live crowd conditions. Prioritize safety, accessibility, signage, and staff assistance.\n\n"
            "Output format:\n"
            "Return valid JSON only with exactly these keys: steps, estimated_minutes, accessibility_notes, alternative_route."
        )

        openrouter_response = await self._call_openrouter_json(
            system_prompt=NAVIGATION_GUIDANCE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=700,
        )
        if self._is_valid_navigation_response(openrouter_response):
            return openrouter_response

        logger.info("openrouter_fallback_used")
        return fallback_response

    async def generate_match_day_briefing(
        self,
        stadium_id: str,
        scenario_id: str,
        language: str,
        briefing_focus: str,
        expected_attendance: int,
        weather_condition: str,
        notes: str,
        stadium_context: str,
        scenario_context: str,
        knowledge_context: str,
        operations_rules_context: str,
    ) -> dict[str, object]:
        """Generate a match-day operations briefing from OpenRouter or fallback.

        Args:
            stadium_id: Stadium slug from the local dataset.
            scenario_id: Active scenario identifier.
            language: Supported output language code.
            briefing_focus: Requested briefing focus.
            expected_attendance: Expected attendance estimate.
            weather_condition: Planning weather condition.
            notes: Optional staff notes, sanitized and never logged.
            stadium_context: Local stadium context.
            scenario_context: Local scenario context.
            knowledge_context: Local knowledge retrieval context.
            operations_rules_context: Local operations rules context.

        Returns:
            Structured match-day briefing response.
        """
        sanitized_stadium_id = prompt_guard.sanitize_input(stadium_id)
        sanitized_scenario_id = prompt_guard.sanitize_input(scenario_id)
        sanitized_language = language if language in prompt_guard.SUPPORTED_LANGUAGE_CODES else "en"
        sanitized_briefing_focus = prompt_guard.sanitize_input(briefing_focus)
        sanitized_weather_condition = prompt_guard.sanitize_input(weather_condition)
        sanitized_notes = prompt_guard.sanitize_input(notes)[:1000]
        sanitized_stadium_context = prompt_guard.sanitize_input(stadium_context)
        sanitized_scenario_context = prompt_guard.sanitize_input(scenario_context)
        sanitized_knowledge_context = prompt_guard.sanitize_input(knowledge_context)
        sanitized_operations_rules_context = prompt_guard.sanitize_input(operations_rules_context)
        logger.info("match_day_briefing_request")

        fallback_response = self._get_deterministic_fallback_response(
            response_type="match_day_briefing",
            stadium_id=sanitized_stadium_id,
            scenario_id=sanitized_scenario_id,
            language=sanitized_language,
            briefing_focus=sanitized_briefing_focus,
            expected_attendance=expected_attendance,
            weather_condition=sanitized_weather_condition,
            notes=sanitized_notes,
            stadium_context=sanitized_stadium_context,
            scenario_context=sanitized_scenario_context,
            knowledge_context=sanitized_knowledge_context,
            operations_rules_context=sanitized_operations_rules_context,
        )
        user_prompt = (
            "Context:\n"
            f"Stadium ID: {sanitized_stadium_id}\n"
            f"Scenario ID: {sanitized_scenario_id}\n"
            f"Briefing focus: {sanitized_briefing_focus}\n"
            f"Expected attendance: {expected_attendance}\n"
            f"Weather condition: {sanitized_weather_condition}\n"
            f"Requested language: {SUPPORTED_LANGUAGE_NAMES.get(sanitized_language, 'English')}\n"
            f"Stadium context: {sanitized_stadium_context or 'Selected FIFA World Cup 2026 venue'}\n"
            f"Scenario context: {sanitized_scenario_context or 'Selected operations scenario'}\n"
            f"Local knowledge context: {sanitized_knowledge_context or 'Local stadium operations knowledge'}\n"
            f"Operations rules: {sanitized_operations_rules_context or 'Keep communications calm and safety-first'}\n"
            f"Sanitized staff notes: {sanitized_notes or 'none'}\n\n"
            "Task:\n"
            "Generate a concise executive briefing for the stadium operations room.\n\n"
            "Constraints:\n"
            "Do not claim live conditions or match results. Keep it practical for staff, volunteers, and organizers.\n\n"
            "Output format:\n"
            "Return valid JSON only with exactly these keys: briefing_title, executive_summary, key_risks, "
            "recommended_actions, volunteer_coordination, accessibility_focus, transit_focus, sustainability_focus."
        )

        openrouter_response = await self._call_openrouter_json(
            system_prompt=MATCH_DAY_BRIEFING_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1100,
        )
        if self._is_valid_match_day_briefing_response(openrouter_response):
            return openrouter_response

        logger.info("openrouter_fallback_used")
        return fallback_response

    async def generate_safety_support_pack(
        self,
        stadium_id: str,
        language_codes: list[str],
        support_focus: str,
        current_location: str,
        accessibility_needs: str,
        notes: str,
        stadium_context: str,
        accessibility_context: str,
        safety_templates: dict[str, object],
        knowledge_context: str,
    ) -> dict[str, dict[str, object]]:
        """Generate multilingual safety support packs from OpenRouter or fallback.

        Args:
            stadium_id: Stadium slug from the local dataset.
            language_codes: Requested supported language codes.
            support_focus: Safety topic selected by the fan.
            current_location: Optional fan location.
            accessibility_needs: Optional accessibility needs.
            notes: Optional fan notes, sanitized and never logged.
            stadium_context: Local stadium context.
            accessibility_context: Local accessibility playbook context.
            safety_templates: Local multilingual safety template mapping.
            knowledge_context: Local knowledge retrieval context.

        Returns:
            Mapping of language code to localized safety support content.
        """
        sanitized_stadium_id = prompt_guard.sanitize_input(stadium_id)
        sanitized_support_focus = prompt_guard.sanitize_input(support_focus)
        sanitized_current_location = prompt_guard.sanitize_input(current_location)
        sanitized_accessibility_needs = prompt_guard.sanitize_input(accessibility_needs)
        sanitized_notes = prompt_guard.sanitize_input(notes)[:1000]
        sanitized_stadium_context = prompt_guard.sanitize_input(stadium_context)
        sanitized_accessibility_context = prompt_guard.sanitize_input(accessibility_context)
        sanitized_knowledge_context = prompt_guard.sanitize_input(knowledge_context)
        supported_language_codes = [
            language_code
            for language_code in language_codes
            if language_code in prompt_guard.SUPPORTED_LANGUAGE_CODES
        ] or ["en"]
        logger.info("safety_support_pack_request")

        fallback_response = self._get_deterministic_fallback_response(
            response_type="safety_support_pack",
            stadium_id=sanitized_stadium_id,
            language_codes=supported_language_codes,
            support_focus=sanitized_support_focus,
            current_location=sanitized_current_location,
            accessibility_needs=sanitized_accessibility_needs,
            notes=sanitized_notes,
            stadium_context=sanitized_stadium_context,
            accessibility_context=sanitized_accessibility_context,
            safety_templates=safety_templates,
            knowledge_context=sanitized_knowledge_context,
        )
        user_prompt = (
            "Context:\n"
            f"Stadium ID: {sanitized_stadium_id}\n"
            f"Support focus: {sanitized_support_focus}\n"
            f"Current location: {sanitized_current_location or 'not provided'}\n"
            f"Accessibility needs: {sanitized_accessibility_needs or 'not provided'}\n"
            f"Language codes: {', '.join(supported_language_codes)}\n"
            f"Stadium context: {sanitized_stadium_context or 'Selected FIFA World Cup 2026 venue'}\n"
            f"Accessibility context: {sanitized_accessibility_context or 'General accessible support'}\n"
            f"Knowledge context: {sanitized_knowledge_context or 'Local safety guidance'}\n"
            f"Safety templates: {json.dumps(safety_templates, ensure_ascii=False)}\n"
            f"Sanitized fan notes: {sanitized_notes or 'none'}\n\n"
            "Task:\n"
            "Generate short fan-facing safety support packs for the requested languages.\n\n"
            "Constraints:\n"
            "Keep messages friendly, practical, simple to translate, and safety-first. Do not claim live conditions.\n\n"
            "Output format:\n"
            f"Return valid JSON only with exactly these root keys: {', '.join(supported_language_codes)}. "
            "Each value must include exactly: title, safety_steps, accessibility_note, transport_note, staff_help_message."
        )

        openrouter_response = await self._call_openrouter_json(
            system_prompt=SAFETY_SUPPORT_PACK_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            max_tokens=1600,
        )
        if self._is_valid_safety_support_pack_response(openrouter_response, supported_language_codes):
            return {
                language_code: dict(openrouter_response[language_code])
                for language_code in supported_language_codes
            }

        logger.info("openrouter_fallback_used")
        return fallback_response

    def _build_openrouter_headers(self) -> dict[str, str]:
        """Build OpenRouter request headers without logging secrets.

        Args:
            None.

        Returns:
            Headers required by OpenRouter chat completions.
        """
        return {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": settings.OPENROUTER_SITE_URL,
            "X-OpenRouter-Title": settings.OPENROUTER_APP_NAME,
        }

    def _build_chat_payload(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.3,
        max_tokens: int = 700,
        stream: bool = False,
    ) -> dict[str, object]:
        """Build an OpenAI-compatible OpenRouter chat completions payload.

        Args:
            system_prompt: System instruction for the selected workflow.
            user_prompt: Sanitized user and context prompt.
            temperature: Sampling temperature for the model.
            max_tokens: Maximum response tokens.
            stream: Whether OpenRouter should stream the response.

        Returns:
            JSON-compatible request payload for OpenRouter.
        """
        return {
            "model": settings.OPENROUTER_MODEL or DEFAULT_OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }

    async def _call_openrouter_json(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 700,
    ) -> dict[str, Any] | None:
        """Call OpenRouter for a JSON response and parse it safely.

        Args:
            system_prompt: System instruction for the selected workflow.
            user_prompt: Sanitized user and context prompt.
            max_tokens: Maximum response tokens.

        Returns:
            Parsed JSON object from model output, or None when fallback should be used.
        """
        if not settings.OPENROUTER_API_KEY:
            return None

        request_payload = self._build_chat_payload(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=max_tokens,
            stream=False,
        )
        try:
            logger.info("openrouter_request_started")
            async with httpx.AsyncClient(timeout=OPENROUTER_REQUEST_TIMEOUT_SECONDS) as http_client:
                openrouter_response = await http_client.post(
                    self._get_openrouter_chat_url(),
                    headers=self._build_openrouter_headers(),
                    json=request_payload,
                )
                openrouter_response.raise_for_status()
            logger.info("openrouter_request_completed")
            return self._parse_openrouter_json_response(openrouter_response.json())
        except (
            httpx.TimeoutException,
            httpx.HTTPStatusError,
            httpx.RequestError,
            ValueError,
            KeyError,
            TypeError,
        ):
            logger.warning("openrouter_request_failed")
            return None

    async def _stream_openrouter_response(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_text: str,
    ) -> AsyncGenerator[str, None]:
        """Stream OpenRouter text chunks or deterministic fallback chunks.

        Args:
            system_prompt: System instruction for the selected workflow.
            user_prompt: Sanitized user and context prompt.
            fallback_text: Text streamed when OpenRouter is unavailable or fails.

        Returns:
            Async generator yielding text chunks only, without SSE prefixes.
        """
        if not settings.OPENROUTER_API_KEY:
            logger.info("openrouter_fallback_used")
            for fallback_chunk in _chunk_text(fallback_text, chunk_size=96):
                yield fallback_chunk
            return

        request_payload = self._build_chat_payload(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=700,
            stream=True,
        )
        streamed_token_count = 0

        try:
            logger.info("openrouter_request_started")
            async with httpx.AsyncClient(timeout=OPENROUTER_REQUEST_TIMEOUT_SECONDS) as http_client:
                async with http_client.stream(
                    "POST",
                    self._get_openrouter_chat_url(),
                    headers=self._build_openrouter_headers(),
                    json=request_payload,
                ) as openrouter_stream:
                    openrouter_stream.raise_for_status()
                    async for stream_line in openrouter_stream.aiter_lines():
                        if not stream_line.startswith("data:"):
                            continue

                        stream_payload_text = stream_line.removeprefix("data:").strip()
                        if not stream_payload_text or stream_payload_text == "[DONE]":
                            continue

                        response_chunk = self._extract_stream_delta(stream_payload_text)
                        if response_chunk:
                            streamed_token_count += 1
                            yield response_chunk

            logger.info("openrouter_request_completed")
        except (httpx.TimeoutException, httpx.HTTPStatusError, httpx.RequestError, ValueError, KeyError, TypeError):
            logger.warning("openrouter_request_failed")
            streamed_token_count = 0

        if streamed_token_count == 0:
            logger.info("openrouter_fallback_used")
            for fallback_chunk in _chunk_text(fallback_text, chunk_size=96):
                yield fallback_chunk

    def _parse_openrouter_json_response(self, response_payload: dict[str, Any]) -> dict[str, Any] | None:
        """Extract and parse JSON object content from an OpenRouter response payload.

        Args:
            response_payload: Decoded OpenRouter chat completions response.

        Returns:
            Parsed JSON object, or None when content is missing or invalid.
        """
        try:
            message_content = response_payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            return None

        if not isinstance(message_content, str):
            return None

        cleaned_message_content = _strip_json_markdown_fence(message_content)
        try:
            parsed_message_content = json.loads(cleaned_message_content)
        except json.JSONDecodeError:
            return None

        return parsed_message_content if isinstance(parsed_message_content, dict) else None

    def _get_deterministic_fallback_response(self, response_type: str, **fallback_context: Any) -> Any:
        """Return useful FIFA World Cup 2026 fallback content for a workflow.

        Args:
            response_type: Workflow identifier.
            **fallback_context: Sanitized context used to customize the fallback.

        Returns:
            String or structured fallback response for the selected workflow.
        """
        if response_type == "fan_assistant":
            return _build_fan_assistant_fallback(fallback_context)
        if response_type == "ops_recommendation":
            return _build_ops_recommendation_fallback(fallback_context)
        if response_type == "pa_announcement":
            return _build_pa_announcement_fallback(fallback_context)
        if response_type == "navigation_guidance":
            return _build_navigation_guidance_fallback(fallback_context)
        if response_type == "match_day_briefing":
            return _build_match_day_briefing_fallback(fallback_context)
        if response_type == "safety_support_pack":
            return _build_safety_support_pack_fallback(fallback_context)
        return "NexaStadium AI is ready with FIFA World Cup 2026 stadium operations guidance."

    def _get_openrouter_chat_url(self) -> str:
        """Return the normalized OpenRouter chat completions URL.

        Args:
            None.

        Returns:
            Fully qualified OpenRouter chat completions URL.
        """
        openrouter_base_url = settings.OPENROUTER_BASE_URL or "https://openrouter.ai/api/v1"
        return f"{openrouter_base_url.rstrip('/')}/chat/completions"

    def _extract_stream_delta(self, stream_payload_text: str) -> str:
        """Extract a text token from one OpenRouter SSE JSON line.

        Args:
            stream_payload_text: Text after the SSE data prefix.

        Returns:
            Streamed model text chunk, or an empty string when absent.
        """
        parsed_stream_payload = json.loads(stream_payload_text)
        response_choices = parsed_stream_payload.get("choices", [])
        if not response_choices:
            return ""

        delta_content = response_choices[0].get("delta", {}).get("content", "")
        return delta_content if isinstance(delta_content, str) else ""

    def _is_valid_ops_response(self, openrouter_response: dict[str, Any] | None) -> bool:
        """Validate OpenRouter operations response shape.

        Args:
            openrouter_response: Parsed OpenRouter JSON object.

        Returns:
            True when all required keys and value types are present.
        """
        if not isinstance(openrouter_response, dict) or set(openrouter_response.keys()) != REQUIRED_OPS_RESPONSE_KEYS:
            return False

        priority_level = openrouter_response.get("priority_level")
        return (
            isinstance(openrouter_response.get("recommended_actions"), list)
            and isinstance(openrouter_response.get("affected_zones"), list)
            and isinstance(openrouter_response.get("estimated_resolution_minutes"), int)
            and isinstance(openrouter_response.get("staff_coordination_note"), str)
            and isinstance(openrouter_response.get("safety_escalation_trigger"), str)
            and isinstance(priority_level, str)
            and priority_level in VALID_PRIORITY_LEVELS
        )

    def _is_valid_announcement_response(
        self,
        openrouter_response: dict[str, Any] | None,
        language_codes: list[str],
    ) -> bool:
        """Validate OpenRouter PA announcement response shape.

        Args:
            openrouter_response: Parsed OpenRouter JSON object.
            language_codes: Requested language codes.

        Returns:
            True when response includes exactly the requested language keys.
        """
        if not isinstance(openrouter_response, dict) or set(openrouter_response.keys()) != set(language_codes):
            return False

        return all(isinstance(openrouter_response.get(language_code), str) for language_code in language_codes)

    def _is_valid_navigation_response(self, openrouter_response: dict[str, Any] | None) -> bool:
        """Validate OpenRouter navigation guidance response shape.

        Args:
            openrouter_response: Parsed OpenRouter JSON object.

        Returns:
            True when all required navigation keys and value types are present.
        """
        if not isinstance(openrouter_response, dict) or set(openrouter_response.keys()) != REQUIRED_NAVIGATION_RESPONSE_KEYS:
            return False

        alternative_route = openrouter_response.get("alternative_route")
        return (
            isinstance(openrouter_response.get("steps"), list)
            and isinstance(openrouter_response.get("estimated_minutes"), int)
            and isinstance(openrouter_response.get("accessibility_notes"), str)
            and (isinstance(alternative_route, str) or alternative_route is None)
        )

    def _is_valid_match_day_briefing_response(self, openrouter_response: dict[str, Any] | None) -> bool:
        """Validate OpenRouter match-day briefing response shape.

        Args:
            openrouter_response: Parsed OpenRouter JSON object.

        Returns:
            True when all briefing keys and value types are present.
        """
        if not isinstance(openrouter_response, dict) or set(openrouter_response.keys()) != REQUIRED_MATCH_DAY_BRIEFING_KEYS:
            return False

        return (
            isinstance(openrouter_response.get("briefing_title"), str)
            and isinstance(openrouter_response.get("executive_summary"), str)
            and isinstance(openrouter_response.get("key_risks"), list)
            and isinstance(openrouter_response.get("recommended_actions"), list)
            and isinstance(openrouter_response.get("volunteer_coordination"), str)
            and isinstance(openrouter_response.get("accessibility_focus"), str)
            and isinstance(openrouter_response.get("transit_focus"), str)
            and isinstance(openrouter_response.get("sustainability_focus"), str)
        )

    def _is_valid_safety_support_pack_response(
        self,
        openrouter_response: dict[str, Any] | None,
        language_codes: list[str],
    ) -> bool:
        """Validate OpenRouter safety support pack response shape.

        Args:
            openrouter_response: Parsed OpenRouter JSON object.
            language_codes: Requested language codes.

        Returns:
            True when each requested language has the required safety content.
        """
        if not isinstance(openrouter_response, dict) or set(openrouter_response.keys()) != set(language_codes):
            return False

        for language_code in language_codes:
            language_pack = openrouter_response.get(language_code)
            if not isinstance(language_pack, dict) or set(language_pack.keys()) != REQUIRED_SAFETY_PACK_CONTENT_KEYS:
                return False
            if not isinstance(language_pack.get("safety_steps"), list):
                return False
            if not all(
                isinstance(language_pack.get(text_key), str)
                for text_key in ("title", "accessibility_note", "transport_note", "staff_help_message")
            ):
                return False

        return True


def _build_fan_assistant_fallback(fallback_context: dict[str, Any]) -> str:
    """Build deterministic streaming fallback text for fan assistance.

    Args:
        fallback_context: Sanitized fan assistant context.

    Returns:
        Stadium-specific fan guidance text.
    """
    language = str(fallback_context.get("language") or "en")
    message = str(fallback_context.get("message") or "your stadium request")
    stadium_context = str(fallback_context.get("stadium_context") or "the selected FIFA World Cup 2026 venue")
    return _build_localized_fan_assistant_text(
        language_code=language,
        message=message,
        stadium_context=stadium_context,
    )


def _build_localized_fan_assistant_text(language_code: str, message: str, stadium_context: str) -> str:
    """Build polished fan-facing assistance text in a supported language.

    Args:
        language_code: Supported response language code.
        message: Sanitized fan request.
        stadium_context: Sanitized stadium context.

    Returns:
        Concise fan guidance text suitable for streaming to the frontend.
    """
    if language_code == "es":
        return (
            f"Claro. Para {stadium_context}, la opcion mas segura es seguir la senalizacion oficial del estadio "
            "y confirmar los detalles con el personal si necesitas ayuda especifica.\n\n"
            "Pasos sugeridos:\n"
            "1. Ten tu entrada lista antes de entrar al concourse.\n"
            "2. Sigue las senales hacia tu puerta, seccion o servicio solicitado.\n"
            "3. Si necesitas acceso sin escalones, pide a un voluntario el corredor accesible o el elevador mas cercano.\n\n"
            f"Sobre tu solicitud: {message}. Evita detenerte en zonas de alto flujo y sigue las indicaciones del personal del estadio."
        )
    if language_code == "fr":
        return (
            f"Bien sur. Pour {stadium_context}, l'approche la plus sure est de suivre la signalisation officielle du stade "
            "et de demander confirmation au personnel si vous avez besoin d'une aide precise.\n\n"
            "Etapes conseillees:\n"
            "1. Gardez votre billet pret avant d'entrer dans le hall.\n"
            "2. Suivez les panneaux vers votre porte, votre section ou le service recherche.\n"
            "3. Si vous avez besoin d'un parcours sans marches, demandez a un benevole le couloir accessible ou l'ascenseur le plus proche.\n\n"
            f"Pour votre demande: {message}. Evitez de vous arreter dans les zones de forte circulation et suivez les consignes du personnel."
        )
    if language_code == "ar":
        return (
            f"يرجى الانتباه. للمساعدة في {announcement_purpose}، يرجى اتباع لافتات الملعب وتعليمات الموظفين والمتطوعين. "
            "شكرا لتحرككم بهدوء."
        )
    if language_code == "pt":
        return (
            f"Claro. Para {stadium_context}, a opcao mais segura e seguir a sinalizacao oficial do estadio "
            "e confirmar os detalhes com a equipe se precisar de ajuda especifica.\n\n"
            "Passos sugeridos:\n"
            "1. Tenha seu ingresso pronto antes de entrar no concourse.\n"
            "2. Siga as placas para o portao, setor ou servico desejado.\n"
            "3. Se precisar de acesso sem degraus, peca a um voluntario o corredor acessivel ou elevador mais proximo.\n\n"
            f"Sobre sua pergunta: {message}. Evite parar em areas de grande fluxo e siga as orientacoes da equipe do estadio."
        )
    if language_code == "de":
        return (
            f"Gerne. Fur {stadium_context} ist der sicherste Weg, der offiziellen Stadionbeschilderung zu folgen "
            "und bei Bedarf das Personal um Bestatigung zu bitten.\n\n"
            "Empfohlene Schritte:\n"
            "1. Halten Sie Ihr Ticket bereit, bevor Sie den Umlauf betreten.\n"
            "2. Folgen Sie den Schildern zu Ihrem Eingang, Block oder gewunschten Service.\n"
            "3. Wenn Sie stufenfreien Zugang benotigen, fragen Sie Freiwillige nach dem nachsten barrierefreien Korridor oder Aufzug.\n\n"
            f"Zu Ihrer Anfrage: {message}. Bitte bleiben Sie nicht in stark frequentierten Wegen stehen und folgen Sie den Hinweisen des Stadionpersonals."
        )
    return (
        f"Absolutely. For {stadium_context}, the safest approach is to follow the posted stadium signage "
        "and confirm section-specific details with venue staff if you need help.\n\n"
        "Suggested next steps:\n"
        "1. Keep your ticket ready before entering the concourse.\n"
        "2. Follow signs toward your assigned gate, section, or requested service.\n"
        "3. If you need step-free access, ask a volunteer for the nearest accessible corridor or elevator bank.\n\n"
        f"For your request about {message}, avoid stopping in high-flow walkways and follow instructions from stadium staff."
    )


def _build_ops_recommendation_fallback(fallback_context: dict[str, Any]) -> dict[str, object]:
    """Build deterministic fallback operations recommendation.

    Args:
        fallback_context: Sanitized operations context.

    Returns:
        Structured operations action plan.
    """
    scenario = str(fallback_context.get("scenario") or "")
    incident_type = str(fallback_context.get("incident_type") or "the incident")
    severity = str(fallback_context.get("severity") or "medium").lower()
    affected_zone = str(fallback_context.get("affected_zone") or "")
    notes = str(fallback_context.get("notes") or "")
    priority_level = _determine_priority_level(incident_type, scenario, severity)
    affected_zones = _infer_affected_zones(scenario)
    if affected_zone:
        affected_zones = [affected_zone, *[zone for zone in affected_zones if zone != affected_zone]]
    staff_context_action = (
        "Review the submitted staff notes with the zone lead before changing gate or concourse flow."
        if notes
        else "Ask the zone lead for a current field report before changing gate or concourse flow."
    )

    return {
        "recommended_actions": [
            f"Confirm {incident_type} with the zone supervisor and keep one clear access lane open for staff movement.",
            f"Stage staff and volunteers near {', '.join(affected_zones)} to guide fans toward lower-pressure routes.",
            staff_context_action,
            "Prepare calm PA and volunteer messaging before congestion increases, using multilingual support where needed.",
        ],
        "priority_level": priority_level,
        "affected_zones": affected_zones,
        "estimated_resolution_minutes": _estimate_resolution_minutes(priority_level),
        "staff_coordination_note": (
            f"Assign one operations lead to coordinate security, volunteers, guest services, and accessibility support for {affected_zones[0]}."
        ),
        "safety_escalation_trigger": (
            "Escalate if fan movement stops for more than five minutes, crowd pressure builds near barriers, or medical and accessibility access is blocked."
        ),
    }


def _build_pa_announcement_fallback(fallback_context: dict[str, Any]) -> dict[str, str]:
    """Build deterministic fallback PA announcements.

    Args:
        fallback_context: Sanitized PA announcement context.

    Returns:
        Mapping of language code to announcement text.
    """
    language_codes = fallback_context.get("language_codes") or ["en"]
    announcement_purpose = fallback_context.get("announcement_purpose") or "stadium operations"
    announcement_by_language: dict[str, str] = {}
    for language_code in language_codes:
        announcement_by_language[str(language_code)] = _build_localized_pa_announcement_text(
            language_code=str(language_code),
            announcement_purpose=str(announcement_purpose),
        )

    return announcement_by_language


def _build_localized_pa_announcement_text(
    language_code: str,
    announcement_purpose: str,
) -> str:
    """Build a localized fallback PA announcement for one language.

    Args:
        language_code: Supported output language code.
        announcement_purpose: Operational announcement purpose.

    Returns:
        Public address announcement text in the requested language when supported.
    """
    if language_code == "es":
        return (
            f"Atencion, por favor. Para apoyar {announcement_purpose}, sigan la senalizacion del estadio "
            "y las indicaciones del personal y los voluntarios. Gracias por avanzar con calma."
        )
    if language_code == "fr":
        return (
            f"Votre attention, s'il vous plait. Pour faciliter {announcement_purpose}, suivez la signalisation du stade "
            "et les consignes du personnel et des benevoles. Merci d'avancer calmement."
        )
    if language_code == "ar":
        return (
            f"يرجى الانتباه. للمساعدة في {announcement_purpose}، يرجى اتباع لافتات الملعب وتعليمات الموظفين والمتطوعين. "
            "شكرا لتحرككم بهدوء."
        )
    if language_code == "pt":        return (
            f"Atencao, por favor. Para apoiar {announcement_purpose}, sigam a sinalizacao do estadio "
            "e as orientacoes da equipe e dos voluntarios. Obrigado por se deslocarem com calma."
        )
    if language_code == "de":
        return (
            f"Bitte beachten Sie diese Durchsage. Zur Unterstutzung von {announcement_purpose} folgen Sie bitte der Stadionbeschilderung "
            "und den Hinweisen von Personal und Freiwilligen. Vielen Dank, dass Sie ruhig weitergehen."
        )
    return (
        f"Attention please. To support {announcement_purpose}, please follow the stadium signs and listen to guidance "
        "from staff and volunteers. Thank you for moving calmly."
    )


def _build_navigation_guidance_fallback(fallback_context: dict[str, Any]) -> dict[str, object]:
    """Build deterministic fallback stadium navigation guidance.

    Args:
        fallback_context: Sanitized navigation context.

    Returns:
        Structured route guidance.
    """
    from_location = fallback_context.get("from_location") or "your current stadium location"
    to_location = fallback_context.get("to_location") or "the requested destination"
    accessibility_needs = fallback_context.get("accessibility_needs") or ""
    stadium_id = fallback_context.get("stadium_id") or "the selected stadium"
    accessibility_notes = (
        f"For {accessibility_needs}, use marked step-free routes, elevator banks, and guest services assistance points before entering crowded aisles."
        if accessibility_needs
        else "Accessible support is available at main gates, guest services desks, elevator banks, and marked assistance points."
    )

    return {
        "steps": [
            f"Start from {from_location} and follow the nearest concourse signs toward {to_location}.",
            "Stay to the side of the walkway so the main fan flow can keep moving safely.",
            "Use the signed elevator or accessible corridor before taking stairs if step-free access is helpful.",
            "Stop at the nearest information desk or ask a volunteer if you need section-specific confirmation.",
        ],
        "estimated_minutes": 8 if accessibility_needs else 6,
        "accessibility_notes": accessibility_notes,
        "alternative_route": f"If the direct concourse route feels crowded, use the signed outer concourse loop for {stadium_id} and re-enter near {to_location}.",
    }


def _build_match_day_briefing_fallback(fallback_context: dict[str, Any]) -> dict[str, object]:
    """Build deterministic fallback match-day briefing content.

    Args:
        fallback_context: Sanitized briefing context.

    Returns:
        Structured match-day briefing response.
    """
    stadium_id = fallback_context.get("stadium_id") or "selected stadium"
    scenario_id = fallback_context.get("scenario_id") or "MATCH_ENTRY_SURGE"
    briefing_focus = fallback_context.get("briefing_focus") or "operations readiness"
    expected_attendance = int(fallback_context.get("expected_attendance") or 0)
    weather_condition = fallback_context.get("weather_condition") or "clear"
    stadium_context = fallback_context.get("stadium_context") or "the selected FIFA World Cup 2026 venue"
    scenario_context = fallback_context.get("scenario_context") or "the active operations scenario"
    knowledge_context = fallback_context.get("knowledge_context") or "local safety, accessibility, and crowd guidance"
    operations_rules_context = fallback_context.get("operations_rules_context") or "keep communications calm and accessible routes clear"

    return {
        "briefing_title": f"FIFA World Cup 2026 Match-Day Briefing for {stadium_id}",
        "executive_summary": (
            f"{briefing_focus} is the command focus for this FIFA World Cup 2026 operation. "
            f"Plan for {expected_attendance:,} expected attendees with {weather_condition} as the planning weather condition. "
            f"Use {stadium_context} and {scenario_context} to keep fan movement safe, accessible, and easy to understand."
        ),
        "key_risks": [
            "Arrival or exit waves can build pressure at gates, concourses, restrooms, and transit corridors.",
            "Accessible routes, elevators, and assistance points can be blocked if staff are staged too late.",
            "Fan confusion increases when PA messages, signage, and volunteer instructions are not aligned.",
        ],
        "recommended_actions": [
            "Brief zone leads on the active scenario before the first major fan wave reaches the venue.",
            "Protect accessible entrances, elevator banks, medical lanes, and guest services desks before adjusting general flow.",
            "Prepare short multilingual PA, signage, and volunteer scripts for gate, concourse, transit, and weather updates.",
            f"Use local knowledge for staff decisions: {knowledge_context}",
        ],
        "volunteer_coordination": (
            "Place volunteers at perimeter queues, information desks, accessible support points, and transit-facing exits with one lead per zone."
        ),
        "accessibility_focus": (
            "Keep accessible corridors, restrooms, elevator banks, and mobility assistance points clear before changing general crowd routes."
        ),
        "transit_focus": (
            "Coordinate rail, bus, rideshare, parking, and accessible pickup messaging before releasing the largest post-match fan waves."
        ),
        "sustainability_focus": (
            f"Promote refill stations, cup returns, waste sorting, and public transit while applying this operations rule: {operations_rules_context}. Scenario: {scenario_id}."
        ),
    }


def _build_safety_support_pack_fallback(fallback_context: dict[str, Any]) -> dict[str, dict[str, object]]:
    """Build deterministic fallback safety support packs.

    Args:
        fallback_context: Sanitized safety support context.

    Returns:
        Safety support packs keyed by language code.
    """
    language_codes = fallback_context.get("language_codes") or ["en"]
    support_focus = str(fallback_context.get("support_focus") or "general safety")
    current_location = str(fallback_context.get("current_location") or "your current stadium location")
    accessibility_needs = str(fallback_context.get("accessibility_needs") or "")
    safety_templates = fallback_context.get("safety_templates") or {}
    safety_pack_by_language: dict[str, dict[str, object]] = {}

    for language_code in language_codes:
        template = safety_templates.get(language_code) if isinstance(safety_templates, dict) else None
        if not isinstance(template, dict):
            template = _default_safety_template(language_code=str(language_code))

        template_steps = template.get("steps", _default_safety_template(str(language_code))["steps"])
        safety_steps = [str(step) for step in template_steps if isinstance(step, str)]
        focus_suffix = _localized_support_focus_sentence(str(language_code), support_focus)
        location_suffix = _localized_location_sentence(str(language_code), current_location) if current_location else ""
        accessibility_suffix = (
            _localized_accessibility_request_sentence(str(language_code), accessibility_needs)
            if accessibility_needs
            else ""
        )
        safety_pack_by_language[str(language_code)] = {
            "title": str(template.get("title") or "FIFA World Cup 2026 Safety Support"),
            "safety_steps": [*safety_steps[:3], focus_suffix],
            "accessibility_note": f"{template.get('accessibility_note', '')} {accessibility_suffix}".strip(),
            "transport_note": f"{template.get('transport_note', '')} {location_suffix}".strip(),
            "staff_help_message": str(template.get("staff_help_message") or "Ask the nearest venue staff member or volunteer for help."),
        }

    return safety_pack_by_language


def _localized_support_focus_sentence(language_code: str, support_focus: str) -> str:
    """Build a short safety focus sentence for a supported language.

    Args:
        language_code: Supported language code.
        support_focus: Sanitized safety support focus.

    Returns:
        Localized sentence that keeps the fan guidance specific.
    """
    if language_code == "es":
        return f"Mantén tu atención en {support_focus} y pide ayuda si la ruta no es clara."
    if language_code == "fr":
        return f"Gardez l'attention sur {support_focus} et demandez de l'aide si le parcours n'est pas clair."
    if language_code == "ar":
        return f"ركز على {support_focus} واطلب المساعدة إذا لم يكن المسار واضحا."
    if language_code == "pt":
        return f"Mantenha o foco em {support_focus} e peca ajuda se a rota nao estiver clara."
    if language_code == "de":
        return f"Achten Sie auf {support_focus} und bitten Sie um Hilfe, wenn der Weg unklar ist."
    return f"Keep focused on {support_focus} and ask for help if the route is unclear."


def _localized_location_sentence(language_code: str, current_location: str) -> str:
    """Build a short location sentence for safety support packs.

    Args:
        language_code: Supported language code.
        current_location: Sanitized fan location.

    Returns:
        Localized sentence referencing the current location.
    """
    if language_code == "es":
        return f"Ubicacion actual: {current_location}."
    if language_code == "fr":
        return f"Position actuelle: {current_location}."
    if language_code == "ar":
        return f"الموقع الحالي: {current_location}."
    if language_code == "pt":
        return f"Localizacao atual: {current_location}."
    if language_code == "de":
        return f"Aktueller Standort: {current_location}."
    return f"Current location: {current_location}."


def _localized_accessibility_request_sentence(language_code: str, accessibility_needs: str) -> str:
    """Build a short accessibility request sentence for safety support packs.

    Args:
        language_code: Supported language code.
        accessibility_needs: Sanitized accessibility needs.

    Returns:
        Localized sentence referencing requested accessibility support.
    """
    if language_code == "es":
        return f"Apoyo solicitado: {accessibility_needs}."
    if language_code == "fr":
        return f"Aide demandee: {accessibility_needs}."
    if language_code == "ar":
        return f"الدعم المطلوب: {accessibility_needs}."
    if language_code == "pt":
        return f"Apoio solicitado: {accessibility_needs}."
    if language_code == "de":
        return f"Benotigte Unterstutzung: {accessibility_needs}."
    return f"Requested support: {accessibility_needs}."


def _default_safety_template(language_code: str) -> dict[str, object]:
    """Return a minimal safety template when a requested language is missing.

    Args:
        language_code: Requested language code.

    Returns:
        Safety template dictionary.
    """
    if language_code == "es":
        return {
            "title": "Apoyo de seguridad FIFA World Cup 2026",
            "steps": [
                "Avanza con calma hacia el concourse senalizado o el punto de atencion mas cercano.",
                "Manten libres las rutas accesibles, ascensores y pasillos medicos.",
                "Sigue las indicaciones del personal, voluntarios, anuncios y senales del estadio.",
            ],
            "accessibility_note": "Hay apoyo accesible en servicios al invitado y puntos de asistencia senalizados.",
            "transport_note": "Para salir, sigue las senales hacia transporte publico, rideshare, estacionamiento y recogida accesible.",
            "staff_help_message": "Si necesitas ayuda, habla con el personal del estadio o un voluntario de FIFA World Cup 2026.",
        }
    if language_code == "fr":
        return {
            "title": "Aide securite FIFA World Cup 2026",
            "steps": [
                "Avancez calmement vers le hall indique ou le point d'information le plus proche.",
                "Gardez degages les parcours accessibles, ascenseurs et couloirs medicaux.",
                "Suivez les consignes du personnel, des benevoles, des annonces et de la signalisation.",
            ],
            "accessibility_note": "Une aide accessible est disponible aux services spectateurs et aux points d'assistance indiques.",
            "transport_note": "Pour partir, suivez les panneaux vers transports, rideshare, stationnement et prise en charge accessible.",
            "staff_help_message": "Si vous avez besoin d'aide, adressez-vous au personnel du stade ou a un benevole FIFA World Cup 2026.",
        }
    if language_code == "ar":
        return {
            "title": "دعم السلامة في FIFA World Cup 2026",
            "steps": [
                "تحرك بهدوء نحو الممر أو نقطة خدمة الجمهور المشار إليها.",
                "أبق المسارات الميسرة والمصاعد والممرات الطبية مفتوحة.",
                "اتبع تعليمات الموظفين والمتطوعين والإعلانات ولافتات الملعب.",
            ],
            "accessibility_note": "يتوفر دعم ميسر عند خدمات الجمهور ونقاط المساعدة المشار إليها.",
            "transport_note": "عند المغادرة، اتبع اللافتات نحو النقل العام ومناطق الوصول والمواقف ونقاط الالتقاء الميسرة.",
            "staff_help_message": "إذا احتجت إلى مساعدة، تحدث مع أقرب موظف في الملعب أو متطوع في FIFA World Cup 2026.",
        }
    if language_code == "pt":
        return {
            "title": "Apoio de seguranca FIFA World Cup 2026",
            "steps": [
                "Siga com calma para o concourse sinalizado ou ponto de atendimento mais proximo.",
                "Mantenha livres as rotas acessiveis, elevadores e corredores medicos.",
                "Siga as orientacoes da equipe, voluntarios, anuncios e sinalizacao do estadio.",
            ],
            "accessibility_note": "Apoio acessivel esta disponivel nos servicos ao torcedor e pontos de assistencia sinalizados.",
            "transport_note": "Na saida, siga as placas para transporte publico, rideshare, estacionamento e embarque acessivel.",
            "staff_help_message": "Se precisar de ajuda, fale com a equipe do estadio ou um voluntario da FIFA World Cup 2026.",
        }
    if language_code == "de":
        return {
            "title": "Sicherheitsunterstutzung FIFA World Cup 2026",
            "steps": [
                "Gehen Sie ruhig zum ausgeschilderten Umlauf oder zum nachsten Informationspunkt.",
                "Halten Sie barrierefreie Wege, Aufzuge und medizinische Zugange frei.",
                "Folgen Sie den Hinweisen von Personal, Freiwilligen, Durchsagen und Beschilderung.",
            ],
            "accessibility_note": "Barrierefreie Unterstutzung ist an Guest-Services-Punkten und ausgeschilderten Hilfspunkten verfugbar.",
            "transport_note": "Folgen Sie beim Verlassen den Schildern zu Nahverkehr, Rideshare, Parken und barrierefreier Abholung.",
            "staff_help_message": "Wenn Sie Hilfe brauchen, sprechen Sie mit Stadionpersonal oder Freiwilligen der FIFA World Cup 2026.",
        }
    return {
        "title": "FIFA World Cup 2026 Safety Support",
        "steps": [
            "Move calmly toward the nearest signed concourse or guest services point.",
            "Keep accessible routes, elevator banks, and medical aisles clear.",
            "Follow venue staff, volunteer, PA, and signage instructions.",
        ],
        "accessibility_note": "Accessible support is available through guest services and marked assistance points.",
        "transport_note": "For departure, follow signed transit, rideshare, parking, and accessible pickup routes.",
        "staff_help_message": "If you feel unsafe or need help, speak with the nearest FIFA World Cup 2026 venue staff member or volunteer.",
    }


def _strip_json_markdown_fence(message_content: str) -> str:
    """Remove JSON markdown fences and trim surrounding non-JSON text.

    Args:
        message_content: Raw model message content.

    Returns:
        Cleaned JSON candidate string.
    """
    cleaned_message_content = message_content.strip()
    cleaned_message_content = re.sub(r"^```(?:json)?", "", cleaned_message_content, flags=re.IGNORECASE).strip()
    cleaned_message_content = re.sub(r"```$", "", cleaned_message_content).strip()
    json_object_match = re.search(r"\{.*\}", cleaned_message_content, flags=re.DOTALL)
    return json_object_match.group(0).strip() if json_object_match else cleaned_message_content


def _chunk_text(text: str, chunk_size: int) -> list[str]:
    """Split text into stable chunks for fallback streaming.

    Args:
        text: Full response text to stream.
        chunk_size: Maximum chunk length.

    Returns:
        A list of response chunks.
    """
    return [text[start_index : start_index + chunk_size] for start_index in range(0, len(text), chunk_size)]


def _determine_priority_level(incident_type: str, scenario: str, severity: str = "") -> str:
    """Infer incident priority from incident type, scenario, and staff severity.

    Args:
        incident_type: Sanitized incident description.
        scenario: Sanitized active scenario context.
        severity: Staff-selected incident severity.

    Returns:
        One of low, medium, high, or critical.
    """
    if severity in VALID_PRIORITY_LEVELS:
        return severity

    combined_signal = f"{incident_type} {scenario}".lower()
    if any(keyword in combined_signal for keyword in ("medical", "evacuation", "emergency")):
        return "critical"
    if any(keyword in combined_signal for keyword in ("overcrowding", "surge", "weather", "egress")):
        return "high"
    if any(keyword in combined_signal for keyword in ("delay", "vip", "queue")):
        return "medium"
    return "low"


def _infer_affected_zones(scenario: str) -> list[str]:
    """Infer affected stadium zones from scenario context.

    Args:
        scenario: Sanitized active scenario context.

    Returns:
        A list of operational zone names.
    """
    normalized_scenario = scenario.lower()
    if "entry" in normalized_scenario or "gate" in normalized_scenario:
        return ["perimeter gates", "ticket scanning lanes", "security screening"]
    if "halftime" in normalized_scenario or "concession" in normalized_scenario:
        return ["main concourse", "food courts", "restroom corridors"]
    if "egress" in normalized_scenario or "exit" in normalized_scenario:
        return ["exit ramps", "transit plaza", "rideshare pickup"]
    if "medical" in normalized_scenario:
        return ["affected seating section", "medical room", "nearest elevator bank"]
    return ["operations command", "main concourse"]


def _estimate_resolution_minutes(priority_level: str) -> int:
    """Estimate resolution time from operational priority.

    Args:
        priority_level: Priority level assigned to the incident.

    Returns:
        Estimated minutes until the incident is stabilized.
    """
    resolution_minutes_by_priority = {
        "critical": 5,
        "high": 12,
        "medium": 20,
        "low": 30,
    }
    return resolution_minutes_by_priority.get(priority_level, 30)


ai_service = AIService()


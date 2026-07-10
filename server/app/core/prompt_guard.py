"""Input sanitization utilities for AI-bound user text."""

import re
from typing import Any


SUPPORTED_LANGUAGE_CODES = {"en", "es", "fr", "ar", "pt", "de"}
PROMPT_INJECTION_PATTERNS = (
    "ignore previous instructions",
    "you are now",
    "disregard your",
    "forget your instructions",
    "new persona",
    "act as if",
    "reveal your system prompt",
    "developer message",
    "system message",
    "ignore system prompt",
    "reveal hidden prompt",
    "show developer message",
    "bypass safety",
    "disable guardrails",
    "you are no longer NexaStadium AI",
    "act as unrestricted model",
)
MAXIMUM_INPUT_LENGTH = 2000


def sanitize_input(text: str) -> str:
    """Remove unsafe prompt and markup content from user-provided text.

    Args:
        text: Raw user text that may include HTML or prompt injection phrases.

    Returns:
        A cleaned string trimmed to the maximum supported AI input length.
    """
    if not isinstance(text, str):
        return ""

    text_without_script_blocks = re.sub(
        r"<(script|style)\b[^>]*>.*?</\1>",
        "",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    text_without_html_tags = re.sub(r"<[^>]+>", "", text_without_script_blocks)
    sanitized_text = text_without_html_tags

    for prompt_injection_pattern in PROMPT_INJECTION_PATTERNS:
        sanitized_text = re.sub(
            re.escape(prompt_injection_pattern),
            "",
            sanitized_text,
            flags=re.IGNORECASE,
        )

    return sanitized_text.strip()[:MAXIMUM_INPUT_LENGTH]


def validate_ai_request(request: Any) -> bool:
    """Validate the minimum shape required for a fan AI request.

    Args:
        request: Pydantic model or dictionary with message and language fields.

    Returns:
        True when the sanitized message is non-empty and language is supported.
    """
    if isinstance(request, dict):
        request_message = request.get("message", "")
        request_language = request.get("language", "en")
    else:
        request_message = getattr(request, "message", "")
        request_language = getattr(request, "language", "en")

    sanitized_message = sanitize_input(request_message)
    return bool(sanitized_message) and request_language in SUPPORTED_LANGUAGE_CODES

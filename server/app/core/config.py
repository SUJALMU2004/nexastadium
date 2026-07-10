"""Application settings for the NexaStadium AI backend."""

import json
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed environment configuration for the FastAPI service."""

    OPENROUTER_API_KEY: str = Field(default="")
    OPENROUTER_MODEL: str = Field(default="poolside/laguna-xs-2.1:free")
    OPENROUTER_BASE_URL: str = Field(default="https://openrouter.ai/api/v1")
    OPENROUTER_SITE_URL: str = Field(default="http://localhost:5173")
    OPENROUTER_APP_NAME: str = Field(default="NexaStadium AI")
    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    ENVIRONMENT: str = Field(default="development")
    RATE_LIMIT_PER_MINUTE: int = Field(default=30)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, allowed_origins_value: Any) -> list[str]:
        """Parse CORS origins from JSON-like lists or comma-separated strings.

        Args:
            allowed_origins_value: Raw value loaded by pydantic-settings.

        Returns:
            A list of origin strings safe for FastAPI CORS middleware.
        """
        if isinstance(allowed_origins_value, list):
            return [str(origin).strip() for origin in allowed_origins_value if str(origin).strip()]

        if isinstance(allowed_origins_value, str):
            cleaned_origins_value = allowed_origins_value.strip()
            if not cleaned_origins_value:
                return []
            if cleaned_origins_value.startswith("["):
                parsed_origins = json.loads(cleaned_origins_value)
                return [str(origin).strip() for origin in parsed_origins if str(origin).strip()]
            return [
                origin.strip()
                for origin in cleaned_origins_value.split(",")
                if origin.strip()
            ]

        return []


settings = Settings()

"""Cached stadium data service for FIFA World Cup 2026 host venues."""

import json
from pathlib import Path
from typing import Any

from app.models.stadium import Stadium


class StadiumDataService:
    """Loads static stadium data once and serves typed stadium lookups."""

    def __init__(self, stadium_file_path: Path | None = None) -> None:
        """Load and index the FIFA World Cup 2026 stadium dataset.

        Args:
            stadium_file_path: Optional JSON path override used by tests.

        Returns:
            None.
        """
        self._stadium_file_path = stadium_file_path or Path(__file__).resolve().parents[1] / "data" / "stadiums.json"
        self._stadiums_by_id = self._load_stadiums_by_id()
        self._stadium_list = list(self._stadiums_by_id.values())

    def _load_stadiums_by_id(self) -> dict[str, Stadium]:
        """Load stadium records from JSON and validate them once.

        Args:
            None.

        Returns:
            A dictionary of validated stadium models keyed by stadium ID.
        """
        with self._stadium_file_path.open(encoding="utf-8") as stadium_file:
            stadium_records: list[dict[str, Any]] = json.load(stadium_file)

        return {
            stadium_record["id"]: Stadium.model_validate(stadium_record)
            for stadium_record in stadium_records
        }

    def list_stadiums(self) -> list[Stadium]:
        """Return all validated FIFA World Cup 2026 host stadiums.

        Args:
            None.

        Returns:
            A list of stadium models.
        """
        return self._stadium_list

    def get_stadium_by_id(self, stadium_id: str) -> Stadium:
        """Return a validated stadium model by stadium ID.

        Args:
            stadium_id: Stadium slug from the local host venue dataset.

        Returns:
            The requested stadium model.

        Raises:
            ValueError: If the stadium ID is not known.
        """
        if stadium_id not in self._stadiums_by_id:
            raise ValueError(f"Unknown stadium ID: {stadium_id}")

        return self._stadiums_by_id[stadium_id]


stadium_data_service = StadiumDataService()

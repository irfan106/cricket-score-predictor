from __future__ import annotations

import json
from pathlib import Path

from ..config import ROOT_DIR, get_settings
from ..constants import FORMAT_DEFINITIONS, SUPPORTED_FORMATS
from ..schemas import FormatDetail, FormatSummary


class MetadataService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._metadata: dict[str, dict[str, list[str]]] = {}

    def _candidate_paths(self) -> list[Path]:
        primary = self.settings.metadata_path
        return [primary, ROOT_DIR / "metadata.json", self.settings.model_dir / "metadata.json"]

    def load(self) -> None:
        data: dict[str, dict[str, list[str]]] = {}
        for path in self._candidate_paths():
            if not path.exists():
                continue
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            break
        if "teams" in data and "IPL" not in data:
            data = {"IPL": {"teams": data.get("teams", []), "cities": data.get("cities", [])}}
        self._metadata = {key: value for key, value in data.items() if key in SUPPORTED_FORMATS and isinstance(value, dict)}

    @property
    def metadata(self) -> dict[str, dict[str, list[str]]]:
        if not self._metadata:
            self.load()
        return self._metadata

    def build_summary(self, format_code: str, has_model: bool) -> FormatSummary:
        details = FORMAT_DEFINITIONS[format_code]
        format_meta = self.metadata.get(format_code, {})
        return FormatSummary(
            code=format_code,
            label=details["label"],
            description=details["description"],
            max_overs=details["max_overs"],
            r2=details["r2"],
            mae=details["mae"],
            has_model=has_model,
            team_count=len(format_meta.get("teams", [])),
            city_count=len(format_meta.get("cities", [])),
        )

    def list_formats(self, has_model_lookup: dict[str, bool]) -> list[FormatSummary]:
        return [self.build_summary(code, has_model_lookup.get(code, False)) for code in SUPPORTED_FORMATS]

    def get_format_detail(self, format_code: str, has_model: bool) -> FormatDetail:
        summary = self.build_summary(format_code, has_model)
        format_meta = self.metadata.get(format_code, {})
        return FormatDetail(
            **summary.model_dump(),
            teams=sorted(format_meta.get("teams", [])),
            cities=sorted(format_meta.get("cities", [])),
        )


metadata_service = MetadataService()

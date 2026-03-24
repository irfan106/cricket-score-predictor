from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any

from ..config import ROOT_DIR, get_settings
from ..constants import FORMAT_DEFINITIONS, SUPPORTED_FORMATS


class ModelRegistry:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._cache: dict[str, Any] = {}

    def _candidate_paths(self, format_code: str) -> list[Path]:
        filename = FORMAT_DEFINITIONS[format_code]["model_filename"]
        return [
            self.settings.model_dir / filename,
            ROOT_DIR / filename,
        ]

    def get_model_path(self, format_code: str) -> Path | None:
        for path in self._candidate_paths(format_code):
            if path.exists():
                return path
        return None

    def has_model(self, format_code: str) -> bool:
        return self.get_model_path(format_code) is not None

    def available_models(self) -> dict[str, bool]:
        return {code: self.has_model(code) for code in SUPPORTED_FORMATS}

    def get_model(self, format_code: str) -> Any:
        if format_code in self._cache:
            return self._cache[format_code]

        model_path = self.get_model_path(format_code)
        if model_path is None:
            raise FileNotFoundError(f"Model for format '{format_code}' was not found.")

        with model_path.open("rb") as handle:
            model = pickle.load(handle)

        self._prepare_for_inference(model)
        self._cache[format_code] = model
        return model

    @staticmethod
    def _prepare_for_inference(model: Any) -> None:
        # API prediction latency is fine with one worker, and this avoids
        # thread-pool/process-permission issues in restricted environments.
        if hasattr(model, "named_steps"):
            final_estimator = model.named_steps.get("model")
            if final_estimator is not None and hasattr(final_estimator, "n_jobs"):
                final_estimator.n_jobs = 1
        elif hasattr(model, "n_jobs"):
            model.n_jobs = 1


model_registry = ModelRegistry()

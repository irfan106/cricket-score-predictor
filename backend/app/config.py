from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Settings:
    model_dir: Path
    metadata_path: Path
    database_url: str
    frontend_dist: Path
    frontend_assets_dir: Path
    session_cookie_name: str
    session_cookie_secure: bool
    allowed_origins: tuple[str, ...]


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def get_settings() -> Settings:
    raw_origins = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000",
    )
    frontend_dist = Path(os.getenv("FRONTEND_DIST", ROOT_DIR / "frontend" / "dist")).resolve()
    return Settings(
        model_dir=Path(os.getenv("MODEL_DIR", ROOT_DIR / "models")).resolve(),
        metadata_path=Path(os.getenv("METADATA_PATH", ROOT_DIR / "metadata.json")).resolve(),
        database_url=os.getenv("DATABASE_URL", f"sqlite:///{(ROOT_DIR / 'cricket_predictor.db').as_posix()}"),
        frontend_dist=frontend_dist,
        frontend_assets_dir=frontend_dist / "assets",
        session_cookie_name=os.getenv("SESSION_COOKIE_NAME", "cricket_predictor_session"),
        session_cookie_secure=_as_bool(os.getenv("SESSION_COOKIE_SECURE"), default=False),
        allowed_origins=tuple(origin.strip() for origin in raw_origins.split(",") if origin.strip()),
    )

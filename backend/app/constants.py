from __future__ import annotations

from typing import Any

FORMAT_DEFINITIONS: dict[str, dict[str, Any]] = {
    "IPL": {
        "label": "T20 (IPL)",
        "max_overs": 20,
        "model_filename": "pipe_ipl.pkl",
        "r2": 0.9097916119684353,
        "mae": 4.774861511859812,
        "description": "Indian Premier League first-innings projection.",
    },
    "ODI": {
        "label": "ODI (50 overs)",
        "max_overs": 50,
        "model_filename": "pipe_odi.pkl",
        "r2": 0.9667431714885439,
        "mae": 4.028722646666731,
        "description": "One Day International first-innings projection.",
    },
    "T20": {
        "label": "T20 International",
        "max_overs": 20,
        "model_filename": "pipe_t20.pkl",
        "r2": 0.9389115562270136,
        "mae": 5.04910291383341,
        "description": "T20 international first-innings projection.",
    },
    "Test": {
        "label": "Test (per day approx)",
        "max_overs": 90,
        "model_filename": "pipe_test.pkl",
        "r2": 0.9894981821634508,
        "mae": 2.9599330737994,
        "description": "Test match first-innings projection using day-length approximation.",
    },
}

FEATURE_COLUMNS = [
    "batting_team",
    "bowling_team",
    "city",
    "current_score",
    "balls_left",
    "wickets_left",
    "crr",
    "last_five",
]

SUPPORTED_FORMATS = tuple(FORMAT_DEFINITIONS.keys())

DEFAULT_HISTORY_LIMIT = 50
MAX_HISTORY_LIMIT = 200

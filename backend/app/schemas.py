from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .constants import DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT, SUPPORTED_FORMATS


class HealthResponse(BaseModel):
    status: str
    formats: list[str]
    frontend_built: bool


class FormatSummary(BaseModel):
    code: str
    label: str
    description: str
    max_overs: int
    r2: float
    mae: float
    has_model: bool
    team_count: int
    city_count: int


class FormatDetail(FormatSummary):
    teams: list[str]
    cities: list[str]


class PredictionRequest(BaseModel):
    format: str = Field(..., description="One of IPL, ODI, T20, Test")
    batting_team: str
    bowling_team: str
    city: str
    current_score: int = Field(..., ge=0)
    overs_completed: int = Field(..., ge=0)
    balls_this_over: int = Field(..., ge=0, le=5)
    wickets_out: int = Field(..., ge=0, le=10)
    last_five: int = Field(..., ge=0)

    @field_validator("format")
    @classmethod
    def validate_format(cls, value: str) -> str:
        if value not in SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format '{value}'")
        return value


class DerivedFeatures(BaseModel):
    balls_bowled: int
    balls_left: int
    wickets_left: int
    crr: float


class PredictionResponse(BaseModel):
    prediction_id: int
    format: str
    predicted_total: int
    predicted_low: int
    predicted_high: int
    derived: DerivedFeatures
    created_at: datetime


class PredictionHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    prediction_id: int
    format: str
    batting_team: str
    bowling_team: str
    city: str
    current_score: int
    overs_completed: int
    balls_this_over: int
    wickets_out: int
    last_five: int
    predicted_total: int
    predicted_low: int
    predicted_high: int
    balls_bowled: int
    balls_left: int
    wickets_left: int
    crr: float
    created_at: datetime


class PredictionListResponse(BaseModel):
    items: list[PredictionHistoryItem]


class PredictionQueryParams(BaseModel):
    format: str | None = None
    limit: int = DEFAULT_HISTORY_LIMIT

    @field_validator("format")
    @classmethod
    def validate_optional_format(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        if value not in SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format '{value}'")
        return value

    @field_validator("limit")
    @classmethod
    def validate_limit(cls, value: int) -> int:
        if value < 1:
            return 1
        return min(value, MAX_HISTORY_LIMIT)

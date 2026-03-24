from __future__ import annotations

from dataclasses import dataclass
from math import floor

import pandas as pd
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..constants import DEFAULT_HISTORY_LIMIT, FEATURE_COLUMNS, FORMAT_DEFINITIONS
from ..db.models import PredictionRecord
from ..schemas import PredictionHistoryItem, PredictionQueryParams, PredictionRequest, PredictionResponse
from .metadata import metadata_service
from .model_registry import model_registry


class PredictionValidationError(ValueError):
    pass


@dataclass(frozen=True)
class DerivedPredictionState:
    balls_bowled: int
    balls_left: int
    wickets_left: int
    crr: float


def derive_match_state(payload: PredictionRequest) -> DerivedPredictionState:
    config = FORMAT_DEFINITIONS[payload.format]
    total_balls = config["max_overs"] * 6
    balls_bowled = payload.overs_completed * 6 + payload.balls_this_over

    if payload.batting_team == payload.bowling_team:
        raise PredictionValidationError("Batting and bowling teams must be different.")
    if payload.last_five > payload.current_score:
        raise PredictionValidationError("Runs in last 5 overs cannot exceed current score.")
    if balls_bowled <= 0:
        raise PredictionValidationError("At least one ball must be bowled before predicting.")
    if balls_bowled >= total_balls:
        raise PredictionValidationError("Prediction is only available before the innings is complete.")
    if payload.wickets_out >= 10:
        raise PredictionValidationError("Prediction is only available while wickets remain.")

    balls_left = total_balls - balls_bowled
    wickets_left = 10 - payload.wickets_out
    crr = round(payload.current_score / (balls_bowled / 6), 4)

    return DerivedPredictionState(
        balls_bowled=balls_bowled,
        balls_left=balls_left,
        wickets_left=wickets_left,
        crr=crr,
    )


def validate_against_metadata(payload: PredictionRequest) -> None:
    format_detail = metadata_service.get_format_detail(payload.format, has_model=model_registry.has_model(payload.format))
    if payload.batting_team not in format_detail.teams:
        raise PredictionValidationError(f"'{payload.batting_team}' is not available for {payload.format}.")
    if payload.bowling_team not in format_detail.teams:
        raise PredictionValidationError(f"'{payload.bowling_team}' is not available for {payload.format}.")
    if payload.city not in format_detail.cities:
        raise PredictionValidationError(f"'{payload.city}' is not available for {payload.format}.")


def build_feature_frame(payload: PredictionRequest, derived: DerivedPredictionState) -> pd.DataFrame:
    values = {
        "batting_team": payload.batting_team,
        "bowling_team": payload.bowling_team,
        "city": payload.city,
        "current_score": payload.current_score,
        "balls_left": derived.balls_left,
        "wickets_left": derived.wickets_left,
        "crr": derived.crr,
        "last_five": payload.last_five,
    }
    return pd.DataFrame([{column: values[column] for column in FEATURE_COLUMNS}])


def save_prediction(
    db: Session,
    session_id: str,
    payload: PredictionRequest,
    derived: DerivedPredictionState,
    predicted_total: int,
    predicted_low: int,
    predicted_high: int,
) -> PredictionRecord:
    record = PredictionRecord(
        session_id=session_id,
        format=payload.format,
        batting_team=payload.batting_team,
        bowling_team=payload.bowling_team,
        city=payload.city,
        current_score=payload.current_score,
        overs_completed=payload.overs_completed,
        balls_this_over=payload.balls_this_over,
        wickets_out=payload.wickets_out,
        last_five=payload.last_five,
        balls_bowled=derived.balls_bowled,
        balls_left=derived.balls_left,
        wickets_left=derived.wickets_left,
        crr=derived.crr,
        predicted_total=predicted_total,
        predicted_low=predicted_low,
        predicted_high=predicted_high,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def create_prediction(db: Session, session_id: str, payload: PredictionRequest) -> PredictionResponse:
    validate_against_metadata(payload)
    derived = derive_match_state(payload)
    model = model_registry.get_model(payload.format)
    frame = build_feature_frame(payload, derived)
    predicted_total = int(round(float(model.predict(frame)[0])))
    mae = FORMAT_DEFINITIONS[payload.format]["mae"]
    band = max(1, int(floor(mae)))
    predicted_low = max(payload.current_score, predicted_total - band)
    predicted_high = max(predicted_total, predicted_total + band)
    record = save_prediction(db, session_id, payload, derived, predicted_total, predicted_low, predicted_high)
    return PredictionResponse(
        prediction_id=record.id,
        format=record.format,
        predicted_total=record.predicted_total,
        predicted_low=record.predicted_low,
        predicted_high=record.predicted_high,
        derived=derived.__dict__,
        created_at=record.created_at,
    )


def list_predictions(db: Session, session_id: str, params: PredictionQueryParams) -> list[PredictionHistoryItem]:
    stmt = select(PredictionRecord).where(PredictionRecord.session_id == session_id)
    if params.format:
        stmt = stmt.where(PredictionRecord.format == params.format)
    stmt = stmt.order_by(PredictionRecord.created_at.desc(), PredictionRecord.id.desc()).limit(params.limit or DEFAULT_HISTORY_LIMIT)
    records = db.scalars(stmt).all()
    return [
        PredictionHistoryItem(
            prediction_id=record.id,
            format=record.format,
            batting_team=record.batting_team,
            bowling_team=record.bowling_team,
            city=record.city,
            current_score=record.current_score,
            overs_completed=record.overs_completed,
            balls_this_over=record.balls_this_over,
            wickets_out=record.wickets_out,
            last_five=record.last_five,
            predicted_total=record.predicted_total,
            predicted_low=record.predicted_low,
            predicted_high=record.predicted_high,
            balls_bowled=record.balls_bowled,
            balls_left=record.balls_left,
            wickets_left=record.wickets_left,
            crr=record.crr,
            created_at=record.created_at,
        )
        for record in records
    ]


def clear_predictions(db: Session, session_id: str) -> int:
    result = db.execute(delete(PredictionRecord).where(PredictionRecord.session_id == session_id))
    db.commit()
    return int(result.rowcount or 0)

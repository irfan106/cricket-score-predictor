from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ..constants import SUPPORTED_FORMATS
from ..db.database import get_db_session
from ..schemas import (
    HealthResponse,
    FormatDetail,
    FormatSummary,
    PredictionListResponse,
    PredictionQueryParams,
    PredictionRequest,
    PredictionResponse,
)
from ..services.metadata import metadata_service
from ..services.model_registry import model_registry
from ..services.prediction import (
    PredictionValidationError,
    clear_predictions,
    create_prediction,
    list_predictions,
)
from ..services.session import get_session_id


router = APIRouter(prefix="/api/v1", tags=["cricket"])


@router.get("/health", response_model=HealthResponse)
def health(request: Request) -> HealthResponse:
    return HealthResponse(
        status="ok",
        formats=list(SUPPORTED_FORMATS),
        frontend_built=request.app.state.settings.frontend_dist.exists(),
    )


@router.get("/formats", response_model=list[FormatSummary])
def list_formats() -> list[FormatSummary]:
    return metadata_service.list_formats(model_registry.available_models())


@router.get("/formats/{format_code}", response_model=FormatDetail)
def get_format_detail(format_code: str) -> FormatDetail:
    if format_code not in SUPPORTED_FORMATS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Format not found.")
    return metadata_service.get_format_detail(format_code, model_registry.has_model(format_code))


@router.post("/predictions", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def post_prediction(
    payload: PredictionRequest,
    request: Request,
    db: Session = Depends(get_db_session),
) -> PredictionResponse:
    try:
        return create_prediction(db, get_session_id(request), payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except PredictionValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get("/predictions", response_model=PredictionListResponse)
def get_predictions(
    request: Request,
    format: str | None = Query(default=None),
    limit: int = Query(default=50),
    db: Session = Depends(get_db_session),
) -> PredictionListResponse:
    try:
        params = PredictionQueryParams(format=format, limit=limit)
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    items = list_predictions(db, get_session_id(request), params)
    return PredictionListResponse(items=items)


@router.delete("/predictions")
def delete_predictions(request: Request, db: Session = Depends(get_db_session)) -> dict[str, int]:
    deleted = clear_predictions(db, get_session_id(request))
    return {"deleted": deleted}

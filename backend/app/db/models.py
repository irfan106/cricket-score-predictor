from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    format: Mapped[str] = mapped_column(String(16), index=True)
    batting_team: Mapped[str] = mapped_column(String(128))
    bowling_team: Mapped[str] = mapped_column(String(128))
    city: Mapped[str] = mapped_column(String(128))
    current_score: Mapped[int] = mapped_column(Integer)
    overs_completed: Mapped[int] = mapped_column(Integer)
    balls_this_over: Mapped[int] = mapped_column(Integer)
    wickets_out: Mapped[int] = mapped_column(Integer)
    last_five: Mapped[int] = mapped_column(Integer)
    balls_bowled: Mapped[int] = mapped_column(Integer)
    balls_left: Mapped[int] = mapped_column(Integer)
    wickets_left: Mapped[int] = mapped_column(Integer)
    crr: Mapped[float] = mapped_column(Float)
    predicted_total: Mapped[int] = mapped_column(Integer)
    predicted_low: Mapped[int] = mapped_column(Integer)
    predicted_high: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

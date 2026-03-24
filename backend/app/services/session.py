from __future__ import annotations

from uuid import uuid4

from fastapi import Request


def ensure_session_id(request: Request) -> tuple[str, bool]:
    existing = request.cookies.get(request.app.state.settings.session_cookie_name)
    if existing:
        return existing, False
    return uuid4().hex, True


def get_session_id(request: Request) -> str:
    return request.state.session_id

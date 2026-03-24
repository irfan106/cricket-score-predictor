from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi import HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .api.routes import router
from .config import get_settings
from .db.database import Base, engine
from .services.metadata import metadata_service
from .services.session import ensure_session_id


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    metadata_service.load()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    Base.metadata.create_all(bind=engine)
    metadata_service.load()
    app = FastAPI(
        title="Cricket Score Predictor API",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.state.settings = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.allowed_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def session_cookie_middleware(request: Request, call_next):
        session_id, needs_cookie = ensure_session_id(request)
        request.state.session_id = session_id
        response = await call_next(request)
        if needs_cookie:
            response.set_cookie(
                key=settings.session_cookie_name,
                value=session_id,
                httponly=True,
                samesite="lax",
                secure=settings.session_cookie_secure,
                max_age=60 * 60 * 24 * 365,
            )
        return response

    app.include_router(router)

    if settings.frontend_assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=settings.frontend_assets_dir), name="frontend-assets")

    index_file = settings.frontend_dist / "index.html"

    @app.get("/", include_in_schema=False)
    async def serve_root():
        if index_file.exists():
            return FileResponse(index_file)
        return {"message": "Frontend build not found. Run `npm run build` inside frontend/."}

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        candidate = settings.frontend_dist / full_path
        if candidate.exists() and candidate.is_file():
            return FileResponse(candidate)
        if index_file.exists():
            return FileResponse(index_file)
        return {"message": "Frontend build not found. Run `npm run build` inside frontend/."}

    return app


app = create_app()

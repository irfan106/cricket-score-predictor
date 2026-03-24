FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY frontend ./frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY README.md ./README.md
COPY models ./models
COPY metadata.json ./models/metadata.json

RUN mkdir -p /app/models /app/runtime

ENV MODEL_DIR=/app/models
ENV METADATA_PATH=/app/models/metadata.json
ENV DATABASE_URL=sqlite:////app/runtime/cricket_predictor.db
ENV FRONTEND_DIST=/app/frontend/dist

EXPOSE 8000
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

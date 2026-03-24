# Deployment Guide

This project is easiest to deploy as a single web service:

- FastAPI serves the API
- FastAPI also serves the built React frontend
- model artifacts live in `models/`

## 1. Prepare deployable model artifacts

Do not deploy the root-level `pipe_*.pkl` files as-is. They are multi-GB artifacts and are not practical for normal app hosting.

Generate smaller deployable models:

```bash
python optimize_models.py --persist
```

That writes accepted models into `models/`.

For a faster demo-oriented build on a local machine, use:

```bash
python optimize_models.py --persist --best-effort --sample-rows 100000 --tree-scale 0.25
```

This produces much smaller artifacts faster, but the accuracy is lower than the original large models.

You should end up with:

- `models/pipe_ipl.pkl`
- `models/pipe_odi.pkl`
- `models/pipe_t20.pkl`
- `models/pipe_test.pkl`

Then place metadata beside them:

```bash
copy metadata.json models\metadata.json
```

On macOS/Linux:

```bash
cp metadata.json models/metadata.json
```

If you only want to deploy one format while testing, run:

```bash
python optimize_models.py --format IPL --persist
```

Repeat for the formats you want.

## 2. Local pre-deploy check

Backend tests:

```bash
.venv\Scripts\python.exe -m pytest backend\tests\test_prediction_logic.py
```

Frontend build:

```bash
cd frontend
npm run build
```

## 3. Deploy with Docker locally

```bash
docker compose up --build
```

Then open `http://localhost:8000`.

## 4. Deploy to Render

This repo now includes `render.yaml` for a single Docker web service.

Steps:

1. Push this repository to GitHub.
2. In Render, create a new Blueprint instance from the repo.
3. Keep the generated web service settings from `render.yaml`.
4. For a free deploy, keep the service on the `free` plan.
5. Deploy.

Notes:

- Free Render web services use an ephemeral filesystem. The SQLite history database will reset whenever the service redeploys, restarts, or spins down.
- The app health check is `/api/v1/health`.
- The container reads the platform `PORT` variable automatically.

## 5. Required environment values

These are already defined in `render.yaml` and `docker-compose.yml`:

- `MODEL_DIR=/app/models`
- `METADATA_PATH=/app/models/metadata.json`
- `DATABASE_URL=sqlite:////app/runtime/cricket_predictor.db`
- `FRONTEND_DIST=/app/frontend/dist`

## 6. Important limitation

If `models/` is empty, the site can load but predictions will return `503` because no model files are available.

Check the API after deploy:

- `GET /api/v1/health`
- `GET /api/v1/formats`

Each format should report `has_model: true` once the optimized artifacts are present.

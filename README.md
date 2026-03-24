# Cricket Score Predictor

Cricket Score Predictor is now a full-stack application:

- `frontend/`: React + TypeScript + Vite SPA
- `backend/`: FastAPI inference API with anonymous session history
- `models/`: production model artifacts and metadata

The existing notebooks remain the offline data generation and training workflow.

## Product

- Predict first-innings totals for `IPL`, `ODI`, `T20`, and `Test`
- Use format-specific teams, cities, innings lengths, and model metrics
- Store prediction history per anonymous browser session
- Serve the built frontend from FastAPI in production

## Local development

### 1. Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Frontend dependencies

```bash
cd frontend
npm install
```

### 3. Start the backend

```bash
uvicorn backend.app.main:app --reload
```

### 4. Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API requests to `http://127.0.0.1:8000`.

## Required artifacts

Local development currently supports model files from the repository root:

- `pipe_ipl.pkl`
- `pipe_odi.pkl`
- `pipe_t20.pkl`
- `pipe_test.pkl`
- `metadata.json`

Production deployment should place optimized artifacts inside `models/`.

## Offline training flow

1. Run `data-extraction.ipynb`
2. Run `feature-extraction.ipynb`
3. Optional: run `python optimize_models.py --persist` to benchmark lighter deployable models

## Docker

Build and run:

```bash
docker compose up --build
```

Mount optimized model artifacts into `./models` before using Docker in production.

## Deployment

Use a single-service deployment where FastAPI serves both the API and the built React app.

- Prepare deployable artifacts with `python optimize_models.py --persist`
- Copy `metadata.json` to `models/metadata.json`
- Deploy with Docker or the included Render Blueprint in `render.yaml`

See `DEPLOYMENT.md` for the exact steps.

## Environment variables

See `.env.example`.

Important defaults:

- `MODEL_DIR=./models`
- `METADATA_PATH=./metadata.json`
- `DATABASE_URL=sqlite:///./cricket_predictor.db`
- `FRONTEND_DIST=./frontend/dist`

## Dataset

https://www.kaggle.com/veeralakrishna/cricsheet-a-retrosheet-for-cricket?select=t20s

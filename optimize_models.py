from __future__ import annotations

import argparse
import os
import pickle
import tempfile
import time
from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from tqdm import tqdm


ROOT_DIR = Path(__file__).resolve().parent
MODELS_DIR = ROOT_DIR / "models"

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

BASELINES = {
    "IPL": {"features": "ipl_features.pkl", "model_out": "pipe_ipl.pkl", "r2": 0.9097916119684353, "mae": 4.774861511859812},
    "ODI": {"features": "odi_features.pkl", "model_out": "pipe_odi.pkl", "r2": 0.9667431714885439, "mae": 4.028722646666731},
    "T20": {"features": "t20_features.pkl", "model_out": "pipe_t20.pkl", "r2": 0.9389115562270136, "mae": 5.04910291383341},
    "Test": {"features": "test_features.pkl", "model_out": "pipe_test.pkl", "r2": 0.9894981821634508, "mae": 2.9599330737994},
}

MAX_MODEL_SIZE_MB = 300
MAX_R2_DROP = 0.02
MAX_MAE_INCREASE = 1.2
OPTIMIZER_N_JOBS = int(os.getenv("OPTIMIZER_N_JOBS", "1"))
DEFAULT_TREE_SCALE = float(os.getenv("OPTIMIZER_TREE_SCALE", "1.0"))


def make_encoder():
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=True)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=True)


def build_candidates(tree_scale: float = DEFAULT_TREE_SCALE):
    rf_trees = max(20, int(round(80 * tree_scale)))
    extra_trees = max(30, int(round(120 * tree_scale)))
    return [
        (
            "rf_compact",
            RandomForestRegressor(
                n_estimators=rf_trees,
                max_depth=18,
                min_samples_leaf=2,
                random_state=1,
                n_jobs=OPTIMIZER_N_JOBS,
                warm_start=True,
            ),
        ),
        (
            "extra_trees_compact",
            ExtraTreesRegressor(
                n_estimators=extra_trees,
                max_depth=18,
                min_samples_leaf=2,
                random_state=1,
                n_jobs=OPTIMIZER_N_JOBS,
                warm_start=True,
            ),
        ),
    ]


def pipeline_for_model(model):
    preprocess = ColumnTransformer(
        transformers=[("cat", make_encoder(), ["batting_team", "bowling_team", "city"])],
        remainder="passthrough",
    )
    return Pipeline(
        steps=[
            ("preprocess", preprocess),
            ("model", model),
        ]
    )


def serialized_size_mb(pipe: Pipeline) -> float:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pkl") as handle:
        temp_path = Path(handle.name)
    try:
        with temp_path.open("wb") as handle:
            pickle.dump(pipe, handle)
        return temp_path.stat().st_size / (1024 * 1024)
    finally:
        temp_path.unlink(missing_ok=True)


def format_duration(seconds: float | None) -> str:
    if seconds is None:
        return "--:--"
    total_seconds = max(0, int(seconds))
    minutes, secs = divmod(total_seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours:d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def log_progress(
    format_name: str,
    percent: int,
    message: str,
    *,
    start_time: float | None = None,
    eta_seconds: float | None = None,
) -> None:
    elapsed = format_duration(time.perf_counter() - start_time) if start_time is not None else "--:--"
    eta = format_duration(eta_seconds)
    print(f"[{format_name}] [{percent:>3}%] [elapsed {elapsed} | eta {eta}] {message}")


def fit_pipeline_with_progress(
    pipe: Pipeline,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    format_name: str,
    candidate_name: str,
    start_time: float,
):
    preprocess = pipe.named_steps["preprocess"]
    model = pipe.named_steps["model"]

    log_progress(format_name, 25, f"{candidate_name}: fitting categorical encoder", start_time=start_time)
    X_train_transformed = preprocess.fit_transform(X_train)

    total_trees = model.n_estimators
    chunk_size = max(5, total_trees // 20)
    model.set_params(n_estimators=0)

    log_progress(format_name, 35, f"{candidate_name}: training {total_trees} trees", start_time=start_time)
    with tqdm(
        total=total_trees,
        desc=f"[{format_name}] {candidate_name}",
        unit="tree",
        leave=True,
    ) as progress:
        built_trees = 0
        while built_trees < total_trees:
            next_trees = min(total_trees, built_trees + chunk_size)
            model.set_params(n_estimators=next_trees)
            model.fit(X_train_transformed, y_train)
            progress.update(next_trees - built_trees)
            built_trees = next_trees

    return X_train_transformed


def optimize_format(
    format_name: str,
    persist: bool,
    *,
    best_effort: bool = False,
    sample_rows: int | None = None,
    tree_scale: float = DEFAULT_TREE_SCALE,
) -> None:
    cfg = BASELINES[format_name]
    features_path = ROOT_DIR / cfg["features"]
    format_start_time = time.perf_counter()
    if not features_path.exists():
        print(f"[{format_name}] Missing features file: {features_path}")
        return

    log_progress(format_name, 0, f"loading features from {features_path.name}", start_time=format_start_time)
    df = pickle.load(features_path.open("rb"))
    log_progress(format_name, 10, f"loaded {len(df):,} rows", start_time=format_start_time)

    if sample_rows is not None and len(df) > sample_rows:
        df = df.sample(n=sample_rows, random_state=1).reset_index(drop=True)
        log_progress(format_name, 12, f"sampled down to {len(df):,} rows", start_time=format_start_time)

    X = df[FEATURE_COLUMNS]
    y = df["innings_total"]
    log_progress(format_name, 15, "splitting train/test data", start_time=format_start_time)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=1)

    MODELS_DIR.mkdir(exist_ok=True)
    best_candidate: tuple[str, Pipeline, float, float, float] | None = None
    best_size_candidate: tuple[str, Pipeline, float, float, float] | None = None
    candidates = build_candidates(tree_scale=tree_scale)
    candidate_durations: list[float] = []

    for index, (candidate_name, estimator) in enumerate(candidates, start=1):
        remaining_candidates = len(candidates) - index + 1
        average_candidate_seconds = (
            sum(candidate_durations) / len(candidate_durations) if candidate_durations else None
        )
        candidate_eta = (
            average_candidate_seconds * remaining_candidates if average_candidate_seconds is not None else None
        )
        log_progress(
            format_name,
            20,
            f"candidate {index}/{len(candidates)}: {candidate_name}",
            start_time=format_start_time,
            eta_seconds=candidate_eta,
        )
        pipe = pipeline_for_model(estimator)
        preprocess = pipe.named_steps["preprocess"]
        model = pipe.named_steps["model"]
        candidate_start_time = time.perf_counter()

        fit_pipeline_with_progress(pipe, X_train, y_train, format_name, candidate_name, format_start_time)

        log_progress(format_name, 85, f"{candidate_name}: transforming test set", start_time=format_start_time)
        X_test_transformed = preprocess.transform(X_test)
        log_progress(format_name, 90, f"{candidate_name}: scoring candidate", start_time=format_start_time)
        predictions = model.predict(X_test_transformed)
        r2 = r2_score(y_test, predictions)
        mae = mean_absolute_error(y_test, predictions)
        log_progress(format_name, 95, f"{candidate_name}: measuring serialized model size", start_time=format_start_time)
        size_mb = serialized_size_mb(pipe)
        candidate_duration = time.perf_counter() - candidate_start_time
        candidate_durations.append(candidate_duration)
        print(
            f"[{format_name}] {candidate_name}: "
            f"r2={r2:.4f} mae={mae:.4f} size={size_mb:.1f}MB "
            f"(candidate time {format_duration(candidate_duration)})"
        )

        if size_mb <= MAX_MODEL_SIZE_MB and (
            best_size_candidate is None or (mae, -r2, size_mb) < (best_size_candidate[4], -best_size_candidate[3], best_size_candidate[2])
        ):
            best_size_candidate = (candidate_name, pipe, size_mb, r2, mae)

        if r2 < cfg["r2"] - MAX_R2_DROP:
            log_progress(format_name, 97, f"{candidate_name}: rejected on R2 threshold", start_time=format_start_time)
            continue
        if mae > cfg["mae"] * MAX_MAE_INCREASE:
            log_progress(format_name, 97, f"{candidate_name}: rejected on MAE threshold", start_time=format_start_time)
            continue
        if size_mb > MAX_MODEL_SIZE_MB:
            log_progress(format_name, 97, f"{candidate_name}: rejected on model size threshold", start_time=format_start_time)
            continue

        if best_candidate is None or (mae, -r2, size_mb) < (best_candidate[4], -best_candidate[3], best_candidate[2]):
            best_candidate = (candidate_name, pipe, size_mb, r2, mae)
            remaining_candidates = len(candidates) - index
            average_candidate_seconds = sum(candidate_durations) / len(candidate_durations)
            candidate_eta = average_candidate_seconds * remaining_candidates if remaining_candidates else 0
            log_progress(
                format_name,
                98,
                f"{candidate_name}: current best accepted candidate",
                start_time=format_start_time,
                eta_seconds=candidate_eta,
            )

    if best_candidate is None:
        if best_effort and best_size_candidate is not None:
            name, pipe, size_mb, r2, mae = best_size_candidate
            log_progress(
                format_name,
                100,
                f"best-effort fallback: {name} (r2={r2:.4f}, mae={mae:.4f}, size={size_mb:.1f}MB)",
                start_time=format_start_time,
                eta_seconds=0,
            )
            if persist:
                output_path = MODELS_DIR / cfg["model_out"]
                with output_path.open("wb") as handle:
                    pickle.dump(pipe, handle)
                print(f"[{format_name}] Saved best-effort model to {output_path}")
            return
        log_progress(format_name, 100, "no candidate met the optimization thresholds", start_time=format_start_time, eta_seconds=0)
        return

    name, pipe, size_mb, r2, mae = best_candidate
    log_progress(
        format_name,
        100,
        f"best candidate: {name} (r2={r2:.4f}, mae={mae:.4f}, size={size_mb:.1f}MB)",
        start_time=format_start_time,
        eta_seconds=0,
    )

    if persist:
        output_path = MODELS_DIR / cfg["model_out"]
        with output_path.open("wb") as handle:
            pickle.dump(pipe, handle)
        print(f"[{format_name}] Saved optimized model to {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train and benchmark lighter sklearn models for deployment.")
    parser.add_argument("--format", choices=list(BASELINES.keys()), help="Optimize a single format only.")
    parser.add_argument("--persist", action="store_true", help="Persist accepted candidates to ./models.")
    parser.add_argument(
        "--best-effort",
        action="store_true",
        help="Persist the best size-compliant candidate even if it misses the baseline quality thresholds.",
    )
    parser.add_argument(
        "--sample-rows",
        type=int,
        help="Randomly sample up to this many rows from the feature dataset before training.",
    )
    parser.add_argument(
        "--tree-scale",
        type=float,
        default=DEFAULT_TREE_SCALE,
        help="Scale the candidate tree counts to trade off speed vs quality.",
    )
    args = parser.parse_args()

    formats = [args.format] if args.format else list(BASELINES.keys())
    for format_name in formats:
        optimize_format(
            format_name,
            persist=args.persist,
            best_effort=args.best_effort,
            sample_rows=args.sample_rows,
            tree_scale=args.tree_scale,
        )


if __name__ == "__main__":
    main()

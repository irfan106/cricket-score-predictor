from __future__ import annotations

import json
import pickle
from pathlib import Path
from typing import List

import numpy as np
import pandas as pd
from tqdm import tqdm
from yaml import safe_load

from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor


PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
METADATA_PATH = PROJECT_ROOT / "metadata.json"


def _load_yaml_matches(
    data_dir: Path,
    match_type: str | None = None,
    overs: int | None = None,
    competition: str | None = None,
) -> pd.DataFrame:
    """Load all YAML match files from a directory into a flattened DataFrame."""
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory not found at {data_dir}")

    yaml_paths: List[Path] = sorted(data_dir.rglob("*.yaml"))
    if not yaml_paths:
        raise FileNotFoundError(f"No .yaml files found under {DATA_DIR}")

    rows: List[pd.DataFrame] = []
    for path in tqdm(yaml_paths, desc="Loading YAML matches"):
        with path.open("r", encoding="utf-8") as f:
            data = safe_load(f)
        rows.append(pd.json_normalize(data))

    matches = pd.concat(rows, ignore_index=True)

    # Apply optional filters based on configuration.
    if match_type and "info.match_type" in matches.columns:
        matches = matches[matches["info.match_type"] == match_type]
    if overs and "info.overs" in matches.columns:
        matches = matches[matches["info.overs"] == overs]
    if competition and "info.competition" in matches.columns:
        matches = matches[matches["info.competition"] == competition]

    matches.reset_index(drop=True, inplace=True)
    if matches.empty:
        raise ValueError("No matches left after basic filtering. Check data format/filters.")

    return matches


def _build_delivery_frame(matches: pd.DataFrame) -> pd.DataFrame:
    """Construct ball-by-ball delivery DataFrame for first innings, like in the notebook."""
    records = []
    match_counter = 1

    for _, row in tqdm(matches.iterrows(), total=len(matches), desc="Building deliveries"):
        innings = row.get("innings")
        if not isinstance(innings, list) or not innings:
            continue

        first_innings = innings[0].get("1st innings") if isinstance(innings[0], dict) else None
        if not first_innings:
            continue

        team_name = first_innings.get("team")
        deliveries = first_innings.get("deliveries", [])

        for delivery in deliveries:
            for ball_key, ball_val in delivery.items():
                records.append(
                    {
                        "match_id": match_counter,
                        "teams": row.get("info.teams", []),
                        "batting_team": team_name,
                        "ball": str(ball_key),
                        "batsman": ball_val.get("batsman"),
                        "bowler": ball_val.get("bowler"),
                        "runs": ball_val.get("runs", {}).get("total", 0),
                        "player_dismissed": ball_val.get("wicket", {}).get("player_out", "0"),
                        "city": row.get("info.city"),
                        "venue": row.get("info.venue"),
                    }
                )

        match_counter += 1

    delivery_df = pd.DataFrame.from_records(records)
    if delivery_df.empty:
        raise ValueError("No deliveries built from matches; check data content/filters.")

    def bowling_team(row: pd.Series) -> str:
        for team in row["teams"]:
            if team != row["batting_team"]:
                return team
        return row["batting_team"]

    delivery_df["bowling_team"] = delivery_df.apply(bowling_team, axis=1)
    delivery_df.drop(columns=["teams"], inplace=True)
    return delivery_df


def _build_feature_frame(delivery_df: pd.DataFrame) -> pd.DataFrame:
    """Recreate the engineered features from the notebook."""
    output = delivery_df[
        ["match_id", "batting_team", "bowling_team", "ball", "runs", "player_dismissed", "city", "venue"]
    ].copy()

    # Fill missing cities from venue first token when possible.
    mask_city_null = output["city"].isnull()
    output.loc[mask_city_null, "city"] = (
        output.loc[mask_city_null, "venue"].astype(str).str.split().str[0]
    )

    output.drop(columns=["venue"], inplace=True)

    total_df = output.groupby("match_id").sum(numeric_only=True)["runs"].reset_index()
    total_df.rename(columns={"runs": "innings_total"}, inplace=True)
    output = output.merge(total_df, on="match_id", how="left")

    output["current_score"] = output.groupby("match_id")["runs"].cumsum()

    output["over"] = output["ball"].apply(lambda x: str(x).split(".")[0])
    output["ball_no"] = output["ball"].apply(lambda x: str(x).split(".")[1])
    output["balls_bowled"] = output["over"].astype(int) * 6 + output["ball_no"].astype(int)

    # Current run rate
    output["crr"] = (output["current_score"] * 6 / output["balls_bowled"]).replace([np.inf, -np.inf], 0.0)

    # Wickets and wickets_left
    output["player_dismissed"] = output["player_dismissed"].apply(lambda x: 0 if x == "0" else 1)
    output["player_dismissed"] = output["player_dismissed"].astype(int)
    output["player_dismissed"] = output.groupby("match_id")["player_dismissed"].cumsum()
    output["wickets_left"] = 10 - output["player_dismissed"]

    final_df = output[
        [
            "match_id",
            "batting_team",
            "bowling_team",
            "innings_total",
            "current_score",
            "balls_bowled",
            "wickets_left",
            "crr",
            "city",
        ]
    ].copy()

    final_df = final_df.sample(frac=1.0, random_state=1).reset_index(drop=True)

    final_df["balls_left"] = 120 - final_df["balls_bowled"]
    final_df["balls_left"] = final_df["balls_left"].apply(lambda x: 0 if x < 0 else x)
    final_df["crr"] = (final_df["current_score"] * 6 / final_df["balls_bowled"]).replace(
        [np.inf, -np.inf], 0.0
    )
    final_df.drop(columns=["balls_bowled"], inplace=True)

    groups = final_df.groupby("match_id")
    last_five: List[float] = []
    for mid in final_df["match_id"].unique():
        rolling = groups.get_group(mid)["innings_total"].rolling(window=30).sum().values.tolist()
        last_five.extend(rolling)
    final_df["last_five"] = last_five

    final_df.dropna(inplace=True)
    return final_df


def _train_model(df: pd.DataFrame) -> Pipeline:
    features = [
        "batting_team",
        "bowling_team",
        "city",
        "current_score",
        "balls_left",
        "wickets_left",
        "crr",
        "last_five",
    ]
    target_col = "innings_total"

    X = df[features]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=1
    )

    categorical_cols = ["batting_team", "bowling_team", "city"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(
                    sparse=False,
                    drop="first",
                    handle_unknown="ignore",
                ),
                categorical_cols,
            )
        ],
        remainder="passthrough",
    )

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=None,
        random_state=1,
        n_jobs=-1,
    )

    pipe = Pipeline(
        steps=[
            ("preprocess", preprocessor),
            ("scale", StandardScaler()),
            ("model", model),
        ]
    )

    pipe.fit(X_train, y_train)
    y_pred = pipe.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)

    print(f"R2 score: {r2:.4f}")
    print(f"MAE: {mae:.2f}")

    return pipe


def _save_metadata(df: pd.DataFrame, path: Path) -> None:
    teams = sorted(df["batting_team"].unique().tolist())
    cities = sorted(df["city"].unique().tolist())

    metadata = {"teams": teams, "cities": cities}
    with path.open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved metadata to {path}")


FORMAT_CONFIG = {
    # subdir: folder under data/, match_type and overs as per Cricsheet.
    "IPL": {
        "subdir": "ipl",
        "match_type": "T20",
        "overs": 20,
        "competition": "Indian Premier League",
    },
    "ODI": {
        "subdir": "odis",
        "match_type": "ODI",
        "overs": 50,
        "competition": None,
    },
    "T20": {
        "subdir": "t20s",
        "match_type": "T20",
        "overs": 20,
        "competition": None,
    },
    "Test": {
        "subdir": "tests",
        "match_type": "Test",
        "overs": None,
        "competition": None,
    },
}


def main() -> None:
    print(f"Project root: {PROJECT_ROOT}")

    first_metadata_written = False

    for format_name, cfg in FORMAT_CONFIG.items():
        data_dir = DATA_DIR / cfg["subdir"]
        model_path = PROJECT_ROOT / f"pipe_{cfg['subdir']}.pkl"

        if not data_dir.exists():
            print(f"[{format_name}] Skipping: data directory {data_dir} not found.")
            continue

        print(f"[{format_name}] Loading matches from {data_dir} ...")
        try:
            matches = _load_yaml_matches(
                data_dir=data_dir,
                match_type=cfg["match_type"],
                overs=cfg["overs"],
                competition=cfg["competition"],
            )
        except Exception as exc:
            print(f"[{format_name}] Failed to load matches: {exc}")
            continue

        try:
            delivery_df = _build_delivery_frame(matches)
            final_df = _build_feature_frame(delivery_df)
        except Exception as exc:
            print(f"[{format_name}] Failed to build features: {exc}")
            continue

        # Save generic metadata from the first successful format (typically IPL).
        if not first_metadata_written:
            _save_metadata(final_df, METADATA_PATH)
            first_metadata_written = True

        print(f"[{format_name}] Training model ...")
        pipe = _train_model(final_df)

        with model_path.open("wb") as f:
            pickle.dump(pipe, f)
        print(f"[{format_name}] Saved trained model to {model_path}")


if __name__ == "__main__":
    main()


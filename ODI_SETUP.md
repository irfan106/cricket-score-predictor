# ODI pipeline (same as IPL, different data and params)

Ensure **`data/odis`** exists and contains ODI YAML files (e.g. from Cricsheet).

---

## 1. data-extraction.ipynb – ODI section

**Add and run these cells after your IPL section** (or in a new notebook). Only the changed parts are shown; logic is the same as IPL.

### 1.1 ODI file list and load matches

```python
# ========== ODI ==========
data_dir_odi = 'data/odis'
filenames_odi = []
for name in os.listdir(data_dir_odi):
    path = os.path.join(data_dir_odi, name)
    if os.path.isfile(path) and name.lower().endswith('.yaml'):
        filenames_odi.append(path)
len(filenames_odi), filenames_odi[:3]
```

```python
dfs_odi = []
counter = 1
for file in tqdm(filenames_odi, desc="Loading ODI YAML"):
    with open(file, 'r', encoding='utf-8') as f:
        df = pd.json_normalize(safe_load(f))
        df['match_id'] = counter
        dfs_odi.append(df)
        counter += 1
matches_df_odi = pd.concat(dfs_odi, ignore_index=True)
matches_df_odi.shape, matches_df_odi.head(1)
```

### 1.2 Clean and filter for ODI (50 overs)

```python
matches_df_odi.drop(columns=['meta.data_version','meta.created','meta.revision',
    'info.outcome.bowl_out','info.bowl_out','info.supersubs.South Africa',
    'info.supersubs.New Zealand','info.outcome.eliminator','info.outcome.result',
    'info.outcome.method','info.neutral_venue','info.match_type_number',
    'info.outcome.by.runs','info.outcome.by.wickets'], inplace=True, errors="ignore")

if 'info.match_type' in matches_df_odi.columns:
    matches_df_odi = matches_df_odi[matches_df_odi['info.match_type'] == 'ODI']
if 'info.overs' in matches_df_odi.columns:
    matches_df_odi = matches_df_odi[matches_df_odi['info.overs'] == 50]
    matches_df_odi = matches_df_odi.drop(columns=['info.overs'])
if 'info.gender' in matches_df_odi.columns:
    matches_df_odi = matches_df_odi[matches_df_odi['info.gender'] == 'male'].copy()
    matches_df_odi = matches_df_odi.drop(columns=['info.gender'])

required_cols = ["match_id","innings","info.city","info.venue","info.teams","info.dates","info.balls_per_over"]
existing = [c for c in required_cols if c in matches_df_odi.columns]
matches_df_odi = matches_df_odi[existing].copy()
matches_df_odi.shape
```

### 1.3 Build delivery_df for ODI (50 overs = 300 balls)

```python
records_odi = []
for _, row in tqdm(matches_df_odi.iterrows(), total=len(matches_df_odi), desc="ODI deliveries"):
    match_id = row["match_id"]
    city, venue = row.get("info.city"), row.get("info.venue")
    teams = row.get("info.teams", [])
    innings_list = row["innings"]
    if not isinstance(innings_list, list) or not innings_list:
        continue
    first_innings = innings_list[0].get("1st innings") if isinstance(innings_list[0], dict) else None
    if not first_innings:
        continue
    batting_team = first_innings.get("team")
    deliveries = first_innings.get("deliveries", [])
    for delivery in deliveries:
        for ball_key, ball_val in delivery.items():
            records_odi.append({
                "match_id": match_id, "teams": teams, "batting_team": batting_team,
                "ball": str(ball_key), "batsman": ball_val.get("batsman"), "bowler": ball_val.get("bowler"),
                "runs": ball_val.get("runs", {}).get("total", 0),
                "player_dismissed": ball_val.get("wicket", {}).get("player_out", "0"),
                "city": city, "venue": venue,
            })
delivery_df_odi = pd.DataFrame.from_records(records_odi)

def bowling_team_fn(row):
    for t in row["teams"]:
        if t != row["batting_team"]: return t
    return row["batting_team"]
delivery_df_odi["bowling_team"] = delivery_df_odi.apply(bowling_team_fn, axis=1)
delivery_df_odi.drop(columns=["teams"], inplace=True)
mask = delivery_df_odi["city"].isnull()
delivery_df_odi.loc[mask, "city"] = delivery_df_odi.loc[mask, "venue"].astype(str).str.split().str[0]
delivery_df_odi.shape
```

### 1.4 Feature engineering for ODI (300 balls per innings)

```python
delivery_df_odi["over"] = delivery_df_odi["ball"].apply(lambda x: int(str(x).split(".")[0]))
delivery_df_odi["ball_no"] = delivery_df_odi["ball"].apply(lambda x: int(str(x).split(".")[1]))
delivery_df_odi = delivery_df_odi.sort_values(["match_id", "over", "ball_no"]).reset_index(drop=True)

TOTAL_BALLS_ODI = 50 * 6  # 300
delivery_df_odi["balls_bowled"] = delivery_df_odi["over"] * 6 + delivery_df_odi["ball_no"]
delivery_df_odi["balls_left"] = (TOTAL_BALLS_ODI - delivery_df_odi["balls_bowled"]).clip(lower=0)
delivery_df_odi["current_score"] = delivery_df_odi.groupby("match_id")["runs"].cumsum()
delivery_df_odi["player_dismissed_flag"] = delivery_df_odi["player_dismissed"].apply(lambda x: 0 if x == "0" else 1).astype(int)
delivery_df_odi["total_dismissed"] = delivery_df_odi.groupby("match_id")["player_dismissed_flag"].cumsum()
delivery_df_odi["wickets_left"] = 10 - delivery_df_odi["total_dismissed"]
delivery_df_odi["crr"] = (delivery_df_odi["current_score"] * 6 / delivery_df_odi["balls_bowled"]).replace([np.inf, -np.inf], 0.0).fillna(0.0)
match_totals_odi = delivery_df_odi.groupby("match_id")["runs"].sum().rename("innings_total")
delivery_df_odi = delivery_df_odi.merge(match_totals_odi, on="match_id", how="left")
delivery_df_odi["last_five"] = delivery_df_odi.groupby("match_id")["runs"].rolling(window=30, min_periods=1).sum().reset_index(level=0, drop=True)

final_features_df_odi = delivery_df_odi[["batting_team","bowling_team","city","current_score","balls_left","wickets_left","crr","last_five","innings_total"]].copy()
final_features_df_odi.dropna(inplace=True)
final_features_df_odi.shape, final_features_df_odi.head(3)
```

### 1.5 Save ODI features

```python
pickle.dump(final_features_df_odi, open("odi_features.pkl", "wb"))
```

---

## 2. feature-extraction.ipynb – Train ODI model

```python
final_features_df_odi = pickle.load(open("odi_features.pkl", "rb"))

X_odi = final_features_df_odi[["batting_team","bowling_team","city","current_score","balls_left","wickets_left","crr","last_five"]]
y_odi = final_features_df_odi["innings_total"]
X_train_odi, X_test_odi, y_train_odi, y_test_odi = train_test_split(X_odi, y_odi, test_size=0.2, random_state=1)

pipe_odi = Pipeline(steps=[
    ("preprocess", ColumnTransformer([("cat", OneHotEncoder(sparse_output=False, drop="first", handle_unknown="ignore"), ["batting_team","bowling_team","city"])], remainder="passthrough")),
    ("scale", StandardScaler()),
    ("model", RandomForestRegressor(n_estimators=300, random_state=1, n_jobs=-1)),
])
pipe_odi.fit(X_train_odi, y_train_odi)
y_pred_odi = pipe_odi.predict(X_test_odi)
print("ODI R2:", r2_score(y_test_odi, y_pred_odi))
print("ODI MAE:", mean_absolute_error(y_test_odi, y_pred_odi))

pickle.dump(pipe_odi, open("pipe_odi.pkl", "wb"))
```

---

## 3. Update metadata.json so IPL and ODI both show correct teams/cities

Run **once** (e.g. in feature-extraction or a new cell) so the app uses per-format teams and cities:

```python
import json
from pathlib import Path

# Load existing metadata if present (e.g. from IPL)
meta = {}
if Path("metadata.json").exists():
    meta = json.load(open("metadata.json", "r", encoding="utf-8"))

# If current metadata is flat {"teams": [...], "cities": [...]}, move it under "IPL"
if "teams" in meta and "IPL" not in meta:
    meta = {"IPL": {"teams": meta["teams"], "cities": meta["cities"]}}

# Add ODI teams and cities from your trained ODI features
meta["ODI"] = {
    "teams": sorted(final_features_df_odi["batting_team"].unique().tolist()),
    "cities": sorted(final_features_df_odi["city"].unique().tolist()),
}

Path("metadata.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
meta
```

After this, **restart the Streamlit app**. Choosing **IPL** will show IPL teams/cities; choosing **ODI** will show ODI teams/cities and use the 50-over model.

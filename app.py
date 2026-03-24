import json
import pickle
from pathlib import Path

import pandas as pd
import streamlit as st

METADATA_PATH = Path("metadata.json")

teams = [
    "Australia",
    "India",
    "Bangladesh",
    "New Zealand",
    "South Africa",
    "England",
    "West Indies",
    "Afghanistan",
    "Pakistan",
    "Sri Lanka",
]

cities = [
    "Colombo",
    "Mirpur",
    "Johannesburg",
    "Dubai",
    "Auckland",
    "Cape Town",
    "London",
    "Pallekele",
    "Barbados",
    "Sydney",
    "Melbourne",
    "Durban",
    "St Lucia",
    "Wellington",
    "Lauderhill",
    "Hamilton",
    "Centurion",
    "Manchester",
    "Abu Dhabi",
    "Mumbai",
    "Nottingham",
    "Southampton",
    "Mount Maunganui",
    "Chittagong",
    "Kolkata",
    "Lahore",
    "Delhi",
    "Nagpur",
    "Chandigarh",
    "Adelaide",
    "Bangalore",
    "St Kitts",
    "Cardiff",
    "Christchurch",
    "Trinidad",
]


def _get_metadata_for_format(selected_format: str) -> tuple[list, list]:
    """Load teams/cities from metadata.json. Supports per-format or single global metadata."""
    if not METADATA_PATH.exists():
        return teams, cities
    try:
        with METADATA_PATH.open("r", encoding="utf-8") as f:
            meta = json.load(f)
    except Exception:
        return teams, cities
    # Per-format: {"IPL": {"teams": [...], "cities": [...]}, "ODI": {...}}
    if selected_format in meta and isinstance(meta[selected_format], dict):
        fmt = meta[selected_format]
        return fmt.get("teams", teams) or teams, fmt.get("cities", cities) or cities
    # Legacy: single {"teams": [...], "cities": [...]} used for all formats
    return meta.get("teams", teams) or teams, meta.get("cities", cities) or cities


@st.cache_resource(show_spinner=False)
def load_model(model_path: str | Path):
    path = Path(model_path)
    if not path.exists():
        return None
    with path.open("rb") as file:
        return pickle.load(file)


st.set_page_config(
    page_title="Cricket Score Predictor",
    page_icon=":cricket_bat_and_ball:",
    layout="centered",
)

st.title("Cricket Score Predictor")
st.caption("Predict first innings score for different formats.")

format_to_model = {
    "IPL": "pipe_ipl.pkl",
    "ODI": "pipe_odi.pkl",
    "T20": "pipe_t20.pkl",
    "Test": "pipe_test.pkl",
}

format_config = {
    "IPL": {"max_overs": 20, "label": "T20 (IPL)"},
    "ODI": {"max_overs": 50, "label": "ODI (50 overs)"},
    "T20": {"max_overs": 20, "label": "T20 International"},
    "Test": {"max_overs": 90, "label": "Test (per day approx)"},
}

selected_format = st.selectbox("Format", list(format_to_model.keys()))
model_filename = format_to_model[selected_format]
cfg = format_config.get(selected_format, {"max_overs": 20, "label": selected_format})

# Load teams/cities for this format (from metadata.json, per-format or legacy)
display_teams, display_cities = _get_metadata_for_format(selected_format)

pipe = load_model(model_filename)
if pipe is None:
    st.warning(
        f"Model file `{model_filename}` was not found. "
        f"Train and save it to the project root to enable predictions for {selected_format}."
    )
else:
    st.caption(f"Using model for **{cfg['label']}** from `{model_filename}`.")

with st.container(border=True):
    st.subheader("Match Context")
    col1, col2 = st.columns(2)
    with col1:
        batting_team = st.selectbox("Batting Team", sorted(display_teams))
    with col2:
        bowling_team = st.selectbox("Bowling Team", sorted(display_teams))

    city = st.selectbox("City", sorted(display_cities))

max_overs = cfg["max_overs"]
default_overs = min(10.0, max_overs - 0.1)
max_score = 500 if max_overs >= 50 else 300
default_score = 60 if max_overs <= 20 else 120

with st.container(border=True):
    st.subheader("Live Situation")
    col3, col4, col5 = st.columns(3)
    with col3:
        current_score = st.number_input("Current Score", min_value=0, max_value=max_score, value=default_score)
    with col4:
        overs = st.number_input(
            "Overs Completed",
            min_value=5.1,
            max_value=float(max_overs),
            value=default_overs,
            step=0.1,
        )
    with col5:
        wickets = st.number_input("Wickets Out", min_value=0, max_value=10, value=2)

    last_five = st.number_input(
        "Runs in Last 5 Overs",
        min_value=0,
        max_value=150,
        value=35,
    )

predict_disabled = pipe is None

if st.button("Predict Final Score", type="primary", disabled=predict_disabled):
    if batting_team == bowling_team:
        st.warning("Batting and bowling teams must be different.")
    elif overs <= 0:
        st.warning("Overs must be greater than 0.")
    elif overs > cfg["max_overs"]:
        st.warning(f"Overs cannot exceed {cfg['max_overs']} for {cfg['label']}.")
    elif last_five > current_score:
        st.warning("Runs in last 5 overs cannot exceed current score.")
    else:
        # Convert overs to balls assuming 6 balls per over for all formats here.
        total_balls = cfg["max_overs"] * 6
        balls_bowled = int(overs * 6)
        balls_left = max(int(total_balls - balls_bowled), 0)
        wickets_left = int(10 - wickets)
        current_run_rate = current_score / overs

        input_df = pd.DataFrame(
            {
                "batting_team": [batting_team],
                "bowling_team": [bowling_team],
                "city": [city],
                "current_score": [current_score],
                "balls_left": [balls_left],
                "wickets_left": [wickets_left],
                "crr": [current_run_rate],
                "last_five": [last_five],
            }
        )
        with st.spinner("Calculating predicted score..."):
            result = pipe.predict(input_df)
            predicted_total = int(round(result[0]))

        st.success(f"{selected_format} predicted score: {predicted_total}")
        st.metric(f"{selected_format} projected final total", predicted_total)




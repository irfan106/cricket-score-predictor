from backend.app.schemas import PredictionRequest
from backend.app.services.prediction import derive_match_state


def test_derive_match_state_for_valid_t20_payload():
    payload = PredictionRequest(
        format="T20",
        batting_team="India",
        bowling_team="Australia",
        city="Mumbai",
        current_score=72,
        overs_completed=10,
        balls_this_over=3,
        wickets_out=2,
        last_five=28,
    )

    derived = derive_match_state(payload)

    assert derived.balls_bowled == 63
    assert derived.balls_left == 57
    assert derived.wickets_left == 8

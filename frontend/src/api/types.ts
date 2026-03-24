export type FormatCode = "IPL" | "ODI" | "T20" | "Test";

export interface HealthResponse {
  status: string;
  formats: string[];
  frontend_built: boolean;
}

export interface FormatSummary {
  code: FormatCode;
  label: string;
  description: string;
  max_overs: number;
  r2: number;
  mae: number;
  has_model: boolean;
  team_count: number;
  city_count: number;
}

export interface FormatDetail extends FormatSummary {
  teams: string[];
  cities: string[];
}

export interface PredictionRequest {
  format: FormatCode;
  batting_team: string;
  bowling_team: string;
  city: string;
  current_score: number;
  overs_completed: number;
  balls_this_over: number;
  wickets_out: number;
  last_five: number;
}

export interface DerivedFeatures {
  balls_bowled: number;
  balls_left: number;
  wickets_left: number;
  crr: number;
}

export interface PredictionResponse {
  prediction_id: number;
  format: FormatCode;
  predicted_total: number;
  predicted_low: number;
  predicted_high: number;
  derived: DerivedFeatures;
  created_at: string;
}

export interface PredictionHistoryItem extends PredictionRequest, DerivedFeatures {
  prediction_id: number;
  predicted_total: number;
  predicted_low: number;
  predicted_high: number;
  created_at: string;
}

export interface PredictionListResponse {
  items: PredictionHistoryItem[];
}

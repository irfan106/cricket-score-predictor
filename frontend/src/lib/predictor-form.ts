import { z } from "zod";

import type { FormatCode, PredictionRequest } from "api/types";

export const predictorFormSchema = z
  .object({
    format: z.enum(["IPL", "ODI", "T20", "Test"]),
    batting_team: z.string().min(1, "Choose a batting team."),
    bowling_team: z.string().min(1, "Choose a bowling team."),
    city: z.string().min(1, "Choose a city."),
    current_score: z.coerce.number().int().min(0),
    overs_completed: z.coerce.number().int().min(0),
    balls_this_over: z.coerce.number().int().min(0).max(5),
    wickets_out: z.coerce.number().int().min(0).max(10),
    last_five: z.coerce.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.batting_team && value.bowling_team && value.batting_team === value.bowling_team) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bowling_team"],
        message: "Batting and bowling teams must be different.",
      });
    }

    if (value.last_five > value.current_score) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["last_five"],
        message: "Runs in the last five overs cannot exceed current score.",
      });
    }
  });

export type PredictorFormValues = z.infer<typeof predictorFormSchema>;

export const defaultValuesByFormat: Record<FormatCode, PredictorFormValues> = {
  IPL: {
    format: "IPL",
    batting_team: "",
    bowling_team: "",
    city: "",
    current_score: 68,
    overs_completed: 10,
    balls_this_over: 2,
    wickets_out: 2,
    last_five: 37,
  },
  ODI: {
    format: "ODI",
    batting_team: "",
    bowling_team: "",
    city: "",
    current_score: 148,
    overs_completed: 28,
    balls_this_over: 3,
    wickets_out: 4,
    last_five: 29,
  },
  T20: {
    format: "T20",
    batting_team: "",
    bowling_team: "",
    city: "",
    current_score: 64,
    overs_completed: 9,
    balls_this_over: 5,
    wickets_out: 2,
    last_five: 34,
  },
  Test: {
    format: "Test",
    batting_team: "",
    bowling_team: "",
    city: "",
    current_score: 232,
    overs_completed: 61,
    balls_this_over: 1,
    wickets_out: 5,
    last_five: 18,
  },
};

export function buildPrefill(search: URLSearchParams, format: FormatCode): Partial<PredictionRequest> {
  return {
    format,
    batting_team: search.get("batting_team") ?? "",
    bowling_team: search.get("bowling_team") ?? "",
    city: search.get("city") ?? "",
    current_score: Number(search.get("current_score") ?? defaultValuesByFormat[format].current_score),
    overs_completed: Number(search.get("overs_completed") ?? defaultValuesByFormat[format].overs_completed),
    balls_this_over: Number(search.get("balls_this_over") ?? defaultValuesByFormat[format].balls_this_over),
    wickets_out: Number(search.get("wickets_out") ?? defaultValuesByFormat[format].wickets_out),
    last_five: Number(search.get("last_five") ?? defaultValuesByFormat[format].last_five),
  };
}

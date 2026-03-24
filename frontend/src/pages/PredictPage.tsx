import { useEffect, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { createPrediction, getFormatDetail, getFormats } from "api/client";
import type { FormatCode, PredictionResponse } from "api/types";
import { FormatTabs } from "components/predictor/FormatTabs";
import { PredictionResultCard } from "components/predictor/PredictionResultCard";
import { queryClient } from "lib/queryClient";
import { buildPrefill, defaultValuesByFormat, predictorFormSchema, type PredictorFormValues } from "lib/predictor-form";

const formatCodes: FormatCode[] = ["IPL", "ODI", "T20", "Test"];

function normalizeFormat(value: string | undefined): FormatCode {
  return formatCodes.includes(value as FormatCode) ? (value as FormatCode) : "IPL";
}

export default function PredictPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const selectedFormat = normalizeFormat(params.format);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const formatsQuery = useQuery({ queryKey: ["formats"], queryFn: getFormats });
  const formatDetailQuery = useQuery({
    queryKey: ["format-detail", selectedFormat],
    queryFn: () => getFormatDetail(selectedFormat),
  });

  const form = useForm<PredictorFormValues>({
    resolver: zodResolver(predictorFormSchema),
    defaultValues: defaultValuesByFormat[selectedFormat],
  });

  useEffect(() => {
    const prefill = buildPrefill(searchParams, selectedFormat);
    form.reset({
      ...defaultValuesByFormat[selectedFormat],
      ...prefill,
      format: selectedFormat,
    });
    setResult(null);
    setServerError(null);
  }, [form, searchParams, selectedFormat]);

  const predictionMutation = useMutation({
    mutationFn: createPrediction,
    onSuccess: (payload) => {
      setResult(payload);
      setServerError(null);
      void queryClient.invalidateQueries({ queryKey: ["prediction-history"] });
    },
    onError: (error: Error) => {
      setServerError(error.message);
    },
  });

  const values = form.watch();
  const formatDetail = formatDetailQuery.data;

  function onSubmit(payload: PredictorFormValues) {
    setServerError(null);
    predictionMutation.mutate({
      ...payload,
      format: selectedFormat,
    });
  }

  const ballsBowled = values.overs_completed * 6 + values.balls_this_over;
  const ballsLeft = formatDetail ? Math.max(formatDetail.max_overs * 6 - ballsBowled, 0) : 0;
  const wicketsLeft = Math.max(10 - values.wickets_out, 0);
  const crr = ballsBowled > 0 ? (values.current_score / ballsBowled) * 6 : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
      <section className="rounded-[1.75rem] border border-pitch/10 bg-white/84 p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-pitch/10 bg-paper/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-pitch">
                Predictor workspace
              </span>
              <span className="inline-flex rounded-full border border-boundary/16 bg-boundary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-boundary">
                {formatDetail?.label ?? selectedFormat}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-pitch sm:text-4xl">First-innings prediction</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-ink/64">
                Set the match context, enter the live innings state, and run the model. The backend derives the exact
                feature set before prediction.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/history"
              className="rounded-full border border-pitch/12 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-pitch transition hover:bg-paper"
            >
              Session history
            </Link>
            <Link
              to="/about"
              className="rounded-full border border-pitch/12 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65 transition hover:border-pitch/18 hover:bg-paper"
            >
              Model details
            </Link>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <WorkspaceStat label="Max overs" value={String(formatDetail?.max_overs ?? "--")} />
          <WorkspaceStat label="Teams" value={String(formatDetail?.team_count ?? "--")} />
          <WorkspaceStat label="Cities" value={String(formatDetail?.city_count ?? "--")} />
          <WorkspaceStat label="Balls left" value={String(ballsLeft)} />
          <WorkspaceStat label="Current RR" value={crr.toFixed(2)} />
        </div>
      </section>

      <section className="mt-6">
        <FormatTabs formats={formatsQuery.data ?? []} selectedFormat={selectedFormat} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_24rem]">
        <div className="rounded-[1.75rem] border border-pitch/10 bg-white shadow-card">
          <div className="border-b border-pitch/10 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Input panel</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-pitch">Match state</h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-pitch/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-pitch transition hover:bg-paper"
                onClick={() =>
                  form.reset({
                    ...defaultValuesByFormat[selectedFormat],
                    batting_team: formatDetail?.teams[0] ?? "",
                    bowling_team: formatDetail?.teams[1] ?? "",
                    city: formatDetail?.cities[0] ?? "",
                  })
                }
              >
                Reset defaults
              </button>
            </div>
          </div>

          <form className="grid gap-5 p-5 sm:p-6" onSubmit={form.handleSubmit(onSubmit)}>
            <section className="rounded-[1.4rem] border border-pitch/10 bg-paper/72 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Match setup</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-pitch">Teams and location</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-pitch">
                  Format-aware
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Batting team" error={form.formState.errors.batting_team?.message}>
                  <select className="input" {...form.register("batting_team")}>
                    <option value="">Select batting side</option>
                    {formatDetail?.teams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Bowling team" error={form.formState.errors.bowling_team?.message}>
                  <select className="input" {...form.register("bowling_team")}>
                    <option value="">Select bowling side</option>
                    {formatDetail?.teams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="City" error={form.formState.errors.city?.message}>
                  <select className="input md:col-span-2" {...form.register("city")}>
                    <option value="">Select city</option>
                    {formatDetail?.cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className="rounded-[1.4rem] border border-pitch/10 bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Live innings state</p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-pitch">Score, overs, wickets, recent runs</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-ink/56 sm:text-right">
                  <span>{ballsBowled} bowled</span>
                  <span>{wicketsLeft} left</span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Current score" error={form.formState.errors.current_score?.message}>
                  <input className="input" type="number" min={0} {...form.register("current_score")} />
                </Field>

                <Field label="Completed overs" error={form.formState.errors.overs_completed?.message}>
                  <input className="input" type="number" min={0} {...form.register("overs_completed")} />
                </Field>

                <Field label="Balls this over" error={form.formState.errors.balls_this_over?.message}>
                  <select className="input" {...form.register("balls_this_over")}>
                    {[0, 1, 2, 3, 4, 5].map((ball) => (
                      <option key={ball} value={ball}>
                        {ball}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Wickets out" error={form.formState.errors.wickets_out?.message}>
                  <input className="input" type="number" min={0} max={10} {...form.register("wickets_out")} />
                </Field>

                <Field label="Runs in last 5 overs" error={form.formState.errors.last_five?.message}>
                  <input className="input" type="number" min={0} {...form.register("last_five")} />
                </Field>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-4 border-t border-pitch/10 pt-1">
              <button
                type="submit"
                className="rounded-full bg-pitch px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-paper transition hover:bg-pitch/92 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={predictionMutation.isPending || !formatDetail}
              >
                {predictionMutation.isPending ? "Running projection..." : "Predict final score"}
              </button>
              <p className="text-sm text-ink/58">The prediction is saved automatically to this browser session.</p>
            </div>
          </form>
        </div>

        <PredictionResultCard
          format={formatDetail}
          result={result}
          loading={predictionMutation.isPending}
          error={serverError}
          oversCompleted={values.overs_completed}
          ballsThisOver={values.balls_this_over}
        />
      </section>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/48">{label}</span>
      {children}
      {error ? <span className="text-xs leading-6 text-boundary">{error}</span> : null}
    </label>
  );
}

function WorkspaceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-paper/76 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/42">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-pitch">{value}</p>
    </div>
  );
}

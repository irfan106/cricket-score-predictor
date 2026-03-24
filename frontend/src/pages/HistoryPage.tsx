import { useDeferredValue, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { clearPredictionHistory, getFormats, getPredictionHistory } from "api/client";
import type { FormatCode } from "api/types";
import { formatOvers, formatTimestamp } from "lib/formatting";
import { queryClient } from "lib/queryClient";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState<FormatCode | "ALL">("ALL");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const deferredMinScore = useDeferredValue(minScore);
  const deferredMaxScore = useDeferredValue(maxScore);

  const formatsQuery = useQuery({ queryKey: ["formats"], queryFn: getFormats });
  const historyQuery = useQuery({
    queryKey: ["prediction-history", selectedFormat],
    queryFn: () => getPredictionHistory(selectedFormat === "ALL" ? undefined : selectedFormat, 100),
  });

  const clearMutation = useMutation({
    mutationFn: clearPredictionHistory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prediction-history"] });
    },
  });

  const items =
    historyQuery.data?.items.filter((item) => {
      const minValue = deferredMinScore ? Number(deferredMinScore) : null;
      const maxValue = deferredMaxScore ? Number(deferredMaxScore) : null;
      if (minValue !== null && item.predicted_total < minValue) {
        return false;
      }
      if (maxValue !== null && item.predicted_total > maxValue) {
        return false;
      }
      return true;
    }) ?? [];

  const latestItem = items[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
      <section className="rounded-[1.75rem] border border-pitch/10 bg-white/84 p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-pitch/10 bg-paper/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-pitch">
                Session history
              </span>
              <span className="inline-flex rounded-full border border-boundary/16 bg-boundary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-boundary">
                Private to this browser
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-pitch sm:text-4xl">Prediction records</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-ink/64">
                Review saved projections, filter by format or score range, and push any previous innings state back into
                the predictor in one click.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/predict/IPL"
              className="rounded-full border border-pitch/12 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-pitch transition hover:bg-paper"
            >
              Open predictor
            </Link>
            <button
              type="button"
              className="rounded-full border border-boundary/16 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-boundary transition hover:bg-boundary/8 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
            >
              {clearMutation.isPending ? "Clearing..." : "Clear history"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <WorkspaceStat label="Saved calls" value={String(items.length)} />
          <WorkspaceStat label="Active filter" value={selectedFormat === "ALL" ? "All" : selectedFormat} />
          <WorkspaceStat label="Latest total" value={latestItem ? String(latestItem.predicted_total) : "--"} />
          <WorkspaceStat label="Latest saved" value={latestItem ? formatTimestamp(latestItem.created_at) : "--"} compact />
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-pitch/10 bg-white shadow-card">
        <div className="border-b border-pitch/10 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Filter panel</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-pitch">Narrow the board</h2>
            </div>
            <p className="text-sm text-ink/58">Showing up to 100 predictions from the current session.</p>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[1.1fr,1fr,1fr] sm:p-6">
          <label className="grid gap-2 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/48">Format</span>
            <select
              className="input"
              value={selectedFormat}
              onChange={(event) => setSelectedFormat(event.target.value as FormatCode | "ALL")}
            >
              <option value="ALL">All formats</option>
              {(formatsQuery.data ?? []).map((format) => (
                <option key={format.code} value={format.code}>
                  {format.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/48">Min projected total</span>
            <input className="input" type="number" value={minScore} onChange={(event) => setMinScore(event.target.value)} />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/48">Max projected total</span>
            <input className="input" type="number" value={maxScore} onChange={(event) => setMaxScore(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="mt-6">
        {items.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-pitch/14 bg-white/80 px-8 py-16 text-center shadow-card">
            <p className="text-2xl font-semibold tracking-[-0.03em] text-pitch">No predictions saved yet</p>
            <p className="mt-3 text-sm leading-7 text-ink/62">
              Run a projection from the predictor workspace and it will appear here for reuse and comparison.
            </p>
            <Link
              to="/predict/IPL"
              className="mt-6 inline-flex rounded-full bg-pitch px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-paper"
            >
              Go to predictor
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-pitch/10 bg-white shadow-card">
            <div className="hidden border-b border-pitch/10 bg-paper/70 px-5 py-4 lg:grid lg:grid-cols-[1.4fr,0.95fr,0.8fr,0.9fr,auto] lg:gap-4">
              <HeaderLabel>Match</HeaderLabel>
              <HeaderLabel>Score state</HeaderLabel>
              <HeaderLabel>Projection</HeaderLabel>
              <HeaderLabel>Derived</HeaderLabel>
              <HeaderLabel>Action</HeaderLabel>
            </div>

            <div className="divide-y divide-pitch/10">
              {items.map((item) => (
                <article
                  key={item.prediction_id}
                  className="grid gap-5 px-5 py-5 lg:grid-cols-[1.4fr,0.95fr,0.8fr,0.9fr,auto] lg:items-center lg:gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-pitch/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-pitch">
                        {item.format}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/42">
                        {formatTimestamp(item.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-pitch">
                      {item.batting_team} vs {item.bowling_team}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-ink/62">{item.city}</p>
                  </div>

                  <div className="grid gap-2 text-sm text-ink/64">
                    <InfoLine label="Overs" value={formatOvers(item.overs_completed, item.balls_this_over)} />
                    <InfoLine label="Score" value={`${item.current_score}/${item.wickets_out}`} />
                    <InfoLine label="Last five" value={String(item.last_five)} />
                  </div>

                  <div className="rounded-[1.25rem] bg-paper/78 px-4 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/42">Projected total</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-boundary">{item.predicted_total}</p>
                    <p className="mt-2 text-xs text-ink/56">
                      {item.predicted_low} - {item.predicted_high}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                    <MiniStat label="Balls left" value={String(item.balls_left)} />
                    <MiniStat label="Wickets left" value={String(item.wickets_left)} />
                    <MiniStat label="CRR" value={item.crr.toFixed(2)} />
                  </div>

                  <div className="flex items-start lg:justify-end">
                    <button
                      type="button"
                      className="rounded-full bg-pitch px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-paper transition hover:bg-pitch/92"
                      onClick={() => {
                        const params = new URLSearchParams({
                          batting_team: item.batting_team,
                          bowling_team: item.bowling_team,
                          city: item.city,
                          current_score: String(item.current_score),
                          overs_completed: String(item.overs_completed),
                          balls_this_over: String(item.balls_this_over),
                          wickets_out: String(item.wickets_out),
                          last_five: String(item.last_five),
                        });
                        navigate(`/predict/${item.format}?${params.toString()}`);
                      }}
                    >
                      Reuse state
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function WorkspaceStat({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[1.2rem] bg-paper/76 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/42">{label}</p>
      <p className={`mt-2 font-semibold tracking-[-0.03em] text-pitch ${compact ? "text-sm" : "text-lg"}`}>{value}</p>
    </div>
  );
}

function HeaderLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/46">{children}</p>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/42">{label}</span>
      <span className="font-medium text-pitch">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-pitch/10 bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/42">{label}</p>
      <p className="mt-1 text-sm font-semibold text-pitch">{value}</p>
    </div>
  );
}

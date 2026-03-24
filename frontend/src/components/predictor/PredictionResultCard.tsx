import type { FormatDetail, PredictionResponse } from "api/types";
import { formatOvers, formatTimestamp } from "lib/formatting";

interface PredictionResultCardProps {
  format?: FormatDetail;
  result?: PredictionResponse | null;
  loading: boolean;
  error?: string | null;
  oversCompleted: number;
  ballsThisOver: number;
}

export function PredictionResultCard({
  format,
  result,
  loading,
  error,
  oversCompleted,
  ballsThisOver,
}: PredictionResultCardProps) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-28">
      <div className="overflow-hidden rounded-[1.75rem] border border-pitch/10 bg-white shadow-card">
        <div className="border-b border-pitch/10 bg-pitch px-5 py-5 text-paper">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/68">Prediction output</p>
              <p className="mt-3 text-5xl font-semibold leading-none tracking-[-0.05em]">
                {result ? result.predicted_total : "--"}
              </p>
              <p className="mt-2 text-sm text-paper/72">{format ? format.label : "Select a format and enter innings data."}</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/60">Over state</p>
              <p className="mt-1 text-sm font-semibold">{formatOvers(oversCompleted, ballsThisOver)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          {loading ? (
            <div className="space-y-3">
              <div className="h-14 animate-pulse rounded-xl bg-mist" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 animate-pulse rounded-xl bg-mist" />
                <div className="h-20 animate-pulse rounded-xl bg-mist" />
                <div className="h-20 animate-pulse rounded-xl bg-mist" />
                <div className="h-20 animate-pulse rounded-xl bg-mist" />
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[1.25rem] border border-boundary/16 bg-boundary/8 px-4 py-4 text-sm leading-7 text-boundary">
              {error}
            </div>
          ) : result ? (
            <>
              <div className="rounded-[1.25rem] bg-paper/78 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Prediction band</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-pitch">
                  {result.predicted_low} - {result.predicted_high}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Metric label="Balls left" value={String(result.derived.balls_left)} />
                <Metric label="Wickets left" value={String(result.derived.wickets_left)} />
                <Metric label="Current RR" value={result.derived.crr.toFixed(2)} />
                <Metric label="Saved" value={formatTimestamp(result.created_at)} />
              </div>
            </>
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-pitch/14 bg-paper/70 px-4 py-8 text-center">
              <p className="text-lg font-semibold tracking-[-0.02em] text-pitch">No projection yet</p>
              <p className="mt-2 text-sm leading-7 text-ink/62">
                Submit the current innings state to see the projected total and practical scoring band.
              </p>
            </div>
          )}
        </div>
      </div>

      {format ? (
        <div className="rounded-[1.5rem] border border-pitch/10 bg-white/82 p-5 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Format summary</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-pitch">{format.code}</p>
          <p className="mt-2 text-sm leading-7 text-ink/62">{format.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Max overs" value={String(format.max_overs)} />
            <Metric label="Teams" value={String(format.team_count)} />
            <Metric label="Cities" value={String(format.city_count)} />
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-pitch/10 bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-pitch">{value}</p>
    </div>
  );
}

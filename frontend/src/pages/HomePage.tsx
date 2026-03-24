import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getFormats, getPredictionHistory } from "api/client";
import { formatTimestamp } from "lib/formatting";

export default function HomePage() {
  const formatsQuery = useQuery({ queryKey: ["formats"], queryFn: getFormats });
  const historyQuery = useQuery({
    queryKey: ["prediction-history", "home"],
    queryFn: () => getPredictionHistory(undefined, 3),
  });

  const formats = formatsQuery.data ?? [];
  const recentItems = historyQuery.data?.items ?? [];
  const heroFormats = formats.slice(0, 4);
  const featuredFormat = heroFormats[0];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_12%_20%,rgba(39,94,58,0.16),transparent_28%),radial-gradient(circle_at_78%_16%,rgba(211,94,38,0.15),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.4),transparent_78%)]" />
      <div className="absolute inset-x-0 top-24 -z-10 h-[34rem] bg-[linear-gradient(90deg,rgba(45,58,46,0.03)_1px,transparent_1px),linear-gradient(180deg,rgba(45,58,46,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 md:pb-28 md:pt-14">
        <section className="grid gap-8 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-pitch/12 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-pitch">
                First-innings score prediction
              </span>
              <span className="inline-flex rounded-full border border-boundary/18 bg-boundary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-boundary">
                IPL / ODI / T20 / Test
              </span>
            </div>

            <div className="space-y-6">
              <p className="max-w-xl text-sm font-semibold uppercase tracking-[0.24em] text-ink/42">
                Match context in. Projected total out.
              </p>
              <h1 className="max-w-4xl font-display text-6xl font-extrabold leading-[0.94] tracking-[-0.04em] text-pitch sm:text-7xl xl:text-[6.4rem]">
                Predict the shape of an innings before it gets there.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-ink/68 sm:text-xl">
                A cleaner match-day workflow for cricket forecasting. Feed live score, wickets, over state, and recent
                momentum, then get a projected first-innings total with a format-specific prediction range backed by
                trained models.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/predict/IPL"
                className="inline-flex items-center justify-center rounded-full bg-pitch px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-paper transition hover:bg-pitch/92"
              >
                Start a prediction
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center justify-center rounded-full border border-pitch/12 bg-white/75 px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-pitch transition hover:border-pitch/24 hover:bg-white"
              >
                See methodology
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                label="Formats supported"
                value={formats.length ? String(formats.length) : "4"}
                detail="League and international setups"
              />
              <StatCard label="Prediction range" value="MAE-based" detail="Bands derived per format" />
              <StatCard label="Input model" value="Ball-true" detail="Overs and balls tracked separately" />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="overflow-hidden rounded-[2rem] border border-pitch/10 bg-white/85 shadow-card">
              <div className="border-b border-pitch/10 bg-[linear-gradient(135deg,rgba(37,86,54,1),rgba(28,58,39,0.96))] px-6 py-6 text-paper">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/70">Live projection desk</p>
                    <h2 className="mt-3 max-w-sm font-display text-4xl font-bold leading-none tracking-[-0.04em]">
                      Read the pressure, not just the score.
                    </h2>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-paper/60">Lead format</p>
                    <p className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em]">
                      {featuredFormat?.code ?? "IPL"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                <div className="rounded-[1.6rem] border border-pitch/10 bg-paper/80 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/44">Current benchmark</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-pitch">
                        {featuredFormat?.label ?? "T20 (IPL)"}
                      </p>
                    </div>
                    <Link
                      to={`/predict/${featuredFormat?.code ?? "IPL"}`}
                      className="rounded-full bg-pitch px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-paper transition hover:bg-pitch/92"
                    >
                      Open predictor
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <MetricPanel
                      label="Model accuracy"
                      value={featuredFormat ? featuredFormat.r2.toFixed(3) : "0.910"}
                      accent="R2"
                    />
                    <MetricPanel
                      label="Average miss"
                      value={featuredFormat ? featuredFormat.mae.toFixed(2) : "4.77"}
                      accent="MAE"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {heroFormats.map((format) => (
                    <FormatTile
                      key={format.code}
                      code={format.code}
                      label={format.label}
                      r2={format.r2.toFixed(3)}
                      mae={format.mae.toFixed(2)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard
                eyebrow="Product edge"
                title="Built for actual cricket inputs."
                body="The predictor does not fake decimal overs. It captures overs and balls separately and derives the model features on the backend."
              />
              <InfoCard
                eyebrow="Session memory"
                title="Every call stays reusable."
                body="Predictions are stored in anonymous session history so you can revisit the same match state and test alternate scoring paths quickly."
              />
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
          <div className="rounded-[2rem] border border-pitch/10 bg-white/82 p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/44">How it works</p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.04em] text-pitch sm:text-5xl">
                  From live state to credible projection.
                </h2>
              </div>
              <Link
                to="/predict/IPL"
                className="rounded-full border border-pitch/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-pitch hover:bg-paper"
              >
                Try it now
              </Link>
            </div>

            <div className="mt-8 space-y-5">
              <ProcessStep
                number="01"
                title="Choose the match context"
                body="Pick format, batting team, bowling team, and city from the metadata-backed options."
              />
              <ProcessStep
                number="02"
                title="Add the live score state"
                body="Enter score, wickets out, overs completed, balls in the current over, and last-five scoring burst."
              />
              <ProcessStep
                number="03"
                title="Read the projection band"
                body="The backend derives cricket features, runs the correct model, and returns a projected total with a practical range."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-pitch/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,241,234,0.92))] p-6 shadow-card sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/44">Recent session calls</p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.04em] text-pitch sm:text-5xl">
                  Your prediction board
                </h2>
              </div>
              <Link
                to="/history"
                className="rounded-full border border-pitch/12 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-pitch hover:bg-white"
              >
                Open history
              </Link>
            </div>

            <div className="mt-8 space-y-4">
              {recentItems.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-pitch/14 bg-white/70 px-6 py-12 text-center">
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-pitch">No predictions saved yet</p>
                  <p className="mt-3 text-sm leading-7 text-ink/64">
                    Make your first call and this board will start tracking your latest projected innings totals.
                  </p>
                </div>
              ) : (
                recentItems.map((item) => (
                  <PredictionRow
                    key={item.prediction_id}
                    format={item.format}
                    battingTeam={item.batting_team}
                    bowlingTeam={item.bowling_team}
                    city={item.city}
                    currentScore={item.current_score}
                    wicketsOut={item.wickets_out}
                    oversCompleted={item.overs_completed}
                    ballsThisOver={item.balls_this_over}
                    predictedTotal={item.predicted_total}
                    predictedLow={item.predicted_low}
                    predictedHigh={item.predicted_high}
                    createdAt={item.created_at}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.6rem] border border-pitch/10 bg-white/74 p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/42">{label}</p>
      <p className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-pitch">{value}</p>
      <p className="mt-2 text-sm leading-6 text-ink/62">{detail}</p>
    </div>
  );
}

function MetricPanel({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-[1.25rem] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/42">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-display text-4xl font-extrabold leading-none tracking-[-0.05em] text-pitch">{value}</p>
        <span className="rounded-full bg-boundary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-boundary">
          {accent}
        </span>
      </div>
    </div>
  );
}

function FormatTile({
  code,
  label,
  r2,
  mae,
}: {
  code: string;
  label: string;
  r2: string;
  mae: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-pitch/10 bg-white p-5 transition hover:border-pitch/18 hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-extrabold leading-none tracking-[-0.04em] text-pitch">{code}</p>
          <p className="mt-2 text-sm leading-6 text-ink/64">{label}</p>
        </div>
        <span className="rounded-full bg-pitch/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-pitch">
          Ready
        </span>
      </div>
      <div className="mt-5 flex gap-3 text-sm">
        <div className="rounded-2xl bg-paper/90 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/42">R2</p>
          <p className="mt-1 font-semibold text-pitch">{r2}</p>
        </div>
        <div className="rounded-2xl bg-paper/90 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/42">MAE</p>
          <p className="mt-1 font-semibold text-pitch">{mae}</p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="rounded-[1.7rem] border border-pitch/10 bg-white/82 p-6 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/42">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-pitch">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-ink/66">{body}</p>
    </div>
  );
}

function ProcessStep({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="grid gap-4 rounded-[1.6rem] border border-pitch/10 bg-paper/72 p-5 sm:grid-cols-[auto,1fr] sm:items-start">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pitch text-paper">
        <span className="text-sm font-semibold tracking-[0.08em]">{number}</span>
      </div>
      <div>
        <p className="text-xl font-semibold tracking-[-0.03em] text-pitch">{title}</p>
        <p className="mt-2 text-sm leading-7 text-ink/66">{body}</p>
      </div>
    </div>
  );
}

function PredictionRow({
  format,
  battingTeam,
  bowlingTeam,
  city,
  currentScore,
  wicketsOut,
  oversCompleted,
  ballsThisOver,
  predictedTotal,
  predictedLow,
  predictedHigh,
  createdAt,
}: {
  format: string;
  battingTeam: string;
  bowlingTeam: string;
  city: string;
  currentScore: number;
  wicketsOut: number;
  oversCompleted: number;
  ballsThisOver: number;
  predictedTotal: number;
  predictedLow: number;
  predictedHigh: number;
  createdAt: string;
}) {
  return (
    <div className="grid gap-4 rounded-[1.6rem] border border-pitch/10 bg-white/80 p-5 md:grid-cols-[1fr,auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-pitch/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-pitch">
            {format}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/42">{formatTimestamp(createdAt)}</span>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-pitch">
          {battingTeam} vs {bowlingTeam}
        </p>
        <p className="mt-2 text-sm leading-7 text-ink/66">
          {city} / {currentScore}-{wicketsOut} / over state {oversCompleted}.{ballsThisOver}
        </p>
      </div>

      <div className="rounded-[1.4rem] bg-paper/85 px-5 py-4 md:min-w-[10rem]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/42">Projected total</p>
        <p className="mt-2 font-display text-4xl font-extrabold leading-none tracking-[-0.05em] text-boundary">
          {predictedTotal}
        </p>
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-ink/52">
          {predictedLow} - {predictedHigh}
        </p>
      </div>
    </div>
  );
}

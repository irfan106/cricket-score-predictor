import { useQuery } from "@tanstack/react-query";

import { getFormats } from "api/client";

const methodologySteps = [
  {
    title: "Input capture",
    body: "The app collects match context and live innings state: format, teams, city, score, overs completed, balls in the current over, wickets out, and recent scoring momentum.",
  },
  {
    title: "Backend feature derivation",
    body: "The API derives model-facing cricket features such as balls left, wickets left, and current run rate so the frontend never drifts from inference logic.",
  },
  {
    title: "Format-specific inference",
    body: "A dedicated sklearn pipeline is loaded for each format. IPL, ODI, T20, and Test each use their own trained artifact and metadata profile.",
  },
  {
    title: "Session logging",
    body: "Each successful prediction is stored against an anonymous browser session so users can revisit and reuse previous match states without creating an account.",
  },
];

const caveats = [
  "Predictions are for first-innings totals only, not second-innings chases or win probability.",
  "Test projections use a fixed day-length approximation rather than a full simulation of match state across innings and declarations.",
  "The displayed prediction band is derived from per-format MAE and should be read as a practical operating range, not a probabilistic confidence interval.",
  "Teams and cities must exist in the metadata generated from the training pipeline, so unsupported combinations are rejected.",
];

const productNotes = [
  "The web app does not train models. Training stays offline in the notebooks and optimization scripts.",
  "Model artifacts are loaded lazily on demand and cached by format on the backend.",
  "Anonymous history is isolated per browser session via cookie rather than user login.",
  "The frontend and backend share the same input contract so UI validation and API validation stay aligned.",
];

export default function AboutPage() {
  const formatsQuery = useQuery({ queryKey: ["formats"], queryFn: getFormats });
  const formats = formatsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
      <section className="rounded-[1.75rem] border border-pitch/10 bg-white/84 p-6 shadow-card sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-pitch/10 bg-paper/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-pitch">
                About the system
              </span>
              <span className="inline-flex rounded-full border border-boundary/16 bg-boundary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-boundary">
                Inference and methodology
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-pitch sm:text-4xl">How the predictor works</h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-ink/64">
                Cricket Predictor is built as an inference product around offline-trained models. The frontend captures
                clean cricket inputs, the backend derives the final feature frame, and the format-specific pipeline
                returns a projected first-innings total with a usable scoring band.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <SummaryCard label="Formats" value={String(formats.length || 4)} detail="IPL, ODI, T20, Test" />
            <SummaryCard label="Inference mode" value="Server-side" detail="FastAPI + sklearn pipelines" />
            <SummaryCard label="History model" value="Anonymous" detail="Per-browser session storage" />
            <SummaryCard label="Training flow" value="Offline" detail="Notebook and script driven" />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.02fr,0.98fr]">
        <div className="rounded-[1.75rem] border border-pitch/10 bg-white shadow-card">
          <div className="border-b border-pitch/10 px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Methodology flow</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-pitch">From input screen to model output</h2>
          </div>
          <div className="grid gap-4 p-6">
            {methodologySteps.map((step, index) => (
              <div key={step.title} className="grid gap-4 rounded-[1.35rem] border border-pitch/10 bg-paper/72 p-5 sm:grid-cols-[auto,1fr]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pitch text-paper">
                  <span className="text-sm font-semibold">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-pitch">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-ink/64">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Panel
            title="What the model sees"
            body="The prediction request includes batting team, bowling team, city, current score, overs completed, balls this over, wickets out, and runs scored in the last five overs."
          />
          <Panel
            title="Why backend derivation matters"
            body="The API computes derived fields such as balls left, wickets left, and current run rate before inference. That keeps the training contract, runtime behavior, and UI logic consistent."
          />
          <Panel
            title="What gets stored"
            body="Every prediction stores raw inputs, derived values, projected total, range, format, and timestamp so the session history screen can replay any previous state."
          />
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr,1fr]">
        <div className="rounded-[1.75rem] border border-pitch/10 bg-white shadow-card">
          <div className="border-b border-pitch/10 px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Operational notes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-pitch">Product and system details</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-3 text-sm leading-7 text-ink/64">
              {productNotes.map((note) => (
                <li key={note} className="rounded-[1.2rem] bg-paper/72 px-4 py-3">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-pitch/10 bg-white shadow-card">
          <div className="border-b border-pitch/10 px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Limits and caveats</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-pitch">How to read the output responsibly</h2>
          </div>
          <div className="p-6">
            <ul className="space-y-3 text-sm leading-7 text-ink/64">
              {caveats.map((note) => (
                <li key={note} className="rounded-[1.2rem] bg-paper/72 px-4 py-3">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-pitch/10 bg-white shadow-card">
        <div className="border-b border-pitch/10 px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Format coverage</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-pitch">Current models and metadata coverage</h2>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {formats.map((format) => (
            <article key={format.code} className="rounded-[1.45rem] border border-pitch/10 bg-paper/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold tracking-[-0.03em] text-pitch">{format.code}</p>
                  <p className="mt-2 text-sm leading-7 text-ink/62">{format.description}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-pitch">
                  {format.max_overs} overs
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <Metric label="R2" value={format.r2.toFixed(3)} />
                <Metric label="MAE" value={format.mae.toFixed(2)} />
                <Metric label="Teams" value={String(format.team_count)} />
                <Metric label="Cities" value={String(format.city_count)} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.25rem] bg-paper/76 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/42">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-pitch">{value}</p>
      <p className="mt-2 text-sm text-ink/58">{detail}</p>
    </div>
  );
}

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.75rem] border border-pitch/10 bg-white p-6 shadow-card">
      <p className="text-xl font-semibold tracking-[-0.03em] text-pitch">{title}</p>
      <p className="mt-3 text-sm leading-7 text-ink/64">{body}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-pitch">{value}</p>
    </div>
  );
}

import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-[0.85fr,1.15fr] lg:items-center">
        <div className="rounded-[2rem] bg-pitch px-8 py-10 text-paper shadow-card">
          <p className="font-display text-8xl uppercase tracking-[0.12em] text-boundary">404</p>
          <p className="mt-3 text-sm uppercase tracking-[0.24em] text-paper/65">Scoreboard not found</p>
        </div>
        <div>
          <h1 className="font-display text-5xl uppercase tracking-[0.14em] text-pitch md:text-6xl">
            That innings board does not exist.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/68">
            The route is outside the current match sheet. Head back to the home page or jump straight into a new
            prediction flow.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/"
              className="rounded-full bg-pitch px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-paper"
            >
              Back home
            </Link>
            <Link
              to="/predict/IPL"
              className="rounded-full border border-pitch/15 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-pitch hover:bg-white/70"
            >
              Start predicting
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

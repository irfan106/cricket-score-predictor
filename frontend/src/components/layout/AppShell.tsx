import { NavLink, Outlet } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/predict/IPL", label: "Predict" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="fixed inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,_rgba(202,88,34,0.18),_transparent_50%),linear-gradient(180deg,_rgba(37,86,54,0.09),_transparent_75%)]" />
      <header className="sticky top-0 z-40 border-b border-pitch/10 bg-paper/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <NavLink to="/" className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pitch text-paper shadow-[0_14px_30px_rgba(31,45,27,0.16)]">
              <span className="font-display text-2xl font-extrabold uppercase tracking-[0.14em]">CP</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[1.75rem] uppercase leading-none tracking-[0.06em] text-pitch sm:text-[2rem] lg:text-[2.25rem]">
                Cricket Predictor
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.28em] text-ink/48 sm:text-xs">
                Editorial score intelligence
              </p>
            </div>
          </NavLink>

          <div className="min-w-0 lg:flex lg:flex-1 lg:justify-end">
            <nav className="flex flex-nowrap items-center gap-2 overflow-x-auto rounded-full border border-pitch/10 bg-white/78 p-1.5 shadow-[0_10px_30px_rgba(31,45,27,0.08)]">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] transition sm:px-5 ${
                      isActive
                        ? "bg-pitch text-paper shadow-[0_8px_20px_rgba(31,45,27,0.18)]"
                        : "text-ink/68 hover:bg-pitch/6 hover:text-pitch"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-pitch/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,245,239,0.96))]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="grid gap-6 rounded-[1.75rem] border border-pitch/10 bg-white/80 p-6 shadow-card md:grid-cols-[1.2fr,0.8fr,0.9fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pitch text-paper">
                  <span className="font-display text-xl font-extrabold uppercase tracking-[0.12em]">CP</span>
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em] text-pitch">Cricket Predictor</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/46">
                    Editorial score intelligence
                  </p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-7 text-ink/64">
                A modern cricket prediction workspace built on FastAPI inference, React rendering, anonymous session
                history, and offline-trained sklearn models.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-paper px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-pitch">
                  IPL
                </span>
                <span className="rounded-full bg-paper px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-pitch">
                  ODI
                </span>
                <span className="rounded-full bg-paper px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-pitch">
                  T20
                </span>
                <span className="rounded-full bg-paper px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-pitch">
                  Test
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Navigate</p>
              <div className="mt-4 grid gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className="rounded-xl px-3 py-2 text-sm text-ink/66 transition hover:bg-paper hover:text-pitch"
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Platform</p>
                <div className="mt-4 grid gap-2">
                  <FooterLine label="Inference" value="FastAPI + sklearn" />
                  <FooterLine label="Frontend" value="React + TypeScript" />
                  <FooterLine label="History" value="Anonymous session based" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Contact</p>
                <a
                  href="mailto:ir.irfan106@gmail.com"
                  className="mt-3 inline-flex rounded-full border border-pitch/12 bg-paper px-4 py-2 text-sm font-semibold text-pitch transition hover:bg-white"
                >
                  ir.irfan106@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 text-xs text-ink/48 md:flex-row md:items-center md:justify-between">
            <p>Built for first-innings projection workflows across league and international cricket formats.</p>
            <p className="font-medium text-pitch">Cricket Predictor</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-paper/72 px-3 py-2 text-sm">
      <span className="text-ink/54">{label}</span>
      <span className="font-medium text-pitch">{value}</span>
    </div>
  );
}

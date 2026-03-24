import { NavLink } from "react-router-dom";

import type { FormatCode, FormatSummary } from "api/types";

interface FormatTabsProps {
  formats: FormatSummary[];
  selectedFormat: FormatCode;
}

export function FormatTabs({ formats, selectedFormat }: FormatTabsProps) {
  return (
    <div className="rounded-[1.5rem] border border-pitch/10 bg-white/82 p-2 shadow-card">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {formats.map((format) => {
          const isActive = selectedFormat === format.code;

          return (
            <NavLink
              key={format.code}
              to={`/predict/${format.code}`}
              className={`rounded-[1.1rem] border px-4 py-3 transition ${
                isActive
                  ? "border-pitch bg-pitch text-paper"
                  : "border-transparent bg-transparent text-ink hover:border-pitch/10 hover:bg-paper/80"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-lg font-semibold tracking-[-0.03em] ${isActive ? "text-paper" : "text-pitch"}`}>
                    {format.code}
                  </p>
                  <p className={`mt-1 text-xs ${isActive ? "text-paper/72" : "text-ink/58"}`}>{format.label}</p>
                </div>
                <div className={`text-right text-[11px] ${isActive ? "text-paper/70" : "text-ink/45"}`}>
                  <p>{format.max_overs} ov</p>
                  <p className="mt-1">MAE {format.mae.toFixed(2)}</p>
                </div>
              </div>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

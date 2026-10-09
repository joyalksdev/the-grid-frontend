// src/components/admin/TopPlayersLeaderboard.jsx
import React from "react";
import { formatINR } from "../../utils/format";

export default function TopPlayersLeaderboard({ players }) {
  if (!players || players.length === 0) {
    return <p className="py-6 text-center font-mono text-xs text-sub">No player activity recorded</p>;
  }

  return (
    <div className="space-y-2.5">
      {players.map((p, index) => (
        <div
          key={p.name}
          className="flex items-center justify-between rounded-xl border border-border-divider/60 bg-app-bg/40 p-3 transition-colors hover:bg-app-bg/80"
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid size-7 place-items-center rounded-lg font-mono text-xs font-bold ${
                index === 0
                  ? "border border-amber-400/30 bg-amber-400/20 text-amber-400"
                  : index === 1
                  ? "border border-slate-300/30 bg-slate-300/20 text-slate-300"
                  : index === 2
                  ? "border border-amber-700/30 bg-amber-700/20 text-amber-600"
                  : "border border-border-divider bg-app-bg text-sub"
              }`}
            >
              {index + 1}
            </span>
            <div>
              <p className="text-xs font-bold text-main">{p.name}</p>
              <p className="font-mono text-[10px] text-sub">
                {p.sessions} session{p.sessions > 1 ? "s" : ""} · {p.totalMins} mins played
              </p>
            </div>
          </div>
          <div className="font-mono text-xs font-bold tabular-nums text-emerald-400">
            {formatINR(p.spent)}
          </div>
        </div>
      ))}
    </div>
  );
}
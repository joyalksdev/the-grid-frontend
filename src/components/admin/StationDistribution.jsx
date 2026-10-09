// src/components/admin/StationDistribution.jsx
import React, { useMemo } from "react";
import { formatINR } from "../../utils/format";

export default function StationDistribution({ stationData }) {
  const total = useMemo(() => {
    return stationData.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [stationData]);

  const colors = [
    "bg-primary-cyan text-primary-cyan",
    "bg-emerald-400 text-emerald-400",
    "bg-sky-400 text-sky-400",
    "bg-indigo-400 text-indigo-400",
    "bg-amber-400 text-amber-400",
    "bg-rose-400 text-rose-400"
  ];

  if (!stationData || stationData.length === 0 || total === 0) {
    return <p className="py-6 text-center font-mono text-xs text-sub">No station activity logged yet</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-border-divider/80 bg-app-bg">
        {stationData.map((item, idx) => {
          const pct = ((item.value / total) * 100).toFixed(1);
          if (item.value === 0) return null;
          return (
            <div
              key={item.name}
              style={{ width: `${pct}%` }}
              className={`${colors[idx % colors.length].split(" ")[0]} transition-all duration-300`}
              title={`${item.name}: ${formatINR(item.value)} (${pct}%)`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        {stationData.map((item, idx) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <div
              key={item.name}
              className="flex items-center gap-2.5 rounded-xl border border-border-divider/60 bg-app-bg/50 p-2.5"
            >
              <span className={`size-2.5 shrink-0 rounded-full ${colors[idx % colors.length].split(" ")[0]}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-main">{item.name}</p>
                <p className="font-mono text-[11px] text-sub">
                  {formatINR(item.value)} · {pct}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
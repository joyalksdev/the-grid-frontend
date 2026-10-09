// src/components/admin/RevenueChart.jsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { formatINR } from "../../utils/format";

export default function RevenueChart({ data }) {
  const maxVal = useMemo(() => {
    if (!data || data.length === 0) return 1000;
    const max = Math.max(...data.map((d) => d.revenue));
    return max > 0 ? max : 1000;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border-divider/70 bg-app-bg/40 font-mono text-xs text-sub">
        No revenue data recorded for this timeframe
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex h-56 items-end gap-2 overflow-x-auto pb-2 pt-8 scrollbar-none">
        {data.map((item, idx) => {
          const heightPct = Math.round((item.revenue / maxVal) * 100);
          return (
            <div
              key={item.date || idx}
              className="group relative flex h-full min-w-[28px] flex-1 flex-col items-center justify-end"
            >
              {/* Tooltip */}
              <div className="absolute -top-10 z-30 hidden whitespace-nowrap rounded-lg border border-border-divider bg-app-bg px-2.5 py-1 font-mono text-[11px] font-bold text-main shadow-2xl group-hover:block">
                {formatINR(item.revenue)} · {item.sessions} sessions
              </div>

              {/* Animated Bar */}
              <div className="flex h-full w-full max-w-[36px] items-end rounded-t-lg bg-app-bg/60 p-0.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPct, 6)}%` }}
                  transition={{ duration: 0.45, delay: idx * 0.02, ease: "easeOut" }}
                  className="w-full rounded-t-md bg-gradient-to-t from-primary-cyan/30 to-primary-cyan transition-colors group-hover:from-primary-cyan/60 group-hover:to-primary-cyan"
                />
              </div>

              <span className="mt-2 w-full truncate text-center font-mono text-[10px] text-sub">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
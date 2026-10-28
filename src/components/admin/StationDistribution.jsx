// src/components/admin/StationDistribution.jsx
import React, { useMemo } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { formatINR } from "../../utils/format";

const CHART_COLORS = [
  "#06b6d4", // Primary Cyan
  "#34d399", // Emerald
  "#38bdf8", // Sky
  "#818cf8", // Indigo
  "#fbbf24", // Amber
  "#fb7185", // Rose
];

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-border-divider bg-card-panel p-3 shadow-2xl backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-wider text-sub mb-1">
          {data.name}
        </p>
        <div className="space-y-0.5">
          <p className="font-heading text-sm font-bold text-main">
            {formatINR(data.value)}
          </p>
          <p className="font-mono text-[11px] text-primary-cyan">
            {data.percentage}% of total revenue
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default function StationDistribution({ stationData }) {
  const { total, formattedData } = useMemo(() => {
    if (!Array.isArray(stationData) || stationData.length === 0) {
      return { total: 0, formattedData: [] };
    }
    const sum = stationData.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const withPct = stationData.map((item) => ({
      name: item.name,
      value: Number(item.value) || 0,
      percentage: sum > 0 ? ((Number(item.value) || 0) / sum * 100).toFixed(1) : 0,
    }));
    return { total: sum, formattedData: withPct.filter(i => i.value > 0) };
  }, [stationData]);

  if (!formattedData || formattedData.length === 0 || total === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border-divider/70 bg-app-bg/40 font-mono text-xs text-sub">
        No station activity logged yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Donut Chart */}
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {formattedData.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.name}`} 
                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        {formattedData.map((item, idx) => {
          const colorHex = CHART_COLORS[idx % CHART_COLORS.length];
          return (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-2xl border border-border-divider/60 bg-app-bg/50 p-3 transition-colors hover:border-border-divider"
            >
              <span 
                className="size-3 shrink-0 rounded-full shadow-sm" 
                style={{ backgroundColor: colorHex }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-main">{item.name}</p>
                <p className="font-mono text-[11px] text-sub">
                  {formatINR(item.value)} · <span className="text-main font-bold">{item.percentage}%</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
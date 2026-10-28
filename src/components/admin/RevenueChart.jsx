// src/components/admin/RevenueChart.jsx
import React, { useMemo } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";
import { formatINR } from "../../utils/format";

// Custom Apple-inspired Tooltip for the chart
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-border-divider bg-card-panel p-3 shadow-2xl backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-wider text-sub mb-1">
          {data.date || label}
        </p>
        <div className="space-y-0.5">
          <p className="font-heading text-sm font-bold text-main">
            {formatINR(data.revenue)}
          </p>
          <p className="font-mono text-[11px] text-primary-cyan">
            {data.sessions} {data.sessions === 1 ? "session" : "sessions"}
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default function RevenueChart({ data }) {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      label: item.label || item.date,
      revenue: Number(item.revenue) || 0,
      sessions: Number(item.sessions) || 0,
      date: item.date,
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border-divider/70 bg-app-bg/40 font-mono text-xs text-sub">
        No revenue data recorded for this timeframe
      </div>
    );
  }

  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary-cyan, #06b6d4)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-primary-cyan, #06b6d4)" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="var(--color-border-divider, #27272a)" 
            opacity={0.4} 
          />

          <XAxis 
            dataKey="label" 
            stroke="var(--color-sub, #71717a)" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            dy={8}
          />

          <YAxis 
            stroke="var(--color-sub, #71717a)" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="var(--color-primary-cyan, #06b6d4)" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#revenueGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
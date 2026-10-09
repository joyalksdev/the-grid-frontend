// src/pages/RevenueReveal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CaretLeft,
  Sparkle,
  CurrencyInr,
  QrCode,
  ChartLineUp,
  Monitor,
  Trophy,
  Copy,
  DownloadSimple,
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { logService } from "../services/logService";
import { formatINR } from "../utils/format";
import Loader from "../components/ui/Loader";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

const GRID_TEXTURE = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,246,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,246,255,0.06) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
  WebkitMaskImage: "radial-gradient(ellipse at center, #000 0%, transparent 75%)",
  maskImage: "radial-gradient(ellipse at center, #000 0%, transparent 75%)",
};

function useCountUp(target, ready) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (reduceMotion) {
      setValue(target);
      return;
    }
    const duration = 900;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ready, reduceMotion]);

  return value;
}

function sameDay(isoString, target) {
  if (!isoString) return false;
  const d = new Date(isoString);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

function topEntry(counts) {
  let best = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  return best;
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-border-divider bg-card-panel p-4">
      <div className="flex items-center gap-2 text-sub">
        <Icon size={15} aria-hidden="true" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1.5 truncate font-mono text-xl font-bold tabular-nums text-main">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-sub">{sub}</p>}
    </div>
  );
}

/**
 * Owner-only "Wrapped"-style daily summary. Staff reach this via a link they
 * share (see RevenueSummary); this page re-checks the role itself rather
 * than trusting the caller, since the link may be opened by anyone signed in.
 *
 * TODO: if owners should open shared links without logging into the app,
 * swap this auth check for a signed, time-limited token the backend issues
 * when staff shares — right now it only works for an already-authenticated
 * owner account.
 */
export default function RevenueReveal() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isAdmin } = useAuth();
  const reduceMotion = useReducedMotion();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const targetDate = useMemo(() => {
    const raw = params.get("date");
    return raw ? new Date(raw) : new Date();
  }, [params]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    logService
      .getLogs()
      .then((data) => {
        const all = Array.isArray(data) ? data : data.logs || [];
        setLogs(all.filter((l) => sameDay(l.createdAt || l.timestamp, targetDate)));
      })
      .catch(() => toast.error("Failed to load revenue data"))
      .finally(() => setLoading(false));
  }, [isAdmin, targetDate]);

  const totalCash = logs
    .filter((l) => String(l.payment).toLowerCase() === "cash")
    .reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
  const totalGPay = logs
    .filter((l) => {
      const p = String(l.payment).toLowerCase();
      return p.includes("upi") || p.includes("gpay");
    })
    .reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
  const totalRevenue = logs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
  const totalSessions = logs.length;
  const avgSession = totalSessions ? Math.round(totalRevenue / totalSessions) : 0;

  const stationCounts = new Map();
  logs.forEach((l) => {
    const key = l.screen || l.screenName;
    if (key) stationCounts.set(key, (stationCounts.get(key) || 0) + 1);
  });
  const busiestStation = topEntry(stationCounts);

  const playerCounts = new Map();
  logs.forEach((l) => {
    if (l.player) playerCounts.set(l.player, (playerCounts.get(l.player) || 0) + 1);
  });
  const topPlayer = topEntry(playerCounts);

  const cashPct = totalRevenue ? Math.round((totalCash / totalRevenue) * 100) : 0;
  const gpayPct = totalRevenue ? Math.round((totalGPay / totalRevenue) * 100) : 0;

  const revenue = useCountUp(totalRevenue, !loading);

  const dateLabel = targetDate.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  };

  const handleExportCSV = () => {
    if (!logs.length) {
      toast.error("No sessions to export");
      return;
    }
    const headers = ["Player", "Station", "Duration (mins)", "Payment", "Cost (INR)"];
    const rows = logs.map((l) => [l.player, l.screen || l.screenName, l.duration, l.payment, l.cost]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `revenue_${targetDate.toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-sm py-16 text-center">
        <Trophy size={32} aria-hidden="true" className="mx-auto text-sub" />
        <h1 className="mt-3 font-heading text-lg font-bold text-main">Owners Only</h1>
        <p className="mt-1.5 text-sm text-sub">
          This summary is only visible to lounge owners. Ask them to open the link you shared.
        </p>
        <Link
          to="/logs"
          className={`mt-5 inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-divider px-4 text-sm font-medium text-main ${FOCUS}`}
        >
          <CaretLeft size={15} aria-hidden="true" />
          Back to Logs
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <Loader variant="skeleton-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className={`flex items-center gap-1.5 rounded-md text-sm font-medium text-sub transition-colors duration-150 hover:text-main motion-reduce:transition-none ${FOCUS}`}
      >
        <CaretLeft size={15} aria-hidden="true" />
        Back to Logs
      </button>

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl border border-border-divider bg-card-panel px-6 py-9 text-center sm:px-8"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={GRID_TEXTURE} />

        <div className="relative">
          <p className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-primary-cyan">
            <Sparkle size={13} weight="fill" aria-hidden="true" />
            Today&rsquo;s Revenue
          </p>
          <p className="mt-1 text-sm text-sub">{dateLabel}</p>

          <p className="mt-6 font-heading text-5xl font-extrabold tabular-nums text-main sm:text-6xl">
            {formatINR(revenue)}
          </p>
          <p className="mt-1.5 text-sm text-sub">
            {totalSessions} session{totalSessions === 1 ? "" : "s"} served
          </p>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={CurrencyInr} label="Cash" value={formatINR(totalCash)} sub={`${cashPct}% of total`} />
        <StatCard icon={QrCode} label="UPI / GPay" value={formatINR(totalGPay)} sub={`${gpayPct}% of total`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={ChartLineUp} label="Avg / Session" value={formatINR(avgSession)} />
        <StatCard icon={Monitor} label="Busiest Station" value={busiestStation?.key || "—"} />
      </div>

      {topPlayer && topPlayer.count > 1 && (
        <div className="flex items-center gap-3 rounded-xl border border-border-divider bg-card-panel p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-cyan/10 text-primary-cyan">
            <Trophy size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-sub">Most Sessions</p>
            <p className="truncate font-semibold text-main">
              {topPlayer.key} · {topPlayer.count} sessions
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleCopyLink}
          className={`flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-divider text-sm font-semibold text-main transition-colors duration-150 hover:border-sub motion-reduce:transition-none touch-manipulation ${FOCUS}`}
        >
          <Copy size={16} aria-hidden="true" />
          Copy Link
        </button>
        <button
          type="button"
          onClick={handleExportCSV}
          className={`flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-main text-sm font-semibold text-app-bg transition-colors duration-150 hover:bg-main/90 motion-reduce:transition-none touch-manipulation ${FOCUS} focus-visible:ring-offset-2 focus-visible:ring-offset-card-panel`}
        >
          <DownloadSimple size={16} aria-hidden="true" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
// src/pages/Activity.jsx
import React, { useState, useEffect } from "react";
import { CurrencyInr, Clock, MagnifyingGlass, ArrowsClockwise } from "@phosphor-icons/react";
import { logService } from "../services/logService";
import { toast } from "react-hot-toast";
import Loader from "../components/ui/Loader";
import { formatINR } from "../utils/format";

// Utility to format duration into hours and minutes
const formatDuration = (val) => {
  const mins = parseInt(val, 10);
  if (isNaN(mins) || mins === 0) return "-";
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${hrs}h ${m}m` : `${hrs}h`;
};

// Date & Time formatting options explicitly bound to IST (Asia/Kolkata)
const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

// Helper to extract a valid Date instance from any log timestamp field
const getLogDate = (log) => {
  const rawDate = log.timestamp || log.createdAt || log.startTime || log.date;
  if (!rawDate) return null;
  const d = new Date(rawDate);
  return isNaN(d.getTime()) ? null : d;
};

// Utility to reliably get start time in IST
const getStartTime = (log) => {
  if (log.time && typeof log.time === "string" && !log.time.includes("T")) {
    return log.time; // If already a formatted string like "03:45 PM"
  }
  const date = getLogDate(log);
  return date ? timeFmt.format(date) : "-";
};

// Utility to calculate end time in IST based on start time + duration
const getEndTime = (log) => {
  if (log.endTime && typeof log.endTime === "string" && !log.endTime.includes("T")) {
    return log.endTime;
  }
  const startDate = getLogDate(log);
  const mins = parseInt(log.duration || log.durationMins || 0, 10);
  
  if (startDate && !isNaN(mins)) {
    const endDate = new Date(startDate.getTime() + mins * 60000);
    return timeFmt.format(endDate);
  }
  return "-";
};

// Utility to get formatted date in IST
const getDate = (log) => {
  const date = getLogDate(log);
  return date ? dateFmt.format(date) : "";
};

const shortId = (log, n) => {
  const idStr = String(log.logId || log.id || log._id || "");
  return idStr ? idStr.slice(-n) : "-";
};

const getStation = (log) => log.screen || log.screenName || "Station";
const getPayment = (log) => log.payment || log.paymentType || "Cash";
const getAmount = (log) => log.cost || log.finalCost || 0;

function EmptyState({ searchTerm, onClear }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-medium text-main">
        {searchTerm ? `No results for “${searchTerm}”` : "No session logs yet."}
      </p>
      {searchTerm && (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 cursor-pointer rounded-md text-sm font-medium text-primary-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan"
        >
          Clear Search
        </button>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border-divider bg-card-panel p-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon size={22} weight="fill" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-sub">{label}</p>
        <p className="truncate font-mono text-2xl font-bold tabular-nums text-main">{value}</p>
      </div>
    </div>
  );
}

export default function Activity() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);

      const data = await logService.getLogs();
      setActivities(Array.isArray(data) ? data : data.logs || []);
    } catch (err) {
      toast.error(err.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const term = searchTerm.trim().toLowerCase();
  const filteredLogs = activities.filter((log) => {
    const player = String(log.player || "");
    const logId = String(log.logId || log.id || log._id || "");
    const screen = String(getStation(log) || "");

    return (
      player.toLowerCase().includes(term) ||
      logId.toLowerCase().includes(term) ||
      screen.toLowerCase().includes(term)
    );
  });

  const totalRevenue = activities.reduce((sum, current) => sum + Number(getAmount(current) || 0), 0);
  const aggregateSessions = activities.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 border-b border-border-divider pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-wide text-main sm:text-3xl">
            Session Logs
          </h1>
          <p className="mt-1 max-w-xl text-xs text-sub sm:text-sm">
            Review completed sessions, player history, and total revenue collected.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <MagnifyingGlass
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sub"
            />
            <label htmlFor="log-search" className="sr-only">
              Search session logs
            </label>
            <input
              id="log-search"
              name="search"
              type="search"
              autoComplete="off"
              spellCheck={false}
              placeholder="Search player, station or ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-lg border border-border-divider bg-card-panel pl-9 pr-3 text-base text-main placeholder:text-sub/70 transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:border-primary-cyan focus-visible:ring-2 focus-visible:ring-primary-cyan/40 sm:h-10 sm:text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={loading || isRefreshing}
            aria-label="Refresh logs"
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-border-divider bg-card-panel text-sub transition-colors duration-150 hover:border-sub/50 hover:text-main disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan sm:size-10"
          >
            <ArrowsClockwise
              size={18}
              weight="bold"
              aria-hidden="true"
              className={isRefreshing ? "animate-spin text-primary-cyan" : ""}
            />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={CurrencyInr}
          tone="bg-available/10 text-available"
          label="Revenue Collected"
          value={formatINR(totalRevenue)}
        />
        <StatCard
          icon={Clock}
          tone="bg-primary-cyan/10 text-primary-cyan"
          label="Completed Sessions"
          value={aggregateSessions}
        />
      </div>

      {/* Logs */}
      <section aria-label="Session logs" className="overflow-hidden rounded-xl border border-border-divider bg-card-panel">
        {loading && !isRefreshing ? (
          <div className="p-6">
            <Loader variant="skeleton-table" lines={5} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState searchTerm={searchTerm.trim()} onClear={() => setSearchTerm("")} />
        ) : (
          <>
            <p role="status" className="border-b border-border-divider px-4 py-2.5 text-xs text-sub lg:px-5">
              Showing {filteredLogs.length} of {aggregateSessions} sessions
            </p>

            {/* Mobile & tablet list */}
            <ul className="divide-y divide-border-divider lg:hidden">
              {filteredLogs.map((log) => (
                <li key={log._id || log.id || log.logId} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-main">{log.player}</p>
                      <p className="mt-0.5 truncate text-xs text-sub">
                        {getStation(log)} · {formatDuration(log.duration || log.durationMins)}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-bold tabular-nums text-available">
                      {formatINR(getAmount(log))}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs text-sub">
                    <p className="tabular-nums">
                      {getDate(log) && `${getDate(log)} · `}
                      {getStartTime(log)} – {getEndTime(log)}
                    </p>
                    <p className="flex shrink-0 items-center gap-2">
                      <span className="rounded-md border border-border-divider bg-app-bg px-1.5 py-0.5 font-medium uppercase text-main">
                        {getPayment(log)}
                      </span>
                      <span className="font-mono">#{shortId(log, 8)}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead>
                  <tr className="border-b border-border-divider bg-app-bg/50 text-xs font-medium text-sub">
                    <th scope="col" className="px-5 py-3 font-medium">Log ID</th>
                    <th scope="col" className="px-5 py-3 font-medium">Player</th>
                    <th scope="col" className="px-5 py-3 font-medium">Station &amp; Mode</th>
                    <th scope="col" className="px-5 py-3 font-medium">Start Time</th>
                    <th scope="col" className="px-5 py-3 font-medium">End Time</th>
                    <th scope="col" className="px-5 py-3 font-medium">Duration</th>
                    <th scope="col" className="px-5 py-3 font-medium">Payment</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-divider tabular-nums">
                  {filteredLogs.map((log) => (
                    <tr key={log._id || log.id || log.logId} className="transition-colors duration-150 hover:bg-app-bg/40 motion-reduce:transition-none">
                      <td className="px-5 py-3.5 font-mono text-xs text-sub">{log.logId || shortId(log, 8)}</td>
                      <td className="px-5 py-3.5 font-semibold text-main">{log.player}</td>
                      <td className="px-5 py-3.5 text-sub">{getStation(log)}</td>
                      <td className="px-5 py-3.5 text-sub">
                        {getStartTime(log)}
                        {getDate(log) && <span className="block text-xs text-sub/70">{getDate(log)}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sub">{getEndTime(log)}</td>
                      <td className="px-5 py-3.5 font-medium text-main">
                        {formatDuration(log.duration || log.durationMins)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md border border-border-divider bg-app-bg px-2 py-1 text-xs font-medium uppercase text-main">
                          {getPayment(log)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-available">
                        {formatINR(getAmount(log))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
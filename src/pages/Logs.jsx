// src/pages/Logs.jsx
import React, { useState, useEffect, useCallback, useRef, useId } from "react";
import {
  MagnifyingGlass,
  PencilSimple,
  Trash,
  X,
  Calendar,
  Clock,
  DotsThreeVertical,
  User,
  Monitor,
  ArrowRight,
  Sparkle,
  Funnel,
  CaretDown,
  Shield,
  Eye
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { logService } from "../services/logService";
import { formatINR } from "../utils/format";
import Dropdown from "../components/ui/Dropdown";
import Loader from "../components/ui/Loader";
import { Segmented } from "../components/ui/PriceCalculator";
import RevenueSummary from "../components/logs/RevenueSummary";
import EditLogModal from "../components/logs/EditLogModal";

const PAGE_SIZE = 10;

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

// Owner-only: ranges wide enough to spot trends.
const DATE_RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yest" },
  { value: "this_week", label: "Week" },
  { value: "this_month", label: "Month" },
  { value: "all", label: "All" },
];

// Fixed station screen filter options matching system standard
const SCREEN_OPTIONS = [
  { value: "all", label: "All Stations" },
  { value: "PS5-1", label: "PS5 #1" },
  { value: "PS5-2", label: "PS5 #2" },
  { value: "PS5-3", label: "PS5 #3" },
  { value: "PS5-4", label: "PS5 #4" },
  { value: "SimRig-1", label: "SimRig #1" },
  { value: "SimRig-2", label: "SimRig #2" },
];

const COMPACT_SELECT =
  "h-9 w-full appearance-none cursor-pointer rounded-lg border border-border-divider bg-app-bg pl-2.5 pr-7 text-xs text-main transition-colors duration-150 focus:outline-none focus:border-primary-cyan";

function formatDurationDisplay(mins) {
  const num = parseInt(mins, 10);
  if (isNaN(num) || num <= 0) return "0 min";
  if (num < 60) return `${num} min`;
  const hours = Math.floor(num / 60);
  const rem = num % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
}

function formatSessionDateTime(log) {
  if (!log) return { dateStr: "N/A", startTimeStr: "N/A", endTimeStr: "N/A" };

  if (log.startTime && log.endTime) {
    const start = new Date(log.startTime);
    const end = new Date(log.endTime);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return {
        dateStr: start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        startTimeStr: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
        endTimeStr: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      };
    }
  }

  const timestamp = log.createdAt || log.timestamp;
  if (!timestamp) return { dateStr: "N/A", startTimeStr: "N/A", endTimeStr: "N/A" };

  const end = new Date(timestamp);
  if (isNaN(end.getTime())) return { dateStr: "N/A", startTimeStr: "N/A", endTimeStr: "N/A" };

  const parsedDuration = parseInt(log.duration, 10) || 0;
  const start = new Date(end.getTime() - parsedDuration * 60 * 1000);

  return {
    dateStr: start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    startTimeStr: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
    endTimeStr: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

const todayISO = () => new Date().toISOString().split("T")[0];

export default function Logs() {
  const { user } = useAuth();
  const isOwnerOrAdmin = ["admin", "owner"].includes(user?.role);
  const dateInputId = useId();

  const [allLogs, setAllLogs] = useState([]);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("today");
  const [specificDate, setSpecificDate] = useState(todayISO());
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [screenFilter, setScreenFilter] = useState("all");

  const [editingLog, setEditingLog] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const observerTarget = useRef(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();

      if (isOwnerOrAdmin) {
        params.dateRange = dateRange;
        if (paymentFilter !== "all") params.payment = paymentFilter;
        if (screenFilter !== "all") params.screen = screenFilter;
      } else {
        params.date = specificDate;
      }

      const data = await logService.getLogs(params);
      const safeLogs = Array.isArray(data) ? data : [];
      setAllLogs(safeLogs);
      setPage(1);
      setDisplayedLogs(safeLogs.slice(0, PAGE_SIZE));
      setHasMore(safeLogs.length > PAGE_SIZE);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to load session logs");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, dateRange, specificDate, paymentFilter, screenFilter, isOwnerOrAdmin]);

  useEffect(() => {
    const timer = setTimeout(fetchLogs, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const loadMoreLogs = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    setTimeout(() => {
      const nextPage = page + 1;
      const nextBatch = allLogs.slice(0, nextPage * PAGE_SIZE);
      setDisplayedLogs(nextBatch);
      setPage(nextPage);
      setHasMore(nextBatch.length < allLogs.length);
      setLoadingMore(false);
    }, 300);
  }, [allLogs, page, hasMore, loadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) loadMoreLogs();
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => target && observer.unobserve(target);
  }, [hasMore, loading, loadingMore, loadMoreLogs]);

  const handleEditClick = (log) => {
    setEditingLog(log);
    setIsEditModalOpen(true);
  };

  const handleUpdateComplete = () => {
    setIsEditModalOpen(false);
    setEditingLog(null);
    fetchLogs();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session record?")) return;
    try {
      await logService.deleteLog(id);
      toast.success("Log record deleted");
      fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete log");
    }
  };

  // RBA Row Actions: Strict admin/owner edit & delete permissions
  const rowActions = (log) => {
    if (!isOwnerOrAdmin) {
      return [
        { label: `Session ${log.id || ""}`, icon: <Eye size={15} />, onClick: () => {} }
      ];
    }

    return [
      { label: "Edit Session", icon: <PencilSimple size={15} />, onClick: () => handleEditClick(log) },
      { type: "divider" },
      { label: "Delete Record", icon: <Trash size={15} />, danger: true, onClick: () => handleDelete(log._id) },
    ];
  };

  const hasExtraFilters = paymentFilter !== "all" || screenFilter !== "all";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 font-body text-main">
      {/* Top Header */}
      <div className="space-y-5 border-b border-border-divider/70 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
                Session Logs
              </h1>
              <span
                className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isOwnerOrAdmin
                    ? "border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan"
                    : "border-border-divider bg-card-panel text-sub"
                }`}
              >
                {isOwnerOrAdmin ? <Shield size={12} weight="fill" /> : <Eye size={12} />}
                {isOwnerOrAdmin ? "Owner View" : "Staff View"}
              </span>
            </div>
            <p className="mt-1 text-xs text-sub sm:text-sm">
              Track and search daily gaming sessions
              {isOwnerOrAdmin ? ", revenue breakdown, and station occupancy." : "."}
            </p>
          </div>

          <RevenueSummary logs={allLogs} isOwner={isOwnerOrAdmin} />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="space-y-3">
        {isOwnerOrAdmin ? (
          <Segmented
            label="Date Range"
            value={dateRange}
            onChange={setDateRange}
            options={DATE_RANGES}
          />
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-border-divider bg-card-panel p-3">
            <label htmlFor={dateInputId} className="shrink-0 font-mono text-xs font-semibold text-sub">
              Select Date:
            </label>
            <div className="relative w-44">
              <Calendar
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary-cyan"
              />
              <input
                id={dateInputId}
                type="date"
                value={specificDate}
                max={todayISO()}
                onChange={(e) => setSpecificDate(e.target.value)}
                className={`h-9 w-full rounded-lg border border-border-divider bg-app-bg pl-8 pr-2 font-mono text-xs font-bold text-main transition-colors focus:outline-none focus:border-primary-cyan ${FOCUS}`}
              />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlass
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub"
          />
          <input
            type="search"
            placeholder="Search by player name, log ID, or station..."
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`h-11 w-full rounded-xl border border-border-divider bg-card-panel pl-10 pr-9 text-sm text-main placeholder:text-sub/60 transition-colors focus:outline-none focus:border-primary-cyan ${FOCUS}`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className={`absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-sub transition-colors hover:text-main touch-manipulation ${FOCUS}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Owner-only: Payment & Station Cross-Filters */}
        {isOwnerOrAdmin && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-divider/70 bg-card-panel/70 p-3 text-xs shadow-sm">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sub">
              <Funnel size={13} aria-hidden="true" className="text-primary-cyan" />
              Filters
            </span>

            {/* Payment Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-sub font-mono">Payment</span>
              <div className="relative w-28">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className={COMPACT_SELECT}
                >
                  <option value="all">All</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="Card">Card</option>
                </select>
                <CaretDown
                  size={12}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sub"
                />
              </div>
            </div>

            {/* Station Screen Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-sub font-mono">Station</span>
              <div className="relative w-36">
                <select
                  value={screenFilter}
                  onChange={(e) => setScreenFilter(e.target.value)}
                  className={COMPACT_SELECT}
                >
                  {SCREEN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={12}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sub"
                />
              </div>
            </div>

            {hasExtraFilters && (
              <button
                type="button"
                onClick={() => {
                  setPaymentFilter("all");
                  setScreenFilter("all");
                }}
                className={`ml-auto font-mono text-xs font-semibold text-rose-400 hover:underline ${FOCUS}`}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loader variant="skeleton-table" lines={5} text="Loading session logs..." />
      ) : displayedLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border-divider bg-card-panel/40 p-10 text-center md:p-16">
          <div className="grid size-12 place-items-center rounded-2xl border border-border-divider bg-app-bg text-sub">
            <Clock size={24} aria-hidden="true" />
          </div>
          <h3 className="font-heading text-base font-bold text-main">No session logs found</h3>
          <p className="max-w-xs text-xs text-sub">
            {isOwnerOrAdmin
              ? "No gaming sessions match this range or filter."
              : "No sessions recorded for this selected date."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (< md breakpoint) */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {displayedLogs.map((log) => {
              const { dateStr, startTimeStr, endTimeStr } = formatSessionDateTime(log);

              return (
                <div
                  key={log._id}
                  className="space-y-3 rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border-divider/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-border-divider bg-app-bg px-2 py-0.5 font-mono text-[11px] font-bold text-primary-cyan">
                        {log.id}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px] text-sub">
                        <Calendar size={13} aria-hidden="true" />
                        {dateStr}
                      </span>
                    </div>

                    <Dropdown
                      align="right"
                      trigger={
                        <button
                          type="button"
                          aria-label="Session options"
                          className={`grid size-8 cursor-pointer place-items-center rounded-lg text-sub transition-colors hover:bg-app-bg hover:text-main touch-manipulation ${FOCUS}`}
                        >
                          <DotsThreeVertical size={18} weight="bold" aria-hidden="true" />
                        </button>
                      }
                      items={rowActions(log)}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h4 className="flex items-center gap-2 truncate text-base font-bold text-main">
                        <User size={16} aria-hidden="true" className="shrink-0 text-primary-cyan" />
                        <span className="truncate">{log.player}</span>
                      </h4>
                      <p className="flex items-center gap-1.5 text-xs text-sub font-mono">
                        <Monitor size={14} aria-hidden="true" className="text-sub" />
                        {log.screen}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-mono text-base font-bold tabular-nums text-emerald-400">
                        {formatINR(log.cost)}
                      </div>
                      <span className="mt-1 inline-block rounded-md border border-border-divider bg-app-bg px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-sub">
                        {log.payment}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-border-divider/60 bg-app-bg/60 px-3 py-2 text-xs text-sub">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="font-semibold text-main">{startTimeStr}</span>
                      <ArrowRight size={12} aria-hidden="true" />
                      <span className="font-semibold text-main">{endTimeStr}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock size={13} aria-hidden="true" className="text-primary-cyan" />
                      <span className="font-bold text-main">
                        {formatDurationDisplay(log.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout (≥ md breakpoint) */}
          <div className="hidden overflow-hidden rounded-2xl border border-border-divider bg-card-panel shadow-sm md:block">
            <table className="w-full text-left text-sm text-sub">
              <thead className="border-b border-border-divider bg-app-bg/80 font-mono text-[11px] uppercase tracking-wider text-sub">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Log ID</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Player</th>
                  <th className="px-5 py-3.5 font-semibold">Station</th>
                  <th className="px-5 py-3.5 font-semibold">Timing</th>
                  <th className="px-5 py-3.5 font-semibold">Duration</th>
                  <th className="px-5 py-3.5 font-semibold">Payment</th>
                  <th className="px-5 py-3.5 font-semibold">Cost</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider">
                {displayedLogs.map((log) => {
                  const { dateStr, startTimeStr, endTimeStr } = formatSessionDateTime(log);

                  return (
                    <tr
                      key={log._id}
                      className="transition-colors hover:bg-app-bg/40"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-primary-cyan">
                        {log.id}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-sub">{dateStr}</td>
                      <td className="px-5 py-3.5 font-semibold text-main">{log.player}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-main">{log.screen}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-main">
                          <span>{startTimeStr}</span>
                          <ArrowRight size={12} aria-hidden="true" className="text-sub" />
                          <span>{endTimeStr}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-main">
                        {formatDurationDisplay(log.duration)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md border border-border-divider bg-app-bg px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-sub">
                          {log.payment}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold tabular-nums text-emerald-400">
                        {formatINR(log.cost)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Dropdown
                          align="right"
                          trigger={
                            <button
                              type="button"
                              aria-label="Session options"
                              className={`grid size-8 cursor-pointer place-items-center rounded-lg text-sub transition-colors hover:bg-app-bg hover:text-main ${FOCUS}`}
                            >
                              <DotsThreeVertical size={18} weight="bold" aria-hidden="true" />
                            </button>
                          }
                          items={rowActions(log)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Infinite Scroll Controller */}
          <div ref={observerTarget} className="flex flex-col items-center justify-center py-6">
            {loadingMore ? (
              <Loader variant="spinner" text="Loading more logs..." />
            ) : hasMore ? (
              <button
                type="button"
                onClick={loadMoreLogs}
                className={`cursor-pointer rounded-xl border border-border-divider bg-card-panel px-5 py-2.5 text-xs font-semibold text-sub transition-colors hover:text-main ${FOCUS}`}
              >
                Load More ({allLogs.length - displayedLogs.length} remaining)
              </button>
            ) : (
              <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-sub/60">
                <Sparkle size={13} aria-hidden="true" className="text-primary-cyan" />
                End of Session Logs
              </p>
            )}
          </div>
        </>
      )}

      {/* Edit Log Modal */}
      <EditLogModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLog(null);
        }}
        logData={editingLog}
        onUpdateComplete={handleUpdateComplete}
      />
    </div>
  );
}
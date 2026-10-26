// src/pages/Logs.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Shield,
  Eye,
  Clock,
  Calendar,
  ArrowRight,
  Sparkle,
  PencilSimple,
  Trash,
  DotsThreeVertical,
  User,
  Monitor
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { logService } from "../services/logService";
import { formatINR } from "../utils/format";
import Dropdown from "../components/ui/Dropdown";
import Loader from "../components/ui/Loader";
import ConfirmModal from "../components/ui/ConfirmModal";
import RevenueSummary from "../components/logs/RevenueSummary";
import EditLogModal from "../components/logs/EditLogModal";
import StaffProfileModal from "../components/ui/StaffProfileModal";
import LogFilterBar from "../components/logs/LogFilterBar";

const PAGE_SIZE = 10;

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

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
  const [dateMode, setDateMode] = useState("range"); // "range" or "exact" for admin
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [screenFilter, setScreenFilter] = useState("all");

  const [editingLog, setEditingLog] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Profile Modal Showcase State
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);

  const observerTarget = useRef(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();

      if (isOwnerOrAdmin) {
        if (dateMode === "range") {
          params.dateRange = dateRange;
        } else {
          params.date = specificDate;
        }
      } else {
        params.date = specificDate;
      }

      if (paymentFilter !== "all") params.payment = paymentFilter;
      if (screenFilter !== "all") params.screen = screenFilter;

      const data = await logService.getLogs(params);
      console.log(data)
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
  }, [searchTerm, dateRange, specificDate, dateMode, paymentFilter, screenFilter, isOwnerOrAdmin]);

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

  const handleDeletePrompt = (id) => {
    setLogToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!logToDelete) return;
    try {
      await logService.deleteLog(logToDelete);
      toast.success("Log record deleted");
      fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete log");
    } finally {
      setLogToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const handleOpenProfile = (staffData, operatorName, fallbackName) => {
    if (staffData && typeof staffData === "object" && staffData._id) {
      setSelectedStaff(staffData);
    } else {
      setSelectedStaff({
        name: operatorName || fallbackName || "System Staff",
        username: "system",
        role: "operator",
        isActive: true,
      });
    }
    setIsProfileModalOpen(true);
  };

  const rowActions = (log) => {
    const logCreatorId = typeof log?.loggedBy === "object" ? log.loggedBy?._id?.toString() : log?.loggedBy?.toString();
    const currentUserId = user?._id?.toString();
    const isCreator = logCreatorId && currentUserId && logCreatorId === currentUserId;
    const canModify = isOwnerOrAdmin || isCreator;

    if (!canModify) {
      return [
        { label: `Session ${log?.id || ""}`, icon: <Eye size={15} />, onClick: () => {} }
      ];
    }

    return [
      { label: "Edit Session", icon: <PencilSimple size={15} />, onClick: () => handleEditClick(log) },
      { type: "divider" },
      { label: "Delete Record", icon: <Trash size={15} />, danger: true, onClick: () => handleDeletePrompt(log._id) },
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
              {/* <span
                className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isOwnerOrAdmin
                    ? "border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan"
                    : "border-border-divider bg-card-panel text-sub"
                }`}
              >
                {isOwnerOrAdmin ? <Shield size={12} weight="fill" /> : <Eye size={12} />}
                {isOwnerOrAdmin ? "Owner View" : "Staff View"}
              </span> */}
            </div>
            <p className="mt-1 text-xs text-sub sm:text-sm">
              Track and search daily gaming sessions
              {isOwnerOrAdmin ? ", revenue breakdown, and station occupancy." : "."}
            </p>
          </div>

          <RevenueSummary logs={allLogs} isOwner={isOwnerOrAdmin} />
        </div>
      </div>

      {/* Redesigned Unified Filter Toolbar Component with Admin Calendar Support */}
      <LogFilterBar
        isOwnerOrAdmin={isOwnerOrAdmin}
        dateRange={dateRange}
        setDateRange={setDateRange}
        specificDate={specificDate}
        setSpecificDate={setSpecificDate}
        dateMode={dateMode}
        setDateMode={setDateMode}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        screenFilter={screenFilter}
        setScreenFilter={setScreenFilter}
        hasExtraFilters={hasExtraFilters}
        onResetFilters={() => {
          setPaymentFilter("all");
          setScreenFilter("all");
        }}
      />

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
          {/* Mobile Card Layout */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {displayedLogs.map((log) => {
              const { dateStr, startTimeStr, endTimeStr } = formatSessionDateTime(log);
              const operatorObj = typeof log.loggedBy === "object" ? log.loggedBy : null;
              const operatorDisplayName = operatorObj?.name || log.operatorName || "System Staff";

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
                      
                      <button
                        type="button"
                        onClick={() => handleOpenProfile(operatorObj, operatorDisplayName)}
                        className="flex items-center gap-1.5 pt-1 text-left group cursor-pointer"
                      >
                        <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-full border border-border-divider bg-app-bg text-[9px] font-bold text-primary-cyan">
                          {operatorObj?.photoUrl ? (
                            <img src={operatorObj.photoUrl} alt="" className="size-full object-cover" />
                          ) : (
                            operatorDisplayName.charAt(0).toUpperCase()
                          )}
                        </span>
                        <span className="font-mono text-[10px] text-sub group-hover:text-primary-cyan transition-colors">
                          Logged by: <span className="text-main underline underline-offset-2">{operatorDisplayName}</span>
                        </span>
                      </button>
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

          {/* Desktop Table Layout */}
          <div className="hidden overflow-hidden rounded-2xl border border-border-divider bg-card-panel shadow-sm md:block">
            <table className="w-full text-left text-sm text-sub">
              <thead className="border-b border-border-divider bg-app-bg/80 font-mono text-[11px] uppercase tracking-wider text-sub">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Log ID</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Player</th>
                  <th className="px-5 py-3.5 font-semibold">Station</th>
                  <th className="px-5 py-3.5 font-semibold">Logged By</th>
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
                  const operatorObj = typeof log.loggedBy === "object" ? log.loggedBy : null;
                  const operatorDisplayName = operatorObj?.name || log.operatorName || "System Staff";

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
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(operatorObj, operatorDisplayName)}
                          className="flex items-center gap-2 group cursor-pointer text-left"
                        >
                          <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-full border border-border-divider bg-app-bg text-[10px] font-bold text-primary-cyan">
                            {operatorObj?.photoUrl ? (
                              <img src={operatorObj.photoUrl} alt="" className="size-full object-cover" />
                            ) : (
                              operatorDisplayName.charAt(0).toUpperCase()
                            )}
                          </span>
                          <span className="font-mono text-xs text-main group-hover:text-primary-cyan transition-colors underline underline-offset-2">
                            {operatorDisplayName}
                          </span>
                        </button>
                      </td>
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
                        {log.payment === 'Split' && log.splitDetails && (
                          <div className="mt-1 font-mono text-[9px] text-sub">
                            ₹{log.splitDetails.cashAmount}C / ₹{log.splitDetails.upiAmount}U
                          </div>
                        )}
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

      {/* Staff Profile Showcase Modal */}
      <StaffProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedStaff(null);
        }}
        staff={selectedStaff}
      />

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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setLogToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Session Record"
        message="Are you sure you want to delete this session record? This action cannot be undone."
        confirmText="Delete"
        danger={true}
      />
    </div>
  );
}
import React, { useState, useEffect, useCallback, useRef } from "react";
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
  TrendUp,
  Receipt,
  ArrowRight,
  Sparkle
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { logService } from "../services/logService";
import Dropdown from "../components/ui/Dropdown";
import Loader from "../components/ui/Loader";

const PAGE_SIZE = 10;

/**
 * Format session timestamp into detailed date & time components
 */
function formatSessionDateTime(log) {
  if (!log) {
    return { dateStr: "N/A", startTimeStr: "N/A", endTimeStr: "N/A" };
  }

  if (log.startTime && log.endTime) {
    const start = new Date(log.startTime);
    const end = new Date(log.endTime);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      return {
        dateStr: start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }),
        startTimeStr: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
        endTimeStr: end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
      };
    }
  }

  const timestamp = log.createdAt || log.timestamp;
  if (!timestamp) {
    return { dateStr: "N/A", startTimeStr: "N/A", endTimeStr: "N/A" };
  }

  const end = new Date(timestamp);
  if (isNaN(end.getTime())) {
    return { dateStr: "N/A", startTimeStr: "N/A", endTimeStr: "N/A" };
  }

  const parsedDuration = parseInt(log.duration, 10) || 0;
  const start = new Date(end.getTime() - parsedDuration * 60 * 1000);

  const dateStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const startTimeStr = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  const endTimeStr = end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return { dateStr, startTimeStr, endTimeStr };
}

export default function Logs() {
  const [allLogs, setAllLogs] = useState([]);
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today"); // "today" | "all" | "custom"
  const [customDate, setCustomDate] = useState("");

  // Modal edit state
  const [editingLog, setEditingLog] = useState(null);
  const [editFormData, setEditFormData] = useState({
    player: "",
    screen: "",
    duration: "",
    cost: "",
    payment: "UPI"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Observer ref for Scroll to Load More
  const observerTarget = useRef(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();

      if (dateFilter === "today") {
        const todayStr = new Date().toISOString().split("T")[0];
        params.date = todayStr;
      } else if (dateFilter === "custom" && customDate) {
        params.date = customDate;
      } else if (dateFilter === "all") {
        params.date = "all";
      }

      const data = await logService.getLogs(params);
      const safeLogs = Array.isArray(data) ? data : [];
      setAllLogs(safeLogs);
      setPage(1);
      setDisplayedLogs(safeLogs.slice(0, PAGE_SIZE));
      setHasMore(safeLogs.length > PAGE_SIZE);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to load session logs";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, dateFilter, customDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // Load More Function
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

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreLogs();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loading, loadingMore, loadMoreLogs]);

  const handleEditClick = (log) => {
    setEditingLog(log);
    setEditFormData({
      player: log.player || "",
      screen: log.screen || "",
      duration: log.duration || "",
      cost: log.cost !== undefined ? log.cost : "",
      payment: log.payment || "UPI"
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    setIsSubmitting(true);

    try {
      await logService.updateLog(editingLog._id, editFormData);
      toast.success("Log updated successfully");
      setEditingLog(null);
      fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update log");
    } finally {
      setIsSubmitting(false);
    }
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

  const totalRevenue = allLogs.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
  const totalSessions = allLogs.length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 text-main min-h-screen font-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-divider pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-main">
              Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-sub mt-1">
            Track, search, and manage daily player gaming sessions.
          </p>
        </div>

        {/* Top Summary Badges */}
        <div className="flex items-center gap-2.5">
          <div className="bg-card-panel border border-border-divider px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-sm">
            <TrendUp size={18} className="text-available" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-sub">Total Revenue</span>
              <span className="text-sm font-bold text-available font-mono">₹{totalRevenue}</span>
            </div>
          </div>
          <div className="bg-card-panel border border-border-divider px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-sm">
            <Receipt size={18} className="text-primary-cyan" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-sub">Sessions</span>
              <span className="text-sm font-bold text-main font-mono">{totalSessions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Controls Bar & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Date Tabs */}
        <div className="md:col-span-6 flex items-center gap-1 bg-card-panel p-1 rounded-xl border border-border-divider overflow-x-auto shadow-inner">
          <button
            type="button"
            onClick={() => {
              setDateFilter("today");
              setCustomDate("");
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
              dateFilter === "today"
                ? "bg-app-bg text-main border border-border-divider shadow-sm"
                : "text-sub hover:text-main"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              setDateFilter("all");
              setCustomDate("");
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
              dateFilter === "all"
                ? "bg-app-bg text-main border border-border-divider shadow-sm"
                : "text-sub hover:text-main"
            }`}
          >
            All Logs
          </button>

          <div className="flex items-center gap-1 pl-2 border-l border-border-divider">
            <Calendar size={15} className="text-sub ml-1" />
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilter("custom");
              }}
              className="bg-transparent text-xs text-main focus:outline-none p-1 rounded cursor-pointer font-mono"
            />
          </div>
        </div>

        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <MagnifyingGlass
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by player, log ID, or station..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card-panel border border-border-divider rounded-xl pl-10 pr-9 py-2 text-sm text-main placeholder-sub/60 focus:outline-none focus:border-primary-cyan focus:ring-1 focus:ring-primary-cyan transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sub hover:text-main"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Feed */}
      {loading ? (
        <Loader variant="skeleton-table" lines={5} text="Loading activity logs..." />
      ) : displayedLogs.length === 0 ? (
        <div className="border border-dashed border-border-divider rounded-2xl p-8 md:p-14 text-center bg-card-panel/40 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 bg-app-bg rounded-2xl flex items-center justify-center text-sub border border-border-divider shadow-sm">
            <Clock size={24} />
          </div>
          <h3 className="text-base font-bold text-main font-heading">No activity logs found</h3>
          <p className="text-xs text-sub max-w-xs">
            {dateFilter === "today"
              ? "No gaming sessions recorded today. Logs populate automatically as sessions checkout."
              : "No logs matching your specified date or search criteria."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {displayedLogs.map((log) => {
              const { dateStr, startTimeStr, endTimeStr } = formatSessionDateTime(log);

              return (
                <div
                  key={log._id}
                  className="bg-card-panel border border-border-divider rounded-2xl p-4 space-y-3.5 relative shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border-divider/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-app-bg border border-border-divider text-sub font-semibold">
                        {log.id}
                      </span>
                      <span className="text-xs font-medium text-sub flex items-center gap-1">
                        <Calendar size={13} className="text-sub" /> {dateStr}
                      </span>
                    </div>

                    <Dropdown
                      align="right"
                      trigger={
                        <button
                          type="button"
                          className="p-1 rounded-lg hover:bg-app-bg text-sub hover:text-main transition-colors"
                          aria-label="Session options"
                        >
                          <DotsThreeVertical size={20} weight="bold" />
                        </button>
                      }
                      items={[
                        {
                          label: "Edit Session",
                          icon: <PencilSimple size={16} />,
                          onClick: () => handleEditClick(log)
                        },
                        { type: "divider" },
                        {
                          label: "Delete Record",
                          icon: <Trash size={16} />,
                          danger: true,
                          onClick: () => handleDelete(log._id)
                        }
                      ]}
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-main flex items-center gap-2">
                        <User size={16} className="text-primary-cyan" /> {log.player}
                      </h4>
                      <p className="text-xs text-sub flex items-center gap-1.5">
                        <Monitor size={14} className="text-sub" /> {log.screen}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-available">₹{log.cost}</div>
                      <span className="inline-block mt-1 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-app-bg border border-border-divider text-sub font-bold">
                        {log.payment}
                      </span>
                    </div>
                  </div>

                  {/* Start, End Time & Duration */}
                  <div className="pt-2 border-t border-border-divider/60 flex items-center justify-between text-xs text-sub bg-app-bg/50 px-3 py-2 rounded-xl border border-border-divider/40">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-main font-medium">{startTimeStr}</span>
                      <ArrowRight size={12} className="text-sub" />
                      <span className="text-main font-medium">{endTimeStr}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock size={13} className="text-primary-cyan" />
                      <span className="font-mono font-bold text-main">{log.duration} min</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-card-panel border border-border-divider rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-sub">
              <thead className="bg-app-bg/80 text-[11px] text-sub uppercase font-mono tracking-wider border-b border-border-divider">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Log ID</th>
                  <th className="px-5 py-3.5 font-semibold">Date</th>
                  <th className="px-5 py-3.5 font-semibold">Player</th>
                  <th className="px-5 py-3.5 font-semibold">Station</th>
                  <th className="px-5 py-3.5 font-semibold">Timing (Start → End)</th>
                  <th className="px-5 py-3.5 font-semibold">Duration</th>
                  <th className="px-5 py-3.5 font-semibold">Payment</th>
                  <th className="px-5 py-3.5 font-semibold">Cost</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider/60">
                {displayedLogs.map((log) => {
                  const { dateStr, startTimeStr, endTimeStr } = formatSessionDateTime(log);

                  return (
                    <tr key={log._id} className="hover:bg-app-bg/40 transition-colors duration-150">
                      <td className="px-5 py-4 font-mono text-xs text-sub font-semibold">{log.id}</td>
                      <td className="px-5 py-4 text-xs font-medium text-sub">{dateStr}</td>
                      <td className="px-5 py-4 font-semibold text-main">{log.player}</td>
                      <td className="px-5 py-4 text-main">{log.screen}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-main">
                          <span>{startTimeStr}</span>
                          <ArrowRight size={12} className="text-sub" />
                          <span>{endTimeStr}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-sub">{log.duration} min</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full font-semibold bg-app-bg border border-border-divider text-sub">
                          {log.payment}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-available">₹{log.cost}</td>
                      <td className="px-5 py-4 text-right">
                        <Dropdown
                          align="right"
                          trigger={
                            <button
                              type="button"
                              className="p-1.5 text-sub hover:text-main hover:bg-app-bg rounded-lg transition-colors"
                              aria-label="Actions"
                            >
                              <DotsThreeVertical size={20} weight="bold" />
                            </button>
                          }
                          items={[
                            {
                              label: "Edit Session",
                              icon: <PencilSimple size={15} />,
                              onClick: () => handleEditClick(log)
                            },
                            { type: "divider" },
                            {
                              label: "Delete Record",
                              icon: <Trash size={15} />,
                              danger: true,
                              onClick: () => handleDelete(log._id)
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="py-6 flex flex-col items-center justify-center">
            {loadingMore ? (
              <Loader variant="spinner" text="Loading more records..." />
            ) : hasMore ? (
              <button
                type="button"
                onClick={loadMoreLogs}
                className="px-5 py-2.5 rounded-xl border border-border-divider bg-card-panel hover:bg-app-bg text-xs font-semibold text-sub hover:text-main transition-all shadow-sm"
              >
                Load More Logs ({allLogs.length - displayedLogs.length} remaining)
              </button>
            ) : (
              <p className="text-xs text-sub/60 font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Sparkle size={14} className="text-primary-cyan" /> End of Activity Log
              </p>
            )}
          </div>
        </>
      )}

      {/* Edit Log Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card-panel border border-border-divider rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setEditingLog(null)}
              className="absolute top-4 right-4 text-sub hover:text-main p-1 rounded-lg hover:bg-app-bg transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="font-heading text-lg font-bold text-main mb-1">Edit Session Record</h3>
            <p className="text-xs text-sub mb-5">
              Modify details for log entry <span className="font-mono text-primary-cyan font-bold">{editingLog.id}</span>
            </p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-main mb-1.5">Player Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.player}
                  onChange={(e) => setEditFormData({ ...editFormData, player: e.target.value })}
                  className="w-full bg-app-bg border border-border-divider rounded-xl px-3.5 py-2 text-sm text-main focus:outline-none focus:border-primary-cyan"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-main mb-1.5">Station / Screen</label>
                  <input
                    type="text"
                    required
                    value={editFormData.screen}
                    onChange={(e) => setEditFormData({ ...editFormData, screen: e.target.value })}
                    className="w-full bg-app-bg border border-border-divider rounded-xl px-3.5 py-2 text-sm text-main focus:outline-none focus:border-primary-cyan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-main mb-1.5">Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                    className="w-full bg-app-bg border border-border-divider rounded-xl px-3.5 py-2 text-sm text-main focus:outline-none focus:border-primary-cyan font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-main mb-1.5">Cost (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editFormData.cost}
                    onChange={(e) => setEditFormData({ ...editFormData, cost: e.target.value })}
                    className="w-full bg-app-bg border border-border-divider rounded-xl px-3.5 py-2 text-sm text-main focus:outline-none focus:border-primary-cyan font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-main mb-1.5">Payment Method</label>
                  <select
                    value={editFormData.payment}
                    onChange={(e) => setEditFormData({ ...editFormData, payment: e.target.value })}
                    className="w-full bg-app-bg border border-border-divider rounded-xl px-3.5 py-2 text-sm text-main focus:outline-none focus:border-primary-cyan"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="UPI/GPay">UPI/GPay</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-divider">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 text-xs text-sub hover:text-main rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold bg-main text-app-bg rounded-xl transition-all shadow-md disabled:opacity-50 hover:bg-main/90"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
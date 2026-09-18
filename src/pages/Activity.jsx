import React, { useState, useEffect } from "react";
import { CurrencyInr, Clock, MagnifyingGlass, ArrowsClockwise } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { logService } from "../services/logService";
import { toast } from "react-hot-toast";
import Loader from "../components/ui/Loader";

// Utility to format duration into hours and minutes
const formatDuration = (val) => {
  const mins = parseInt(val, 10);
  if (isNaN(mins) || mins === 0) return "-";
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${hrs}h ${m}m` : `${hrs}h`;
};

// Utility to reliably get start time
const getStartTime = (log) => {
  if (log.time) return log.time;
  if (log.createdAt) return new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return "-";
};

// Utility to calculate end time based on start time + duration
const getEndTime = (log) => {
  if (log.endTime) return log.endTime;
  const mins = parseInt(log.duration || log.durationMins || 0, 10);
  if (log.createdAt && !isNaN(mins)) {
    const start = new Date(log.createdAt);
    const end = new Date(start.getTime() + mins * 60000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return "-";
};

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

  const filteredLogs = activities.filter((log) => {
    const player = log.player || "";
    const logId = log.id || log._id || "";
    const screen = log.screen || log.screenName || "";

    return (
      player.toLowerCase().includes(searchTerm.toLowerCase()) ||
      logId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screen.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalRevenue = activities.reduce((sum, current) => sum + Number(current.cost || current.finalCost || 0), 0);
  const aggregateSessions = activities.length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="pb-5 border-b border-border-divider flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <span className="font-mono text-[10px] text-muted uppercase tracking-widest font-bold block mb-1">
            System Operations
          </span>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-main uppercase tracking-tight">
            Session Logs
          </h1>
          <p className="font-body text-xs text-sub mt-1 max-w-xl">
            Review completed sessions, player history, and total revenue collected.
          </p>
        </div>

        {/* Search & Refresh Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-sub text-sm" />
            <input
              type="text"
              placeholder="Search player, station or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card-panel border border-border-divider rounded-lg pl-9 pr-3 py-2.5 font-mono text-xs text-main placeholder:text-muted focus:outline-none focus:border-primary-cyan/50 transition-colors"
            />
          </div>
          
          <button
            onClick={() => fetchLogs(true)}
            disabled={loading || isRefreshing}
            className="shrink-0 p-2.5 rounded-lg bg-card-panel border border-border-divider hover:bg-app-bg text-sub hover:text-primary-cyan hover:border-primary-cyan/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group outline-none"
            title="Refresh Logs"
          >
            <ArrowsClockwise 
              size={18} 
              weight="bold"
              className={isRefreshing ? "animate-spin text-primary-cyan" : "group-hover:rotate-180 transition-transform duration-500"} 
            />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card-panel border border-border-divider rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-available/10 text-available text-xl">
            <CurrencyInr size={24} weight="fill" />
          </div>
          <div>
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider block font-bold">Revenue Collected</span>
            <h3 className="font-mono text-2xl font-bold text-main">₹{totalRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-card-panel border border-border-divider rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary-cyan/10 text-primary-cyan text-xl">
            <Clock size={24} weight="fill" />
          </div>
          <div>
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider block font-bold">Completed Sessions</span>
            <h3 className="font-mono text-2xl font-bold text-main">{aggregateSessions}</h3>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card-panel border border-border-divider rounded-xl overflow-hidden shadow-sm">
        {loading && !isRefreshing ? (
          <div className="p-6">
            <Loader variant="skeleton-table" lines={5} />
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block lg:hidden divide-y divide-border-divider">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs text-muted uppercase">
                  No session logs found.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log._id || log.id} className="p-4 space-y-3 hover:bg-app-bg/40 transition-colors">
                    <div className="flex items-center justify-between font-mono text-xs border-b border-border-divider/50 pb-2">
                      <span className="font-bold text-primary-cyan">#{log.id?.slice(-6) || log._id?.slice(-6)}</span>
                      <span className="px-2 py-0.5 rounded bg-app-bg border border-border-divider text-[10px] uppercase text-main">
                        {log.payment || log.paymentType}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm font-bold text-main">{log.player}</span>
                      <span className="font-mono text-sm font-bold text-available">₹{log.cost || log.finalCost}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 font-mono text-[10px] bg-app-bg/50 p-2 rounded-lg border border-border-divider/50">
                      <div className="space-y-1">
                        <span className="text-muted block uppercase">Station</span>
                        <span className="text-sub font-bold">{log.screen || log.screenName}</span>
                      </div>
                      <div className="space-y-1 text-right">
                        <span className="text-muted block uppercase">Duration</span>
                        <span className="text-sub font-bold">{formatDuration(log.duration || log.durationMins)}</span>
                      </div>
                      <div className="space-y-1 col-span-2 flex justify-between border-t border-border-divider/50 pt-2 mt-1">
                        <div>
                          <span className="text-muted block uppercase">Start</span>
                          <span className="text-sub">{getStartTime(log)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-muted block uppercase">End</span>
                          <span className="text-sub">{getEndTime(log)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border-divider bg-app-bg/50 font-mono text-[11px] uppercase tracking-wider text-muted font-bold">
                    <th className="px-5 py-4">Log ID</th>
                    <th className="px-5 py-4">Player</th>
                    <th className="px-5 py-4">Station & Mode</th>
                    <th className="px-5 py-4">Start Time</th>
                    <th className="px-5 py-4">End Time</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-divider font-mono text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-muted uppercase tracking-widest">
                        No session logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id || log.id} className="hover:bg-app-bg/40 transition-colors group">
                        <td className="px-5 py-4 font-bold text-primary-cyan">
                          {log.id?.slice(-8) || log._id?.slice(-8)}
                        </td>
                        <td className="px-5 py-4 font-body font-semibold text-main text-sm">
                          {log.player}
                        </td>
                        <td className="px-5 py-4 text-sub font-bold">
                          {log.screen || log.screenName}
                        </td>
                        <td className="px-5 py-4 text-muted group-hover:text-sub transition-colors">
                          {getStartTime(log)}
                        </td>
                        <td className="px-5 py-4 text-muted group-hover:text-sub transition-colors">
                          {getEndTime(log)}
                        </td>
                        <td className="px-5 py-4 text-main font-bold">
                          {formatDuration(log.duration || log.durationMins)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-1 rounded-md bg-app-bg border border-border-divider text-[10px] uppercase font-bold text-main">
                            {log.payment || log.paymentType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-available text-sm">
                          ₹{log.cost || log.finalCost}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
} 
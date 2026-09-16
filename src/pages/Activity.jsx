// src/pages/Activity.jsx
import React, { useState, useEffect } from "react";
import { PiCurrencyInr, PiClock, PiMagnifyingGlass } from "react-icons/pi";
import { logService } from "../services/logService";
import { toast } from "react-hot-toast";

export default function Activity() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await logService.getLogs();
      setActivities(Array.isArray(data) ? data : data.logs || []);
    } catch (err) {
      toast.error(err.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border-divider flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[11px] text-muted uppercase tracking-widest font-semibold">
              Activity
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-main uppercase tracking-tight">
            Session Logs
          </h1>
          <p className="text-sub text-xs sm:text-sm mt-1 max-w-xl">
            Review completed sessions, player activity, and payments collected at the lounge.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-sub text-sm" />
          <input
            type="text"
            placeholder="Search player or log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card-panel border border-border-divider rounded-lg pl-9 pr-3 py-2 font-mono text-xs text-main placeholder:text-muted focus:outline-none focus:border-sub transition-colors"
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card-panel border border-border-divider rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-app-bg border border-border-divider text-available text-xl">
            <PiCurrencyInr />
          </div>
          <div>
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider block">Revenue Collected</span>
            <h3 className="font-mono text-2xl font-bold text-main">₹{totalRevenue}</h3>
          </div>
        </div>

        <div className="bg-card-panel border border-border-divider rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-app-bg border border-border-divider text-primary-cyan text-xl">
            <PiClock />
          </div>
          <div>
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider block">Completed Sessions</span>
            <h3 className="font-mono text-2xl font-bold text-main">{aggregateSessions} Sessions</h3>
          </div>
        </div>
      </div>

      {/* Logs Table / Card Layout */}
      <div className="bg-card-panel border border-border-divider rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-muted uppercase animate-pulse">
            Loading session logs...
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="block md:hidden divide-y divide-border-divider">
              {filteredLogs.length === 0 ? (
                <div className="p-6 text-center font-mono text-xs text-muted uppercase">
                  No sessions found.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log._id || log.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary-cyan">{log.id || log._id}</span>
                      <span className="font-mono text-xs text-muted">{log.time || new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body text-sm font-medium text-main">{log.player}</span>
                      <span className="font-mono text-sm font-bold text-available">₹{log.cost || log.finalCost}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-sub">
                      <span>{log.screen || log.screenName}</span>
                      <span className="px-2 py-0.5 rounded bg-app-bg border border-border-divider text-[10px] uppercase">
                        {log.payment || log.paymentType}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-divider bg-app-bg/50 font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="px-5 py-3.5">Log ID</th>
                    <th className="px-5 py-3.5">Player</th>
                    <th className="px-5 py-3.5">Station & Mode</th>
                    <th className="px-5 py-3.5">Time</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-divider font-mono text-xs">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-muted uppercase">
                        No sessions found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id || log.id} className="hover:bg-app-bg/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-primary-cyan">{log.id || log._id}</td>
                        <td className="px-5 py-4 font-body font-medium text-main">{log.player}</td>
                        <td className="px-5 py-4 text-sub">{log.screen || log.screenName}</td>
                        <td className="px-5 py-4 text-muted">{log.time || new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-5 py-4 text-sub">{log.duration ? `${log.duration} Mins` : `${log.durationMins} Mins`}</td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-1 rounded bg-app-bg border border-border-divider text-[10px] uppercase text-main">
                            {log.payment || log.paymentType}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-available">₹{log.cost || log.finalCost}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
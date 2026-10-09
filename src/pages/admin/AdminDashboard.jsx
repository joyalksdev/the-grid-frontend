// src/pages/admin/AnalyticsDashboard.jsx
import React, { useState, useEffect, useMemo, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CurrencyInr,
  Clock,
  QrCode,
  CaretDown,
  DownloadSimple,
  Sparkle,
  GameController,
  Lightning,
  ArrowClockwise,
  Trophy,
  Monitor
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { logService } from "../../services/logService";
import { socket } from "../../services/socket";
import { formatINR } from "../../utils/format";
import Loader from "../../components/ui/Loader";

// Modular Subcomponents
import LiveScreensGrid from "../../components/admin/LiveScreensGrid";
import RevenueChart from "../../components/admin/RevenueChart";
import StationDistribution from "../../components/admin/StationDistribution";
import TopPlayersLeaderboard from "../../components/admin/TopPlayersLeaderboard";
import OperationalHealth from "../../components/admin/OperationalHealth";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "3m", label: "Last 3 Months" },
  { value: "all", label: "All Time" }
];

function MetricCard({ title, value, subtext, icon: Icon, toneColor }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="relative overflow-hidden rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-sub">
          {title}
        </span>
        <div className={`grid size-9 place-items-center rounded-xl bg-app-bg/80 ${toneColor}`}>
          <Icon size={18} weight="bold" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <p className="font-mono text-2xl font-extrabold tabular-nums text-main md:text-3xl">
          {value}
        </p>
      </div>

      {subtext && <p className="mt-2 text-xs text-sub/80">{subtext}</p>}
    </motion.div>
  );
}

export default function AnalyticsDashboard() {
  const rangeSelectId = useId();
  const [selectedRange, setSelectedRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  // Aggregated Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const data = await logService.getAnalytics({ range: selectedRange });
      setAnalyticsData(data);
    } catch (error) {
      toast.error("Failed to load analytics dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedRange]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    const handleScreenUpdated = () => {
      fetchAnalyticsData();
    };

    const handleLogAdded = () => {
      fetchAnalyticsData();
    };

    socket.on("screen_updated", handleScreenUpdated);
    socket.on("log_added", handleLogAdded);

    return () => {
      socket.off("screen_updated", handleScreenUpdated);
      socket.off("log_added", handleLogAdded);
    };
  }, [selectedRange]);

  const { summary, chartData, stationList, topPlayers, hardwareStats, taskStats, screens } = useMemo(() => {
    return {
      summary: analyticsData?.summary || {
        totalRevenue: 0,
        cashRevenue: 0,
        upiRevenue: 0,
        totalSessions: 0,
        avgRevenuePerSession: 0,
        avgDurationMins: 0,
        peakHourFormatted: "N/A"
      },
      chartData: analyticsData?.chartData || [],
      stationList: analyticsData?.stationList || [],
      topPlayers: analyticsData?.topPlayers || [],
      hardwareStats: analyticsData?.hardwareStats || {
        totalRepairExpenses: 0,
        totalIssuesReported: 0,
        activeDevices: 0,
        maintenanceDevices: 0
      },
      taskStats: analyticsData?.taskStats || {
        totalTasks: 0,
        completed: 0,
        pending: 0,
        completionRatePct: 0
      },
      screens: analyticsData?.screens || []
    };
  }, [analyticsData]);

  const handleExportFullReport = () => {
    if (!analyticsData) {
      toast.error("No data available to export");
      return;
    }

    const rows = [
      ["Metric", "Value"],
      ["Timeframe", selectedRange],
      ["Total Revenue", summary.totalRevenue],
      ["Cash Revenue", summary.cashRevenue],
      ["UPI Revenue", summary.upiRevenue],
      ["Total Sessions", summary.totalSessions],
      ["Avg Rev / Session", summary.avgRevenuePerSession],
      ["Busiest Peak Hour", summary.peakHourFormatted],
      ["Active Hardware Devices", hardwareStats.activeDevices],
      ["Devices Under Maintenance", hardwareStats.maintenanceDevices],
      ["Total Repair Expenses", hardwareStats.totalRepairExpenses],
      ["Task Completion Rate", `${taskStats.completionRatePct}%`]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TheGrid_Analytics_Report_${selectedRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Analytics report exported successfully");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 font-body text-main">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-border-divider/80 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
              Business Analytics
            </h1>
            <span className="flex items-center gap-1 rounded-full border border-primary-cyan/30 bg-primary-cyan/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-cyan">
              <Sparkle size={12} weight="fill" /> Owner Control
            </span>
          </div>
          <p className="mt-1 text-xs text-sub sm:text-sm">
            Monitor lounge revenue, live console states, station occupancy, and peak gaming hours.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[150px] flex-1 sm:flex-initial">
            <select
              id={rangeSelectId}
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className={`h-10 w-full appearance-none cursor-pointer rounded-xl border border-border-divider/80 bg-card-panel pl-3.5 pr-9 font-mono text-xs font-semibold text-main transition-colors hover:border-sub ${FOCUS_RING}`}
            >
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub" />
          </div>

          <button
            type="button"
            onClick={fetchAnalyticsData}
            className={`grid size-10 place-items-center rounded-xl border border-border-divider/80 bg-card-panel text-sub transition-colors hover:text-main ${FOCUS_RING}`}
            title="Refresh analytics data"
          >
            <ArrowClockwise size={18} />
          </button>

          <button
            type="button"
            onClick={handleExportFullReport}
            className={`flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-main px-4 font-mono text-xs font-bold text-app-bg transition-colors hover:bg-main/90 ${FOCUS_RING}`}
          >
            <DownloadSimple size={16} weight="bold" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <Loader variant="skeleton-card" lines={3} text="Aggregating lounge analytics..." />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedRange}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Live Console Screens Grid */}
            <LiveScreensGrid screens={screens} />

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Period Gross Revenue"
                value={formatINR(summary.totalRevenue)}
                subtext="Total earnings in selected range"
                icon={CurrencyInr}
                toneColor="text-emerald-400"
              />
              <MetricCard
                title="Sessions Served"
                value={summary.totalSessions}
                subtext="Completed checkout sessions"
                icon={GameController}
                toneColor="text-primary-cyan"
              />
              <MetricCard
                title="Avg / Session"
                value={formatINR(summary.avgRevenuePerSession)}
                subtext={`Avg duration: ${summary.avgDurationMins} min`}
                icon={Clock}
                toneColor="text-sky-400"
              />
              <MetricCard
                title="Busiest Hour"
                value={summary.peakHourFormatted}
                subtext="Peak customer traffic slot"
                icon={Lightning}
                toneColor="text-amber-400"
              />
            </div>

            {/* Row 1: Chart & Payment Split */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Daily Revenue Bar Chart */}
              <div className="space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm lg:col-span-8">
                <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
                  <div>
                    <h2 className="font-heading text-base font-bold text-main">Revenue Trend</h2>
                    <p className="text-xs text-sub">Daily revenue breakdown across stations</p>
                  </div>
                  <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400">
                    {formatINR(summary.totalRevenue)} Total
                  </span>
                </div>

                <RevenueChart data={chartData} />
              </div>

              {/* Payment Split Card */}
              <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm lg:col-span-4">
                <div className="border-b border-border-divider/60 pb-3">
                  <h2 className="font-heading text-base font-bold text-main">Payment Split</h2>
                  <p className="text-xs text-sub">Cash vs digital UPI collections</p>
                </div>

                <div className="my-auto space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="flex items-center gap-1.5 text-sub">
                        <CurrencyInr size={14} className="text-emerald-400" /> Cash Received
                      </span>
                      <span className="font-bold text-emerald-400">{formatINR(summary.cashRevenue)}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full border border-border-divider bg-app-bg">
                      <div
                        style={{
                          width: `${
                            summary.totalRevenue
                              ? Math.round((summary.cashRevenue / summary.totalRevenue) * 100)
                              : 0
                          }%`
                        }}
                        className="h-full bg-emerald-400 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="flex items-center gap-1.5 text-sub">
                        <QrCode size={14} className="text-sky-400" /> UPI / GPay Digital
                      </span>
                      <span className="font-bold text-sky-400">{formatINR(summary.upiRevenue)}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full border border-border-divider bg-app-bg">
                      <div
                        style={{
                          width: `${
                            summary.totalRevenue
                              ? Math.round((summary.upiRevenue / summary.totalRevenue) * 100)
                              : 0
                          }%`
                        }}
                        className="h-full bg-sky-400 transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 rounded-xl border border-border-divider/60 bg-app-bg/50 p-3 font-mono text-xs text-sub">
                  <div className="flex justify-between">
                    <span>Digital Ratio:</span>
                    <span className="font-bold text-main">
                      {summary.totalRevenue
                        ? Math.round((summary.upiRevenue / summary.totalRevenue) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Ratio:</span>
                    <span className="font-bold text-main">
                      {summary.totalRevenue
                        ? Math.round((summary.cashRevenue / summary.totalRevenue) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Station Occupancy & Top Players */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm lg:col-span-7">
                <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
                  <div>
                    <h2 className="font-heading text-base font-bold text-main">Station Occupancy & Revenue</h2>
                    <p className="text-xs text-sub">Performance metrics by console station</p>
                  </div>
                  <Monitor size={20} className="text-primary-cyan" />
                </div>

                <StationDistribution stationData={stationList} />
              </div>

              <div className="space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm lg:col-span-5">
                <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
                  <div>
                    <h2 className="font-heading text-base font-bold text-main">Top Gamers Leaderboard</h2>
                    <p className="text-xs text-sub">High value players by total spend</p>
                  </div>
                  <Trophy size={20} className="text-amber-400" />
                </div>

                <TopPlayersLeaderboard players={topPlayers} />
              </div>
            </div>

            {/* Row 3: Operational Health */}
            <OperationalHealth hardwareStats={hardwareStats} taskStats={taskStats} />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
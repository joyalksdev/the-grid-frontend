// src/components/admin/OperationalHealth.jsx
import React from "react";
import { motion } from "framer-motion";
import { HardDrives, CheckSquareOffset } from "@phosphor-icons/react";
import { formatINR } from "../../utils/format";

export default function OperationalHealth({ hardwareStats, taskStats }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Hardware Health Metrics */}
      <div className="space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
          <div className="flex items-center gap-2">
            <HardDrives size={18} className="text-primary-cyan" />
            <h2 className="font-heading text-base font-bold text-main">Hardware & Device Health</h2>
          </div>
          <span className="font-mono text-xs font-bold text-sub">
            {hardwareStats.activeDevices} Active Devices
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 rounded-xl border border-border-divider/60 bg-app-bg/50 p-3.5">
            <span className="font-mono text-[10px] uppercase text-sub">Repair Expenses</span>
            <p className="font-mono text-lg font-bold text-rose-400">
              {formatINR(hardwareStats.totalRepairExpenses)}
            </p>
            <p className="text-[10px] text-sub">Service logs logged</p>
          </div>

          <div className="space-y-1 rounded-xl border border-border-divider/60 bg-app-bg/50 p-3.5">
            <span className="font-mono text-[10px] uppercase text-sub">Maintenance Devices</span>
            <p className="font-mono text-lg font-bold text-amber-400">
              {hardwareStats.maintenanceDevices} Devices
            </p>
            <p className="text-[10px] text-sub">{hardwareStats.totalIssuesReported} issues logged</p>
          </div>
        </div>
      </div>

      {/* Staff Task Performance */}
      <div className="space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
          <div className="flex items-center gap-2">
            <CheckSquareOffset size={18} className="text-emerald-400" />
            <h2 className="font-heading text-base font-bold text-main">Staff Task Performance</h2>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-400">
            {taskStats.completionRatePct}% Completed
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-sub">Completed: {taskStats.completed}</span>
            <span className="text-sub">Pending: {taskStats.pending}</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full border border-border-divider/80 bg-app-bg">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taskStats.completionRatePct}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full bg-emerald-400"
            />
          </div>

          <p className="font-mono text-[11px] text-sub">
            {taskStats.completed} of {taskStats.totalTasks} staff tasks completed and verified.
          </p>
        </div>
      </div>
    </div>
  );
}
// src/components/admin/OperationalHealth.jsx
import React from "react";
import { motion } from "framer-motion";
import { HardDrives, CheckSquareOffset } from "@phosphor-icons/react";
import { formatINR } from "../../utils/format";

export default function OperationalHealth({ hardwareStats, taskStats }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Hardware Health Metrics */}
      <div className="space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm lg:col-span-6 transition-colors hover:border-border-divider">
        <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg border border-border-divider bg-app-bg text-primary-cyan">
              <HardDrives size={16} weight="fill" />
            </div>
            <h2 className="font-heading text-base font-bold text-main">Hardware & Device Health</h2>
          </div>
          <span className="rounded-lg border border-border-divider bg-app-bg px-2.5 py-1 font-mono text-xs font-bold text-sub">
            {hardwareStats.activeDevices} Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 rounded-xl border border-border-divider/60 bg-app-bg/50 p-3.5 transition-colors hover:border-border-divider">
            <span className="font-mono text-[10px] uppercase tracking-wider text-sub">Repair Expenses</span>
            <p className="font-mono text-lg font-bold text-rose-400">
              {formatINR(hardwareStats.totalRepairExpenses)}
            </p>
            <p className="text-[10px] text-sub">Service logs recorded</p>
          </div>

          <div className="space-y-1 rounded-xl border border-border-divider/60 bg-app-bg/50 p-3.5 transition-colors hover:border-border-divider">
            <span className="font-mono text-[10px] uppercase tracking-wider text-sub">Maintenance</span>
            <p className="font-mono text-lg font-bold text-amber-400">
              {hardwareStats.maintenanceDevices} Devices
            </p>
            <p className="text-[10px] text-sub">{hardwareStats.totalIssuesReported} issues logged</p>
          </div>
        </div>
      </div>

      {/* Staff Task Performance */}
      <div className="space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel p-5 shadow-sm lg:col-span-6 transition-colors hover:border-border-divider">
        <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg border border-border-divider bg-app-bg text-emerald-400">
              <CheckSquareOffset size={16} weight="fill" />
            </div>
            <h2 className="font-heading text-base font-bold text-main">Staff Task Performance</h2>
          </div>
          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400">
            {taskStats.completionRatePct}% Completed
          </span>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-sub">Completed: <strong className="text-main">{taskStats.completed}</strong></span>
            <span className="text-sub">Pending: <strong className="text-main">{taskStats.pending}</strong></span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full border border-border-divider/80 bg-app-bg p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taskStats.completionRatePct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r.from-emerald-500 bg-emerald-400 shadow-sm shadow-emerald-500/20"
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
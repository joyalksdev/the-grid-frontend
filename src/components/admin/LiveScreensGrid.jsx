// src/components/admin/LiveScreensGrid.jsx
import React from "react";
import { motion } from "framer-motion";
import { Monitor, User, Clock, CurrencyInr } from "@phosphor-icons/react";
import { formatINR } from "../../utils/format";

export default function LiveScreensGrid({ screens }) {
  if (!screens || screens.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-divider/70 bg-app-bg/40 p-6 text-center font-mono text-xs text-sub">
        No active gaming consoles configured.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-border-divider/60 pb-2">
        <h2 className="font-heading text-base font-bold text-main">Live Screen Status</h2>
        <span className="font-mono text-xs text-sub">
          {screens.filter((s) => s.status === "occupied").length} / {screens.length} Occupied
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {screens.map((screen) => {
          const isOccupied = screen.status === "occupied";
          const session = screen.activeSession;

          return (
            <motion.div
              key={screen._id || screen.screenId}
              whileHover={{ y: -2 }}
              className={`relative flex flex-col justify-between rounded-2xl border p-3.5 backdrop-blur-md transition-all ${
                isOccupied
                  ? "border-occupied/40 bg-occupied/10 shadow-lg shadow-occupied/5"
                  : "border-border-divider/80 bg-card-panel/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-main">{screen.name}</span>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                    isOccupied
                      ? "border border-occupied/30 bg-occupied/20 text-occupied"
                      : "border border-available/30 bg-available/10 text-available"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      isOccupied ? "bg-occupied animate-pulse" : "bg-available"
                    }`}
                  />
                  {isOccupied ? "Playing" : "Free"}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {isOccupied && session ? (
                  <>
                    <div className="flex items-center gap-1.5 truncate text-xs font-semibold text-main">
                      <User size={13} className="shrink-0 text-primary-cyan" />
                      <span className="truncate">{session.player || "Guest"}</span>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[11px] text-sub">
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-sub" />
                        {session.duration} min
                      </span>
                      <span className="font-bold text-emerald-400">
                        {formatINR(session.estimatedCost || 0)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-2 text-center font-mono text-[11px] text-sub/60">
                    Console Ready
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
// src/components/notifications/ImportantNotificationModal.jsx
import React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Megaphone,
  WarningCircle,
  CheckCircle,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";
import { useNotifications } from "../../context/NotificationContext";

export default function ImportantNotificationModal() {
  const { activeModalNotification, acknowledgeModal } = useNotifications();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  if (!activeModalNotification) return null;

  const isCritical = activeModalNotification.priority === "critical";

  const handleAcknowledge = () => {
    acknowledgeModal(activeModalNotification._id);
  };

  const handleOpenLink = () => {
    const url = activeModalNotification.actionUrl;
    acknowledgeModal(activeModalNotification._id);
    if (url) {
      navigate(url);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 font-body">
        {/* Backdrop */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          role="alertdialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", damping: 28, stiffness: 340 }
          }
          className={`relative z-10 w-full max-w-md overflow-hidden rounded-2xl border bg-card-panel shadow-2xl ${
            isCritical
              ? "border-rose-500/50 shadow-rose-500/15"
              : "border-primary-cyan/50 shadow-primary-cyan/15"
          }`}
        >
          {/* Top Accent Banner */}
          <div
            className={`px-6 py-4 border-b flex items-center justify-between ${
              isCritical
                ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                : "bg-primary-cyan/15 border-primary-cyan/30 text-primary-cyan"
            }`}
          >
            <div className="flex items-center gap-2 font-mono text-xs font-extrabold uppercase tracking-wider">
              {isCritical ? (
                <WarningCircle size={18} weight="fill" />
              ) : (
                <Megaphone size={18} weight="fill" />
              )}
              <span>
                {isCritical ? "Critical Staff Alert" : "New Staff Update"}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-app-bg/60 px-2.5 py-0.5 font-mono text-[10px] font-bold text-main">
              <Sparkle size={11} weight="fill" /> From{" "}
              {activeModalNotification.createdByName || "Admin"}
            </span>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="font-heading text-xl font-extrabold tracking-wide text-main">
                {activeModalNotification.title}
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm text-sub leading-relaxed">
                {activeModalNotification.message}
              </p>
            </div>

            <div className="rounded-xl border border-border-divider bg-app-bg/70 px-3.5 py-2.5 flex items-center justify-between text-[11px] font-mono text-sub">
              <span>
                Posted{" "}
                {new Date(
                  activeModalNotification.createdAt || Date.now()
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-primary-cyan font-bold">
                Requires Staff Acknowledgement
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              {activeModalNotification.actionUrl && (
                <button
                  type="button"
                  onClick={handleOpenLink}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border-divider bg-app-bg px-4 text-xs font-bold text-main hover:border-primary-cyan/40 cursor-pointer transition-colors"
                >
                  <span>View Section</span>
                  <ArrowRight size={14} />
                </button>
              )}

              <button
                type="button"
                onClick={handleAcknowledge}
                className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-extrabold cursor-pointer transition-opacity hover:opacity-90 ${
                  isCritical
                    ? "bg-rose-500 text-white"
                    : "bg-primary-cyan text-app-bg"
                }`}
              >
                <CheckCircle size={16} weight="bold" />
                <span>Got It, Acknowledge</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

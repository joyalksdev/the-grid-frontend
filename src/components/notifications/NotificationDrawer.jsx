// src/components/notifications/NotificationDrawer.jsx
import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Checks,
  CalendarCheck,
  Megaphone,
  WarningCircle,
  CheckCircle,
  Clock,
  X,
  ArrowRight,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

const TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "bookings", label: "Bookings" },
  { id: "updates", label: "Updates" },
];

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diffSec = Math.max(
    0,
    Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  );
  if (diffSec < 60) return "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getNotificationVisual(item) {
  if (item.type === "booking_pending") {
    return {
      icon: Clock,
      tone: "text-amber-400 bg-amber-400/10 border-amber-400/30",
      badge: "GTA 6 Pending",
      badgeClass: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    };
  }
  if (item.type === "booking_confirmed") {
    return {
      icon: CheckCircle,
      tone: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
      badge: "Confirmed",
      badgeClass: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    };
  }
  if (item.priority === "critical") {
    return {
      icon: WarningCircle,
      tone: "text-rose-400 bg-rose-400/10 border-rose-400/30",
      badge: "Critical Alert",
      badgeClass: "text-rose-400 bg-rose-400/10 border-rose-400/30",
    };
  }
  if (item.type === "announcement" || item.priority === "important") {
    return {
      icon: Megaphone,
      tone: "text-primary-cyan bg-primary-cyan/10 border-primary-cyan/30",
      badge: item.priority === "important" ? "Important Update" : "Staff Update",
      badgeClass: "text-primary-cyan bg-primary-cyan/10 border-primary-cyan/30",
    };
  }
  return {
    icon: CalendarCheck,
    tone: "text-sub bg-app-bg border-border-divider",
    badge: "System",
    badgeClass: "text-sub bg-app-bg border-border-divider",
  };
}

export default function NotificationDrawer() {
  const {
    notifications,
    unreadCount,
    isDrawerOpen,
    closeDrawer,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState("all");
  const isAdminOrOwner = ["admin", "owner"].includes(user?.role);

  useEffect(() => {
    if (!isDrawerOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const filtered = useMemo(() => {
    if (activeTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    if (activeTab === "bookings") {
      return notifications.filter((n) =>
        String(n.type || "").startsWith("booking")
      );
    }
    if (activeTab === "updates") {
      return notifications.filter((n) => n.type === "announcement");
    }
    return notifications;
  }, [notifications, activeTab]);

  const handleItemClick = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    if (item.actionUrl) {
      closeDrawer();
      navigate(item.actionUrl);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[900] flex justify-end font-body">
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/65 backdrop-blur-xs"
          />

          {/* Right Slide-Over Drawer */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Notifications Drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", damping: 32, stiffness: 340 }
            }
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border-divider bg-card-panel text-main shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-divider px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl border border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan">
                  <Bell size={18} weight="fill" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-base font-bold uppercase tracking-wide text-main">
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary-cyan px-2 py-0.5 font-mono text-[10px] font-extrabold text-app-bg">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-sub">
                    Real-time GTA 6 slot locks &amp; staff updates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="inline-flex items-center gap-1 rounded-lg border border-border-divider bg-app-bg px-2.5 py-1.5 text-[11px] font-semibold text-sub hover:text-primary-cyan cursor-pointer transition-colors"
                  >
                    <Checks size={14} /> Read All
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close drawer"
                  className="grid size-8 place-items-center rounded-lg text-sub hover:bg-app-bg hover:text-main cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-border-divider bg-app-bg/50 px-5 py-2.5 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      active
                        ? "bg-primary-cyan text-app-bg font-bold shadow-xs"
                        : "text-sub hover:text-main"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border-divider/60 p-3 space-y-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <Bell size={32} className="text-sub/50 mb-2" />
                  <p className="text-sm font-bold text-main">All caught up!</p>
                  <p className="text-xs text-sub mt-0.5">
                    New GTA 6 WhatsApp bookings and staff updates will appear here in real time.
                  </p>
                </div>
              ) : (
                filtered.map((item) => {
                  const visual = getNotificationVisual(item);
                  const Icon = visual.icon;

                  return (
                    <div
                      key={item._id}
                      onClick={() => handleItemClick(item)}
                      className={`group relative rounded-xl border p-3.5 transition-all ${
                        item.actionUrl ? "cursor-pointer" : ""
                      } ${
                        !item.isRead
                          ? "border-primary-cyan/30 bg-primary-cyan/[0.04] hover:bg-primary-cyan/[0.08]"
                          : "border-border-divider/70 bg-app-bg/40 hover:border-border-divider"
                      }`}
                    >
                      {!item.isRead && (
                        <span className="absolute right-3.5 top-3.5 size-2 rounded-full bg-primary-cyan shadow-[0_0_8px_#00F5D4]" />
                      )}

                      <div className="flex items-start gap-3">
                        <div
                          className={`grid size-9 shrink-0 place-items-center rounded-xl border ${visual.tone}`}
                        >
                          <Icon size={18} weight="bold" />
                        </div>

                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded border px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase ${visual.badgeClass}`}
                            >
                              {visual.badge}
                            </span>
                            {item.metadata?.orderId && (
                              <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-400">
                                {item.metadata.orderId}
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-sub">
                              {formatTimeAgo(item.createdAt)}
                            </span>
                          </div>

                          <h4 className="mt-1 text-xs font-bold text-main leading-snug">
                            {item.title}
                          </h4>
                          <p className="mt-0.5 text-xs text-sub leading-relaxed">
                            {item.message}
                          </p>

                          <div className="mt-2 flex items-center justify-between text-[10px] text-sub">
                            <span>By {item.createdByName || "System"}</span>
                            {item.actionUrl && (
                              <span className="inline-flex items-center gap-1 font-semibold text-primary-cyan group-hover:translate-x-0.5 transition-transform">
                                Open <ArrowRight size={11} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer for Admin / Owner to open Dedicated Notifications Page */}
            {isAdminOrOwner && (
              <div className="border-t border-border-divider bg-app-bg/80 p-3.5">
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    navigate("/notifications");
                  }}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary-cyan text-xs font-bold text-app-bg hover:opacity-90 cursor-pointer transition-opacity"
                >
                  <SlidersHorizontal size={15} weight="bold" />
                  Open Notification Center &amp; Broadcast Update
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

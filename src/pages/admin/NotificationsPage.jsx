// src/pages/admin/NotificationsPage.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Megaphone,
  WarningCircle,
  CheckCircle,
  Clock,
  Trash,
  Checks,
  PaperPlaneTilt,
  Sparkle,
  ArrowRight,
  Eye,
} from "@phosphor-icons/react";
import { useNotifications } from "../../context/NotificationContext";
import { notificationService } from "../../services/notificationService";
import { notify } from "../../utils/toastController";

const FILTER_TABS = [
  { id: "all", label: "All Activity" },
  { id: "updates", label: "Staff Updates" },
  { id: "bookings", label: "GTA 6 & Bookings" },
  { id: "unread", label: "Unread" },
];

const QUICK_LINKS = [
  { value: "", label: "No Action Link" },
  { value: "/booking?tab=pending_whatsapp", label: "Pending WhatsApp Bookings" },
  { value: "/booking", label: "Reservations Page" },
  { value: "/tasks", label: "Tasks Board" },
  { value: "/screens", label: "Live Stations Floor" },
  { value: "/pricing", label: "Pricing & Rates" },
  { value: "/hardware", label: "Hardware & Devices" },
];

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const navigate = useNavigate();

  // Broadcast Composer State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("important"); // 'normal' | 'important' | 'critical'
  const [isModalPopup, setIsModalPopup] = useState(true);
  const [actionUrl, setActionUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Feed Filter State
  const [filterTab, setFilterTab] = useState("all");

  const handlePrioritySelect = (nextPriority) => {
    setPriority(nextPriority);
    if (nextPriority === "important" || nextPriority === "critical") {
      setIsModalPopup(true);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      notify.error("Please enter both a title and a message.");
      return;
    }

    setSubmitting(true);
    try {
      await notificationService.createNotification({
        title: title.trim(),
        message: message.trim(),
        type: "announcement",
        priority,
        isModalPopup,
        actionUrl,
      });

      notify.success(
        isModalPopup
          ? "Important Update broadcasted as a live modal to all staff!"
          : "Notification broadcasted to all staff!"
      );
      setTitle("");
      setMessage("");
      setActionUrl("");
    } catch (error) {
      notify.error(
        error.response?.data?.error || "Failed to broadcast notification"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredList = useMemo(() => {
    if (filterTab === "updates") {
      return notifications.filter((n) => n.type === "announcement");
    }
    if (filterTab === "bookings") {
      return notifications.filter((n) =>
        String(n.type || "").startsWith("booking")
      );
    }
    if (filterTab === "unread") {
      return notifications.filter((n) => !n.isRead);
    }
    return notifications;
  }, [notifications, filterTab]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20 font-body text-main px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-divider pb-5 pt-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-cyan/30 bg-primary-cyan/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary-cyan mb-1.5">
            <Bell size={12} weight="fill" /> Admin &amp; Owner Control Center
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-wide text-main">
            Notifications &amp; Staff Broadcasts
          </h1>
          <p className="text-xs text-sub mt-0.5">
            Send real-time announcements or important popup modals to staff and monitor live GTA 6 booking alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-border-divider bg-card-panel px-3.5 py-2 text-xs font-bold text-main hover:border-primary-cyan/40 cursor-pointer transition-colors"
          >
            <Checks size={16} className="text-primary-cyan" />
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* LEFT 5 COLUMNS: BROADCAST COMPOSER */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <form
            onSubmit={handleBroadcast}
            className="rounded-2xl border border-border-divider bg-card-panel p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border-divider pb-3">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-xl bg-primary-cyan/15 text-primary-cyan border border-primary-cyan/30">
                  <Megaphone size={17} weight="fill" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-bold uppercase tracking-wide text-main">
                    Broadcast New Update
                  </h2>
                  <p className="text-[11px] text-sub">
                    Pushes instantly via Socket.IO to all staff
                  </p>
                </div>
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-bold text-sub uppercase tracking-wider mb-2">
                Update Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "normal",
                    label: "Normal",
                    sub: "Drawer only",
                    activeClass:
                      "border-primary-cyan bg-primary-cyan/15 text-primary-cyan",
                  },
                  {
                    id: "important",
                    label: "Important",
                    sub: "Modal Popup",
                    activeClass:
                      "border-amber-400 bg-amber-400/15 text-amber-300",
                  },
                  {
                    id: "critical",
                    label: "Critical",
                    sub: "Urgent Modal",
                    activeClass:
                      "border-rose-500 bg-rose-500/15 text-rose-400",
                  },
                ].map((p) => {
                  const active = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePrioritySelect(p.id)}
                      className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                        active
                          ? `${p.activeClass} font-bold`
                          : "border-border-divider bg-app-bg text-sub hover:text-main"
                      }`}
                    >
                      <p className="text-xs font-bold">{p.label}</p>
                      <p className="text-[10px] opacity-75 mt-0.5">{p.sub}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Popup Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-primary-cyan/25 bg-primary-cyan/[0.05] p-3">
              <div className="pr-2">
                <p className="text-xs font-bold text-main flex items-center gap-1.5">
                  <Sparkle
                    size={14}
                    weight="fill"
                    className="text-primary-cyan"
                  />
                  Pop up as Important Modal for Staff
                </p>
                <p className="text-[11px] text-sub mt-0.5">
                  Opens a center modal on all staff screens until acknowledged.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isModalPopup}
                onClick={() => setIsModalPopup((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  isModalPopup ? "bg-primary-cyan" : "bg-border-divider"
                }`}
              >
                <span
                  className={`inline-block size-5 transform rounded-full bg-app-bg shadow-md transition-transform ${
                    isModalPopup ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-sub mb-1.5">
                Update Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. GTA 6 Launch Rules & Controller Policy"
                className="h-10 w-full rounded-xl border border-border-divider bg-app-bg px-3.5 text-xs text-main placeholder:text-sub/50 focus:border-primary-cyan focus:outline-none"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-sub mb-1.5">
                Message / Instructions for Staff *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write important instructions or updates for the floor staff..."
                className="w-full rounded-xl border border-border-divider bg-app-bg p-3.5 text-xs text-main placeholder:text-sub/50 focus:border-primary-cyan focus:outline-none resize-none"
              />
            </div>

            {/* Optional Deep Link */}
            <div>
              <label className="block text-xs font-semibold text-sub mb-1.5">
                Quick Action Link (Optional)
              </label>
              <select
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                className="h-10 w-full rounded-xl border border-border-divider bg-app-bg px-3 text-xs text-main focus:border-primary-cyan focus:outline-none"
              >
                {QUICK_LINKS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-cyan text-xs font-extrabold text-app-bg shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity"
            >
              <PaperPlaneTilt size={16} weight="bold" />
              {submitting
                ? "Broadcasting..."
                : isModalPopup
                ? "Broadcast Important Modal Update"
                : "Send Notification to Staff"}
            </button>
          </form>
        </div>

        {/* RIGHT 7 COLUMNS: LIVE NOTIFICATIONS & AUDIT FEED */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-divider bg-card-panel p-3">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {FILTER_TABS.map((t) => {
                const active = filterTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFilterTab(t.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      active
                        ? "bg-primary-cyan/15 text-primary-cyan font-bold border border-primary-cyan/30"
                        : "text-sub hover:text-main"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <span className="font-mono text-[11px] text-sub px-2">
              {filteredList.length} records
            </span>
          </div>

          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-divider bg-card-panel/40 p-12 text-center">
              <Bell size={32} className="text-sub/50 mb-2" />
              <h3 className="text-sm font-bold text-main">
                No notifications in this view
              </h3>
              <p className="text-xs text-sub mt-0.5">
                Broadcast a staff update on the left or wait for incoming booking events.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((item) => {
                const isBooking = String(item.type || "").startsWith("booking");
                const isCritical = item.priority === "critical";
                const isImportant =
                  item.isModalPopup || item.priority === "important";

                return (
                  <div
                    key={item._id}
                    className={`rounded-2xl border bg-card-panel p-4 transition-all ${
                      !item.isRead
                        ? "border-primary-cyan/40 shadow-sm"
                        : "border-border-divider"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`grid size-10 shrink-0 place-items-center rounded-xl border ${
                            isCritical
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                              : isBooking
                              ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                              : "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                          }`}
                        >
                          {isCritical ? (
                            <WarningCircle size={20} weight="fill" />
                          ) : isBooking ? (
                            <Clock size={20} weight="bold" />
                          ) : (
                            <Megaphone size={20} weight="fill" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isImportant && (
                              <span className="rounded border border-primary-cyan/30 bg-primary-cyan/10 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase text-primary-cyan">
                                Modal Popup
                              </span>
                            )}
                            {item.metadata?.orderId && (
                              <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.2 font-mono text-[10px] font-bold text-amber-400">
                                {item.metadata.orderId}
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-sub">
                              {new Date(item.createdAt).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                          <h3 className="mt-1 text-sm font-bold text-main">
                            {item.title}
                          </h3>
                          <p className="mt-1 whitespace-pre-line text-xs text-sub leading-relaxed">
                            {item.message}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-mono text-sub">
                            <span>By: {item.createdByName || "System"}</span>
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <Eye size={13} /> Seen by {item.readCount || 0}
                            </span>
                            {item.type === "announcement" && (
                              <span className="inline-flex items-center gap-1 text-primary-cyan">
                                <CheckCircle size={13} /> Acknowledged by{" "}
                                {item.acknowledgedCount || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.actionUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!item.isRead) markAsRead(item._id);
                              navigate(item.actionUrl);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-primary-cyan/30 bg-primary-cyan/10 px-2.5 py-1.5 text-xs font-bold text-primary-cyan hover:bg-primary-cyan/20 cursor-pointer"
                          >
                            Open <ArrowRight size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(item._id)}
                          title="Delete notification"
                          className="grid size-8 place-items-center rounded-lg text-sub hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer transition-colors"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

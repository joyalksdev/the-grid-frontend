// src/pages/admin/BookingsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  Phone,
  User,
  Plus,
  CheckCircle,
  XCircle,
  Trash,
  BookmarkSimple,
  ListBullets,
  SquaresFour,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  ArrowUUpLeft,
  DotsThreeVertical,
  WhatsappLogo,
  Copy,
  ArrowSquareOut,
  CurrencyInr,
  Receipt,
  ArrowsClockwise,
  Check,
  MagnifyingGlass,
  DesktopTower,
  GameController,
  X,
} from "@phosphor-icons/react";
import { bookingService } from "../../services/bookingService";
import { useSocket } from "../../context/SocketContext";
import { notify } from "../../utils/toastController";
import { formatINR } from "../../utils/format";
import Loader from "../../components/ui/Loader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Dropdown from "../../components/ui/Dropdown";
import RefundModal from "../../components/bookings/RefundModal";
import ExtendBookingModal from "../../components/bookings/ExtendBookingModal";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";
const VIEW_MODE_STORAGE_KEY = "grid_bookings_view_mode";

const TABS = [
  { id: "active", label: "Active & Confirmed" },
  { id: "pending_whatsapp", label: "Pending (WhatsApp)" },
  { id: "refunded", label: "Refunded" },
  { id: "history", label: "Audit History" },
];

const todayISO = () => new Date().toISOString().split("T")[0];

function format12HourTime(timeStr) {
  if (!timeStr) return "";
  if (/am|pm/i.test(timeStr)) return timeStr;
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
}

function isGta6Booking(b) {
  return (
    b.mode === "GTA6_Launch" ||
    Boolean(b.orderId) ||
    (Array.isArray(b.selectedGames) &&
      b.selectedGames.some((g) => /gta\s*(vi|6)|grand theft auto/i.test(g)))
  );
}

// History View Sub-Component
function HistoryView({ bookings, onUndo, onOpenRefund }) {
  const completedList = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status === "completed" ||
        b.status === "cancelled" ||
        b.status === "refunded"
    );
  }, [bookings]);

  if (completedList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border-divider bg-card-panel/30">
        <ClockCounterClockwise size={28} className="text-sub mb-2" />
        <h3 className="text-sm font-bold text-main">No history records yet</h3>
        <p className="text-xs text-sub mt-0.5">Completed, cancelled, or refunded sessions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-card-panel border border-border-divider rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-app-bg/50 border-b border-border-divider flex items-center justify-between">
          <span className="text-xs font-bold text-main uppercase tracking-wider">Session Audit Log &amp; History</span>
          <span className="text-[10px] font-mono text-sub">{completedList.length} total records</span>
        </div>
        <div className="divide-y divide-border-divider/50">
          {completedList.map((item) => {
            const isRefunded = item.status === "refunded";
            const isCancelled = item.status === "cancelled";

            return (
              <div
                key={item._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-bg/30 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-main">{item.customerName}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                        isRefunded
                          ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                          : isCancelled
                          ? "border-rose-400/30 bg-rose-400/10 text-rose-400"
                          : "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.orderId && (
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                        {item.orderId}
                      </span>
                    )}
                    {item.bookingCode && (
                      <span className="text-[10px] font-mono text-sub">{item.bookingCode}</span>
                    )}
                  </div>
                  <p className="text-xs text-sub font-mono">
                    {item.station || item.screen?.name || "Station"} • {item.date} at{" "}
                    {format12HourTime(item.startTime)} ({item.duration}m, {item.mode})
                  </p>
                  {isRefunded && item.refundDetails?.refundAmount !== undefined && (
                    <p className="text-[11px] text-amber-400 font-mono">
                      Refunded: {formatINR(item.refundDetails.refundAmount)} • Ref:{" "}
                      {item.refundDetails.refundTransactionRef || "N/A"} • Reason:{" "}
                      {item.refundDetails.refundReason || "Admin processed"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-available">
                    {formatINR(item.totalAmount !== undefined ? item.totalAmount : item.estimatedCost || 0)}
                  </span>

                  {!isRefunded && (
                    <button
                      type="button"
                      onClick={() => onOpenRefund(item)}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:underline bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-lg cursor-pointer"
                    >
                      <CurrencyInr size={13} /> Refund
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onUndo(item._id, "confirmed")}
                    className="flex items-center gap-1 text-xs text-primary-cyan hover:underline bg-primary-cyan/10 border border-primary-cyan/20 px-2.5 py-1 rounded-lg cursor-pointer"
                    title="Revert status back to confirmed"
                  >
                    <ArrowUUpLeft size={13} /> Undo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage({ isStaff = false }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { socket } = useSocket() || {};

  const [bookings, setBookings] = useState([]);
  const [allBookingsForMonth, setAllBookingsForMonth] = useState([]);
  const [loading, setLoading] = useState(true);

  // Persisted View Mode: "column" | "list" | "calendar"
  const [viewMode, setViewModeState] = useState(() => {
    const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (saved === "list" || saved === "column" || saved === "calendar") {
      return saved;
    }
    return "column";
  });

  const handleSetViewMode = (mode) => {
    setViewModeState(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  };

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      return tabParam;
    }
    return "active";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [stationFilter, setStationFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const [calendarDate, setCalendarDate] = useState(new Date());

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [bookingToRefund, setBookingToRefund] = useState(null);

  // Extend Booking Modal State
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [bookingToExtend, setBookingToExtend] = useState(null);

  const openExtendModal = (booking) => {
    setBookingToExtend(booking);
    setExtendModalOpen(true);
  };

  // Sync URL query params when navigated from NotificationDrawer (without locking date filter)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
    if (searchParams.has("date")) {
      searchParams.delete("date");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await bookingService.getBookings({});
      const list = Array.isArray(data) ? data : [];
      setBookings(list);
      setAllBookingsForMonth(list);
    } catch (error) {
      if (!silent) notify.error("Failed to load lounge bookings");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(false);
  }, [fetchBookings]);

  // Real-Time Socket Updates
  useEffect(() => {
    if (!socket) return;
    const handleCreated = (newBooking) => {
      if (newBooking && newBooking._id) {
        setBookings((prev) => {
          const exists = prev.some((b) => String(b._id) === String(newBooking._id));
          return exists
            ? prev.map((b) => (String(b._id) === String(newBooking._id) ? newBooking : b))
            : [newBooking, ...prev];
        });
      }
      fetchBookings(true);
    };
    const handleUpdated = (updatedBooking) => {
      if (updatedBooking && updatedBooking._id) {
        setBookings((prev) =>
          prev.map((b) => (String(b._id) === String(updatedBooking._id) ? updatedBooking : b))
        );
      }
      fetchBookings(true);
    };
    const handleDeleted = () => {
      fetchBookings(true);
    };
    socket.on("booking_created", handleCreated);
    socket.on("booking_updated", handleUpdated);
    socket.on("booking_deleted", handleDeleted);
    return () => {
      socket.off("booking_created", handleCreated);
      socket.off("booking_updated", handleUpdated);
      socket.off("booking_deleted", handleDeleted);
    };
  }, [socket, fetchBookings]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await bookingService.updateBookingStatus(id, newStatus);
      notify.success(`Status updated to ${newStatus.replace("_", " ")}`);
      fetchBookings(true);
    } catch (error) {
      notify.error("Failed to update status");
    }
  };

  const handleResendTicket = async (id, phone) => {
    try {
      await bookingService.resendTicket(id);
      notify.success(`Fast2SMS WhatsApp ticket re-sent to ${phone || "customer"}!`);
    } catch (error) {
      notify.error(error.response?.data?.error || "Failed to resend WhatsApp pass");
    }
  };

  const handleCopyTicketUrl = (token) => {
    if (!token) {
      notify.error("No ticket token found for this booking");
      return;
    }
    const url = `https://thegridgaming.fun/ticket/${token}`;
    navigator.clipboard.writeText(url).then(
      () => notify.success("Ticket link copied to clipboard!"),
      () => notify.error("Failed to copy link")
    );
  };

  const handleDeleteConfirm = async () => {
    if (isStaff) {
      notify.error("Staff members do not have permission to delete records.");
      setDeleteModalOpen(false);
      return;
    }
    if (!bookingToDelete) return;
    try {
      await bookingService.deleteBooking(bookingToDelete);
      notify.success("Booking removed");
      fetchBookings(true);
    } catch (error) {
      notify.error("Failed to delete booking");
    } finally {
      setBookingToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const handleApprovePending = async (id, phone) => {
    try {
      await bookingService.approveBooking(id);
      notify.success(`Booking approved! Fast2SMS WhatsApp ticket sent to ${phone || "player"}.`);
      fetchBookings(true);
    } catch (error) {
      notify.error(error.response?.data?.error || "Failed to approve booking");
    }
  };

  const openRefundModal = (booking) => {
    setBookingToRefund(booking);
    setRefundModalOpen(true);
  };

  // KPI summary metrics
  const kpiStats = useMemo(() => {
    const total = bookings.length;
    const activeCount = bookings.filter(
      (b) => b.status === "confirmed" || b.status === "checked_in"
    ).length;
    const pendingCount = bookings.filter((b) => b.status === "pending").length;
    const confirmedRevenue = bookings
      .filter((b) => b.status === "confirmed" || b.status === "checked_in" || b.status === "completed")
      .reduce((sum, b) => sum + (b.totalAmount !== undefined ? Number(b.totalAmount) : Number(b.estimatedCost || 0)), 0);

    return { total, activeCount, pendingCount, confirmedRevenue };
  }, [bookings]);

  // Unique station names for filter dropdown
  const stationOptions = useMemo(() => {
    const set = new Set(["Screen 1", "Screen 2", "Screen 3"]);
    bookings.forEach((b) => {
      const name = b.station || b.screen?.name;
      if (name) set.add(name);
    });
    return ["ALL", ...Array.from(set)];
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let list = bookings;

    // 1. Tab filter (Completed bookings are excluded from main view and only shown in Audit History)
    if (activeTab === "active") {
      list = list.filter((b) => b.status === "confirmed" || b.status === "checked_in");
    } else if (activeTab === "pending_whatsapp") {
      list = list.filter((b) => b.status === "pending");
    } else if (activeTab === "refunded") {
      list = list.filter((b) => b.status === "refunded");
    } else if (activeTab === "history") {
      list = list.filter(
        (b) =>
          b.status === "completed" ||
          b.status === "cancelled" ||
          b.status === "refunded"
      );
    } else {
      list = list.filter((b) => b.status === "confirmed" || b.status === "checked_in");
    }

    // 2. Station filter
    if (stationFilter !== "ALL") {
      list = list.filter(
        (b) => (b.station || b.screen?.name || "").toLowerCase() === stationFilter.toLowerCase()
      );
    }

    // 3. Optional Date filter (Note: when on Pending WhatsApp tab, only filter by date if explicitly set)
    if (dateFilter) {
      list = list.filter((b) => b.date === dateFilter);
    }

    // 4. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          (b.customerName || "").toLowerCase().includes(q) ||
          (b.phoneNumber || "").toLowerCase().includes(q) ||
          (b.orderId || "").toLowerCase().includes(q) ||
          (b.bookingCode || "").toLowerCase().includes(q) ||
          (b.utr || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [bookings, activeTab, stationFilter, dateFilter, searchQuery]);

  const buildMenuItems = (b) => {
    const isPending = b.status === "pending";
    const isConfirmed = b.status === "confirmed";
    const isCheckedIn = b.status === "checked_in";
    const isRefunded = b.status === "refunded";

    return [
      ...(isPending
        ? [
            {
              label: "Approve & Mark Paid",
              icon: <CheckCircle size={15} className="text-emerald-400" />,
              onClick: () => handleApprovePending(b._id, b.phoneNumber),
            },
            {
              label: "Chat with Customer",
              icon: <WhatsappLogo size={15} className="text-emerald-400" />,
              onClick: () => {
                if (b.phoneNumber) {
                  window.open(`https://wa.me/91${b.phoneNumber}`, "_blank");
                }
              },
            },
          ]
        : [
            {
              label: "Resend WhatsApp Pass",
              icon: <WhatsappLogo size={15} className="text-emerald-400" />,
              onClick: () => handleResendTicket(b._id, b.phoneNumber),
            },
            {
              label: "Copy Pass Link",
              icon: <Copy size={15} className="text-primary-cyan" />,
              onClick: () => handleCopyTicketUrl(b.ticketToken),
            },
            {
              label: "Open Public Pass",
              icon: <ArrowSquareOut size={15} className="text-sub" />,
              onClick: () => {
                if (b.ticketToken) {
                  window.open(`https://thegridgaming.fun/ticket/${b.ticketToken}`, "_blank");
                }
              },
            },
          ]),
      { type: "divider" },
      ...(isConfirmed || isCheckedIn
        ? [
            {
              label: "Extend Session (+Time)",
              icon: <Plus size={15} className="text-primary-cyan" />,
              onClick: () => openExtendModal(b),
            },
          ]
        : []),
      ...(isConfirmed
        ? [
            {
              label: "Check In Player",
              icon: <CheckCircle size={15} className="text-emerald-400" />,
              onClick: () => handleStatusChange(b._id, "checked_in"),
            },
          ]
        : []),
      ...(isCheckedIn
        ? [
            {
              label: "Complete Session",
              icon: <Check size={15} className="text-indigo-400" />,
              onClick: () => handleStatusChange(b._id, "completed"),
            },
          ]
        : []),
      ...(!isConfirmed && !isRefunded && !isPending
        ? [
            {
              label: "Undo to Confirmed",
              icon: <ArrowUUpLeft size={15} className="text-primary-cyan" />,
              onClick: () => handleStatusChange(b._id, "confirmed"),
            },
          ]
        : []),
      ...(!isRefunded && !isPending
        ? [
            {
              label: "Process Refund",
              icon: <CurrencyInr size={15} className="text-amber-400" />,
              onClick: () => openRefundModal(b),
            },
          ]
        : []),
      ...(isConfirmed || isPending
        ? [
            {
              label: "Cancel Booking",
              icon: <XCircle size={15} className="text-rose-400" />,
              onClick: () => handleStatusChange(b._id, "cancelled"),
            },
          ]
        : []),
      ...(!isStaff
        ? [
            { type: "divider" },
            {
              label: "Delete Booking",
              icon: <Trash size={15} className="text-rose-400" />,
              danger: true,
              onClick: () => {
                setBookingToDelete(b._id);
                setDeleteModalOpen(true);
              },
            },
          ]
        : []),
    ];
  };

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(month + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      days.push({ day: d, dateStr: `${year}-${monthStr}-${dayStr}` });
    }
    return days;
  }, [year, month, firstDayIndex, daysInMonth]);

  return (
    <div className="mx-auto space-y-5 pb-24 font-body text-main px-4 sm:px-6">
      {/* Top Header & Layout Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-b border-border-divider pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main">
              Reservations &amp; Booking Command
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-sub mt-0.5">
            Real-time GTA 6 WhatsApp locks, instant Fast2SMS pass triggers, UTR verification, and layout persistence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* View Mode Switcher (Persisted in localStorage) */}
          <div
            className="flex items-center rounded-xl border border-border-divider bg-card-panel p-1 shadow-sm"
            role="group"
            aria-label="Booking Layout Mode"
          >
            <button
              type="button"
              onClick={() => handleSetViewMode("column")}
              title="Column / Card Grid View (Saved in browser)"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "column"
                  ? "bg-primary-cyan text-app-bg font-bold shadow-sm"
                  : "text-sub hover:text-main"
              }`}
            >
              <SquaresFour size={15} weight={viewMode === "column" ? "fill" : "regular"} />
              <span>Column</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode("list")}
              title="Compact List / Row View (Saved in browser)"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary-cyan text-app-bg font-bold shadow-sm"
                  : "text-sub hover:text-main"
              }`}
            >
              <ListBullets size={15} weight={viewMode === "list" ? "bold" : "regular"} />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode("calendar")}
              title="Monthly Calendar View (Saved in browser)"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-primary-cyan text-app-bg font-bold shadow-sm"
                  : "text-sub hover:text-main"
              }`}
            >
              <CalendarBlank size={15} weight={viewMode === "calendar" ? "fill" : "regular"} />
              <span>Calendar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchBookings(false)}
            title="Refresh Bookings"
            className={`flex size-9 items-center justify-center rounded-xl border border-border-divider bg-card-panel text-sub hover:border-primary-cyan/40 hover:text-primary-cyan transition-colors cursor-pointer ${FOCUS}`}
          >
            <ArrowsClockwise size={15} className={loading ? "animate-spin text-primary-cyan" : ""} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/booking/new")}
            className={`flex h-9 items-center gap-1.5 rounded-xl bg-primary-cyan px-3.5 text-xs font-bold text-app-bg shadow-md hover:opacity-90 cursor-pointer ${FOCUS}`}
          >
            <Plus size={14} weight="bold" /> Create Booking
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border-divider bg-card-panel p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-sub">Total Bookings</p>
            <p className="mt-1 text-xl font-bold font-mono text-main">{kpiStats.total}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary-cyan/10 border border-primary-cyan/20 text-primary-cyan">
            <Calendar size={20} weight="duotone" />
          </div>
        </div>

        <div className="rounded-2xl border border-border-divider bg-card-panel p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-sub">Active &amp; Confirmed</p>
            <p className="mt-1 text-xl font-bold font-mono text-emerald-400">{kpiStats.activeCount}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle size={20} weight="duotone" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("pending_whatsapp")}
          className={`rounded-2xl border p-3.5 flex items-center justify-between text-left transition-all cursor-pointer ${
            kpiStats.pendingCount > 0
              ? "border-amber-400/50 bg-amber-500/10 shadow-sm shadow-amber-500/10"
              : "border-border-divider bg-card-panel"
          }`}
        >
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              Pending WhatsApp
              {kpiStats.pendingCount > 0 && (
                <span className="size-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </p>
            <p className="mt-1 text-xl font-bold font-mono text-amber-400">{kpiStats.pendingCount}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400">
            <WhatsappLogo size={20} weight="fill" />
          </div>
        </button>

        <div className="rounded-2xl border border-border-divider bg-card-panel p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-sub">Confirmed Revenue</p>
            <p className="mt-1 text-xl font-bold font-mono text-available">
              {formatINR(kpiStats.confirmedRevenue)}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-available/10 border border-available/20 text-available">
            <CurrencyInr size={20} weight="bold" />
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search & Station/Date Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-card-panel p-3 rounded-2xl border border-border-divider">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const count =
              tab.id === "active"
                ? bookings.filter((b) => b.status === "confirmed" || b.status === "checked_in").length
                : tab.id === "pending_whatsapp"
                ? bookings.filter((b) => b.status === "pending").length
                : tab.id === "refunded"
                ? bookings.filter((b) => b.status === "refunded").length
                : bookings.filter(
                    (b) =>
                      b.status === "completed" ||
                      b.status === "cancelled" ||
                      b.status === "refunded"
                  ).length;

            const isPendingTab = tab.id === "pending_whatsapp";

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (searchParams.has("tab")) {
                    searchParams.delete("tab");
                    setSearchParams(searchParams, { replace: true });
                  }
                }}
                className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? isPendingTab
                      ? "bg-amber-400/15 text-amber-400 font-bold border border-amber-400/40"
                      : "bg-primary-cyan/15 text-primary-cyan font-bold border border-primary-cyan/30"
                    : "text-sub hover:text-main"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isPendingTab && count > 0
                      ? "bg-amber-400 text-slate-950 font-bold"
                      : "bg-app-bg opacity-80"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlass
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sub"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, #GRID..."
              className="h-9 w-full rounded-xl border border-border-divider bg-app-bg pl-8 pr-7 text-xs text-main placeholder:text-sub/60 focus:border-primary-cyan focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sub hover:text-main cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Station Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border-divider bg-app-bg px-2.5 h-9">
            <DesktopTower size={13} className="text-primary-cyan shrink-0" />
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-main focus:outline-none cursor-pointer"
            >
              {stationOptions.map((st) => (
                <option key={st} value={st} className="bg-card-panel text-main">
                  {st === "ALL" ? "All Screens" : st}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border-divider bg-app-bg px-2.5 h-9">
            <Calendar size={13} className="text-primary-cyan shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-main focus:outline-none cursor-pointer"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter("");
                  if (searchParams.has("date")) {
                    searchParams.delete("date");
                    setSearchParams(searchParams, { replace: true });
                  }
                }}
                title="Show All Dates"
                className="text-[10px] font-bold text-primary-cyan hover:underline ml-1 cursor-pointer"
              >
                All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "history" ? (
        <HistoryView
          bookings={bookings}
          onUndo={handleStatusChange}
          onOpenRefund={openRefundModal}
        />
      ) : viewMode === "calendar" ? (
        /* Month Calendar View */
        <div className="bg-card-panel border border-border-divider rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-border-divider mb-4">
            <h2 className="text-base font-bold text-main">
              {monthNames[month]} {year} <span className="text-xs font-normal text-sub ml-2">(IST)</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-xl border border-border-divider bg-app-bg text-main hover:border-primary-cyan cursor-pointer"
              >
                <CaretLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setCalendarDate(new Date())}
                className="px-2.5 py-1 rounded-xl border border-border-divider bg-app-bg text-xs font-semibold text-main cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-xl border border-border-divider bg-app-bg text-main hover:border-primary-cyan cursor-pointer"
              >
                <CaretRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-sub pb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((item, idx) => {
              if (!item.day) return <div key={`e-${idx}`} className="h-24 rounded-xl bg-app-bg/20 opacity-30" />;

              const dayBookings = allBookingsForMonth.filter((b) => b.date === item.dateStr);
              const isToday = item.dateStr === todayISO();

              return (
                <div
                  key={`d-${item.dateStr}`}
                  onClick={() => {
                    setDateFilter(item.dateStr);
                    handleSetViewMode("column");
                    setActiveTab("active");
                  }}
                  className={`flex flex-col h-24 rounded-xl border p-2 cursor-pointer transition-all overflow-hidden ${
                    isToday
                      ? "border-primary-cyan bg-primary-cyan/10"
                      : "border-border-divider bg-app-bg hover:border-primary-cyan/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isToday ? "text-primary-cyan" : "text-main"}`}>
                      {item.day}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary-cyan/20 text-primary-cyan">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 overflow-y-auto no-scrollbar">
                    {dayBookings.slice(0, 2).map((b) => (
                      <div
                        key={b._id}
                        className="text-[9px] truncate bg-card-panel px-1 py-0.5 rounded border border-border-divider/60 text-main font-semibold"
                      >
                        {b.customerName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : loading ? (
        <Loader variant="skeleton-table" lines={4} text="Loading reservations..." />
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border-divider bg-card-panel/30 space-y-3">
          <BookmarkSimple size={28} className="text-sub" />
          <div>
            <h3 className="text-sm font-bold text-main">No reservations found</h3>
            <p className="text-xs text-sub mt-0.5">
              {searchQuery || dateFilter || stationFilter !== "ALL"
                ? "Try clearing your search or date filter."
                : "No bookings match this tab."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(searchQuery || dateFilter || stationFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDateFilter("");
                  setStationFilter("ALL");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border-divider bg-app-bg text-xs font-semibold text-main hover:border-primary-cyan cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate("/booking/new")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-cyan/15 border border-primary-cyan/30 text-primary-cyan hover:bg-primary-cyan/25 text-xs font-semibold cursor-pointer"
            >
              <Plus size={13} weight="bold" /> New Reservation
            </button>
          </div>
        </div>
      ) : viewMode === "list" ? (
        /* COMPACT LIST / TABLE MODE */
        <div className="bg-card-panel border border-border-divider rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-divider bg-app-bg/60 text-[10px] font-mono font-bold uppercase tracking-wider text-sub">
                  <th className="py-3 px-4">Order / Station</th>
                  <th className="py-3 px-4">Player &amp; WhatsApp</th>
                  <th className="py-3 px-4">Date &amp; Slot</th>
                  <th className="py-3 px-4">Mode &amp; Duration</th>
                  <th className="py-3 px-4">Amount &amp; UTR</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider/60 text-xs">
                {filteredBookings.map((b) => {
                  const isPending = b.status === "pending";
                  const isConfirmed = b.status === "confirmed";
                  const isCheckedIn = b.status === "checked_in";
                  const isCompleted = b.status === "completed";
                  const isRefunded = b.status === "refunded";
                  const gta6 = isGta6Booking(b);
                  const finalCost =
                    b.totalAmount !== undefined ? b.totalAmount : b.estimatedCost || 0;
                  const menuItems = buildMenuItems(b);

                  return (
                    <tr
                      key={b._id}
                      className={`transition-colors ${
                        isPending
                          ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]"
                          : "hover:bg-app-bg/40"
                      }`}
                    >
                      {/* Station & Order ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-primary-cyan uppercase tracking-wide">
                              {b.station || b.screen?.name || "Station"}
                            </span>
                            {gta6 && (
                              <span className="rounded bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase text-fuchsia-300">
                                GTA VI
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {b.orderId && (
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30">
                                {b.orderId}
                              </span>
                            )}
                            {b.bookingCode && (
                              <span className="text-[10px] font-mono text-sub">{b.bookingCode}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Player & Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-main flex items-center gap-1.5">
                          <User size={13} className="text-primary-cyan shrink-0" />
                          <span>{b.customerName}</span>
                        </div>
                        <div className="text-[11px] text-sub font-mono flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-emerald-400" />
                          <span>{b.phoneNumber}</span>
                        </div>
                      </td>

                      {/* Date & Time Slot */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-main flex items-center gap-1">
                          <Clock size={12} className="text-primary-cyan" />
                          <span>{format12HourTime(b.startTime)}</span>
                        </div>
                        <div className="text-[11px] font-mono text-sub mt-0.5">{b.date}</div>
                      </td>

                      {/* Mode & Duration */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-main font-semibold">
                          {b.duration}m • {b.mode === "GTA6_Launch" ? "GTA 6 Launch" : b.mode}
                        </div>
                        {b.extensionDuration > 0 && (
                          <span className="text-[10px] font-mono text-primary-cyan">
                            +{b.extensionDuration}m extension
                          </span>
                        )}
                      </td>

                      {/* Amount & UTR */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-available">{formatINR(finalCost)}</div>
                        {b.utr && (
                          <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Receipt size={10} /> UTR: {b.utr}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                            isPending
                              ? "border-amber-400/40 bg-amber-400/10 text-amber-400 animate-pulse"
                              : isConfirmed
                              ? "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                              : isCheckedIn
                              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                              : isCompleted
                              ? "border-indigo-400/30 bg-indigo-400/10 text-indigo-400"
                              : isRefunded
                              ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                              : "border-rose-400/30 bg-rose-400/10 text-rose-400"
                          }`}
                        >
                          {isPending ? "Pending (WhatsApp)" : b.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprovePending(b._id, b.phoneNumber)}
                                className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-sm transition-all cursor-pointer"
                              >
                                <CheckCircle size={13} weight="bold" /> Approve &amp; Mark Paid
                              </button>
                              {b.phoneNumber && (
                                <button
                                  type="button"
                                  onClick={() => window.open(`https://wa.me/91${b.phoneNumber}`, "_blank")}
                                  title="Chat on WhatsApp"
                                  className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                                >
                                  <WhatsappLogo size={14} weight="fill" />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResendTicket(b._id, b.phoneNumber)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title="Resend WhatsApp Ticket Pass"
                            >
                              <WhatsappLogo size={15} weight="fill" />
                            </button>
                          )}

                          {(isConfirmed || isCheckedIn) && (
                            <button
                              type="button"
                              onClick={() => openExtendModal(b)}
                              className="flex items-center gap-1 bg-primary-cyan/10 border border-primary-cyan/30 text-primary-cyan hover:bg-primary-cyan/20 text-xs px-2 py-1 rounded-lg font-semibold cursor-pointer"
                              title="Extend Session (+30m / +1hr)"
                            >
                              <Plus size={12} weight="bold" /> Extend
                            </button>
                          )}

                          {isConfirmed && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(b._id, "checked_in")}
                              className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                            >
                              <CheckCircle size={13} /> Check In
                            </button>
                          )}

                          {isCheckedIn && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(b._id, "completed")}
                              className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 text-xs px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                            >
                              <Check size={13} /> Complete
                            </button>
                          )}

                          <Dropdown
                            trigger={
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-sub hover:text-main hover:bg-app-bg transition-colors cursor-pointer"
                                title="More Options"
                              >
                                <DotsThreeVertical size={16} weight="bold" />
                              </button>
                            }
                            items={menuItems}
                            align="right"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* COLUMN / CARD GRID MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredBookings.map((b) => {
            const isPending = b.status === "pending";
            const isConfirmed = b.status === "confirmed";
            const isCheckedIn = b.status === "checked_in";
            const isCompleted = b.status === "completed";
            const isRefunded = b.status === "refunded";
            const gta6 = isGta6Booking(b);

            const finalCost =
              b.totalAmount !== undefined ? b.totalAmount : b.estimatedCost || 0;

            const menuItems = buildMenuItems(b);

            return (
              <div
                key={b._id}
                className={`bg-card-panel border rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-sm transition-all ${
                  isPending
                    ? "border-amber-400/50 shadow-amber-500/5 hover:border-amber-400"
                    : gta6
                    ? "border-fuchsia-500/30 hover:border-fuchsia-400/50"
                    : "border-border-divider hover:border-primary-cyan/30"
                }`}
              >
                <div className="space-y-2.5">
                  {/* Header Row: Station + Order ID + Status + Three Dots Menu */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-primary-cyan uppercase tracking-wide">
                        {b.station || b.screen?.name || "Station"}
                      </span>
                      {gta6 && (
                        <span className="rounded bg-fuchsia-500/15 border border-fuchsia-500/30 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-fuchsia-300">
                          GTA VI
                        </span>
                      )}
                      {b.orderId && (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                          {b.orderId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          isPending
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-400 animate-pulse"
                            : isConfirmed
                            ? "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                            : isCheckedIn
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                            : isCompleted
                            ? "border-indigo-400/30 bg-indigo-400/10 text-indigo-400"
                            : isRefunded
                            ? "border-amber-400/30 bg-amber-400/10 text-amber-400 font-bold"
                            : "border-rose-400/30 bg-rose-400/10 text-rose-400"
                        }`}
                      >
                        {isPending ? "Pending (WA)" : b.status.replace("_", " ")}
                      </span>

                      <Dropdown
                        trigger={
                          <button
                            type="button"
                            className="p-1 rounded-lg text-sub hover:text-main hover:bg-app-bg transition-colors cursor-pointer"
                            title="Booking options"
                          >
                            <DotsThreeVertical size={16} weight="bold" />
                          </button>
                        }
                        items={menuItems}
                        align="right"
                      />
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-main flex items-center gap-1.5 truncate">
                        <User size={14} className="text-primary-cyan shrink-0" />
                        <span className="truncate">{b.customerName}</span>
                      </h3>
                      {b.bookingCode && (
                        <span className="text-[10px] font-mono text-sub shrink-0">{b.bookingCode}</span>
                      )}
                    </div>
                    <p className="text-xs text-sub flex items-center gap-1 mt-0.5 font-mono">
                      <Phone size={12} className="text-emerald-400" /> {b.phoneNumber}
                    </p>
                  </div>

                  {/* Time & Mode pill */}
                  <div className="flex items-center justify-between bg-app-bg px-2.5 py-2 rounded-xl text-xs border border-border-divider/50">
                    <span className="font-bold text-main flex items-center gap-1">
                      <Clock size={13} className="text-primary-cyan" /> {format12HourTime(b.startTime)}
                    </span>
                    <span className="text-sub font-mono text-[11px]">
                      {b.duration}m ({b.mode === "GTA6_Launch" ? "GTA 6" : b.mode})
                      {b.extensionDuration ? ` +${b.extensionDuration}m` : ""}
                    </span>
                  </div>

                  {/* Games if any */}
                  {b.selectedGames && b.selectedGames.length > 0 && (
                    <p className="text-[11px] text-sub truncate flex items-center gap-1">
                      <GameController size={13} className="text-primary-cyan shrink-0" />
                      <span className="truncate">{b.selectedGames.join(", ")}</span>
                    </p>
                  )}

                  {/* Pending Notice Box */}
                  {isPending && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-amber-400" /> Awaiting WhatsApp Payment
                        </span>
                      </div>
                      {b.expiresAt && (
                        <p className="text-amber-400/80 text-[10px] font-mono">
                          Slot lock expires:{" "}
                          {new Date(b.expiresAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Amount & UTR / Verification */}
                  <div className="flex items-center justify-between text-xs px-1 pt-0.5">
                    <span className="text-sub">Total Amount:</span>
                    <span className="font-bold text-available font-mono text-sm">
                      {formatINR(finalCost)}
                    </span>
                  </div>

                  {b.utr && (
                    <div className="flex items-center justify-between text-[11px] px-2 font-mono bg-emerald-500/5 rounded-lg py-1 border border-emerald-500/20">
                      <span className="text-sub flex items-center gap-1">
                        <Receipt size={12} className="text-emerald-400" /> UTR / Ref:
                      </span>
                      <span className="font-bold text-emerald-400">{b.utr}</span>
                    </div>
                  )}

                  {/* Refund Audit Box */}
                  {isRefunded && (
                    <div className="mt-1 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-0.5 font-mono">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span>Refunded:</span>
                        <span>{formatINR(b.refundDetails?.refundAmount || finalCost)}</span>
                      </div>
                      {b.refundDetails?.refundTransactionRef && (
                        <p className="text-sub text-[10px] truncate">
                          Ref: {b.refundDetails.refundTransactionRef}
                        </p>
                      )}
                      {b.refundDetails?.refundReason && (
                        <p className="text-sub text-[10px] truncate">
                          Reason: {b.refundDetails.refundReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-border-divider/50">
                  <span className="text-[11px] text-sub font-mono">{b.date}</span>

                  <div className="flex items-center gap-1.5">
                    {!isPending && (
                      <button
                        type="button"
                        onClick={() => handleResendTicket(b._id, b.phoneNumber)}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                        title="Resend WhatsApp Ticket Pass"
                      >
                        <WhatsappLogo size={14} weight="fill" />
                      </button>
                    )}

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleApprovePending(b._id, b.phoneNumber)}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle size={13} weight="bold" /> Approve &amp; Mark Paid
                      </button>
                    )}

                    {(isConfirmed || isCheckedIn) && (
                      <button
                        type="button"
                        onClick={() => openExtendModal(b)}
                        className="flex items-center gap-1 bg-primary-cyan/10 border border-primary-cyan/30 text-primary-cyan hover:bg-primary-cyan/20 text-xs px-2 py-1 rounded-lg font-semibold cursor-pointer"
                        title="Extend Session (+30m / +1hr)"
                      >
                        <Plus size={12} weight="bold" /> Extend
                      </button>
                    )}

                    {isConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(b._id, "checked_in")}
                        className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                      >
                        <CheckCircle size={13} /> Check In
                      </button>
                    )}

                    {isCheckedIn && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(b._id, "completed")}
                        className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 text-xs px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                      >
                        <Check size={13} /> Complete
                      </button>
                    )}

                    {!isConfirmed && !isRefunded && !isPending && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(b._id, "confirmed")}
                        className="flex items-center gap-1 text-xs text-primary-cyan hover:underline px-2 py-1 cursor-pointer"
                        title="Undo to Confirmed"
                      >
                        <ArrowUUpLeft size={12} /> Undo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extend Session Modal (Synced with DB Pricing Service) */}
      <ExtendBookingModal
        isOpen={extendModalOpen}
        onClose={() => {
          setExtendModalOpen(false);
          setBookingToExtend(null);
        }}
        booking={bookingToExtend}
        onExtended={() => fetchBookings(true)}
      />

      {/* Refund Processing Modal */}
      <RefundModal
        isOpen={refundModalOpen}
        onClose={() => {
          setRefundModalOpen(false);
          setBookingToRefund(null);
        }}
        booking={bookingToRefund}
        onRefundProcessed={() => fetchBookings(true)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Reservation"
        message="Permanently delete this reservation record?"
        confirmText="Delete"
        danger={true}
      />
    </div>
  );
}

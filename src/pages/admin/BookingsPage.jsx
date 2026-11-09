// src/pages/admin/BookingsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  ArrowUUpLeft,
} from "@phosphor-icons/react";
import { bookingService } from "../../services/bookingService";
import { useSocket } from "../../context/SocketContext";
import { notify } from "../../utils/toastController";
import { formatINR } from "../../utils/format";
import Loader from "../../components/ui/Loader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import CreateBookingModal from "../../components/bookings/CreateBookingModal";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

const TABS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "history", label: "History" },
];

const todayISO = () => new Date().toISOString().split("T")[0];

function format12HourTime(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${String(hour).padStart(2, "0")}:${minute} ${ampm} IST`;
}

// Simple embedded History Sub-Component (rendered conditionally without routing)
function HistoryView({ bookings, onUndo }) {
  const completedList = useMemo(() => {
    return bookings.filter(
      (b) => b.status === "checked_in" || b.status === "completed" || b.status === "cancelled"
    );
  }, [bookings]);

  if (completedList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border-divider bg-card-panel/30">
        <ClockCounterClockwise size={28} className="text-sub mb-2" />
        <h3 className="text-sm font-bold text-main">No history records yet</h3>
        <p className="text-xs text-sub mt-0.5">Completed or cancelled sessions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-card-panel border border-border-divider rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-app-bg/50 border-b border-border-divider flex items-center justify-between">
          <span className="text-xs font-bold text-main uppercase tracking-wider">Session Audit Log & History</span>
          <span className="text-[10px] font-mono text-sub">{completedList.length} total records</span>
        </div>
        <div className="divide-y divide-border-divider/50">
          {completedList.map((item) => (
            <div key={item._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-app-bg/30 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-main">{item.customerName}</span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                    item.status === "cancelled" ? "border-rose-400/30 bg-rose-400/10 text-rose-400" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-sub font-mono">
                  {item.station || item.screenId?.name || "Station"} • {item.date} at {format12HourTime(item.startTime)} ({item.duration}m)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-available">{formatINR(item.estimatedCost || 0)}</span>
                {/* Undo accidental action */}
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage({ isStaff = false }) {
  const { socket } = useSocket() || {};
  const [bookings, setBookings] = useState([]);
  const [allBookingsForMonth, setAllBookingsForMonth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // "list" | "calendar"
  const [activeTab, setActiveTab] = useState("all"); // "all" | "active" | "history"
  const [selectedDate, setSelectedDate] = useState(todayISO());

  const [calendarDate, setCalendarDate] = useState(new Date());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookingService.getBookings({});
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      notify.error("Failed to load lounge bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthBookings = useCallback(async () => {
    try {
      const data = await bookingService.getBookings({});
      setAllBookingsForMonth(Array.isArray(data) ? data : []);
    } catch (error) {}
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchMonthBookings();
  }, [fetchBookings, fetchMonthBookings]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchBookings();
      fetchMonthBookings();
    };
    socket.on("booking_created", handleUpdate);
    socket.on("booking_updated", handleUpdate);
    socket.on("booking_deleted", handleUpdate);
    return () => {
      socket.off("booking_created", handleUpdate);
      socket.off("booking_updated", handleUpdate);
      socket.off("booking_deleted", handleUpdate);
    };
  }, [socket, fetchBookings, fetchMonthBookings]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await bookingService.updateBookingStatus(id, newStatus);
      notify.success(`Status updated successfully`);
      fetchBookings();
      fetchMonthBookings();
    } catch (error) {
      notify.error("Failed to update status");
    }
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
      fetchBookings();
      fetchMonthBookings();
    } catch (error) {
      notify.error("Failed to delete booking");
    } finally {
      setBookingToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (activeTab === "all") return bookings;
    if (activeTab === "active") {
      return bookings.filter((b) => b.status === "confirmed" || b.status === "checked_in");
    }
    return bookings;
  }, [bookings, activeTab]);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
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
    <div className="mx-auto max-w-6xl space-y-6 pb-20 font-body text-main px-4 sm:px-6">
      
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-b border-border-divider pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main">
            Reservations & Schedule
          </h1>
          <p className="text-xs text-sub mt-0.5">
            Manage station bookings in 12-hr Indian Standard Time (IST).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-xl border border-border-divider bg-app-bg p-1">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "list" ? "bg-primary-cyan text-app-bg font-bold shadow-sm" : "text-sub hover:text-main"
              }`}
            >
              <ListBullets size={14} /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "calendar" ? "bg-primary-cyan text-app-bg font-bold shadow-sm" : "text-sub hover:text-main"
              }`}
            >
              <CalendarBlank size={14} /> Calendar
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className={`flex h-9 items-center gap-1.5 rounded-xl bg-primary-cyan px-3.5 text-xs font-bold text-app-bg shadow-md hover:opacity-90 cursor-pointer ${FOCUS}`}
          >
            <Plus size={14} weight="bold" /> New
          </button>
        </div>
      </div>

      {/* Simple Filter Bar / Tabs */}
      <div className="flex items-center justify-between gap-3 bg-card-panel p-3 rounded-2xl border border-border-divider">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-primary-cyan/15 text-primary-cyan font-bold border border-primary-cyan/30"
                  : "text-sub hover:text-main"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditional Rendering for History View vs Main List/Calendar */}
      {activeTab === "history" ? (
        <HistoryView bookings={bookings} onUndo={handleStatusChange} />
      ) : viewMode === "list" ? (
        loading ? (
          <Loader variant="skeleton-table" lines={4} text="Loading..." />
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border-divider bg-card-panel/30">
            <BookmarkSimple size={28} className="text-sub mb-2" />
            <h3 className="text-sm font-bold text-main">No reservations found</h3>
            <p className="text-xs text-sub mt-0.5">No bookings match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBookings.map((b) => {
              const isConfirmed = b.status === "confirmed";
              const isCheckedIn = b.status === "checked_in" || b.status === "completed";

              return (
                <div key={b._id} className="bg-card-panel border border-border-divider rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-primary-cyan/30 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-primary-cyan uppercase tracking-wide">
                        {b.station || b.screenId?.name || "Station"}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                        isConfirmed ? "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan" :
                        isCheckedIn ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" :
                        "border-rose-400/30 bg-rose-400/10 text-rose-400"
                      }`}>
                        {b.status.replace("_", " ")}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-main flex items-center gap-1.5">
                        <User size={14} className="text-primary-cyan shrink-0" /> {b.customerName}
                      </h3>
                      <p className="text-xs text-sub flex items-center gap-1 mt-0.5">
                        <Phone size={12} /> {b.phoneNumber}
                      </p>
                    </div>

                    <div className="flex items-center justify-between bg-app-bg px-2.5 py-1.5 rounded-xl text-xs">
                      <span className="font-bold text-main flex items-center gap-1">
                        <Clock size={13} className="text-primary-cyan" /> {format12HourTime(b.startTime)}
                      </span>
                      <span className="text-sub">{b.duration}m ({b.mode})</span>
                    </div>

                    {b.selectedGames && b.selectedGames.length > 0 && (
                      <p className="text-[11px] text-sub truncate">
                        🎮 Games: {b.selectedGames.join(", ")}
                      </p>
                    )}

                    {b.estimatedCost > 0 && (
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-sub">Total:</span>
                        <span className="font-bold text-available">{formatINR(b.estimatedCost)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-divider/50">
                    <span className="text-[10px] text-sub">{b.date}</span>
                    <div className="flex items-center gap-1">
                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b._id, "checked_in")}
                          className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                        >
                          <CheckCircle size={13} /> Check In
                        </button>
                      )}
                      
                      {/* Undo / Cancel button */}
                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b._id, "cancelled")}
                          className="text-xs text-sub hover:text-rose-400 px-2 py-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}

                      {!isConfirmed && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(b._id, "confirmed")}
                          className="flex items-center gap-1 text-xs text-primary-cyan hover:underline px-2 py-1 cursor-pointer"
                          title="Undo to Confirmed"
                        >
                          <ArrowUUpLeft size={12} /> Undo
                        </button>
                      )}

                      {!isStaff && (
                        <button
                          type="button"
                          onClick={() => { setBookingToDelete(b._id); setDeleteModalOpen(true); }}
                          className="p-1 text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                          title="Delete booking"
                        >
                          <Trash size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Optimized Big Calendar View */
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
                  onClick={() => { setSelectedDate(item.dateStr); setViewMode("list"); setActiveTab("all"); }}
                  className={`flex flex-col h-24 rounded-xl border p-2 cursor-pointer transition-all overflow-hidden ${
                    isToday ? "border-primary-cyan bg-primary-cyan/10" : "border-border-divider bg-app-bg hover:border-primary-cyan/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isToday ? "text-primary-cyan" : "text-main"}`}>{item.day}</span>
                    {dayBookings.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary-cyan/20 text-primary-cyan">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 overflow-y-auto no-scrollbar">
                    {dayBookings.slice(0, 2).map((b) => (
                      <div key={b._id} className="text-[9px] truncate bg-card-panel px-1 py-0.5 rounded border border-border-divider/60 text-main font-semibold">
                        {b.customerName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CreateBookingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onBookingCreated={() => { fetchBookings(); fetchMonthBookings(); }}
      />

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
// src/components/bookings/CreateBookingModal.jsx
import React, { useState, useEffect, useId, useMemo, useCallback } from "react";
import { bookingService } from "../../services/bookingService";
import { customerService } from "../../services/customerService";
import { screenService } from "../../services/screenService";
import { gameService } from "../../services/gameService";
import { usePricing } from "../../context/PricingContext";
import { notify } from "../../utils/toastController";
import { formatINR } from "../../utils/format";
import Modal from "../ui/Modal";
import { INPUT_CLASS } from "../ui/Sheet";
import {
  CaretDown,
  User,
  Phone,
  GameController,
  Plus,
  Check,
  CalendarBlank,
  Clock,
  WhatsappLogo,
  Receipt,
  CurrencyInr,
  Monitor,
  Gauge,
  ArrowsClockwise,
  Prohibit,
  Sparkle,
} from "@phosphor-icons/react";

const MODE_METADATA = {
  Single: { label: "Single", detail: "1 Player", tag: "Solo" },
  Dual: { label: "Dual", detail: "2 Players", tag: "Duo" },
  Triple: { label: "Triple", detail: "3 Players", tag: "Trio" },
  Big: { label: "Big Mode", detail: "4 Players", tag: "Squad" },
  SimDrive: { label: "SimDrive", detail: "Racing Rig", tag: "Wheel" },
  GTA6: { label: "GTA 6 Special", detail: "Launch Pass", tag: "VIP" },
  GTA6_Launch: { label: "GTA 6 Special", detail: "Launch Pass", tag: "VIP" },
};

function getModeMeta(modeKey) {
  if (MODE_METADATA[modeKey]) return MODE_METADATA[modeKey];
  return {
    label: modeKey,
    detail: "Custom Setup",
    tag: modeKey.slice(0, 4).toUpperCase(),
  };
}

const BASE_TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
];

const todayISO = () => new Date().toISOString().split("T")[0];

// Build upcoming 6 quick date pills
function buildUpcomingDatePills() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const list = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()];
    const sub = `${months[d.getMonth()]} ${d.getDate()}`;
    list.push({ dateStr, label, sub });
  }
  return list;
}

// Convert "07:00 PM" -> "19:00"
function to24HourTime(rawTime) {
  if (!rawTime) return "10:00";
  const trimmed = String(rawTime).trim();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1], 10);
    const minute = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }
  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    const h = String(parseInt(parts[0], 10) || 0).padStart(2, "0");
    const m = String(parseInt(parts[1], 10) || 0).padStart(2, "0");
    return `${h}:${m}`;
  }
  return "10:00";
}

// Convert "19:00" -> "07:00 PM"
function to12HourTime(time24) {
  if (!time24) return "10:00 AM";
  const [hStr, mStr] = String(time24).split(":");
  let hour = parseInt(hStr, 10);
  const minute = mStr || "00";
  if (isNaN(hour)) return time24;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
}

function timeToMinutes(timeStr) {
  const norm = to24HourTime(timeStr);
  const [h, m] = norm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function checkOverlap(start1, dur1, start2, dur2) {
  const s1 = timeToMinutes(start1);
  const e1 = s1 + Number(dur1 || 60);
  const s2 = timeToMinutes(start2);
  const e2 = s2 + Number(dur2 || 60);
  return Math.max(s1, s2) < Math.min(e1, e2);
}

export default function CreateBookingModal({ isOpen, onClose, onBookingCreated }) {
  const nameId = useId();
  const phoneId = useId();
  const utrId = useId();
  const amountId = useId();
  const datePickerId = useId();
  const notesId = useId();

  // Pricing & live discounts synced from backend pricingService via PricingContext
  const {
    matrix,
    offers,
    calculateSessionPricing,
    fetchPricing,
  } = usePricing();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screens, setScreens] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [gamesList, setGamesList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Existing bookings for slot conflict checking
  const [existingDateBookings, setExistingDateBookings] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [customTimeActive, setCustomTimeActive] = useState(false);

  const quickDates = useMemo(() => buildUpcomingDatePills(), []);

  // Dynamically derive modes directly from backend pricing matrix
  const dynamicModes = useMemo(() => {
    const keys = Object.keys(matrix || {});
    if (keys.length === 0) {
      return ["Single", "Dual", "Triple", "Big", "SimDrive"].map((k) => ({
        value: k,
        ...getModeMeta(k),
      }));
    }
    return keys.map((k) => ({
      value: k,
      ...getModeMeta(k),
    }));
  }, [matrix]);

  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    screenId: "",
    mode: "Single",
    date: todayISO(),
    startTime: "14:00", // 24-hr stored
    duration: 60,
    amountPaid: "",
    utr: "",
    selectedGames: [],
    customGameInput: "",
    notes: "",
  });

  // Load screens & games when modal opens, and fetch fresh pricing
  useEffect(() => {
    if (isOpen) {
      if (fetchPricing) fetchPricing();

      screenService.getScreens()
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setScreens(list);
          if (list.length > 0) {
            setFormData((f) => ({ ...f, screenId: list[0]._id }));
          }
        })
        .catch(() => {});

      gameService.getGames()
        .then((data) => setGamesList(Array.isArray(data) ? data : []))
        .catch(() => setGamesList([]));

      setFormData({
        customerName: "",
        phoneNumber: "",
        screenId: "",
        mode: "Single",
        date: todayISO(),
        startTime: "14:00",
        duration: 60,
        amountPaid: "",
        utr: "",
        selectedGames: [],
        customGameInput: "",
        notes: "",
      });
      setCustomTimeActive(false);
    }
  }, [isOpen, fetchPricing]);

  // Ensure current mode exists in dynamicModes
  useEffect(() => {
    if (dynamicModes.length > 0 && !dynamicModes.some((m) => m.value === formData.mode)) {
      setFormData((prev) => ({ ...prev, mode: dynamicModes[0].value }));
    }
  }, [dynamicModes, formData.mode]);

  // Fetch bookings for the selected date to mark booked slots
  const fetchDateBookings = useCallback(async (dateStr) => {
    setLoadingSlots(true);
    try {
      const data = await bookingService.getBookings({ date: dateStr });
      setExistingDateBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setExistingDateBookings([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && formData.date) {
      fetchDateBookings(formData.date);
    }
  }, [isOpen, formData.date, fetchDateBookings]);

  // Available durations from pricing matrix
  const availableDurations = useMemo(() => {
    const sessionTable = matrix?.[formData.mode]?.sessions || {};
    const keys = Object.keys(sessionTable).map(Number).sort((a, b) => a - b);
    return keys.length > 0 ? keys : [15, 30, 60, 120];
  }, [matrix, formData.mode]);

  useEffect(() => {
    if (!availableDurations.includes(formData.duration)) {
      setFormData((f) => ({
        ...f,
        duration: availableDurations.includes(60) ? 60 : availableDurations[0] || 60,
      }));
    }
  }, [availableDurations, formData.duration]);

  // Live session pricing with backend discount/offer calculation
  const currentPricing = useMemo(() => {
    return calculateSessionPricing(formData.mode, formData.duration, false) || {
      basePrice: 0,
      finalPrice: 0,
      discountAmount: 0,
      activeOffer: null,
      hasDiscount: false,
    };
  }, [formData.mode, formData.duration, calculateSessionPricing]);

  // Auto-sync amountPaid with discounted finalPrice
  useEffect(() => {
    if (currentPricing.finalPrice > 0) {
      setFormData((f) => ({ ...f, amountPaid: String(currentPricing.finalPrice) }));
    }
  }, [currentPricing.finalPrice, formData.mode, formData.duration]);

  // Selected screen object
  const currentScreen = useMemo(() => {
    return screens.find((s) => String(s._id) === String(formData.screenId)) || screens[0] || null;
  }, [screens, formData.screenId]);

  // Switch screen handler
  const handleSelectScreen = (screen) => {
    const isSim = screen.type === "SimDrive" || /simdrive/i.test(screen.name);
    setFormData((prev) => ({
      ...prev,
      screenId: screen._id,
      mode: isSim ? "SimDrive" : prev.mode === "SimDrive" ? "Single" : prev.mode,
    }));
  };

  // Mode selection handler
  const handleSelectMode = (modeVal) => {
    if (modeVal === "SimDrive") {
      const simScreen = screens.find((s) => s.type === "SimDrive" || /simdrive/i.test(s.name));
      if (simScreen) {
        setFormData((prev) => ({ ...prev, mode: modeVal, screenId: simScreen._id }));
        return;
      }
    } else if (currentScreen && currentScreen.type === "SimDrive") {
      const consoleScreen = screens.find((s) => s.type !== "SimDrive" && !/simdrive/i.test(s.name));
      if (consoleScreen) {
        setFormData((prev) => ({ ...prev, mode: modeVal, screenId: consoleScreen._id }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, mode: modeVal }));
  };

  // Slot availability calculation
  const computedSlots = useMemo(() => {
    if (!currentScreen) return [];
    const screenBookings = existingDateBookings.filter(
      (b) =>
        (String(b.screen?._id || b.screen) === String(currentScreen._id) || b.station === currentScreen.name) &&
        (b.status === "confirmed" || b.status === "checked_in")
    );

    return BASE_TIME_SLOTS.map((slot12) => {
      const slot24 = to24HourTime(slot12);
      const isBooked = screenBookings.some((b) =>
        checkOverlap(slot24, formData.duration, b.startTime, b.duration)
      );
      return {
        slot12,
        slot24,
        isBooked,
      };
    });
  }, [currentScreen, existingDateBookings, formData.duration]);

  // Select slot
  const handlePickSlot = (slot24) => {
    setFormData((prev) => ({ ...prev, startTime: slot24 }));
    setCustomTimeActive(false);
  };

  // Customer search auto-complete
  useEffect(() => {
    const query = formData.customerName.trim() || formData.phoneNumber.trim();
    if (query.length < 2) {
      setCustomers([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await customerService.searchCustomers(query);
        setCustomers(Array.isArray(results) ? results : []);
        setShowDropdown(results.length > 0);
      } catch (err) {
        setCustomers([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [formData.customerName, formData.phoneNumber]);

  const selectCustomer = (cust) => {
    setFormData((f) => ({
      ...f,
      customerName: cust.name,
      phoneNumber: cust.phoneNumber,
    }));
    setShowDropdown(false);
  };

  const set = (key) => (e) => setFormData((f) => ({ ...f, [key]: e.target.value }));

  // Game selection
  const toggleGameSelection = (gameTitle) => {
    setFormData((prev) => {
      const exists = prev.selectedGames.includes(gameTitle);
      return {
        ...prev,
        selectedGames: exists
          ? prev.selectedGames.filter((g) => g !== gameTitle)
          : [...prev.selectedGames, gameTitle],
      };
    });
  };

  const handleAddCustomGame = () => {
    const val = formData.customGameInput.trim();
    if (!val) return;
    if (!formData.selectedGames.includes(val)) {
      setFormData((prev) => ({
        ...prev,
        selectedGames: [...prev.selectedGames, val],
        customGameInput: "",
      }));
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim()) {
      notify.error("Player name is required");
      return;
    }

    const cleanPhone = formData.phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      notify.error("Please enter a valid 10-digit Indian phone number");
      return;
    }

    if (!formData.screenId) {
      notify.error("Please select a gaming screen");
      return;
    }

    if (!formData.startTime) {
      notify.error("Please select a booking time slot");
      return;
    }

    let gamesToSubmit = [...formData.selectedGames];
    const customVal = formData.customGameInput.trim();
    if (customVal && !gamesToSubmit.includes(customVal)) {
      gamesToSubmit.push(customVal);
    }

    const finalPaid = formData.amountPaid !== "" ? Number(formData.amountPaid) : currentPricing.finalPrice;

    setIsSubmitting(true);
    try {
      const res = await bookingService.createBooking({
        customerName: formData.customerName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        screenId: formData.screenId,
        mode: formData.mode,
        date: formData.date,
        startTime: formData.startTime,
        duration: Number(formData.duration),
        amountPaid: finalPaid,
        estimatedCost: finalPaid,
        utr: formData.utr ? formData.utr.trim() : "",
        selectedGames: gamesToSubmit,
        notes: formData.notes.trim(),
      });

      notify.success(
        `Booking ${res.bookingCode || "created"}! Fast2SMS WhatsApp ticket sent to ${formData.phoneNumber}`
      );
      if (onBookingCreated) onBookingCreated();
      onClose();
    } catch (error) {
      notify.error(error.response?.data?.error || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Manual Admin Booking"
      description="Backend pricing synced with automatic discount rules & Fast2SMS WhatsApp utility ticket pass."
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3 text-xs font-mono text-sub">
            <span>Amount:</span>
            {currentPricing.hasDiscount && (
              <span className="line-through text-sub text-[11px]">
                {formatINR(currentPricing.basePrice)}
              </span>
            )}
            <span className="text-base font-bold text-available font-mono">
              {formatINR(Number(formData.amountPaid) || currentPricing.finalPrice)}
            </span>
            {currentPricing.hasDiscount && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
                {currentPricing.activeOffer?.title || "Discount Active"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border-divider px-4 py-2.5 text-xs font-semibold text-sub hover:text-main cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="manual-admin-booking-modal-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-primary-cyan hover:brightness-110 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-primary-cyan/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <ArrowsClockwise size={15} className="animate-spin" />
                  Creating &amp; Dispatching...
                </>
              ) : (
                <>
                  <WhatsappLogo size={16} weight="fill" className="text-emerald-950" />
                  Confirm &amp; Create Booking
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form id="manual-admin-booking-modal-form" onSubmit={handleSubmit} className="space-y-5">
        
        {/* STEP 1: Screen & Mode Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-cyan flex items-center gap-1.5">
              <Monitor size={15} /> 1. Select Station / Screen
            </span>
            <span className="text-[11px] text-sub">PS5 4K HDR &amp; SimDrive</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {screens.map((scr) => {
              const isSelected = String(scr._id) === String(formData.screenId);
              const isSim = scr.type === "SimDrive" || /simdrive/i.test(scr.name);

              return (
                <button
                  key={scr._id}
                  type="button"
                  onClick={() => handleSelectScreen(scr)}
                  className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-primary-cyan bg-primary-cyan/10 shadow-[0_0_20px_-8px_rgba(0,255,242,0.4)]"
                      : "border-border-divider bg-app-bg hover:border-primary-cyan/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${isSelected ? "text-primary-cyan" : "text-main"}`}>
                      {scr.name}
                    </span>
                    {isSim ? (
                      <Gauge size={15} className={isSelected ? "text-primary-cyan" : "text-sub"} />
                    ) : (
                      <Monitor size={15} className={isSelected ? "text-primary-cyan" : "text-sub"} />
                    )}
                  </div>
                  <p className="text-[10px] text-sub mt-1">
                    {isSim ? "Logitech G923 Wheel Rig" : "Console · 1 to 4 Players"}
                  </p>
                  <div className="mt-2 pt-1 border-t border-border-divider/50 flex items-center justify-between text-[10px]">
                    <span className="text-sub capitalize">{scr.status || "available"}</span>
                    <span className={`font-semibold ${isSelected ? "text-primary-cyan" : "text-sub"}`}>
                      {isSelected ? "Selected ✓" : "Select"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Mode & Duration Selection (Synced from Pricing Service) */}
        <div className="space-y-3 pt-1 border-t border-border-divider/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-cyan flex items-center gap-1.5">
              <GameController size={15} /> 2. Mode &amp; Duration
            </span>
            <span className="text-[10px] font-mono text-sub">
              {currentPricing.hasDiscount ? (
                <span className="text-emerald-400 font-bold">
                  Discounted: {formatINR(currentPricing.finalPrice)} (was {formatINR(currentPricing.basePrice)})
                </span>
              ) : (
                `Matrix Rate: ${formatINR(currentPricing.finalPrice)}`
              )}
            </span>
          </div>

          {/* Mode Cards mapped from backend matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {dynamicModes.map((m) => {
              const isSelected = formData.mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => handleSelectMode(m.value)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary-cyan bg-primary-cyan/15 text-primary-cyan font-bold"
                      : "border-border-divider bg-app-bg text-sub hover:border-border-divider/80 hover:text-main"
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase opacity-75">{m.tag}</span>
                  <span className="text-xs font-semibold mt-0.5">{m.label}</span>
                  <span className="text-[9px] text-sub">{m.detail}</span>
                </button>
              );
            })}
          </div>

          {/* Duration Pills with Live Discount Calculations */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {availableDurations.map((mins) => {
              const isSelected = formData.duration === mins;
              const tierPricing = calculateSessionPricing(formData.mode, mins, false);
              const label = mins >= 60 && mins % 60 === 0 ? `${mins / 60} Hour` : `${mins} Mins`;

              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setFormData((f) => ({
                      ...f,
                      duration: mins,
                      amountPaid: String(tierPricing.finalPrice),
                    }));
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary-cyan bg-primary-cyan text-black font-bold shadow-md shadow-primary-cyan/20"
                      : "border-border-divider bg-app-bg text-main hover:border-primary-cyan/40"
                  }`}
                >
                  <span className="text-xs font-semibold">{label}</span>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      {tierPricing.hasDiscount && (
                        <span className={`line-through text-[10px] font-mono ${isSelected ? "text-black/60" : "text-sub"}`}>
                          {formatINR(tierPricing.basePrice)}
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono font-bold ${
                          isSelected
                            ? "text-black"
                            : tierPricing.hasDiscount
                            ? "text-emerald-400"
                            : "text-primary-cyan"
                        }`}
                      >
                        {formatINR(tierPricing.finalPrice)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3: Date & Slot Picker Grid */}
        <div className="space-y-3 pt-1 border-t border-border-divider/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-cyan flex items-center gap-1.5">
              <CalendarBlank size={15} /> 3. Date &amp; Available Time Slot
            </span>
            <div className="flex items-center gap-2 text-[10px] text-sub">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary-cyan" /> Selected
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-border-divider" /> Available
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Booked
              </span>
            </div>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {quickDates.map((d) => {
              const isSelected = formData.date === d.dateStr;
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, date: d.dateStr }))}
                  className={`shrink-0 rounded-xl border px-3 py-1.5 text-center transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary-cyan bg-primary-cyan/15 text-primary-cyan font-bold"
                      : "border-border-divider bg-app-bg text-sub hover:border-border-divider/80 hover:text-main"
                  }`}
                >
                  <p className="text-[10px] uppercase font-semibold">{d.label}</p>
                  <p className="text-xs font-bold">{d.sub}</p>
                </button>
              );
            })}

            {/* Custom Date Input */}
            <div className="relative shrink-0">
              <input
                id={datePickerId}
                type="date"
                value={formData.date}
                onChange={set("date")}
                className="rounded-xl border border-border-divider bg-app-bg px-2.5 py-2 text-xs font-mono text-main cursor-pointer focus:border-primary-cyan"
              />
            </div>
          </div>

          {/* Time Slot Picker Grid */}
          <div>
            {loadingSlots ? (
              <div className="flex items-center justify-center p-6 text-xs text-sub gap-2">
                <ArrowsClockwise size={14} className="animate-spin text-primary-cyan" />
                Checking station availability...
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                {computedSlots.map(({ slot12, slot24, isBooked }) => {
                  const isSelected = !isBooked && !customTimeActive && formData.startTime === slot24;

                  return (
                    <button
                      key={slot12}
                      type="button"
                      disabled={isBooked}
                      onClick={() => handlePickSlot(slot24)}
                      title={
                        isBooked
                          ? `${slot12} is already booked on ${currentScreen?.name || "Station"}`
                          : `Select ${slot12}`
                      }
                      className={`flex flex-col items-center justify-center rounded-xl border py-2 px-1 text-center transition-all ${
                        isBooked
                          ? "cursor-not-allowed border-rose-500/30 bg-rose-500/10 text-rose-400/60 opacity-60 line-through select-none"
                          : isSelected
                          ? "cursor-pointer border-primary-cyan bg-primary-cyan text-black font-bold shadow-[0_0_15px_-4px_rgba(0,255,242,0.5)]"
                          : "cursor-pointer border-border-divider bg-app-bg text-main hover:border-primary-cyan/50"
                      }`}
                    >
                      <span className="text-[11px] font-semibold">{slot12}</span>
                      {isBooked ? (
                        <span className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter mt-0.5">
                          Booked
                        </span>
                      ) : isSelected ? (
                        <span className="text-[8px] font-bold text-black uppercase tracking-tighter mt-0.5">
                          Picked ✓
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Time Option Toggle */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setCustomTimeActive((prev) => !prev)}
              className="text-xs text-primary-cyan hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Clock size={13} />
              {customTimeActive ? "Switch back to slot grid" : "Need a custom / off-hour time? Click here"}
            </button>

            {customTimeActive && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-sub font-mono">Custom Time (24h):</span>
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))}
                  className={`${INPUT_CLASS} w-32 py-1 text-xs`}
                />
              </div>
            )}
          </div>
        </div>

        {/* STEP 4: Player Info & Fast2SMS WhatsApp */}
        <div className="space-y-3 pt-1 border-t border-border-divider/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-cyan flex items-center gap-1.5">
              <User size={15} /> 4. Player Details (WhatsApp Pass)
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <WhatsappLogo size={13} weight="fill" /> Instant Ticket Pass Trigger
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Player Name */}
            <div className="relative">
              <label htmlFor={nameId} className="mb-1 block text-xs font-medium text-main">
                Player Name *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
                <input
                  id={nameId}
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.customerName}
                  onChange={set("customerName")}
                  placeholder="e.g. Rahul Sharma"
                  className={`${INPUT_CLASS} pl-9 text-xs`}
                />
              </div>

              {/* Customer Auto-Search dropdown */}
              {showDropdown && customers.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-border-divider bg-card-panel shadow-2xl overflow-hidden max-h-40 overflow-y-auto">
                  <div className="px-3 py-1 bg-app-bg font-mono text-[10px] uppercase text-sub tracking-wider border-b border-border-divider">
                    Existing Lounge Players
                  </div>
                  {customers.map((cust) => (
                    <button
                      key={cust._id}
                      type="button"
                      onClick={() => selectCustomer(cust)}
                      className="w-full text-left px-3 py-2 hover:bg-app-bg transition-colors flex items-center justify-between border-b border-border-divider/50 last:border-0 cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-bold text-main">{cust.name}</p>
                        <p className="font-mono text-[10px] text-sub">{cust.phoneNumber}</p>
                      </div>
                      <span className="font-mono text-[10px] text-primary-cyan bg-primary-cyan/10 px-2 py-0.5 rounded-md">
                        {cust.totalVisits} visits
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor={phoneId} className="mb-1 block text-xs font-medium text-main flex items-center justify-between">
                <span>Phone Number (WhatsApp) *</span>
                <span className="text-[10px] text-emerald-400 font-mono">Fast2SMS Delivery</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
                <input
                  id={phoneId}
                  type="tel"
                  required
                  autoComplete="off"
                  value={formData.phoneNumber}
                  onChange={set("phoneNumber")}
                  placeholder="9876543210"
                  className={`${INPUT_CLASS} pl-9 text-xs font-mono`}
                />
              </div>
              <p className="text-[10px] text-sub mt-1">
                WhatsApp utility ticket will be sent to this number with pass link.
              </p>
            </div>
          </div>
        </div>

        {/* STEP 5: Payment & UPI Transaction ID / UTR */}
        <div className="space-y-3 pt-1 border-t border-border-divider/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-cyan flex items-center gap-1.5">
              <Receipt size={15} /> 5. Payment &amp; UTR Verification
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Payment Status: Paid</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Amount Paid */}
            <div>
              <label htmlFor={amountId} className="mb-1 block text-xs font-medium text-main flex items-center gap-1">
                <CurrencyInr size={14} className="text-primary-cyan" />
                Amount Paid (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sub font-mono text-xs">₹</span>
                <input
                  id={amountId}
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formData.amountPaid}
                  onChange={set("amountPaid")}
                  placeholder={String(currentPricing.finalPrice)}
                  className={`${INPUT_CLASS} pl-7 font-mono text-xs`}
                />
              </div>
              <p className="text-[10px] text-sub mt-1">
                {currentPricing.hasDiscount ? (
                  <span className="text-emerald-400 font-semibold">
                    Discount active! Matrix rate is {formatINR(currentPricing.basePrice)} ({currentPricing.activeOffer?.title || "Offer"}).
                  </span>
                ) : (
                  <span>Defaults to live Matrix Rate ({formatINR(currentPricing.finalPrice)}). Editable for custom discounts.</span>
                )}
              </p>
            </div>

            {/* UPI Transaction ID / UTR */}
            <div>
              <label htmlFor={utrId} className="mb-1 block text-xs font-medium text-main flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Receipt size={14} className="text-primary-cyan" />
                  UPI Transaction ID / UTR
                </span>
                <span className="text-[10px] text-primary-cyan font-mono">Full UTR or Last 4</span>
              </label>
              <input
                id={utrId}
                type="text"
                value={formData.utr}
                onChange={set("utr")}
                placeholder="e.g. 432109876543 or 6543"
                className={`${INPUT_CLASS} font-mono text-xs`}
              />
              <p className="text-[10px] text-sub mt-1">
                Record full reference or last 4 digits for rapid verification against bank statements.
              </p>
            </div>
          </div>
        </div>

        {/* STEP 6: Optional Game Selection & Notes */}
        <div className="space-y-3 pt-1 border-t border-border-divider/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-main flex items-center gap-1.5">
              <GameController size={14} className="text-sub" />
              Game Selection (Optional)
            </span>
            <span className="text-[10px] font-mono text-sub">
              {formData.selectedGames.length} selected
            </span>
          </div>

          {gamesList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl border border-border-divider bg-app-bg/50">
              {gamesList.map((g) => {
                const title = g.title || g.name || g;
                const isSelected = formData.selectedGames.includes(title);
                return (
                  <button
                    key={g._id || title}
                    type="button"
                    onClick={() => toggleGameSelection(title)}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary-cyan text-black font-bold shadow-sm"
                        : "bg-card-panel border border-border-divider text-sub hover:text-main"
                    }`}
                  >
                    {isSelected && <Check size={12} weight="bold" />}
                    {title}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={formData.customGameInput}
              onChange={set("customGameInput")}
              placeholder="Or type custom game title (e.g. EA FC 25, GTA V)..."
              className={`${INPUT_CLASS} text-xs flex-1`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomGame();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomGame}
              className="flex items-center gap-1 bg-primary-cyan/15 border border-primary-cyan/30 text-primary-cyan hover:bg-primary-cyan/25 px-3 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Plus size={14} weight="bold" /> Add
            </button>
          </div>

          {formData.selectedGames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formData.selectedGames.map((gameName) => (
                <span
                  key={gameName}
                  className="inline-flex items-center gap-1 bg-primary-cyan/10 text-primary-cyan border border-primary-cyan/30 text-[10px] font-mono px-2 py-0.5 rounded-md"
                >
                  {gameName}
                  <button
                    type="button"
                    onClick={() => toggleGameSelection(gameName)}
                    className="hover:text-rose-400 font-bold ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div>
            <label htmlFor={notesId} className="mb-1 block text-xs font-medium text-main">
              Special Notes / Requests (Optional)
            </label>
            <textarea
              id={notesId}
              rows={1}
              value={formData.notes}
              onChange={set("notes")}
              placeholder="e.g. Birthday group, prefers DualSense Edge controllers..."
              className={`${INPUT_CLASS} h-auto py-1.5 text-xs`}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

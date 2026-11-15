// src/pages/admin/CreateBookingPage.jsx
import React, { useState, useEffect, useId, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { bookingService } from "../../services/bookingService";
import { customerService } from "../../services/customerService";
import { screenService } from "../../services/screenService";
import { gameService } from "../../services/gameService";
import { usePricing } from "../../context/PricingContext";
import { notify } from "../../utils/toastController";
import { formatINR } from "../../utils/format";
import { INPUT_CLASS } from "../../components/ui/Sheet";
import {
  ArrowLeft,
  Monitor,
  GameController,
  CalendarBlank,
  Clock,
  User,
  Phone,
  Receipt,
  CurrencyInr,
  WhatsappLogo,
  Check,
  Plus,
  Gauge,
  ArrowsClockwise,
  Sparkle,
  Info,
  ShieldCheck,
  Tag,
  Percent,
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

export default function CreateBookingPage() {
  const navigate = useNavigate();
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

  // Always re-fetch pricing and screens from backend on mount
  useEffect(() => {
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
  }, [fetchPricing]);

  // Ensure current mode exists in dynamicModes
  useEffect(() => {
    if (dynamicModes.length > 0 && !dynamicModes.some((m) => m.value === formData.mode)) {
      setFormData((prev) => ({ ...prev, mode: dynamicModes[0].value }));
    }
  }, [dynamicModes, formData.mode]);

  // Fetch bookings for the selected date to mark conflict slots
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
    if (formData.date) {
      fetchDateBookings(formData.date);
    }
  }, [formData.date, fetchDateBookings]);

  // Available durations dynamically derived from backend matrix for the selected mode
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

  // Real-time pricing with backend discount calculations
  const currentPricing = useMemo(() => {
    return calculateSessionPricing(formData.mode, formData.duration, false) || {
      basePrice: 0,
      finalPrice: 0,
      discountAmount: 0,
      activeOffer: null,
      hasDiscount: false,
    };
  }, [formData.mode, formData.duration, calculateSessionPricing]);

  // Auto-sync amountPaid with discounted finalPrice when mode/duration/discounts change
  useEffect(() => {
    if (currentPricing.finalPrice > 0) {
      setFormData((f) => ({ ...f, amountPaid: String(currentPricing.finalPrice) }));
    }
  }, [currentPricing.finalPrice, formData.mode, formData.duration]);

  // Selected screen object
  const currentScreen = useMemo(() => {
    return screens.find((s) => String(s._id) === String(formData.screenId)) || screens[0] || null;
  }, [screens, formData.screenId]);

  // Screen selection
  const handleSelectScreen = (screen) => {
    const isSim = screen.type === "SimDrive" || /simdrive/i.test(screen.name);
    setFormData((prev) => ({
      ...prev,
      screenId: screen._id,
      mode: isSim ? "SimDrive" : prev.mode === "SimDrive" ? "Single" : prev.mode,
    }));
  };

  // Mode selection
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

  // Submit Handler
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
      navigate("/booking");
    } catch (error) {
      notify.error(error.response?.data?.error || "Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-28 sm:pb-20 font-body text-main px-4 sm:px-6">
      
      {/* Header Bar */}
      <div className="pt-4 border-b border-border-divider pb-4">
        <button
          type="button"
          onClick={() => navigate("/booking")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sub hover:text-primary-cyan transition-colors mb-2 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Reservations
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main">
              New Station Reservation
            </h1>
            <p className="text-xs text-sub mt-0.5">
              Live backend pricing sync with automatic discount rules &amp; Fast2SMS WhatsApp ticket dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
              <WhatsappLogo size={15} weight="fill" />
              Fast2SMS Utility Active
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Form Layout */}
      <form id="create-booking-page-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT 8 COLUMNS: Form Sections */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* SECTION 1: Station / Screen Selection */}
            <div className="rounded-2xl border border-border-divider bg-card-panel p-4 sm:p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 text-primary-cyan">
                  <Monitor size={17} /> 1. Select Station / Screen
                </h2>
                <span className="text-[11px] text-sub">PS5 4K HDR &amp; SimDrive</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {screens.map((scr) => {
                  const isSelected = String(scr._id) === String(formData.screenId);
                  const isSim = scr.type === "SimDrive" || /simdrive/i.test(scr.name);

                  return (
                    <button
                      key={scr._id}
                      type="button"
                      onClick={() => handleSelectScreen(scr)}
                      className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-primary-cyan bg-primary-cyan/10 shadow-[0_0_20px_-8px_rgba(0,255,242,0.4)] ring-1 ring-primary-cyan"
                          : "border-border-divider bg-app-bg hover:border-primary-cyan/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-sm font-bold ${isSelected ? "text-primary-cyan" : "text-main"}`}>
                          {scr.name}
                        </span>
                        {isSim ? (
                          <Gauge size={18} className={isSelected ? "text-primary-cyan" : "text-sub"} />
                        ) : (
                          <Monitor size={18} className={isSelected ? "text-primary-cyan" : "text-sub"} />
                        )}
                      </div>

                      <p className="text-xs text-sub mt-2">
                        {isSim ? "Logitech G923 Wheel Rig" : "PS5 Console · 1 to 4 Players"}
                      </p>

                      <div className="mt-3 pt-2 border-t border-border-divider/50 flex items-center justify-between text-xs">
                        <span className="text-sub capitalize">{scr.status || "available"}</span>
                        <span className={`font-semibold ${isSelected ? "text-primary-cyan font-bold" : "text-sub"}`}>
                          {isSelected ? "Selected ✓" : "Pick"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Dynamic Gaming Mode & Duration (Synced from Backend Pricing Matrix) */}
            <div className="rounded-2xl border border-border-divider bg-card-panel p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 text-primary-cyan">
                  <GameController size={17} /> 2. Mode &amp; Duration
                </h2>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  {currentPricing.hasDiscount ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <Sparkle size={12} weight="fill" />
                      Live Rate: {formatINR(currentPricing.finalPrice)}
                      <span className="line-through text-sub font-normal text-[10px] ml-1">
                        {formatINR(currentPricing.basePrice)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-sub">Rate: {formatINR(currentPricing.finalPrice)}</span>
                  )}
                </div>
              </div>

              {/* Mode Selection — Dynamically mapped from backend matrix */}
              <div>
                <p className="text-xs text-sub mb-2 font-medium">Player Mode (from Pricing Config):</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {dynamicModes.map((m) => {
                    const isSelected = formData.mode === m.value;
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => handleSelectMode(m.value)}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary-cyan bg-primary-cyan/15 text-primary-cyan font-bold shadow-sm"
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
              </div>

              {/* Duration Pills — with live discount calculations from backend */}
              <div>
                <p className="text-xs text-sub mb-2 font-medium">Session Duration:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                        className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 transition-all cursor-pointer ${
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

                          {tierPricing.hasDiscount && (
                            <span
                              className={`text-[8px] font-mono uppercase px-1 rounded font-bold ${
                                isSelected ? "bg-black/20 text-black" : "bg-emerald-500/20 text-emerald-300"
                              }`}
                            >
                              Discount Active
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: Date & Slot Picker Grid */}
            <div className="rounded-2xl border border-border-divider bg-card-panel p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 text-primary-cyan">
                  <CalendarBlank size={17} /> 3. Date &amp; Available Slot
                </h2>
                <div className="flex items-center gap-3 text-[11px] text-sub">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary-cyan" /> Selected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-border-divider" /> Available
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Booked
                  </span>
                </div>
              </div>

              {/* Quick Date Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {quickDates.map((d) => {
                  const isSelected = formData.date === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, date: d.dateStr }))}
                      className={`shrink-0 rounded-xl border px-4 py-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary-cyan bg-primary-cyan/15 text-primary-cyan font-bold ring-1 ring-primary-cyan/50"
                          : "border-border-divider bg-app-bg text-sub hover:border-border-divider/80 hover:text-main"
                      }`}
                    >
                      <p className="text-[10px] uppercase font-semibold">{d.label}</p>
                      <p className="text-xs font-bold mt-0.5">{d.sub}</p>
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
                    className="rounded-xl border border-border-divider bg-app-bg px-3 py-2 text-xs font-mono text-main cursor-pointer focus:border-primary-cyan"
                  />
                </div>
              </div>

              {/* Time Slot Picker Grid */}
              <div>
                {loadingSlots ? (
                  <div className="flex items-center justify-center p-8 text-xs text-sub gap-2">
                    <ArrowsClockwise size={16} className="animate-spin text-primary-cyan" />
                    Checking station availability for {formData.date}...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
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
                          className={`flex flex-col items-center justify-center rounded-xl border py-2.5 px-1.5 text-center transition-all ${
                            isBooked
                              ? "cursor-not-allowed border-rose-500/30 bg-rose-500/10 text-rose-400/60 opacity-60 line-through select-none"
                              : isSelected
                              ? "cursor-pointer border-primary-cyan bg-primary-cyan text-black font-bold shadow-[0_0_15px_-4px_rgba(0,255,242,0.5)]"
                              : "cursor-pointer border-border-divider bg-app-bg text-main hover:border-primary-cyan/50"
                          }`}
                        >
                          <span className="text-xs font-semibold">{slot12}</span>
                          {isBooked ? (
                            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter mt-0.5">
                              Booked
                            </span>
                          ) : isSelected ? (
                            <span className="text-[9px] font-bold text-black uppercase tracking-tighter mt-0.5">
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setCustomTimeActive((prev) => !prev)}
                  className="text-xs text-primary-cyan hover:underline flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <Clock size={14} />
                  {customTimeActive ? "Switch back to standard slots grid" : "Need a custom / off-hour time? Click here"}
                </button>

                {customTimeActive && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-sub font-mono">Custom Start Time (24h):</span>
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

            {/* SECTION 4: Player Info & Fast2SMS WhatsApp */}
            <div className="rounded-2xl border border-border-divider bg-card-panel p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 text-primary-cyan">
                  <User size={17} /> 4. Player Details
                </h2>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                  <WhatsappLogo size={14} weight="fill" /> Ticket Delivered to Phone
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Player Name */}
                <div className="relative">
                  <label htmlFor={nameId} className="mb-1.5 block text-xs font-medium text-main">
                    Player Name *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
                    <input
                      id={nameId}
                      type="text"
                      required
                      autoComplete="off"
                      value={formData.customerName}
                      onChange={set("customerName")}
                      placeholder="e.g. Rahul Sharma"
                      className={`${INPUT_CLASS} pl-10 text-xs`}
                    />
                  </div>

                  {/* Customer Auto-Search dropdown */}
                  {showDropdown && customers.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-border-divider bg-card-panel shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                      <div className="px-3 py-1.5 bg-app-bg font-mono text-[10px] uppercase text-sub tracking-wider border-b border-border-divider">
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
                  <label htmlFor={phoneId} className="mb-1.5 block text-xs font-medium text-main flex items-center justify-between">
                    <span>Phone Number (WhatsApp) *</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Fast2SMS Template</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
                    <input
                      id={phoneId}
                      type="tel"
                      required
                      autoComplete="off"
                      value={formData.phoneNumber}
                      onChange={set("phoneNumber")}
                      placeholder="9876543210"
                      className={`${INPUT_CLASS} pl-10 text-xs font-mono`}
                    />
                  </div>
                  <p className="text-[10px] text-sub mt-1">
                    Automated Fast2SMS WhatsApp ticket link will be dispatched to this phone.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 5: Payment & UPI Transaction ID / UTR */}
            <div className="rounded-2xl border border-border-divider bg-card-panel p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 text-primary-cyan">
                  <Receipt size={17} /> 5. Payment &amp; UTR Verification
                </h2>
                <span className="text-xs font-mono text-emerald-400">Payment Status: Paid</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount Paid */}
                <div>
                  <label htmlFor={amountId} className="mb-1.5 block text-xs font-medium text-main flex items-center gap-1">
                    <CurrencyInr size={14} className="text-primary-cyan" />
                    Amount Paid (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub font-mono text-xs">₹</span>
                    <input
                      id={amountId}
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formData.amountPaid}
                      onChange={set("amountPaid")}
                      placeholder={String(currentPricing.finalPrice)}
                      className={`${INPUT_CLASS} pl-8 font-mono text-xs`}
                    />
                  </div>
                  <p className="text-[10px] text-sub mt-1">
                    {currentPricing.hasDiscount ? (
                      <span className="text-emerald-400 font-semibold">
                        Discounted from matrix rate of {formatINR(currentPricing.basePrice)} ({currentPricing.activeOffer?.title || "Active Offer"}).
                      </span>
                    ) : (
                      <span>Defaults to live Matrix Rate ({formatINR(currentPricing.finalPrice)}). Editable for custom discounts.</span>
                    )}
                  </p>
                </div>

                {/* UPI Transaction ID / UTR */}
                <div>
                  <label htmlFor={utrId} className="mb-1.5 block text-xs font-medium text-main flex items-center justify-between">
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

            {/* SECTION 6: Game Selection & Special Requests */}
            <div className="rounded-2xl border border-border-divider bg-card-panel p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2 text-sub">
                  <GameController size={17} /> 6. Games &amp; Notes (Optional)
                </h2>
                <span className="text-[10px] font-mono text-sub">
                  {formData.selectedGames.length} selected
                </span>
              </div>

              {gamesList.length > 0 && (
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2.5 rounded-xl border border-border-divider bg-app-bg/50">
                  {gamesList.map((g) => {
                    const title = g.title || g.name || g;
                    const isSelected = formData.selectedGames.includes(title);
                    return (
                      <button
                        key={g._id || title}
                        type="button"
                        onClick={() => toggleGameSelection(title)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary-cyan text-black font-bold shadow-sm"
                            : "bg-card-panel border border-border-divider text-sub hover:text-main"
                        }`}
                      >
                        {isSelected && <Check size={13} weight="bold" />}
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
                  placeholder="Or type custom game title (e.g. EA FC 25, Gran Turismo 7)..."
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
                  className="flex items-center gap-1 bg-primary-cyan/15 border border-primary-cyan/30 text-primary-cyan hover:bg-primary-cyan/25 px-3.5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <Plus size={14} weight="bold" /> Add
                </button>
              </div>

              {formData.selectedGames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.selectedGames.map((gameName) => (
                    <span
                      key={gameName}
                      className="inline-flex items-center gap-1 bg-primary-cyan/10 text-primary-cyan border border-primary-cyan/30 text-xs font-mono px-2.5 py-1 rounded-md"
                    >
                      {gameName}
                      <button
                        type="button"
                        onClick={() => toggleGameSelection(gameName)}
                        className="hover:text-rose-400 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor={notesId} className="mb-1.5 block text-xs font-medium text-main">
                  Special Notes / Requests (Optional)
                </label>
                <textarea
                  id={notesId}
                  rows={2}
                  value={formData.notes}
                  onChange={set("notes")}
                  placeholder="e.g. Birthday celebration, requested extra wireless controller..."
                  className={`${INPUT_CLASS} h-auto py-2 text-xs`}
                />
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLUMNS: Sticky Live Booking Summary & Action Card */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <div className="rounded-2xl border border-primary-cyan/30 bg-card-panel p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border-divider">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-cyan flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Booking Summary
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Ready
                </span>
              </div>

              {/* Station & Mode */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sub">Station:</span>
                  <span className="font-bold text-main">{currentScreen?.name || "Screen 1"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sub">Mode &amp; Duration:</span>
                  <span className="font-bold text-main font-mono">
                    {formData.mode} · {formData.duration}m
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sub">Date &amp; Slot:</span>
                  <span className="font-bold text-primary-cyan font-mono">
                    {formData.date} at {to12HourTime(formData.startTime)}
                  </span>
                </div>
              </div>

              {/* Player & Phone */}
              <div className="pt-3 border-t border-border-divider space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sub">Player:</span>
                  <span className="font-bold text-main truncate max-w-[150px]">
                    {formData.customerName || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sub">WhatsApp Phone:</span>
                  <span className="font-mono text-emerald-400">
                    {formData.phoneNumber || "—"}
                  </span>
                </div>
                {formData.utr && (
                  <div className="flex items-center justify-between">
                    <span className="text-sub">UPI UTR Ref:</span>
                    <span className="font-mono text-xs text-primary-cyan">{formData.utr}</span>
                  </div>
                )}
              </div>

              {/* Amount Display & Live Discount Banner */}
              <div className="pt-3 border-t border-border-divider space-y-2">
                {currentPricing.hasDiscount && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                    <span className="text-emerald-300 flex items-center gap-1.5 font-medium text-[11px]">
                      <Sparkle size={14} className="text-emerald-400 shrink-0" weight="fill" />
                      {currentPricing.activeOffer?.title || "Active Discount Applied"}
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      -{formatINR(currentPricing.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-sub font-medium">Total Payable:</span>
                  <div className="text-right">
                    {currentPricing.hasDiscount && (
                      <span className="line-through text-xs text-sub font-mono mr-2">
                        {formatINR(currentPricing.basePrice)}
                      </span>
                    )}
                    <span className="text-xl font-bold font-mono text-available">
                      {formatINR(Number(formData.amountPaid) || currentPricing.finalPrice)}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-sub">Payment Status: Paid on Confirmation</p>
              </div>

              {/* Fast2SMS Notice */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
                <WhatsappLogo size={18} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Clicking confirm will automatically generate the 48-char secure ticket token and send the WhatsApp pass to <strong>{formData.phoneNumber || "the player"}</strong>.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  form="create-booking-page-form"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-cyan hover:brightness-110 py-3 text-xs font-bold text-black shadow-lg shadow-primary-cyan/20 cursor-pointer transition-all disabled:opacity-50"
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

                <button
                  type="button"
                  onClick={() => navigate("/booking")}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-border-divider py-2 text-xs font-semibold text-sub hover:text-main cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>

      {/* Floating Bottom Action Bar for Mobile Viewports */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card-panel/95 backdrop-blur-xl border-t border-border-divider p-3.5 flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <span className="text-[10px] text-sub block">Total Amount</span>
          <div className="flex items-center gap-1.5">
            {currentPricing.hasDiscount && (
              <span className="line-through text-[11px] text-sub font-mono">
                {formatINR(currentPricing.basePrice)}
              </span>
            )}
            <span className="text-base font-bold text-available font-mono">
              {formatINR(Number(formData.amountPaid) || currentPricing.finalPrice)}
            </span>
          </div>
        </div>

        <button
          type="submit"
          form="create-booking-page-form"
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary-cyan hover:brightness-110 py-2.5 px-4 text-xs font-bold text-black shadow-md cursor-pointer transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <ArrowsClockwise size={14} className="animate-spin" /> Creating...
            </>
          ) : (
            <>
              <WhatsappLogo size={15} weight="fill" /> Confirm Booking
            </>
          )}
        </button>
      </div>

    </div>
  );
}

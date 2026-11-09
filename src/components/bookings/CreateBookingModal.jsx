// src/components/bookings/CreateBookingModal.jsx
import React, { useState, useEffect, useId, useMemo } from "react";
import { bookingService } from "../../services/bookingService";
import { customerService } from "../../services/customerService";
import { screenService } from "../../services/screenService";
import { gameService } from "../../services/gameService";
import { usePricing } from "../../context/PricingContext";
import { notify } from "../../utils/toastController";
import { formatINR } from "../../utils/format";
import Modal from "../ui/Modal";
import { INPUT_CLASS, PRIMARY_BTN, OptionCard } from "../ui/Sheet";
import { CaretDown, User, Phone, GameController, Plus, Check } from "@phosphor-icons/react";

const MODES = [
  { value: "SimDrive", label: "SimDrive", detail: "Wheel Setup" },
  { value: "Single", label: "Single", detail: "1 Player" },
  { value: "Dual", label: "Dual", detail: "2 Players" },
  { value: "Triple", label: "Triple", detail: "3 Players" },
  { value: "Big", label: "Big Mode", detail: "4 Players" },
];

const COLS = { 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" };

const todayISO = () => new Date().toISOString().split("T")[0];

export default function CreateBookingModal({ isOpen, onClose, onBookingCreated }) {
  const nameId = useId();
  const phoneId = useId();
  const screenId = useId();
  const dateId = useId();
  const timeId = useId();
  const notesId = useId();

  const { matrix, calculateSessionCost } = usePricing();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screens, setScreens] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [gamesList, setGamesList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    phoneNumber: "",
    screenId: "",
    mode: "Single",
    date: todayISO(),
    startTime: "14:00",
    duration: 30,
    selectedGames: [], // Required array of game strings/titles
    customGameInput: "", // Manual string input fallback
    notes: "",
  });

  // Fetch screens, games via service layer, and reset on open
  useEffect(() => {
    if (isOpen) {
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
        .then((data) => {
          setGamesList(Array.isArray(data) ? data : []);
        })
        .catch(() => setGamesList([]));

      setFormData({
        customerName: "",
        phoneNumber: "",
        screenId: "",
        mode: "Single",
        date: todayISO(),
        startTime: "14:00",
        duration: 30,
        selectedGames: [],
        customGameInput: "",
        notes: "",
      });
    }
  }, [isOpen]);

  const availableDurations = useMemo(() => {
    const sessionTable = matrix?.[formData.mode]?.sessions || {};
    const keys = Object.keys(sessionTable).map(Number).sort((a, b) => a - b);
    return keys.length > 0 ? keys : [15, 30, 60, 120];
  }, [matrix, formData.mode]);

  useEffect(() => {
    if (!availableDurations.includes(formData.duration)) {
      setFormData((f) => ({
        ...f,
        duration: availableDurations.includes(30) ? 30 : availableDurations[0] || 30,
      }));
    }
  }, [availableDurations, formData.duration]);

  const calculatedCost = useMemo(() => {
    return calculateSessionCost(formData.mode, formData.duration, false);
  }, [formData.mode, formData.duration, calculateSessionCost]);

  // Customer search autocomplete
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
        setCustomers(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        setCustomers([]);
      }
    }, 250);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.screenId) {
      notify.error("Please select a valid station");
      return;
    }
    if (!formData.selectedGames || formData.selectedGames.length === 0) {
      notify.error("Game selection is required. Please choose or type at least one game.");
      return;
    }
    if (!formData.duration || calculatedCost <= 0) {
      notify.error("Please select a valid duration and rate");
      return;
    }

    setIsSubmitting(true);
    try {
      await bookingService.createBooking({
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        screenId: formData.screenId,
        mode: formData.mode,
        date: formData.date,
        startTime: formData.startTime,
        duration: formData.duration,
        estimatedCost: calculatedCost,
        selectedGames: formData.selectedGames,
        notes: formData.notes,
      });
      notify.success("Reservation created successfully");
      onBookingCreated();
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
      title="New Lounge Reservation"
      description="Schedule station slot with required game selection and live rates."
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 font-mono text-xs text-sub">
            <span>Estimated Total:</span>
            <span className="text-base font-bold text-available font-mono">
              {formatINR(calculatedCost)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border-divider px-4 py-2.5 text-xs font-semibold text-sub hover:text-main cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-booking-form"
              disabled={isSubmitting || calculatedCost <= 0}
              className={PRIMARY_BTN}
            >
              {isSubmitting ? "Creating..." : "Confirm Reservation"}
            </button>
          </div>
        </div>
      }
    >
      <form id="create-booking-form" onSubmit={handleSubmit} className="space-y-4 relative">
        {/* Customer Search Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <label htmlFor={nameId} className="mb-1 block text-xs font-medium text-main">
              Customer Name
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
              <input
                id={nameId}
                type="text"
                required
                autoComplete="off"
                value={formData.customerName}
                onChange={set("customerName")}
                placeholder="e.g., Alex Mercer"
                className={`${INPUT_CLASS} pl-9 text-xs`}
              />
            </div>
            
            {showDropdown && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-border-divider bg-card-panel shadow-2xl overflow-hidden max-h-40 overflow-y-auto">
                <div className="px-3 py-1 bg-app-bg font-mono text-[10px] uppercase text-sub tracking-wider border-b border-border-divider">
                  Existing Customers
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

          <div>
            <label htmlFor={phoneId} className="mb-1 block text-xs font-medium text-main">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
              <input
                id={phoneId}
                type="tel"
                required
                autoComplete="off"
                value={formData.phoneNumber}
                onChange={set("phoneNumber")}
                placeholder="+91 98765 43210"
                className={`${INPUT_CLASS} pl-9 text-xs`}
              />
            </div>
          </div>
        </div>

        {/* Station Selection */}
        <div>
          <label htmlFor={screenId} className="mb-1 block text-xs font-medium text-main">
            Assigned Station / Screen
          </label>
          <div className="relative">
            <select
              id={screenId}
              value={formData.screenId}
              onChange={set("screenId")}
              className={`${INPUT_CLASS} cursor-pointer appearance-none pr-8 text-xs`}
            >
              {screens.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.type}) - {s.status}
                </option>
              ))}
            </select>
            <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub" />
          </div>
        </div>

        {/* Required Game Selection (from gameService API + Manual String Input Fallback) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-main flex items-center gap-1.5">
              <GameController size={15} className="text-primary-cyan" />
              Select Games <span className="text-rose-400">* (Required)</span>
            </label>
            <span className="font-mono text-[10px] text-sub">
              {formData.selectedGames.length} selected
            </span>
          </div>

          {gamesList.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl border border-border-divider bg-app-bg/50">
              {gamesList.map((g) => {
                const title = g.title || g.name || g;
                const isSelected = formData.selectedGames.includes(title);
                return (
                  <button
                    key={g._id || title}
                    type="button"
                    onClick={() => toggleGameSelection(title)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary-cyan text-app-bg font-bold shadow-sm"
                        : "bg-card-panel border border-border-divider text-sub hover:text-main"
                    }`}
                  >
                    {isSelected && <Check size={12} weight="bold" />}
                    {title}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-sub italic mb-2">No pre-configured games fetched. Type game titles manually below.</p>
          )}

          {/* Manual String Input for Custom Game Name */}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={formData.customGameInput}
              onChange={set("customGameInput")}
              placeholder="Type custom game title (e.g., FIFA 26)..."
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

          {/* Selected Game Badges preview */}
          {formData.selectedGames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
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
        </div>

        {/* Gaming Mode Selection (Pills) */}
        <fieldset>
          <legend className="mb-1 text-xs font-medium text-main">
            Gaming Mode
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {MODES.map((o) => (
              <OptionCard
                key={`booking-mode-${o.value}`}
                name="booking-mode"
                value={o.value}
                checked={formData.mode === o.value}
                onChange={() => setFormData((f) => ({ ...f, mode: o.value }))}
              >
                <span className="text-xs font-semibold">{o.label}</span>
                <span className="text-[9px] text-sub">{o.detail}</span>
              </OptionCard>
            ))}
          </div>
        </fieldset>

        {/* Session Duration Selection */}
        <fieldset>
          <legend className="mb-1 text-xs font-medium text-main">
            Reservation Duration
          </legend>
          <div className={`grid gap-1.5 ${COLS[availableDurations.length] || "grid-cols-4"}`}>
            {availableDurations.map((mins) => {
              const tierPrice = matrix?.[formData.mode]?.sessions?.[mins] || 0;
              return (
                <OptionCard
                  key={`booking-dur-${mins}`}
                  name="booking-duration"
                  value={mins}
                  checked={formData.duration === mins}
                  onChange={() => setFormData((f) => ({ ...f, duration: mins }))}
                >
                  <span className="font-mono text-xs font-bold tabular-nums">
                    {mins >= 60 && mins % 60 === 0 ? `${mins / 60} Hr` : `${mins} M`}
                  </span>
                  <span className="font-mono text-[9px] tabular-nums text-sub">
                    {formatINR(tierPrice)}
                  </span>
                </OptionCard>
              );
            })}
          </div>
        </fieldset>

        {/* Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={dateId} className="mb-1 block text-xs font-medium text-main">
              Reservation Date
            </label>
            <input
              id={dateId}
              type="date"
              required
              value={formData.date}
              onChange={set("date")}
              className={`${INPUT_CLASS} text-xs`}
            />
          </div>

          <div>
            <label htmlFor={timeId} className="mb-1 block text-xs font-medium text-main">
              Start Time
            </label>
            <input
              id={timeId}
              type="time"
              required
              value={formData.startTime}
              onChange={set("startTime")}
              className={`${INPUT_CLASS} text-xs`}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor={notesId} className="mb-1 block text-xs font-medium text-main">
            Notes / Special Requests (Optional)
          </label>
          <textarea
            id={notesId}
            rows={1}
            value={formData.notes}
            onChange={set("notes")}
            placeholder="e.g., Bringing own racing wheel gear..."
            className={`${INPUT_CLASS} h-auto py-1.5 text-xs`}
          />
        </div>
      </form>
    </Modal>
  );
}
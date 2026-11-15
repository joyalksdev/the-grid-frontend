// src/components/bookings/ExtendBookingModal.jsx
import React, { useState, useEffect, useMemo, useId } from "react";
import Modal from "../ui/Modal";
import { INPUT_CLASS } from "../ui/Sheet";
import { formatINR } from "../../utils/format";
import { notify } from "../../utils/toastController";
import { bookingService } from "../../services/bookingService";
import { usePricing } from "../../context/PricingContext";
import {
  Clock,
  CurrencyInr,
  Receipt,
  Plus,
  Sparkle,
  ArrowsClockwise,
} from "@phosphor-icons/react";

export default function ExtendBookingModal({
  isOpen,
  onClose,
  booking,
  onExtended,
}) {
  const amountId = useId();
  const utrId = useId();

  const { matrix, calculateSessionPricing, calculateCustomCost, fetchPricing } =
    usePricing();

  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [amountPaid, setAmountPaid] = useState("");
  const [utr, setUtr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookingMode = booking?.mode || "Single";

  // Strictly derive the 2 extension tiers from GTA6_Launch.extensions ({ 30: 130, 60: 230 })
  const extensionOptions = useMemo(() => {
    const extTable = matrix?.GTA6_Launch?.extensions || { 30: 130, 60: 230 };
    const baseTiers = Object.keys(extTable)
      .map(Number)
      .filter((n) => n === 30 || n === 60)
      .sort((a, b) => a - b);

    return baseTiers.length > 0 ? baseTiers : [30, 60];
  }, [matrix]);

  // Calculate price for extension duration using GTA6_Launch.extensions via PricingContext
  const getExtensionPriceInfo = (mins) => {
    return (
      calculateSessionPricing("GTA6_Launch", mins, true) || {
        basePrice: mins === 60 ? 230 : 130,
        finalPrice: mins === 60 ? 230 : 130,
        discountAmount: 0,
        activeOffer: null,
        hasDiscount: false,
      }
    );
  };

  const currentExtPricing = useMemo(() => {
    return getExtensionPriceInfo(selectedMinutes);
  }, [selectedMinutes, bookingMode, matrix]);

  useEffect(() => {
    if (isOpen && booking) {
      if (fetchPricing) fetchPricing();
      const defaultMins = extensionOptions.includes(30)
        ? 30
        : extensionOptions[0] || 60;
      setSelectedMinutes(defaultMins);
      setUtr("");
    }
  }, [isOpen, booking]);

  useEffect(() => {
    if (currentExtPricing.finalPrice >= 0) {
      setAmountPaid(String(currentExtPricing.finalPrice));
    }
  }, [currentExtPricing.finalPrice, selectedMinutes]);

  if (!booking) return null;

  const currentDuration = Number(booking.duration || 60);
  const currentTotalAmount = Number(
    booking.totalAmount !== undefined
      ? booking.totalAmount
      : booking.estimatedCost || 0
  );
  const newTotalDuration = currentDuration + Number(selectedMinutes || 0);
  const newCombinedTotal = currentTotalAmount + (Number(amountPaid) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMinutes || selectedMinutes <= 0) {
      notify.error("Please select an extension duration");
      return;
    }

    setIsSubmitting(true);
    try {
      await bookingService.extendBooking(booking._id, {
        extensionMinutes: Number(selectedMinutes),
        amountPaid:
          amountPaid !== "" ? Number(amountPaid) : currentExtPricing.finalPrice,
        utr: utr.trim(),
      });
      notify.success(
        `Extended ${booking.customerName}'s session by +${selectedMinutes} mins!`
      );
      if (onExtended) onExtended();
      onClose();
    } catch (error) {
      notify.error(
        error.response?.data?.error || "Failed to extend booking session"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Extend Session Duration"
      description={`Add extra playtime for ${booking.customerName} (${booking.station || "Station"}) synced with live DB extension rates.`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-sub font-mono">
            New Total: <span className="font-bold text-available">{formatINR(newCombinedTotal)}</span>{" "}
            <span className="text-[10px] text-sub">({newTotalDuration}m)</span>
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-border-divider px-3.5 py-2 text-xs font-semibold text-sub hover:text-main cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="extend-booking-form"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-primary-cyan hover:brightness-110 px-4 py-2 text-xs font-bold text-black shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <ArrowsClockwise size={14} className="animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus size={14} weight="bold" /> Add +{selectedMinutes}m Extension
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <form id="extend-booking-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Current Booking Info */}
        <div className="rounded-xl border border-border-divider bg-app-bg/60 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary-cyan uppercase">
              {booking.station || "Station"}
            </span>
            <span className="font-mono text-[11px] text-sub">
              {booking.orderId || booking.bookingCode}
            </span>
          </div>
          <div className="flex items-center justify-between text-sub font-mono text-[11px]">
            <span>
              {booking.date} • {booking.startTime} (Current: {currentDuration}m)
            </span>
            <span className="text-main font-bold">
              {bookingMode === "GTA6_Launch" ? "GTA 6 Launch" : bookingMode}
            </span>
          </div>
        </div>

        {/* Select Extension Duration (Synced with DB Pricing Service) */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-main flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-primary-cyan" />
              Select Extra Time (DB Extension Matrix)
            </span>
            <span className="font-mono text-[10px] text-primary-cyan">
              {currentDuration}m → {newTotalDuration}m
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            {extensionOptions.map((mins) => {
              const isSelected = selectedMinutes === mins;
              const info = getExtensionPriceInfo(mins);
              const label =
                mins === 60
                  ? "+1 Hour (60m)"
                  : mins === 90
                  ? "+1.5 Hours (90m)"
                  : mins === 120
                  ? "+2 Hours (120m)"
                  : `+${mins} Mins`;

              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  className={`flex flex-col items-start justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary-cyan bg-primary-cyan text-black font-bold shadow-md"
                      : "border-border-divider bg-app-bg text-main hover:border-primary-cyan/40"
                  }`}
                >
                  <span className="text-xs font-semibold">{label}</span>
                  <div className="mt-1 flex items-center gap-1 font-mono text-xs">
                    {info.hasDiscount && (
                      <span
                        className={`line-through text-[10px] ${
                          isSelected ? "text-black/60" : "text-sub"
                        }`}
                      >
                        {formatINR(info.basePrice)}
                      </span>
                    )}
                    <span
                      className={`font-bold ${
                        isSelected
                          ? "text-black"
                          : info.hasDiscount
                          ? "text-emerald-400"
                          : "text-primary-cyan"
                      }`}
                    >
                      +{formatINR(info.finalPrice)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Extension Amount Paid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={amountId}
              className="mb-1 block text-xs font-medium text-main flex items-center gap-1"
            >
              <CurrencyInr size={14} className="text-primary-cyan" />
              Extension Charge (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sub font-mono text-xs">
                ₹
              </span>
              <input
                id={amountId}
                type="number"
                min="0"
                step="1"
                required
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className={`${INPUT_CLASS} pl-7 font-mono text-xs`}
              />
            </div>
            {currentExtPricing.hasDiscount && (
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                <Sparkle size={11} weight="fill" /> Active offer applied
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={utrId}
              className="mb-1 block text-xs font-medium text-main flex items-center gap-1"
            >
              <Receipt size={14} className="text-primary-cyan" />
              UTR / Payment Ref (Optional)
            </label>
            <input
              id={utrId}
              type="text"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="Last 4 digits or UTR"
              className={`${INPUT_CLASS} font-mono text-xs`}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

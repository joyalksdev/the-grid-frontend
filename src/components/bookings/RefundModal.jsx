// src/components/bookings/RefundModal.jsx
import React, { useState, useEffect, useId } from "react";
import Modal from "../ui/Modal";
import { INPUT_CLASS } from "../ui/Sheet";
import { formatINR } from "../../utils/format";
import { notify } from "../../utils/toastController";
import { bookingService } from "../../services/bookingService";
import {
  CurrencyInr,
  Receipt,
  WarningCircle,
  Tag,
  Note,
  ArrowsClockwise,
} from "@phosphor-icons/react";

const REASONS = [
  "Customer Requested Cancellation",
  "Station / Hardware Technical Issue",
  "Double Booking / Schedule Conflict",
  "Customer No-Show / Late Cancel",
  "Price Adjustment / Overcharge",
  "Other Reason",
];

export default function RefundModal({ isOpen, onClose, booking, onRefundProcessed }) {
  const amountId = useId();
  const refId = useId();
  const reasonId = useId();
  const notesId = useId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [refundTransactionRef, setRefundTransactionRef] = useState("");
  const [notes, setNotes] = useState("");

  const originalTotal = Number(
    booking?.totalAmount !== undefined
      ? booking.totalAmount
      : booking?.estimatedCost || 0
  );

  useEffect(() => {
    if (booking && isOpen) {
      setRefundAmount(String(originalTotal));
      setRefundReason(REASONS[0]);
      setCustomReason("");
      setRefundTransactionRef(booking.utr || "");
      setNotes("");
    }
  }, [booking, isOpen, originalTotal]);

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(refundAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      notify.error("Please enter a valid refund amount");
      return;
    }

    const finalReason = refundReason === "Other Reason" ? (customReason.trim() || "Other Reason") : refundReason;

    setIsSubmitting(true);
    try {
      await bookingService.refundBooking(booking._id, {
        refundAmount: numAmount,
        refundReason: finalReason,
        refundTransactionRef: refundTransactionRef.trim(),
        notes: notes.trim(),
      });
      notify.success(`Refund of ${formatINR(numAmount)} recorded for ${booking.customerName}`);
      if (onRefundProcessed) onRefundProcessed();
      onClose();
    } catch (error) {
      notify.error(error.response?.data?.error || "Failed to process refund");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Booking Refund"
      description={`Record refund details & update status for ${booking.customerName} (${booking.bookingCode || "Booking"}).`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-sub font-mono">
            Original: <span className="font-bold text-main">{formatINR(originalTotal)}</span>
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
              form="refund-booking-form"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-black shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <ArrowsClockwise size={14} className="animate-spin" /> Processing...
                </>
              ) : (
                "Confirm & Refund"
              )}
            </button>
          </div>
        </div>
      }
    >
      <form id="refund-booking-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Booking Summary Box */}
        <div className="rounded-xl border border-border-divider bg-app-bg/60 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-main">{booking.station || "Station"}</span>
            <span className="font-mono text-[11px] text-primary-cyan">{booking.bookingCode}</span>
          </div>
          <div className="flex items-center justify-between text-sub font-mono text-[11px]">
            <span>{booking.date} at {booking.startTime} ({booking.duration}m)</span>
            <span className="text-main font-bold">{booking.mode}</span>
          </div>
          {booking.utr && (
            <div className="text-[11px] text-sub font-mono pt-1 border-t border-border-divider/50 flex items-center justify-between">
              <span>Original UPI / UTR:</span>
              <span className="text-emerald-400 font-bold">{booking.utr}</span>
            </div>
          )}
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <WarningCircle size={18} className="shrink-0 mt-0.5 text-amber-400" />
          <p className="leading-relaxed text-[11px]">
            Processing this refund will set the booking status to <strong className="font-bold text-amber-200">refunded</strong>, free up the station slot, and record the audit log with your staff credentials.
          </p>
        </div>

        {/* Refund Amount */}
        <div>
          <label htmlFor={amountId} className="mb-1 block text-xs font-medium text-main flex items-center gap-1">
            <CurrencyInr size={14} className="text-primary-cyan" />
            Refund Amount (INR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sub font-mono text-xs">₹</span>
            <input
              id={amountId}
              type="number"
              min="0"
              step="1"
              required
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="0"
              className={`${INPUT_CLASS} pl-7 font-mono text-xs`}
            />
          </div>
          <p className="text-[10px] text-sub mt-1">
            Full refund: {formatINR(originalTotal)}. You may enter a partial amount if a cancellation fee was deducted.
          </p>
        </div>

        {/* Refund Transaction Reference / UTR */}
        <div>
          <label htmlFor={refId} className="mb-1 block text-xs font-medium text-main flex items-center gap-1">
            <Receipt size={14} className="text-primary-cyan" />
            Refund UTR / Bank Reference
          </label>
          <input
            id={refId}
            type="text"
            value={refundTransactionRef}
            onChange={(e) => setRefundTransactionRef(e.target.value)}
            placeholder="e.g. 432109876543 or last 4 digits (6543)"
            className={`${INPUT_CLASS} font-mono text-xs`}
          />
          <p className="text-[10px] text-sub mt-1">
            Record the UPI transfer reference ID or bank slip note for your records.
          </p>
        </div>

        {/* Reason */}
        <div>
          <label htmlFor={reasonId} className="mb-1 block text-xs font-medium text-main flex items-center gap-1">
            <Tag size={14} className="text-primary-cyan" />
            Refund Reason
          </label>
          <select
            id={reasonId}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            className={`${INPUT_CLASS} cursor-pointer text-xs`}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {refundReason === "Other Reason" && (
            <input
              type="text"
              required
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Specify the reason for refund..."
              className={`${INPUT_CLASS} text-xs mt-2`}
            />
          )}
        </div>

        {/* Internal Notes */}
        <div>
          <label htmlFor={notesId} className="mb-1 block text-xs font-medium text-main flex items-center gap-1">
            <Note size={14} className="text-primary-cyan" />
            Internal Notes (Optional)
          </label>
          <textarea
            id={notesId}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details about the refund discussion with the player..."
            className={`${INPUT_CLASS} h-auto py-2 text-xs`}
          />
        </div>
      </form>
    </Modal>
  );
}

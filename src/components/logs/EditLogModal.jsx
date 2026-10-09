// src/components/logs/EditLogModal.jsx
import React, { useState, useEffect, useId } from "react";
import { toast } from "react-hot-toast";
import { logService } from "../../services/logService";
import Sheet, { INPUT_CLASS, PRIMARY_BTN } from "../ui/Sheet";
import { CaretDown } from "@phosphor-icons/react";

function formatDurationDisplay(mins) {
  const num = parseInt(mins, 10);
  if (isNaN(num) || num <= 0) return "0 min";
  if (num < 60) return `${num} min`;
  const hours = Math.floor(num / 60);
  const rem = num % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
}

const LABEL = "mb-1.5 block text-sm font-medium text-main";
const FIELD =
  "flex h-11 items-center gap-1.5 rounded-lg border border-border-divider bg-app-bg px-3 transition-colors duration-150 motion-reduce:transition-none focus-within:border-primary-cyan focus-within:ring-2 focus-within:ring-primary-cyan/40";
const FIELD_INPUT =
  "w-full bg-transparent font-mono text-base font-bold tabular-nums text-main focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export default function EditLogModal({ isOpen, onClose, logData, onUpdateComplete }) {
  const playerId = useId();
  const screenId = useId();
  const durationId = useId();
  const costId = useId();
  const paymentId = useId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    player: "",
    screen: "",
    duration: "",
    cost: "",
    payment: "UPI",
  });

  useEffect(() => {
    if (isOpen && logData) {
      setFormData({
        player: logData.player || "",
        screen: logData.screen || "",
        duration: logData.duration !== undefined ? String(logData.duration) : "",
        cost: logData.cost !== undefined ? String(logData.cost) : "",
        payment: logData.payment || "UPI",
      });
    }
  }, [isOpen, logData]);

  const set = (key) => (e) => setFormData((f) => ({ ...f, [key]: e.target.value }));

  const logId = logData?._id || logData?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!logId) return;
    setIsSubmitting(true);

    try {
      await logService.updateLog(logId, formData);
      toast.success("Log updated successfully");
      onUpdateComplete();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Session Record"
      description={logId ? `Log entry ${logId}` : undefined}
      footer={
        <button type="submit" form="edit-log-form" disabled={isSubmitting} className={PRIMARY_BTN}>
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
      }
    >
      <form id="edit-log-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={playerId} className={LABEL}>
            Player Name
          </label>
          <input
            id={playerId}
            type="text"
            required
            autoComplete="off"
            value={formData.player}
            onChange={set("player")}
            placeholder="e.g., John Doe"
            className={INPUT_CLASS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={screenId} className={LABEL}>
              Station / Screen
            </label>
            <input
              id={screenId}
              type="text"
              required
              value={formData.screen}
              onChange={set("screen")}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label htmlFor={durationId} className={LABEL}>
              Duration
            </label>
            <div className={FIELD}>
              <input
                id={durationId}
                type="number"
                required
                min="1"
                inputMode="numeric"
                value={formData.duration}
                onChange={set("duration")}
                className={FIELD_INPUT}
              />
              <span className="shrink-0 text-xs text-sub">min</span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-sub">
              {formatDurationDisplay(formData.duration)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={costId} className={LABEL}>
              Cost
            </label>
            <div className={FIELD}>
              <span aria-hidden="true" className="shrink-0 font-mono text-sm text-sub">
                ₹
              </span>
              <input
                id={costId}
                type="number"
                required
                min="0"
                inputMode="numeric"
                value={formData.cost}
                onChange={set("cost")}
                className={FIELD_INPUT}
              />
            </div>
          </div>

          <div>
            <label htmlFor={paymentId} className={LABEL}>
              Payment Method
            </label>
            <div className="relative">
              <select
                id={paymentId}
                value={formData.payment}
                onChange={set("payment")}
                className={`${INPUT_CLASS} cursor-pointer appearance-none pr-8`}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="UPI/GPay">UPI / GPay</option>
                <option value="Card">Card</option>
              </select>
              <CaretDown
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub"
              />
            </div>
          </div>
        </div>
      </form>
    </Sheet>
  );
}
// src/components/ui/ExtendModal.jsx
import { useState, useEffect } from "react";
import { PRICING_MATRIX, calculateSessionCost } from "../../config/pricing";
import { formatINR } from "../../utils/format";
import Sheet, { OptionCard, PRIMARY_BTN } from "./Sheet";

const DEFAULT_EXTENSIONS = { 15: 50, 30: 80, 60: 130 };

const getOptions = (mode) => PRICING_MATRIX[mode]?.extensions || DEFAULT_EXTENSIONS;

export default function ExtendModal({ screen, isOpen, onClose, onConfirm }) {
  const [selectedMinutes, setSelectedMinutes] = useState(30);

  const session = screen?.activeSession;
  const mode = session?.mode || "Single";
  const extensionOptions = getOptions(mode);
  const additionalCost = calculateSessionCost(mode, selectedMinutes, true);

  // Start on 30 min when offered, otherwise the first available option
  useEffect(() => {
    if (!isOpen) return;
    const keys = Object.keys(getOptions(mode)).map(Number);
    setSelectedMinutes(keys.includes(30) ? 30 : keys[0]);
  }, [isOpen, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      screenId: screen.screenId || screen.id || screen._id,
      additionalMinutes: selectedMinutes,
    });
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen && !!session}
      onClose={onClose}
      title="Extend Session"
      description={
        session ? `${screen.name} · ${session.player}` : screen?.name
      }
      footer={
        <button type="submit" form="extend-form" className={PRIMARY_BTN}>
          Confirm Extension
        </button>
      }
    >
      <form id="extend-form" onSubmit={handleSubmit} className="space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-main">
            Additional Duration
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(extensionOptions).map((minsStr) => {
              const mins = Number(minsStr);
              const cost = extensionOptions[mins];

              return (
                <OptionCard
                  key={mins}
                  name="extend-minutes"
                  value={mins}
                  checked={selectedMinutes === mins}
                  onChange={() => setSelectedMinutes(mins)}
                >
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {mins}&nbsp;min
                  </span>
                  <span className="font-mono text-xs tabular-nums text-sub">
                    +{formatINR(cost)}
                  </span>
                </OptionCard>
              );
            })}
          </div>
        </fieldset>

        <div className="flex items-center justify-between rounded-lg border border-border-divider bg-app-bg p-4">
          <span className="text-sm text-sub">Additional Fee</span>
          <span className="font-mono text-2xl font-bold tabular-nums text-available">
            {formatINR(additionalCost)}
          </span>
        </div>
      </form>
    </Sheet>
  );
} 
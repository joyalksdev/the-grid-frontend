// src/components/ui/ExtendModal.jsx
import { useState, useEffect } from "react";
import { PRICING_MATRIX, calculateSessionCost } from "../../config/pricing";
import { formatINR } from "../../utils/format";
import Sheet, { OptionCard, PRIMARY_BTN } from "./Sheet";
import PriceCalculator from "./PriceCalculator";

const DEFAULT_EXTENSIONS = { 15: 50, 30: 80, 60: 130 };
const COLS = { 3: "grid-cols-3", 4: "grid-cols-4" };

const getOptions = (mode) => PRICING_MATRIX[mode]?.extensions || DEFAULT_EXTENSIONS;

export default function ExtendModal({ screen, isOpen, onClose, onConfirm }) {
  const [selectedMinutes, setSelectedMinutes] = useState(30); // minutes, or "custom"
  const [custom, setCustom] = useState(null); // { minutes, cost } from the calculator

  const session = screen?.activeSession;
  const mode = session?.mode || "Single";
  const extensionOptions = getOptions(mode);
  const optionKeys = Object.keys(extensionOptions);

  const isCustom = selectedMinutes === "custom";
  const additionalMinutes = isCustom ? custom?.minutes || 0 : selectedMinutes;
  const additionalCost = isCustom
    ? custom?.cost || 0
    : calculateSessionCost(mode, selectedMinutes, true);

  // Start on 30 min when offered, otherwise the first available option
  useEffect(() => {
    if (!isOpen) return;
    const keys = Object.keys(getOptions(mode)).map(Number);
    setSelectedMinutes(keys.includes(30) ? 30 : keys[0]);
    setCustom(null);
  }, [isOpen, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!additionalMinutes || additionalMinutes <= 0 || !additionalCost || additionalCost <= 0) {
      return;
    }

    onConfirm({
      screenId: screen.screenId || screen.id || screen._id,
      additionalMinutes,
      additionalCost,
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
        <button
          type="submit"
          form="extend-form"
          disabled={!additionalCost || additionalCost <= 0}
          className={PRIMARY_BTN}
        >
          Confirm Extension
        </button>
      }
    >
      <form id="extend-form" onSubmit={handleSubmit} className="space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-main">
            Additional Duration
          </legend>
          <div className={`grid gap-2 ${COLS[optionKeys.length + 1] || "grid-cols-4"}`}>
            {optionKeys.map((minsStr) => {
              const mins = Number(minsStr);
              const cost = extensionOptions[mins];

              return (
                <OptionCard
                  key={`ext-option-${mins}`}
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
            <OptionCard
              key="ext-option-custom"
              name="extend-minutes"
              value="custom"
              checked={isCustom}
              onChange={() => setSelectedMinutes("custom")}
            >
              <span className="text-sm font-semibold">Custom</span>
            </OptionCard>
          </div>
        </fieldset>

        {isCustom && (
          <PriceCalculator mode={mode} isExtension onChange={setCustom} />
        )}

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
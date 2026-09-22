// src/components/ui/PriceCalculator.jsx
import { useEffect, useId, useMemo, useState } from "react";
import {
  calculateCustomCost,
  calculateCustomTime,
  getTiers,
  MAX_CUSTOM_MINUTES,
  MAX_CUSTOM_BUDGET,
} from "../../config/pricing";
import { formatINR } from "../../utils/format";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

/** 75 -> "1 hr 15 min" */
export function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  const parts = [];
  if (h) parts.push(`${h}\u00A0hr`);
  if (m || !h) parts.push(`${m}\u00A0min`);
  return parts.join(" ");
}

const describe = (breakdown) =>
  breakdown
    .map((b) => `${b.count > 1 ? `${b.count} × ` : ""}${formatMinutes(b.minutes)}`)
    .join(" + ");

/** Small segmented control (also used on the Pricing page) */
export function Segmented({ label, value, onChange, options }) {
  return (
    <div
      role="group"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      className="grid gap-1 rounded-lg border border-border-divider bg-card-panel p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`h-9 cursor-pointer rounded-md border px-2 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none touch-manipulation ${FOCUS} ${
            value === o.value
              ? "border-border-divider bg-app-bg text-main"
              : "border-transparent text-sub hover:text-main"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Two-way price calculator.
 *  - By Time:  enter minutes  -> cost
 *  - By Price: enter rupees   -> time you get
 *
 * `onChange` receives { minutes, cost } when there is a valid result, else null.
 * Pass a stable function (e.g. a useState setter).
 */
export default function PriceCalculator({ mode, isExtension = false, onChange }) {
  const inputId = useId();
  const [by, setBy] = useState("time");
  const [value, setValue] = useState("");

  const isTime = by === "time";
  const max = isTime ? MAX_CUSTOM_MINUTES : MAX_CUSTOM_BUDGET;
  const n = Math.floor(Number(value));
  const hasValue = value !== "" && Number.isFinite(n) && n > 0;
  const tooBig = hasValue && n > max;

  const result = useMemo(() => {
    if (!hasValue || tooBig) return null;
    return isTime
      ? calculateCustomCost(mode, n, isExtension)
      : calculateCustomTime(mode, n, isExtension);
  }, [hasValue, tooBig, isTime, mode, n, isExtension]);

  const ready = !!result && result.minutes > 0;
  const cheapest = getTiers(mode, isExtension)[0];

  useEffect(() => {
    onChange?.(ready ? { minutes: result.minutes, cost: result.cost } : null);
  }, [ready, result, onChange]);

  const switchBy = (next) => {
    setBy(next);
    setValue("");
  };

  const chips = isTime ? [45, 90, 120] : [100, 200, 300];

  return (
    <div className="space-y-3 rounded-lg border border-border-divider bg-app-bg p-3">
      <Segmented
        label="Calculate by"
        value={by}
        onChange={switchBy}
        options={[
          { value: "time", label: "By Time" },
          { value: "price", label: "By Price" },
        ]}
      />

      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-main">
          {isTime ? "Custom Time" : "Custom Price"}
        </label>
        <div className="flex h-11 items-center gap-2 rounded-lg border border-border-divider bg-card-panel px-3 transition-colors duration-150 motion-reduce:transition-none focus-within:border-primary-cyan focus-within:ring-2 focus-within:ring-primary-cyan/40">
          {!isTime && (
            <span aria-hidden="true" className="font-mono text-lg text-sub">
              ₹
            </span>
          )}
          <input
            id={inputId}
            name={isTime ? "customMinutes" : "customPrice"}
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            step={1}
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isTime ? "e.g., 45" : "e.g., 150"}
            aria-invalid={tooBig}
            className="w-full bg-transparent font-mono text-base sm:text-lg font-bold tabular-nums text-main placeholder:font-normal placeholder:text-sub/70 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {isTime && (
            <span aria-hidden="true" className="text-sm text-sub">
              min
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={`chip-${c}`}
              type="button"
              onClick={() => setValue(String(c))}
              className={`h-8 cursor-pointer rounded-md border border-border-divider px-2.5 text-xs font-medium text-sub transition-colors duration-150 hover:border-sub/50 hover:text-main motion-reduce:transition-none touch-manipulation ${FOCUS}`}
            >
              {isTime ? `${c} min` : formatINR(c)}
            </button>
          ))}
        </div>
      </div>

      <div
        aria-live="polite"
        className="rounded-lg border border-border-divider bg-card-panel p-3"
      >
        {tooBig ? (
          <p className="text-sm text-occupied">
            Maximum is {isTime ? formatMinutes(MAX_CUSTOM_MINUTES) : formatINR(MAX_CUSTOM_BUDGET)}.
          </p>
        ) : !hasValue ? (
          <p className="text-sm text-sub">
            {isTime ? "Enter minutes to see the price." : "Enter an amount to see the time."}
          </p>
        ) : !ready ? (
          <p className="text-sm text-warning">
            Minimum is {formatINR(cheapest.price)} for {formatMinutes(cheapest.minutes)}.
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3">
              <span className="text-sm text-sub">{isTime ? "Cost" : "You Get"}</span>
              <span
                className={`font-mono text-2xl font-bold tabular-nums ${
                  isTime ? "text-available" : "text-main"
                }`}
              >
                {isTime ? formatINR(result.cost) : formatMinutes(result.minutes)}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-sub">
              {isTime ? (
                <>
                  Billed for {formatMinutes(result.minutes)} ({describe(result.breakdown)})
                  {result.minutes !== result.requested &&
                    `. Rounded up from ${formatMinutes(result.requested)} to the cheapest bundle.`}
                </>
              ) : (
                <>
                  {describe(result.breakdown)} for {formatINR(result.cost)}
                  {result.leftover > 0 && `, ${formatINR(result.leftover)} left over`}
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
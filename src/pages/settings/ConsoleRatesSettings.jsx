// src/pages/settings/ConsoleRatesSettings.jsx
import React, { useState, useEffect, useId } from "react";
import {
  FloppyDisk,
  CurrencyInr,
  GameController,
  User,
  Users,
  UsersThree,
  UsersFour,
  SteeringWheel,
  Percent,
  Plus,
  Trash,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { pricingService } from "../../services/pricingService";
import { PRICING_MATRIX } from "../../config/pricing";
import { formatMinutes } from "../../components/ui/PriceCalculator";
import Loader from "../../components/ui/Loader";

const MODE_META = {
  Single: { subtitle: "1 Player", icon: User },
  Dual: { subtitle: "2 Players", icon: Users },
  Triple: { subtitle: "3 Players", icon: UsersThree },
  Big: { subtitle: "Up to 4 Players", icon: UsersFour },
  SimDrive: { subtitle: "Wheel Setup", icon: SteeringWheel },
};

const GROUPS = [
  { key: "sessions", label: "Sessions" },
  { key: "extensions", label: "Extensions" },
];

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

const cloneMatrix = (m) => JSON.parse(JSON.stringify(m));

function RateRow({ label, value, onChange }) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-sm text-main">{label}</span>
      <div className="flex h-8 w-24 shrink-0 items-center gap-1 rounded-md border border-border-divider bg-card-panel px-2 transition-colors duration-150 motion-reduce:transition-none focus-within:border-primary-cyan focus-within:ring-2 focus-within:ring-primary-cyan/40">
        <span aria-hidden="true" className="font-mono text-xs text-sub">₹</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-right font-mono text-sm font-bold tabular-nums text-main focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </li>
  );
}

function RateField({ label, value, onChange, suffix }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-main">
        {label}
      </label>
      <div className="flex h-11 items-center gap-1.5 rounded-lg border border-border-divider bg-app-bg px-3 transition-colors duration-150 motion-reduce:transition-none focus-within:border-primary-cyan focus-within:ring-2 focus-within:ring-primary-cyan/40">
        <span aria-hidden="true" className="font-mono text-sm text-sub">₹</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent font-mono text-base font-bold tabular-nums text-main focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && <span className="shrink-0 text-xs text-sub">{suffix}</span>}
      </div>
    </div>
  );
}

// Standard track-and-thumb switch (fixed: was using an unsupported size/translate pairing)
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 motion-reduce:transition-none touch-manipulation ${FOCUS} ${
        checked ? "border-primary-cyan bg-primary-cyan" : "border-border-divider bg-app-bg"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-4 transform rounded-full bg-main shadow transition-transform duration-150 motion-reduce:transition-none ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

let nextId = 1;
const newDiscount = () => ({ id: `local-${nextId++}`, label: "", percent: 10, enabled: true });

export default function ConsoleRatesSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [matrix, setMatrix] = useState(() => cloneMatrix(PRICING_MATRIX));
  const [addons, setAddons] = useState({ extraController: 50 });
  const [discounts, setDiscounts] = useState([]);

  useEffect(() => {
    pricingService
      .getPricing()
      .then((data) => {
        if (data.matrix) setMatrix(data.matrix);
        if (data.addons) setAddons(data.addons);
        setDiscounts(data.discounts || []);
      })
      .catch(() => toast.error("Failed to fetch rates configuration"))
      .finally(() => setLoading(false));
  }, []);

  const handleRate = (modeId, category, duration, value) => {
    setMatrix((prev) => ({
      ...prev,
      [modeId]: {
        ...prev[modeId],
        [category]: { ...prev[modeId][category], [duration]: Math.max(0, Number(value) || 0) },
      },
    }));
  };

  const handleAddon = (key, value) =>
    setAddons((prev) => ({ ...prev, [key]: Math.max(0, Number(value) || 0) }));

  const updateDiscount = (id, field, value) => {
    setDiscounts((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, [field]: field === "percent" ? Math.min(100, Math.max(0, Number(value) || 0)) : value }
          : d
      )
    );
  };

  const addDiscount = () => setDiscounts((prev) => [...prev, newDiscount()]);
  const removeDiscount = (id) => setDiscounts((prev) => prev.filter((d) => d.id !== id));

  const resetRates = () => {
    if (!window.confirm("Reset all rates to their default values? Unsaved changes will be lost.")) return;
    setMatrix(cloneMatrix(PRICING_MATRIX));
    toast.success("Rates reset to default — remember to save.");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await pricingService.updatePricing({ matrix, addons, discounts });
      toast.success("Rates configuration updated successfully");
    } catch {
      toast.error("Failed to update rates");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Loader variant="skeleton-card" />
        <Loader variant="skeleton-card" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Session & extension rates */}
      <section className="rounded-xl border border-border-divider bg-card-panel p-4 sm:p-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CurrencyInr size={18} aria-hidden="true" className="text-primary-cyan" />
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-main">
              Session &amp; Extension Rates
            </h2>
          </div>
          <button
            type="button"
            onClick={resetRates}
            className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-divider px-3 text-sm font-medium text-sub transition-colors duration-150 hover:border-sub hover:text-main motion-reduce:transition-none touch-manipulation ${FOCUS}`}
          >
            <ArrowCounterClockwise size={15} aria-hidden="true" />
            Reset to Default
          </button>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.keys(matrix).map((modeId) => {
            const meta = MODE_META[modeId] || { subtitle: "", icon: GameController };
            const Icon = meta.icon;

            return (
              <article key={modeId} className="overflow-hidden rounded-xl border border-border-divider bg-app-bg/40">
                <header className="flex items-center gap-3 border-b border-border-divider p-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border-divider bg-app-bg text-primary-cyan">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-base font-bold uppercase leading-tight tracking-wide text-main">
                      {modeId}
                    </h3>
                    <p className="truncate text-xs text-sub">{meta.subtitle}</p>
                  </div>
                </header>

                <div className="space-y-4 p-3.5">
                  {GROUPS.map(({ key, label }) => (
                    <div key={key}>
                      <h4 className="mb-1.5 text-xs font-medium text-sub">{label}</h4>
                      <ul className="divide-y divide-border-divider rounded-lg border border-border-divider bg-card-panel">
                        {Object.keys(matrix[modeId][key] || {})
                          .map(Number)
                          .sort((a, b) => a - b)
                          .map((duration) => (
                            <RateRow
                              key={duration}
                              label={formatMinutes(duration)}
                              value={matrix[modeId][key][duration]}
                              onChange={(v) => handleRate(modeId, key, duration, v)}
                            />
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Add-ons */}
      <section className="rounded-xl border border-border-divider bg-card-panel p-4 sm:p-5">
        <header className="mb-4 flex items-center gap-2">
          <GameController size={18} aria-hidden="true" className="text-primary-cyan" />
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-main">
            Peripheral Add-ons
          </h2>
        </header>

        <div className="max-w-xs">
          <RateField
            label="Extra Controller / Pad"
            value={addons.extraController}
            onChange={(v) => handleAddon("extraController", v)}
          />
        </div>
      </section>

      {/* Discounts */}
      <section className="rounded-xl border border-border-divider bg-card-panel p-4 sm:p-5">
        <header className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Percent size={18} aria-hidden="true" className="text-primary-cyan" />
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-main">
              Discounts &amp; Offers
            </h2>
          </div>
          <button
            type="button"
            onClick={addDiscount}
            className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border-divider px-3 text-sm font-medium text-main transition-colors duration-150 hover:border-sub motion-reduce:transition-none touch-manipulation ${FOCUS}`}
          >
            <Plus size={15} aria-hidden="true" />
            Add
          </button>
        </header>

        {discounts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-divider px-4 py-6 text-center text-sm text-sub">
            No discounts yet. Add one for student rates, happy hour, or a promo code.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {discounts.map((d) => (
              <li
                key={d.id}
                className="flex flex-col gap-2.5 rounded-lg border border-border-divider bg-app-bg/60 p-3 sm:flex-row sm:items-center"
              >
                <input
                  type="text"
                  value={d.label}
                  onChange={(e) => updateDiscount(d.id, "label", e.target.value)}
                  placeholder="e.g., Student Discount"
                  aria-label="Discount name"
                  className="h-10 w-full min-w-0 rounded-lg border border-border-divider bg-card-panel px-3 text-sm text-main placeholder:text-sub/70 transition-colors duration-150 motion-reduce:transition-none focus:outline-none focus:border-primary-cyan focus:ring-2 focus:ring-primary-cyan/40 sm:flex-1"
                />

                <div className="flex shrink-0 items-center gap-2.5">
                  <div className="flex h-10 w-24 items-center gap-1 rounded-lg border border-border-divider bg-card-panel px-2.5">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={d.percent}
                      onChange={(e) => updateDiscount(d.id, "percent", e.target.value)}
                      aria-label="Discount percent"
                      className="w-full bg-transparent text-right font-mono text-sm font-bold tabular-nums text-main focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span aria-hidden="true" className="text-xs text-sub">%</span>
                  </div>

                  <Toggle
                    checked={d.enabled}
                    onChange={(v) => updateDiscount(d.id, "enabled", v)}
                    label={`${d.label || "Discount"} active`}
                  />

                  <button
                    type="button"
                    onClick={() => removeDiscount(d.id)}
                    aria-label={`Remove ${d.label || "discount"}`}
                    className={`grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg text-sub transition-colors duration-150 hover:bg-occupied/10 hover:text-occupied motion-reduce:transition-none touch-manipulation ${FOCUS}`}
                  >
                    <Trash size={16} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className={`flex h-11 items-center gap-2 rounded-lg bg-main px-5 text-sm font-semibold text-app-bg transition-colors duration-150 hover:bg-main/90 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none cursor-pointer touch-manipulation ${FOCUS} focus-visible:ring-offset-2 focus-visible:ring-offset-card-panel`}
        >
          {saving ? <Loader variant="spinner" className="h-4 w-4 py-0" /> : <FloppyDisk size={16} aria-hidden="true" />}
          <span>{saving ? "Saving…" : "Save Configuration"}</span>
        </button>
      </div>
    </form>
  );
}
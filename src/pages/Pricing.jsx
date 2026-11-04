// src/pages/Pricing.jsx
import React, { useState } from "react";
import { User, Users, UsersThree, UsersFour, SteeringWheel, Info, Sparkle, Tag } from "@phosphor-icons/react";
import { usePricing } from "../context/PricingContext";
import { formatINR } from "../utils/format";
import PriceCalculator, { Segmented, formatMinutes } from "../components/ui/PriceCalculator";

const MODE_META = {
  Single: { subtitle: "1 Player Setup", icon: User, players: 1 },
  Dual: { subtitle: "2 Players • Co-op / VS", icon: Users, players: 2 },
  Triple: { subtitle: "3 Players • Co-op / VS", icon: UsersThree, players: 3 },
  Big: { subtitle: "Up to 4 Players Setup", icon: UsersFour, players: 4 },
  SimDrive: {
    subtitle: "Logitech G923 Wheel Setup",
    icon: SteeringWheel,
    players: 1,
    rules: [
      "Single-player sessions are not shared with other players.",
      "Shared SimDrive sessions have an additional ₹20 charge per extra player.",
    ],
  },
};

const GROUPS = [
  { key: "sessions", label: "Standard Sessions", isExtension: false },
  { key: "extensions", label: "Extension  ", isExtension: true },
];

export default function Pricing() {
  const { matrix, getTiers } = usePricing();
  const [calcMode, setCalcMode] = useState("Single");
  const [calcType, setCalcType] = useState("sessions");

  const modeKeys = Object.keys(matrix || {});

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-24 font-body text-main">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border-divider/80 bg-card-panel/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        <div className="absolute -right-10 -top-10 size-64 rounded-full bg-primary-cyan/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-main sm:text-4xl">
              Gaming Rates & Pricing
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-sub leading-relaxed">
              Transparent live rates across all simulation setups and terminals. Rates sync instantly across the lounge ecosystem.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        {/* Rate Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {modeKeys.map((modeKey) => {
            const meta = MODE_META[modeKey] || { subtitle: "Custom Setup", icon: User, players: 1 };
            const Icon = meta.icon;

            return (
              <article
                key={modeKey}
                className="group relative overflow-hidden rounded-2xl border border-border-divider/80 bg-card-panel/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-primary-cyan/50 hover:shadow-primary-cyan/5"
              >
                <div className="flex items-center gap-3.5 border-b border-border-divider/60 pb-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border-divider bg-app-bg text-primary-cyan shadow-sm transition-transform duration-300 group-hover:scale-105">
                    <Icon size={22} aria-hidden="true" weight="duotone" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-bold tracking-wide text-main">
                      {modeKey} Mode
                    </h2>
                    <p className="truncate text-xs text-sub">{meta.subtitle}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {GROUPS.map(({ key, label, isExtension }) => {
                    const tiers = getTiers(modeKey, isExtension);
                    if (!tiers.length) return null;

                    return (
                      <div key={key} className="space-y-2">
                        <h3 className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-sub">
                          <Tag size={13} className="text-primary-cyan" /> {label}
                        </h3>
                        <ul className="divide-y divide-border-divider/60 rounded-xl border border-border-divider bg-app-bg/60 overflow-hidden">
                          {tiers.map((t) => (
                            <li key={t.minutes} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs sm:text-sm">
                              <span className="font-medium text-main">{formatMinutes(t.minutes)}</span>
                              <span className="text-right font-mono tabular-nums">
                                <span className="font-bold text-emerald-400">{formatINR(t.price)}</span>
                                {meta.players > 1 && (
                                  <span className="block text-[10px] text-sub">
                                    {formatINR(Math.round(t.price / meta.players))}/player
                                  </span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}

                  {meta.rules && (
                    <div className="space-y-1.5 rounded-xl border border-warning/30 bg-warning/5 p-3.5">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                        <Info size={15} aria-hidden="true" className="shrink-0" />
                        SimDrive Rules
                      </p>
                      <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-sub marker:text-warning">
                        {meta.rules.map((rule) => (
                          <li key={rule}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Sticky Price Calculator Sidebar */}
        <aside
          aria-labelledby="calc-title"
          className="space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel/90 p-5 shadow-xl backdrop-blur-xl lg:sticky lg:top-[calc(var(--app-header-h,0px)+1.5rem)]"
        >
          <div>
            <h2 id="calc-title" className="font-heading text-base font-bold uppercase tracking-wider text-main">
              Price Calculator
            </h2>
            <p className="mt-0.5 text-xs text-sub">
              Simulate session pricing or compute block budgets instantly.
            </p>
          </div>

          <Segmented
            label="Mode"
            value={calcMode}
            onChange={setCalcMode}
            options={modeKeys.map((m) => ({ value: m, label: m }))}
          />
          <Segmented
            label="Rate Type"
            value={calcType}
            onChange={setCalcType}
            options={GROUPS.map((g) => ({ value: g.key, label: g.label }))}
          />

          <div className="pt-2">
            <PriceCalculator mode={calcMode} isExtension={calcType === "extensions"} />
          </div>
        </aside>
      </div>
    </div>
  );
}
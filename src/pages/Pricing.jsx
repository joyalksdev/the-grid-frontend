// src/pages/Pricing.jsx
import React, { useState } from "react";
import { User, Users, UsersThree, UsersFour, SteeringWheel, Info } from "@phosphor-icons/react";
import { getTiers } from "../config/pricing";
import { formatINR } from "../utils/format";
import PriceCalculator, { Segmented, formatMinutes } from "../components/ui/PriceCalculator";

// `id` must match the keys in PRICING_MATRIX. Rates are read from there,
// so this page can never drift from what the app actually charges.
const MODES = [
  { id: "Single", title: "Single Mode", subtitle: "1 Player", icon: User, players: 1 },
  { id: "Dual", title: "Dual Mode", subtitle: "2 Players • Co-op / VS", icon: Users, players: 2 },
  { id: "Triple", title: "Triple Mode", subtitle: "3 Players • Co-op / VS", icon: UsersThree, players: 3 },
  { id: "Big", title: "Big Mode", subtitle: "Up to 4 Players", icon: UsersFour, players: 4 },
  {
    id: "SimDrive",
    title: "SimDrive",
    subtitle: "Logitech G923 Setup",
    icon: SteeringWheel,
    players: 1,
    rules: [
      "Single-player sessions are not shared with other players.",
      "Shared SimDrive sessions have an additional ₹20 charge per extra player.",
    ],
  },
];

const GROUPS = [
  { key: "sessions", label: "Sessions", isExtension: false },
  { key: "extensions", label: "Extensions", isExtension: true },
];

export default function Pricing() {
  const [calcMode, setCalcMode] = useState("Single");
  const [calcType, setCalcType] = useState("sessions");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border-divider pb-5">
        <h1 className="font-heading text-2xl font-bold tracking-wide text-main sm:text-3xl">
          Gaming Rates
        </h1>
        <p className="mt-1 max-w-xl text-xs text-sub sm:text-sm">
          Current rates for all gaming modes. Use this page as quick reference during session setup and checkout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* Calculator: first on mobile, sticky sidebar on desktop */}
        <section
          aria-labelledby="calc-title"
          className="order-first space-y-4 rounded-xl border border-border-divider bg-card-panel p-4 sm:p-5 lg:sticky lg:top-[calc(var(--app-header-h,0px)+1.5rem)] lg:order-last"
        >
          <div>
            <h2 id="calc-title" className="font-heading text-lg font-bold uppercase tracking-wide text-main">
              Price Calculator
            </h2>
            <p className="mt-0.5 text-xs text-sub">
              Work out the price for any time, or the time for any amount.
            </p>
          </div>

          <Segmented
            label="Mode"
            value={calcMode}
            onChange={setCalcMode}
            options={MODES.map((m) => ({ value: m.id, label: m.id }))}
          />
          <Segmented
            label="Rate type"
            value={calcType}
            onChange={setCalcType}
            options={GROUPS.map((g) => ({ value: g.key, label: g.label }))}
          />

          <PriceCalculator mode={calcMode} isExtension={calcType === "extensions"} />
        </section>

        {/* Rate cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MODES.map(({ id, title, subtitle, icon: Icon, players, rules }) => (
            <article
              key={id}
              className="overflow-hidden rounded-xl border border-border-divider bg-card-panel transition-colors duration-150 hover:border-sub/40 motion-reduce:transition-none"
            >
              <header className="flex items-center gap-3 border-b border-border-divider p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border-divider bg-app-bg text-primary-cyan">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-heading text-lg font-bold uppercase leading-tight tracking-wide text-main">
                    {title}
                  </h2>
                  <p className="truncate text-xs text-sub">{subtitle}</p>
                </div>
              </header>

              <div className="space-y-4 p-4">
                {GROUPS.map(({ key, label, isExtension }) => {
                  const tiers = getTiers(id, isExtension);
                  if (!tiers.length) return null;

                  return (
                    <div key={key}>
                      <h3 className="mb-1.5 text-xs font-medium text-sub">{label}</h3>
                      <ul className="divide-y divide-border-divider rounded-lg border border-border-divider bg-app-bg">
                        {tiers.map((t) => (
                          <li key={t.minutes} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                            <span className="text-main">{formatMinutes(t.minutes)}</span>
                            <span className="text-right font-mono tabular-nums">
                              <span className="font-bold text-main">{formatINR(t.price)}</span>
                              {players > 1 && (
                                <span className="block text-xs text-sub">
                                  {formatINR(Math.round(t.price / players))}/player
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {rules && (
                  <div className="space-y-1.5 rounded-lg border border-warning/30 bg-warning/5 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                      <Info size={14} aria-hidden="true" className="shrink-0" />
                      SimDrive Rules
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-sub marker:text-warning">
                      {rules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
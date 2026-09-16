// src/pages/Pricing.jsx
import React from "react";
import {
  PiUser,
  PiUsers,
  PiUsersThree,
  PiSteeringWheel,
  PiInfo,
} from "react-icons/pi";

const PRICING_DATA = [
  {
    id: "single",
    title: "Single Mode",
    subtitle: "1 Player",
    icon: PiUser,
    rates: [
      { name: "15 Min Express", price: 50 },
      { name: "30 Min Session", price: 90 },
      { name: "1 Hour Session", price: 160 },
      { name: "30 Min Extension", price: 80 },
      { name: "1 Hour Extension", price: 130 },
    ],
  },
  {
    id: "dual",
    title: "Dual Mode",
    subtitle: "2 Players • Co-op / VS",
    icon: PiUsers,
    rates: [
      { name: "15 Min Express", price: 80, perPerson: 40 },
      { name: "30 Min Session", price: 140, perPerson: 70 },
      { name: "1 Hour Session", price: 250, perPerson: 125 },
      { name: "30 Min Extension", price: 120, perPerson: 60 },
      { name: "1 Hour Extension", price: 190, perPerson: 95 },
    ],
  },
  {
    id: "big",
    title: "Big Mode",
    subtitle: "Up to 4 Players",
    icon: PiUsersThree,
    rates: [
      { name: "15 Min Express", price: 120, perPerson: 30 },
      { name: "30 Min Session", price: 220, perPerson: 55 },
      { name: "1 Hour Session", price: 380, perPerson: 95 },
      { name: "30 Min Extension", price: 200, perPerson: 50 },
      { name: "1 Hour Extension", price: 340, perPerson: 85 },
    ],
  },
  {
    id: "simdrive",
    title: "SimDrive",
    subtitle: "Logitech G923 Setup",
    icon: PiSteeringWheel,
    rates: [
      { name: "15 Min Session", price: 90 },
      { name: "15 Min Extension", price: 80 },
      { name: "1 Hour Pro Session", price: 290 },
    ],
    rules: [
      "Single-player sessions are not shared with other players.",
      "Shared SimDrive sessions have an additional ₹20 charge per extra player.",
    ],
  },
];

export default function Pricing() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-border-divider">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-mono text-[11px] text-muted uppercase tracking-widest font-semibold">
            Staff Reference
          </span>
        </div>

        <h1 className="font-heading font-black text-2xl sm:text-3xl text-main uppercase tracking-tight">
          Gaming Rates
        </h1>

        <p className="text-sub text-xs sm:text-sm mt-1 max-w-xl">
          Current rates for all gaming modes. Use this page as the quick pricing reference during session setup and checkout.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PRICING_DATA.map((card) => {
          const IconComponent = card.icon;

          return (
            <div
              key={card.id}
              className="bg-card-panel border border-border-divider rounded-xl overflow-hidden flex flex-col justify-between hover:border-sub/40 transition-colors"
            >
              <div>
                {/* Card Header */}
                <div className="p-5 border-b border-border-divider bg-app-bg/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
                      {card.subtitle}
                    </span>

                    <IconComponent className="text-xl text-primary-cyan" />
                  </div>

                  <h2 className="font-heading font-bold text-lg text-main uppercase tracking-wide">
                    {card.title}
                  </h2>
                </div>

                {/* Rate List */}
                <div className="p-4 space-y-2">
                  {card.rates.map((rate, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-app-bg/60 border border-border-divider/60"
                    >
                      <span className="font-mono text-[11px] text-sub uppercase">
                        {rate.name}
                      </span>

                      <div className="text-right shrink-0 ml-3">
                        <span className="font-mono font-bold text-sm text-main block">
                          ₹{rate.price}
                        </span>

                        {rate.perPerson && (
                          <span className="font-mono text-[10px] text-muted block -mt-0.5">
                            ₹{rate.perPerson} / player
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SimDrive Rules */}
              {card.rules && (
                <div className="p-4 pt-0">
                  <div className="bg-app-bg border border-border-divider/80 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-warning font-mono text-[10px] uppercase font-bold tracking-wider">
                      <PiInfo className="text-xs shrink-0" />
                      SimDrive Rules
                    </div>

                    {card.rules.map((rule, idx) => (
                      <p
                        key={idx}
                        className="text-[11px] font-body text-muted leading-snug"
                      >
                        • {rule}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pricing Notes */}
      <div className="bg-card-panel border border-border-divider rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] text-muted uppercase tracking-wider block mb-1">
              Pricing Reference
            </span>

            <p className="font-body text-xs text-sub">
              Rates are based on session duration and selected gaming mode.
            </p>
          </div>

          <span className="font-mono text-[10px] text-primary-cyan uppercase tracking-wider font-semibold whitespace-nowrap">
            15 Min Express Available
          </span>
        </div>
      </div>
    </div>
  );
}
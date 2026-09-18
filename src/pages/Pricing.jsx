import React from "react";
import { User, Users, UsersThree, SteeringWheel, Info } from "@phosphor-icons/react";

const PRICING_DATA = [
  {
    id: "single",
    title: "Single Mode",
    subtitle: "1 Player",
    icon: User,
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
    icon: Users,
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
    icon: UsersThree,
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
    icon: SteeringWheel,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-border-divider">
        <span className="font-mono text-[10px] text-muted uppercase tracking-widest font-semibold block mb-1">
          Staff Reference
        </span>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-main uppercase tracking-wide">
          Gaming Rates
        </h1>
        <p className="font-body text-xs sm:text-sm text-sub mt-1 max-w-xl">
          Current rates for all gaming modes. Use this page as quick reference during session setup and checkout.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {PRICING_DATA.map((card) => {
          const IconComponent = card.icon;

          return (
            <div
              key={card.id}
              className="bg-card-panel border border-border-divider rounded-xl overflow-hidden flex flex-col justify-between hover:border-sub/40 transition-colors"
            >
              <div>
                <div className="p-4 border-b border-border-divider bg-app-bg/40 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-muted uppercase tracking-wider block">
                      {card.subtitle}
                    </span>
                    <h2 className="font-heading font-bold text-base text-main uppercase tracking-wide">
                      {card.title}
                    </h2>
                  </div>
                  <IconComponent size={22} className="text-primary-cyan" />
                </div>

                <div className="p-3 space-y-2">
                  {card.rates.map((rate, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-app-bg/60 border border-border-divider/60"
                    >
                      <span className="font-mono text-[11px] text-sub uppercase">
                        {rate.name}
                      </span>
                      <div className="text-right shrink-0 ml-2 font-mono">
                        <span className="font-bold text-xs text-main block">
                          ₹{rate.price}
                        </span>
                        {rate.perPerson && (
                          <span className="text-[9px] text-muted block -mt-0.5">
                            ₹{rate.perPerson}/player
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {card.rules && (
                <div className="p-3 pt-0">
                  <div className="bg-app-bg border border-border-divider/80 rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-warning font-mono text-[10px] uppercase font-bold tracking-wider">
                      <Info size={14} className="shrink-0" />
                      SimDrive Rules
                    </div>
                    {card.rules.map((rule, idx) => (
                      <p key={idx} className="text-[11px] font-body text-muted leading-relaxed">
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
    </div>
  );
}
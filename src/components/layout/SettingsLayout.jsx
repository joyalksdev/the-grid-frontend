import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { CurrencyInr, ShieldCheck, Gear } from "@phosphor-icons/react";

export default function SettingsLayout() {
  const location = useLocation();

  const settingsNavItems = [
    {
      path: "/settings/rates",
      label: "Console Rates",
      description: "Manage hourly pricing & extra pads",
      icon: CurrencyInr,
    },
    {
      path: "/settings/security",
      label: "Security & RBAC",
      description: "Admin & staff access privileges",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="pb-5 border-b border-[#232732] flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#00F5D4]">
            <Gear size={24} className="shrink-0" />
            <h1 className="text-xl md:text-2xl font-bold font-heading uppercase tracking-wide text-white">
              System Control Center
            </h1>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Configure system parameters, station pricing, and operator permissions.
          </p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Settings Sub-Sidebar */}
        <aside className="md:col-span-1 bg-[#161920] border border-[#232732] rounded-xl p-2.5 space-y-1 select-none">
          <div className="px-3 py-2 border-b border-[#232732]/60 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-zinc-500">
              Settings Menu
            </span>
          </div>

          <nav className="space-y-1 font-mono">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30 font-bold"
                      : "text-zinc-400 hover:text-white hover:bg-[#0D0E12] border border-transparent"
                  }`}
                >
                  <Icon size={18} className="mt-0.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs uppercase tracking-wider leading-none truncate">
                      {item.label}
                    </p>
                    <p className="text-[10px] text-zinc-500 normal-case line-clamp-1 font-normal">
                      {item.description}
                    </p>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Sub-Page Content Area */}
        <section className="md:col-span-3">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
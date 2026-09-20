// client/src/components/layout/SettingsLayout.jsx
import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { CurrencyInr, ShieldCheck, Gear, Users } from "@phosphor-icons/react";

const SETTINGS_NAV = [
  {
    path: "/settings/rates",
    label: "Console Rates",
    description: "Manage hourly pricing & extra pads",
    icon: CurrencyInr,
  },
  {
    path: "/settings/users",
    label: "User Management",
    description: "Manage staff accounts & credentials",
    icon: Users,
  },
  {
    path: "/settings/security",
    label: "Security & RBAC",
    description: "Admin & staff access privileges",
    icon: ShieldCheck,
  },
];

/* Grid-line texture, fades out toward the bottom-left */
const GRID_TEXTURE = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,246,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,246,255,0.07) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
  WebkitMaskImage:
    "radial-gradient(ellipse at top right, #000 0%, transparent 70%)",
  maskImage: "radial-gradient(ellipse at top right, #000 0%, transparent 70%)",
};

/*
  Layout tiers
  - Mobile  (<640px):    3-up segmented bar, icon over label
  - Tablet  (640–1023):  3-up segmented bar, icon beside label
  - Desktop (1024px+):   sticky sidebar with descriptions

  If your app shell has a fixed top bar, set --app-header-h on <html>
  (e.g. 4rem) so the settings nav sticks below it.
*/
const NAV_BASE =
  "group relative flex flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2.5 text-center " +
  "touch-manipulation [-webkit-tap-highlight-color:transparent] " +
  "transition-colors duration-150 motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-card-panel " +
  "sm:flex-row sm:gap-2.5 sm:px-3 sm:py-3 lg:justify-start lg:text-left";

const NAV_ACTIVE = "border-border-divider bg-app-bg text-main";
const NAV_IDLE =
  "border-transparent text-main/70 hover:bg-app-bg/60 hover:text-main";

export default function SettingsLayout() {
  const { pathname } = useLocation();
  const activeItem = SETTINGS_NAV.find((item) => pathname.startsWith(item.path));

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Skip link */}
      <a
        href="#settings-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 rounded-lg bg-primary-cyan px-4 py-2 text-sm font-bold text-app-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
      >
        Skip to Settings Content
      </a>

      {/* Header */}
      <header className="relative overflow-hidden rounded-xl border border-border-divider bg-card-panel p-4 sm:p-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={GRID_TEXTURE}
        />

        <div className="relative flex items-center gap-3 sm:gap-4">
          <div className="grid size-11 sm:size-12 shrink-0 place-items-center rounded-lg border border-border-divider bg-app-bg text-primary-cyan">
            <Gear size={24} weight="duotone" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading uppercase tracking-wide text-main leading-tight text-balance">
              System Control Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-sub font-body text-pretty">
              Configure system parameters, station pricing, and operator
              permissions.
            </p>
          </div>
        </div>
      </header>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)] gap-4 lg:gap-6 items-start">
        {/* Settings Navigation */}
        <aside className="min-w-0 sticky z-20 top-[var(--app-header-h,0px)] lg:top-[calc(var(--app-header-h,0px)+1.5rem)] select-none">
          <div className="rounded-xl border border-border-divider bg-card-panel p-1 lg:p-1.5">
            <nav
              aria-label="Settings Sections"
              className="grid grid-cols-3 gap-1 lg:flex lg:flex-col"
            >
              {SETTINGS_NAV.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `${NAV_BASE} ${isActive ? NAV_ACTIVE : NAV_IDLE}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="hidden lg:block absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary-cyan"
                          />
                        )}

                        <Icon
                          size={20}
                          weight={isActive ? "duotone" : "regular"}
                          aria-hidden="true"
                          className={`shrink-0 transition-colors duration-150 motion-reduce:transition-none ${
                            isActive
                              ? "text-primary-cyan"
                              : "text-sub group-hover:text-main"
                          }`}
                        />

                        <div className="min-w-0">
                          <p
                            className={`text-[11px] leading-tight sm:text-xs lg:text-sm text-balance ${
                              isActive ? "font-semibold" : "font-medium"
                            }`}
                          >
                            {item.label}
                          </p>
                          <p className="hidden lg:block mt-0.5 text-xs leading-snug text-sub">
                            {item.description}
                          </p>
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Sub-Page Content */}
        <section id="settings-content" className="min-w-0 scroll-mt-24">
          {activeItem && (
            <p className="lg:hidden mb-3 px-1 text-xs text-sub">
              {activeItem.description}
            </p>
          )}
          <Outlet />
        </section>
      </div>
    </div>
  );
}
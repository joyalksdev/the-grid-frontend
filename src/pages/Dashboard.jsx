// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ScreenCard from "../components/ui/ScreenCard";
import StartSessionModal from "../components/ui/StartSessionModal";
import CheckoutModal from "../components/ui/CheckoutModal";
import ExtendModal from "../components/ui/ExtendModal";
import Loader from "../components/ui/Loader";
import { useTimers } from "../context/TimerContext";
import { PiLightning, PiCheckCircle } from "react-icons/pi";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "occupied", label: "In Use" },
  { value: "available", label: "Available" },
];

function Stat({ icon: Icon, tone, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border-divider bg-card-panel px-3.5 py-3 md:min-w-36">
      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon aria-hidden="true" className="text-lg" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-sub">{label}</p>
        <p className="font-mono text-base font-bold tabular-nums text-main">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { screens, startSession, extendSession, checkoutSession, loading } = useTimers();

  const [selectedScreen, setSelectedScreen] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  // Filter lives in the URL (?filter=occupied) so it survives refresh & back
  const [params, setParams] = useSearchParams();
  const raw = params.get("filter");
  const filter = raw === "occupied" || raw === "available" ? raw : "all";
  const setFilter = (value) =>
    setParams(value === "all" ? {} : { filter: value }, { replace: true });

  const findScreen = (screenId) => {
    return screens.find((s) => (s.screenId || s.id || s._id) === screenId);
  };

  const openModal = (type) => (screenId) => {
    setSelectedScreen(findScreen(screenId));
    setActiveModal(type);
  };

  const handleStartSubmit = async (sessionData) => {
    await startSession(sessionData);
    setActiveModal(null);
  };

  const handleCheckoutSubmit = async (checkoutData) => {
    await checkoutSession(checkoutData);
    setActiveModal(null);
  };

  const handleExtendSubmit = async ({ screenId, additionalMinutes }) => {
    await extendSession(screenId, additionalMinutes);
    setActiveModal(null);
  };

  const activeCount = screens.filter((s) => s.status === "occupied").length;
  const availableCount = screens.length - activeCount;

  const visibleScreens = screens.filter((s) =>
    filter === "all" ? true : filter === "occupied" ? s.status === "occupied" : s.status !== "occupied"
  );

  return (
    <div className="space-y-6">
      {/* Header & metrics */}
      <div className="flex flex-col justify-between gap-5 border-b border-border-divider pb-6 md:flex-row md:items-end">
        <div>
          <p className="mb-1.5 flex items-center gap-2 text-xs font-medium text-sub">
            <span aria-hidden="true" className="size-2 rounded-full bg-available" />
            Live Arena Floor
          </p>
          <h1 className="font-heading text-2xl font-extrabold tracking-wide text-main sm:text-3xl">
            Station Status
          </h1>
          <p className="mt-1 max-w-xl text-xs text-sub sm:text-sm">
            Monitor active sessions, available gaming stations, and remaining session times in real-time.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:flex md:self-auto">
          <Stat
            icon={PiLightning}
            tone="bg-occupied/10 text-occupied"
            label="In Use"
            value={loading ? "…" : `${activeCount} / ${screens.length}`}
          />
          <Stat
            icon={PiCheckCircle}
            tone="bg-available/10 text-available"
            label="Available"
            value={loading ? "…" : `${availableCount} Free`}
          />
        </div>
      </div>

      {/* Filter */}
      <div
        role="group"
        aria-label="Filter stations"
        className="grid grid-cols-3 gap-1 rounded-xl border border-border-divider bg-card-panel p-1 sm:inline-grid sm:w-auto"
      >
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`h-9 cursor-pointer rounded-lg border px-4 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan ${
              filter === value
                ? "border-border-divider bg-app-bg text-main"
                : "border-transparent text-sub hover:text-main"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Cards / skeletons / empty state */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Loader key={i} variant="skeleton-card" className="min-h-72" />
          ))}
        </div>
      ) : visibleScreens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-divider px-6 py-14 text-center">
          <p className="text-sm font-medium text-main">
            {screens.length === 0 ? "No stations configured yet." : "No stations match this filter."}
          </p>
          {screens.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-3 cursor-pointer rounded-md text-sm font-medium text-primary-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan"
            >
              Show All Stations
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {visibleScreens.map((screen) => (
            <ScreenCard
              key={screen.screenId || screen.id || screen._id}
              screen={screen}
              onStartSession={openModal("start")}
              onCheckoutPrompt={openModal("checkout")}
              onExtendPrompt={openModal("extend")}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <StartSessionModal
        screen={selectedScreen}
        isOpen={activeModal === "start"}
        onClose={() => setActiveModal(null)}
        onSubmit={handleStartSubmit}
      />

      <CheckoutModal
        screen={selectedScreen}
        isOpen={activeModal === "checkout"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleCheckoutSubmit}
      />

      <ExtendModal
        screen={selectedScreen}
        isOpen={activeModal === "extend"}
        onClose={() => setActiveModal(null)}
        onConfirm={handleExtendSubmit}
      />
    </div>
  );
}
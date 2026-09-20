// src/pages/Dashboard.jsx
import React, { useState } from "react";
import ScreenCard from "../components/ui/ScreenCard";
import StartSessionModal from "../components/ui/StartSessionModal";
import CheckoutModal from "../components/ui/CheckoutModal";
import ExtendModal from "../components/ui/ExtendModal";
import Loader from "../components/ui/Loader";
import { useTimers } from "../context/TimerContext";
import { PiLightning, PiCheckCircle } from "react-icons/pi";

export default function Dashboard() {
  const { screens, startSession, extendSession, checkoutSession, loading } = useTimers();

  const [selectedScreen, setSelectedScreen] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const findScreen = (screenId) => {
    return screens.find((s) => (s.screenId || s.id || s._id) === screenId);
  };

  const handleStartPrompt = (screenId) => {
    setSelectedScreen(findScreen(screenId));
    setActiveModal("start");
  };

  const handleCheckoutPrompt = (screenId) => {
    setSelectedScreen(findScreen(screenId));
    setActiveModal("checkout");
  };

  const handleExtendPrompt = (screenId) => {
    setSelectedScreen(findScreen(screenId));
    setActiveModal("extend");
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

  return (
    <div className="space-y-8">
      {/* Header & High-Level Metric Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-available opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-available"></span>
            </span>
            <span className="font-mono text-xs text-sub uppercase tracking-widest font-semibold">
              Live Arena Floor
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-main tracking-wide">
            Station Status
          </h1>
          <p className="text-sub text-xs sm:text-sm mt-1 max-w-xl font-body">
            Monitor active sessions, available gaming stations, and remaining session times in real-time.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-card-panel border border-border-divider rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-xs min-w-[130px]">
            <div className="p-2 rounded-lg bg-occupied/10 text-occupied">
              <PiLightning className="text-lg" />
            </div>
            <div>
              <span className="block font-mono text-[10px] text-sub uppercase tracking-wider font-semibold">
                In Use
              </span>
              <span className="font-mono text-base font-bold text-main tabular-nums">
                {loading ? "..." : `${activeCount} / ${screens.length}`}
              </span>
            </div>
          </div>

          <div className="bg-card-panel border border-border-divider rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-xs min-w-[130px]">
            <div className="p-2 rounded-lg bg-available/10 text-available">
              <PiCheckCircle className="text-lg" />
            </div>
            <div>
              <span className="block font-mono text-[10px] text-sub uppercase tracking-wider font-semibold">
                Available
              </span>
              <span className="font-mono text-base font-bold text-main tabular-nums">
                {loading ? "..." : `${availableCount} Free`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Cards Grid OR Skeleton Loaders */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Loader key={i} variant="skeleton-card" className="min-h-72" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {screens.map((screen) => (
            <ScreenCard
              key={screen.screenId || screen.id || screen._id}
              screen={screen}
              onStartSession={handleStartPrompt}
              onCheckoutPrompt={handleCheckoutPrompt}
              onExtendPrompt={handleExtendPrompt}
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
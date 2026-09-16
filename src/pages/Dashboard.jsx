// src/pages/Dashboard.jsx
import React, { useState } from "react";
import ScreenCard from "../components/ui/ScreenCard";
import StartSessionModal from "../components/ui/StartSessionModal";
import CheckoutModal from "../components/ui/CheckoutModal";
import ExtendModal from "../components/ui/ExtendModal";
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-muted uppercase animate-pulse">
        Syncing floor state with server...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & High-Level Metric Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border-divider">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-available"></span>
            <span className="font-mono text-[11px] text-muted uppercase tracking-widest font-medium">
              Live Floor
            </span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-main uppercase tracking-tight">
            Station Status
          </h1>
          <p className="text-sub text-xs sm:text-sm mt-1 max-w-xl font-body">
            Keep track of active sessions, available stations, and time remaining.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-card-panel border border-border-divider rounded-lg px-4 py-2.5 flex items-center gap-3">
            <PiLightning className="text-primary-cyan text-lg shrink-0" />
            <div>
              <span className="block font-mono text-[10px] text-muted uppercase tracking-wider">Active</span>
              <span className="font-mono text-sm font-bold text-main">{activeCount} / {screens.length}</span>
            </div>
          </div>
          <div className="bg-card-panel border border-border-divider rounded-lg px-4 py-2.5 flex items-center gap-3">
            <PiCheckCircle className="text-available text-lg shrink-0" />
            <div>
              <span className="block font-mono text-[10px] text-muted uppercase tracking-wider">Available</span>
              <span className="font-mono text-sm font-bold text-main">{availableCount} Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Cards Grid */}
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
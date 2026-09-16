// src/components/ui/ExtendModal.jsx
import React, { useState } from 'react';
import { PiX, PiClockAfternoon, PiCurrencyInr } from 'react-icons/pi';
import { PRICING_MATRIX, calculateSessionCost } from '../../config/pricing';

export default function ExtendModal({ screen, isOpen, onClose, onConfirm }) {
  const [selectedMinutes, setSelectedMinutes] = useState(30);

  if (!isOpen || !screen?.activeSession) return null;

  const mode = screen.activeSession.mode || 'Single';
  const extensionOptions = PRICING_MATRIX[mode]?.extensions || { 15: 50, 30: 80, 60: 130 };

  const additionalCost = calculateSessionCost(mode, selectedMinutes, true);

  const handleExtend = () => {
    onConfirm({
      screenId: screen.screenId || screen.id,
      additionalMinutes: selectedMinutes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xs bg-[var(--color-card-panel)] border border-[var(--color-border-divider)] rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-[var(--color-border-divider)] px-5 py-4 flex items-center justify-between bg-[var(--color-app-bg)]/50">
          <h3 className="font-['Rajdhani'] font-bold text-lg uppercase tracking-wider text-white flex items-center gap-2">
            <PiClockAfternoon className="text-[var(--color-primary-cyan)]" /> Extend Session
          </h3>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-white transition">
            <PiX size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4 font-['Inter']">
          <div>
            <span className="block text-[11px] font-['Rajdhani'] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-2">
              Select Additional Duration
            </span>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(extensionOptions).map((minsStr) => {
                const mins = Number(minsStr);
                const cost = extensionOptions[mins];
                const isSelected = selectedMinutes === mins;

                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedMinutes(mins)}
                    className={`py-2.5 px-2 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary-cyan)] bg-[var(--color-primary-cyan)]/10 text-[var(--color-primary-cyan)] shadow-md'
                        : 'border-[var(--color-border-divider)] bg-[var(--color-app-bg)] text-[var(--color-sub)] hover:border-slate-600'
                    }`}
                  >
                    <span className="block font-mono font-bold text-sm">{mins}m</span>
                    <span className="block text-[10px] font-mono text-[var(--color-muted)] mt-0.5">+₹{cost}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[var(--color-app-bg)] border border-[var(--color-border-divider)] rounded-lg p-3 flex justify-between items-center text-xs">
            <span className="text-[var(--color-muted)] font-['Rajdhani'] uppercase font-semibold">Additional Fee</span>
            <span className="font-mono font-bold text-sm text-[var(--color-available)] flex items-center">
              <PiCurrencyInr /> {additionalCost}
            </span>
          </div>

          <button
            onClick={handleExtend}
            className="w-full py-3 bg-[var(--color-primary-cyan)] hover:opacity-90 text-[var(--color-app-bg)] font-['Rajdhani'] font-bold uppercase tracking-wider text-sm rounded-lg transition"
          >
            Confirm Extension
          </button>
        </div>
      </div>
    </div>
  );
}
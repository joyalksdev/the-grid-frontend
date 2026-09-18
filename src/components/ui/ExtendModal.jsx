import React, { useState } from 'react';
import { PiX, PiClockAfternoon, PiCurrencyInr } from 'react-icons/pi';
import { motion, AnimatePresence } from 'framer-motion';
import { PRICING_MATRIX, calculateSessionCost } from '../../config/pricing';

export default function ExtendModal({ screen, isOpen, onClose, onConfirm }) {
  const [selectedMinutes, setSelectedMinutes] = useState(30);

  if (!screen?.activeSession) return null;

  const mode = screen.activeSession.mode || 'Single';
  const extensionOptions = PRICING_MATRIX[mode]?.extensions || { 15: 50, 30: 80, 60: 130 };
  const additionalCost = calculateSessionCost(mode, selectedMinutes, true);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
            onClick={onClose} 
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-xs bg-card-panel border border-border-divider rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="border-b border-border-divider px-5 py-4 flex items-center justify-between bg-app-bg/50">
              <h3 className="font-heading font-bold text-lg uppercase tracking-wider text-main flex items-center gap-2">
                <PiClockAfternoon className="text-primary-cyan" /> Extend Session
              </h3>
              <button onClick={onClose} className="text-muted hover:text-main transition">
                <PiX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 font-body">
              <div>
                <span className="block text-[11px] font-heading font-bold uppercase tracking-wider text-muted mb-2">
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
                            ? 'border-primary-cyan bg-primary-cyan/10 text-primary-cyan shadow-md'
                            : 'border-border-divider bg-app-bg text-sub hover:border-muted'
                        }`}
                      >
                        <span className="block font-mono font-bold text-sm">{mins}m</span>
                        <span className="block text-[10px] font-mono text-muted mt-0.5">+₹{cost}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-app-bg border border-border-divider rounded-lg p-3 flex justify-between items-center text-xs">
                <span className="text-muted font-heading uppercase font-semibold">Additional Fee</span>
                <span className="font-mono font-bold text-sm text-available flex items-center">
                  <PiCurrencyInr /> {additionalCost}
                </span>
              </div>

              <button
                onClick={() => {
                  onConfirm({ screenId: screen.screenId || screen.id, additionalMinutes: selectedMinutes });
                  onClose();
                }}
                className="w-full py-3 bg-primary-cyan hover:opacity-90 text-app-bg font-heading font-bold uppercase tracking-wider text-sm rounded-lg transition"
              >
                Confirm Extension
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
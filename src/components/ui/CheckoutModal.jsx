import { useState, useEffect } from "react";
import { PiX, PiCreditCard, PiCurrencyInr } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";

export default function CheckoutModal({ screen, isOpen, onClose, onConfirm }) {
  const [paymentType, setPaymentType] = useState("Cash");
  const [calculatedCost, setCalculatedCost] = useState(0);

  const screenIdentifier = screen?.screenId || screen?.id || screen?._id;

  useEffect(() => {
    if (isOpen && screen?.activeSession) {
      setCalculatedCost(screen.activeSession.estimatedCost || 0);
    }
  }, [isOpen, screen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-body">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
            onClick={onClose} 
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-[95%] sm:max-w-sm bg-card-panel border border-border-divider rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="border-b border-border-divider px-4 sm:px-6 py-4 flex items-center justify-between bg-app-bg/50">
              <h3 className="font-heading font-bold text-lg sm:text-xl uppercase tracking-wider text-main">
                Checkout: <span className="text-available">{screen?.name}</span>
              </h3>
              <button onClick={onClose} className="text-muted hover:text-main text-xl transition-colors">
                <PiX />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              <div className="bg-app-bg border border-border-divider rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="block font-heading text-[10px] uppercase tracking-wider text-muted">
                    Player ({screen?.activeSession?.mode})
                  </span>
                  <span className="font-semibold text-sm text-main">{screen?.activeSession?.player}</span>
                </div>
                <div className="text-right">
                  <span className="block font-heading text-[10px] uppercase tracking-wider text-muted">
                    Total Duration
                  </span>
                  <span className="font-mono text-sm font-bold text-main">{screen?.activeSession?.duration} Mins</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-sub mb-2">
                  <PiCreditCard className="text-available text-base" /> Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["Cash", "UPI/GPay"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPaymentType(type)}
                      className={`py-2.5 rounded-lg font-heading text-xs uppercase font-bold tracking-wider border transition-all ${
                        paymentType === type
                          ? "border-available text-available bg-available/10"
                          : "border-border-divider text-sub bg-app-bg hover:border-muted"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-sub mb-2">
                  <PiCurrencyInr className="text-available text-base" /> Final Amount
                </label>
                <input
                  type="number"
                  value={calculatedCost}
                  onChange={(e) => setCalculatedCost(Number(e.target.value))}
                  className="w-full bg-app-bg border border-border-divider rounded-lg px-4 py-3 text-3xl font-mono font-black text-available focus:outline-none focus:border-available transition-colors"
                />
              </div>

              <button
                onClick={() => {
                  onConfirm({
                    screenId: screenIdentifier,
                    finalCost: calculatedCost,
                    paymentType: paymentType === "UPI/GPay" ? "UPI" : "Cash",
                  });
                  onClose();
                }}
                className="w-full py-3.5 bg-available hover:bg-available/90 text-app-bg font-heading font-bold uppercase tracking-wider text-sm rounded-lg transition"
              >
                Complete Checkout
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
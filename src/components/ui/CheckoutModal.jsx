// src/components/ui/CheckoutModal.jsx
import { useState, useEffect } from "react";
import { PiX, PiCreditCard, PiCurrencyInr } from "react-icons/pi";

export default function CheckoutModal({ screen, isOpen, onClose, onConfirm }) {
  const [paymentType, setPaymentType] = useState("Cash");
  const [calculatedCost, setCalculatedCost] = useState(0);

  const screenIdentifier = screen?.screenId || screen?.id || screen?._id;

  useEffect(() => {
    if (isOpen && screen?.activeSession) {
      // Default directly to calculated session cost (base + extensions)
      setCalculatedCost(screen.activeSession.estimatedCost || 0);
    }
  }, [isOpen, screen]);

  if (!isOpen) return null;

  const handleCheckout = () => {
    onConfirm({
      screenId: screenIdentifier,
      finalCost: calculatedCost,
      paymentType: paymentType === "UPI/GPay" ? "UPI" : "Cash",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-['Inter']">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[95%] sm:max-w-sm bg-[var(--color-card-panel)] border border-[var(--color-border-divider)] rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-[var(--color-border-divider)] px-4 sm:px-6 py-4 flex items-center justify-between bg-[var(--color-app-bg)]/50">
          <h3 className="font-['Rajdhani'] font-bold text-lg sm:text-xl uppercase tracking-wider text-white">
            Checkout: <span className="text-[var(--color-available)]">{screen?.name}</span>
          </h3>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-white text-xl transition-colors">
            <PiX />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="bg-[var(--color-app-bg)] border border-[var(--color-border-divider)] rounded-lg p-4 grid grid-cols-2 gap-4">
            <div>
              <span className="block font-['Rajdhani'] text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                Player ({screen?.activeSession?.mode})
              </span>
              <span className="font-semibold text-sm text-white">{screen?.activeSession?.player}</span>
            </div>
            <div className="text-right">
              <span className="block font-['Rajdhani'] text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                Total Duration
              </span>
              <span className="font-mono text-sm font-bold text-white">{screen?.activeSession?.duration} Mins</span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 font-['Rajdhani'] text-xs font-semibold uppercase tracking-wider text-[var(--color-sub)] mb-2">
              <PiCreditCard className="text-[var(--color-available)] text-base" /> Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["Cash", "UPI/GPay"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPaymentType(type)}
                  className={`py-2.5 rounded-lg font-['Rajdhani'] text-xs uppercase font-bold tracking-wider border transition-all ${
                    paymentType === type
                      ? "border-[var(--color-available)] text-[var(--color-available)] bg-[var(--color-available)]/10"
                      : "border-[var(--color-border-divider)] text-[var(--color-sub)] bg-[var(--color-app-bg)] hover:border-slate-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 font-['Rajdhani'] text-xs font-semibold uppercase tracking-wider text-[var(--color-sub)] mb-2">
              <PiCurrencyInr className="text-[var(--color-available)] text-base" /> Final Amount
            </label>
            <input
              type="number"
              value={calculatedCost}
              onChange={(e) => setCalculatedCost(Number(e.target.value))}
              className="w-full bg-[var(--color-app-bg)] border border-[var(--color-border-divider)] rounded-lg px-4 py-3 text-3xl font-mono font-black text-[var(--color-available)] focus:outline-none focus:border-[var(--color-available)] transition-colors"
            />
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-3.5 bg-[var(--color-available)] hover:bg-[var(--color-available)]/90 text-[var(--color-app-bg)] font-['Rajdhani'] font-bold uppercase tracking-wider text-sm rounded-lg transition"
          >
            Complete Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
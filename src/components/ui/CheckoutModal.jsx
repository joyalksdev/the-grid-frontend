// src/components/ui/CheckoutModal.jsx
import { useState, useEffect } from "react";
import { PiMoney, PiQrCode, PiSplitVertical } from "react-icons/pi";
import { formatINR } from "../../utils/format";
import Sheet, { OptionCard, PRIMARY_BTN } from "./Sheet";

const PAYMENT_OPTIONS = [
  { value: "Cash", label: "Cash", icon: PiMoney },
  { value: "UPI/GPay", label: "UPI / GPay", icon: PiQrCode },
  { value: "Split", label: "Split (Cash + UPI)", icon: PiSplitVertical },
];

export default function CheckoutModal({ screen, isOpen, onClose, onConfirm }) {
  const [paymentType, setPaymentType] = useState("Cash");
  const [amount, setAmount] = useState("0");
  const [cashAmount, setCashAmount] = useState("0");
  const [upiAmount, setUpiAmount] = useState("0");

  const session = screen?.activeSession;
  const screenIdentifier = screen?.screenId || screen?.id || screen?._id;
  const estimatedCost = session?.estimatedCost || 0;

  useEffect(() => {
    if (isOpen && session) {
      const costStr = String(session.estimatedCost || 0);
      setAmount(costStr);
      setCashAmount("0");
      setUpiAmount(costStr);
      setPaymentType("Cash");
    }
  }, [isOpen, session]);

  // Handle auto-balancing split amounts
  const handleTotalChange = (val) => {
    setAmount(val);
    if (paymentType === "Split") {
      const total = Number(val) || 0;
      const cash = Number(cashAmount) || 0;
      setUpiAmount(String(Math.max(0, total - cash)));
    }
  };

  const handleCashChange = (val) => {
    setCashAmount(val);
    const total = Number(amount) || 0;
    const cash = Number(val) || 0;
    setUpiAmount(String(Math.max(0, total - cash)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCost = Number(amount);
    if (!Number.isFinite(finalCost) || finalCost < 0) return;

    let payloadPayment = paymentType;
    let splitDetails = { cashAmount: 0, upiAmount: 0 };

    if (paymentType === "Split") {
      const cash = Number(cashAmount);
      const upi = Number(upiAmount);
      if (cash + upi !== finalCost) {
        alert("Cash amount + UPI amount must equal the total final cost.");
        return;
      }
      splitDetails = { cashAmount: cash, upiAmount: upi };
    }

    onConfirm({
      screenId: screenIdentifier,
      finalCost,
      paymentType: payloadPayment,
      splitDetails,
    });
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Checkout"
      description={screen?.name}
      footer={
        <button type="submit" form="checkout-form" className={PRIMARY_BTN}>
          Complete Checkout
        </button>
      }
    >
      <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
        <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border-divider bg-app-bg p-4">
          <div className="min-w-0">
            <dt className="text-xs text-sub">Player ({session?.mode})</dt>
            <dd className="truncate text-sm font-semibold text-main">
              {session?.player}
            </dd>
          </div>
          <div className="text-right">
            <dt className="text-xs text-sub">Total Duration</dt>
            <dd className="font-mono text-sm font-bold tabular-nums text-main">
              {session?.duration}&nbsp;Mins
            </dd>
          </div>
        </dl>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-main">
            Payment Method
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <OptionCard
                key={value}
                name="checkout-payment"
                value={value}
                checked={paymentType === value}
                onChange={() => {
                  setPaymentType(value);
                  if (value === "Split") {
                    const half = Math.round((Number(amount) || 0) / 2);
                    setCashAmount(String(half));
                    setUpiAmount(String((Number(amount) || 0) - half));
                  }
                }}
              >
                <Icon aria-hidden="true" className="mb-1 text-xl" />
                <span className="text-xs font-semibold">{label}</span>
              </OptionCard>
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="checkout-amount"
            className="mb-1.5 block text-sm font-medium text-main"
          >
            Final Amount
          </label>
          <div className="flex h-16 items-center gap-2 rounded-lg border border-border-divider bg-app-bg px-4 transition-colors duration-150 focus-within:border-primary-cyan focus-within:ring-2 focus-within:ring-primary-cyan/40">
            <span aria-hidden="true" className="font-mono text-2xl text-sub">
              ₹
            </span>
            <input
              id="checkout-amount"
              name="finalAmount"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              required
              autoComplete="off"
              value={amount}
              onChange={(e) => handleTotalChange(e.target.value)}
              className="w-full bg-transparent font-mono text-3xl font-bold tabular-nums text-available focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <p className="mt-1.5 text-xs text-sub">
            Estimated {formatINR(estimatedCost)}. Edit if final amount differs.
          </p>
        </div>

        {paymentType === "Split" && (
          <div className="space-y-3 rounded-xl border border-border-divider bg-app-bg/60 p-3.5">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-primary-cyan">
              Split Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-sub">Cash (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={cashAmount}
                  onChange={(e) => handleCashChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border-divider bg-app-bg px-3 font-mono text-sm font-bold text-main focus:border-primary-cyan focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-sub">UPI / GPay (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={upiAmount}
                  readOnly
                  className="h-10 w-full rounded-lg border border-border-divider bg-app-bg/50 px-3 font-mono text-sm font-bold text-main/80 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </Sheet>
  );
}
// src/components/ui/CheckoutModal.jsx
import { useState, useEffect } from "react";
import { PiMoney, PiQrCode } from "react-icons/pi";
import { formatINR } from "../../utils/format";
import Sheet, { OptionCard, PRIMARY_BTN } from "./Sheet";

const PAYMENT_OPTIONS = [
  { value: "Cash", label: "Cash", icon: PiMoney },
  { value: "UPI/GPay", label: "UPI/GPay", icon: PiQrCode },
];

export default function CheckoutModal({ screen, isOpen, onClose, onConfirm }) {
  const [paymentType, setPaymentType] = useState("Cash");
  const [amount, setAmount] = useState("0");

  const session = screen?.activeSession;
  const screenIdentifier = screen?.screenId || screen?.id || screen?._id;
  const estimatedCost = session?.estimatedCost || 0;

  useEffect(() => {
    if (isOpen && session) {
      setAmount(String(session.estimatedCost || 0));
      setPaymentType("Cash");
    }
  }, [isOpen, session]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCost = Number(amount);
    if (!Number.isFinite(finalCost) || finalCost < 0) return;

    onConfirm({
      screenId: screenIdentifier,
      finalCost,
      paymentType: paymentType === "UPI/GPay" ? "UPI" : "Cash",
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
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <OptionCard
                key={value}
                name="checkout-payment"
                value={value}
                checked={paymentType === value}
                onChange={() => setPaymentType(value)}
              >
                <Icon aria-hidden="true" className="mb-1 text-xl" />
                <span className="text-sm font-semibold">{label}</span>
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
          <div className="flex h-16 items-center gap-2 rounded-lg border border-border-divider bg-app-bg px-4 transition-colors duration-150 motion-reduce:transition-none focus-within:border-primary-cyan focus-within:ring-2 focus-within:ring-primary-cyan/40">
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
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent font-mono text-3xl font-bold tabular-nums text-available focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
          <p className="mt-1.5 text-xs text-sub">
            Estimated {formatINR(estimatedCost)}. Edit if the final amount
            differs.
          </p>
        </div>
      </form>
    </Sheet>
  );
}
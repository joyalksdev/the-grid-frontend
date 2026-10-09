// src/components/logs/RevenueSummary.jsx
import React, { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CurrencyInr,
  QrCode,
  Sparkle,
  ShareNetwork,
  Copy,
  WhatsappLogo,
  LinkSimple,
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { formatINR } from "../../utils/format";
import Sheet from "../ui/Sheet";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

function StatPill({ icon: Icon, tone, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border-divider bg-card-panel px-3.5 py-2.5">
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg bg-app-bg ${tone}`}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-sub">{label}</p>
        <p className="font-mono text-sm font-bold tabular-nums text-main">{value}</p>
      </div>
    </div>
  );
}

function ShareRevenueSheet({ isOpen, onClose, link }) {
  const inputId = useId();

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied");
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Today's revenue summary for The Grid: ${link}`
  )}`;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Share Today's Revenue"
      description="Send this to the owner — no need to read out numbers."
    >
      <div className="space-y-4">
        <div>
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-main">
            Shareable Link
          </label>
          <div className="flex h-11 items-center gap-2 rounded-lg border border-border-divider bg-app-bg px-3">
            <LinkSimple size={16} aria-hidden="true" className="shrink-0 text-sub" />
            <input
              id={inputId}
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="w-full truncate bg-transparent text-sm text-main focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copy}
            className={`flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border-divider text-sm font-semibold text-main transition-colors duration-150 hover:border-sub motion-reduce:transition-none touch-manipulation ${FOCUS}`}
          >
            <Copy size={16} aria-hidden="true" />
            Copy Link
          </button>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-available text-sm font-semibold text-app-bg transition-colors duration-150 hover:bg-available/90 motion-reduce:transition-none touch-manipulation ${FOCUS}`}
          >
            <WhatsappLogo size={16} weight="fill" aria-hidden="true" />
            WhatsApp
          </a>
        </div>
      </div>
    </Sheet>
  );
}

/**
 * Role-based: owners get a direct button into the Revenue Reveal page.
 * Staff get a link they can hand off — the breakdown never renders on their
 * screen.
 *
 * `dayClosed` should reflect your real end-of-day state; wire it up when
 * that flow exists. Defaults to true so this works as-is.
 */
export default function RevenueSummary({ logs = [], isOwner = false, dayClosed = true }) {
  const navigate = useNavigate();
  const [shareOpen, setShareOpen] = useState(false);

  const totalCash = logs
    .filter((l) => String(l.payment).toLowerCase() === "cash")
    .reduce((sum, l) => sum + (Number(l.cost) || 0), 0);

  const totalGPay = logs
    .filter((l) => {
      const p = String(l.payment).toLowerCase();
      return p.includes("upi") || p.includes("gpay");
    })
    .reduce((sum, l) => sum + (Number(l.cost) || 0), 0);

  const totalRevenue = logs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
  const shareLink = `${window.location.origin}/logs/revenue`;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <StatPill icon={CurrencyInr} tone="text-available" label="Cash" value={formatINR(totalCash)} />
      <StatPill icon={QrCode} tone="text-primary-cyan" label="UPI / GPay" value={formatINR(totalGPay)} />
      <StatPill icon={CurrencyInr} tone="text-main" label="Total" value={formatINR(totalRevenue)} />

      <div className="ml-auto">
        {isOwner ? (
          <button
            type="button"
            onClick={() => navigate("/logs/revenue")}
            disabled={!dayClosed}
            title={!dayClosed ? "Available after closing today's accounts" : undefined}
            className={`flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary-cyan px-4 text-sm font-semibold text-app-bg transition-colors duration-150 hover:bg-primary-cyan/90 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none touch-manipulation ${FOCUS} focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg`}
          >
            <Sparkle size={16} weight="fill" aria-hidden="true" />
            See Today&rsquo;s Revenue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            disabled={!dayClosed}
            title={!dayClosed ? "Available after closing today's accounts" : undefined}
            className={`flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border-divider bg-card-panel px-4 text-sm font-semibold text-main transition-colors duration-150 hover:border-sub disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none touch-manipulation ${FOCUS}`}
          >
            <ShareNetwork size={16} aria-hidden="true" />
            Share Today&rsquo;s Revenue
          </button>
        )}
      </div>

      <ShareRevenueSheet isOpen={shareOpen} onClose={() => setShareOpen(false)} link={shareLink} />
    </div>
  );
}
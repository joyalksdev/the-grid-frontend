// src/components/ui/Toast.jsx
import React from "react";
import { 
  CheckCircle, 
  XCircle, 
  WarningCircle, 
  Info, 
  Timer, 
  Monitor, 
  Receipt,
  X 
} from "@phosphor-icons/react";

// Icon & Accent Color Config Map
export const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  error: {
    icon: XCircle,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  warning: {
    icon: WarningCircle,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  info: {
    icon: Info,
    color: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  },
  timeup: {
    icon: Timer,
    color: "text-amber-500 border-amber-500/40 bg-amber-500/15 animate-pulse",
  },
  screen: {
    icon: Monitor,
    color: "text-primary-cyan border-primary-cyan/30 bg-primary-cyan/10",
  },
  checkout: {
    icon: Receipt,
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  },
};

export default function Toast({ type = "info", title, message, onClose }) {
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={`flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-200 ${config.color}`}
    >
      <span className="shrink-0 pt-0.5">
        <IconComponent size={22} weight="bold" />
      </span>

      <div className="min-w-0 flex-1">
        {title && <h4 className="text-sm font-semibold leading-tight text-main">{title}</h4>}
        {message && <p className="mt-0.5 text-xs text-sub leading-relaxed">{message}</p>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-sub hover:bg-card-panel hover:text-main transition-colors"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
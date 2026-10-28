// src/components/ui/Toast.jsx
import React, { useState } from "react";
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
    barColor: "bg-emerald-400",
  },
  error: {
    icon: XCircle,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    barColor: "bg-rose-400",
  },
  warning: {
    icon: WarningCircle,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    barColor: "bg-amber-400",
  },
  info: {
    icon: Info,
    color: "text-sky-400 border-sky-500/30 bg-sky-500/10",
    barColor: "bg-sky-400",
  },
  timeup: {
    icon: Timer,
    color: "text-amber-500 border-amber-500/40 bg-amber-500/15 animate-pulse",
    barColor: "bg-amber-500",
  },
  screen: {
    icon: Monitor,
    color: "text-primary-cyan border-primary-cyan/30 bg-primary-cyan/10",
    barColor: "bg-primary-cyan",
  },
  checkout: {
    icon: Receipt,
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    barColor: "bg-indigo-400",
  },
};

export default function Toast({ 
  type = "info", 
  title, 
  message, 
  onClose, 
  duration = 4000,
  onMouseEnter,
  onMouseLeave 
}) {
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;
  const IconComponent = config.icon;
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 180);
  };

  return (
    <div
      role="alert"
      onMouseEnter={(e) => {
        setIsPaused(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsPaused(false);
        onMouseLeave?.(e);
      }}
      className={`relative overflow-hidden flex w-full max-w-sm items-center gap-3.5 rounded-xl border px-4 py-3.5 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-200 transform ${
        isExiting 
          ? "opacity-0 scale-95 translate-x-4 pointer-events-none" 
          : "opacity-100 scale-100 translate-x-0"
      } ${config.color}`}
    >
      {/* Status Icon - Auto-centered dynamically */}
      <span className="shrink-0 self-center">
        <IconComponent size={22} weight="bold" />
      </span>

      {/* Content Block - Grows and wraps naturally */}
      <div className="min-w-0 flex-1 self-center">
        {title && <h4 className="text-sm font-semibold leading-tight text-main">{title}</h4>}
        {message && <p className="mt-0.5 text-xs text-sub leading-relaxed">{message}</p>}
      </div>

      {/* Close Button - Auto-centered dynamically */}
      {onClose && (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 self-center rounded-lg p-1 text-sub hover:bg-card-panel hover:text-main transition-colors cursor-pointer touch-manipulation"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      )}

      {/* Progress Bar with CSS Animation & Pause on Hover */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
        <div 
          className={`h-full ${config.barColor} origin-left`}
          style={{
            animation: `toastShrink ${duration}ms linear forwards`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
          onAnimationEnd={handleDismiss}
        />
      </div>

      {/* Keyframe animation for smooth shrinking */}
      <style>{`
        @keyframes toastShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
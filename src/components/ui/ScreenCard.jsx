// src/components/ui/ScreenCard.jsx
import { useState, useEffect } from "react";
import { PiPlusCircle, PiClock } from "react-icons/pi";
import { playTimerAlertSound } from "../../utils/audioAlert";

export default function ScreenCard({ screen, onStartSession, onCheckoutPrompt, onExtendPrompt }) {
  const { name, type, status, activeSession } = screen;
  const screenIdentifier = screen.screenId || screen.id || screen._id;

  const [timeLeft, setTimeLeft] = useState("");
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (status !== "occupied" || !activeSession?.endTime) return;

    const timer = setInterval(() => {
      const difference = new Date(activeSession.endTime) - new Date();

      if (difference <= 0) {
        setTimeLeft("00:00:00");
        setIsWarning(true);
        playTimerAlertSound(); // Play audio alert when time runs out
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setIsWarning(hours === 0 && minutes < 10);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [status, activeSession]);

  return (
    <div className="bg-card-panel border border-border-divider rounded-xl p-5 flex flex-col justify-between min-h-[320px] hover:border-sub/40 transition-colors shadow-sm">
      {/* Station Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-divider/50">
        <div>
          <span className="font-mono text-[10px] text-muted uppercase tracking-wider block">
            {type}
          </span>
          <h3 className="font-heading font-bold text-xl text-main tracking-wide">
            {name}
          </h3>
        </div>

        {status === "occupied" ? (
          <span className={`px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-wider font-semibold border ${
            isWarning
              ? "bg-warning/10 text-warning border-warning/30"
              : "bg-occupied/10 text-occupied border-occupied/30"
          }`}>
            {isWarning ? "Ending Soon" : "In Use"}
          </span>
        ) : (
          <span className="bg-available/10 text-available border border-available/30 px-2.5 py-1 rounded-md font-mono text-[11px] uppercase tracking-wider font-semibold">
            Available
          </span>
        )}
      </div>

      {/* Timer & Details Block */}
      <div className="my-6 flex-grow flex flex-col justify-center">
        {status === "occupied" ? (
          <div className="space-y-4">
            <div className="text-center py-2 bg-app-bg/50 border border-border-divider/60 rounded-lg">
              <span className="font-mono text-[10px] uppercase text-muted tracking-wider block mb-0.5">Time Remaining</span>
              <span className={`font-mono text-3xl font-bold tracking-wider ${isWarning ? "text-warning" : "text-primary-cyan"}`}>
                {timeLeft || "00:00:00"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-app-bg/40 p-2.5 rounded border border-border-divider/40">
                <span className="text-muted block font-mono uppercase text-[9px] tracking-wider">Player</span>
                <span className="font-body font-medium text-main truncate block">{activeSession?.player}</span>
              </div>
              <div className="bg-app-bg/40 p-2.5 rounded border border-border-divider/40 text-right">
                <span className="text-muted block font-mono uppercase text-[9px] tracking-wider">Mode</span>
                <span className="font-mono text-xs text-sub">{activeSession?.mode}</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onStartSession(screenIdentifier)}
            className="w-full py-8 border border-dashed border-border-divider hover:border-sub rounded-lg flex flex-col items-center justify-center gap-2 text-muted hover:text-main transition-colors group"
          >
            <PiPlusCircle className="text-3xl text-sub group-hover:text-main transition-colors" />
            <span className="font-mono font-semibold text-xs uppercase tracking-wider">Start Session</span>
          </button>
        )}
      </div>

      {/* Action Controls */}
      <div className="pt-4 border-t border-border-divider/50">
        {status === "occupied" ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onExtendPrompt(screenIdentifier)}
              className="flex items-center justify-center gap-1.5 border border-border-divider hover:border-sub text-sub hover:text-main py-2 rounded font-mono uppercase tracking-wider font-semibold text-xs transition-colors"
            >
              <PiClock className="text-sm" /> Extend
            </button>
            <button
              onClick={() => onCheckoutPrompt(screenIdentifier)}
              className="bg-main hover:bg-main/90 text-app-bg py-2 rounded font-mono uppercase tracking-wider font-semibold text-xs transition-colors"
            >
              Checkout
            </button>
          </div>
        ) : (
          <div className="text-center py-1 font-mono text-[11px] text-muted">
            Ready for Player
          </div>
        )}
      </div>
    </div>
  );
}
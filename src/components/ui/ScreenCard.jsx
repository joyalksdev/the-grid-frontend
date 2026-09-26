// src/components/ui/ScreenCard.jsx
import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  PiClock,
  PiBellRinging,
  PiGameController,
  PiPlus,
} from "react-icons/pi";
import { playTimerAlertSound } from "../../utils/audioAlert";

const WARNING_MS = 10 * 60 * 1000;

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-card-panel";

const BTN_BASE = `flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold cursor-pointer touch-manipulation transition-colors duration-150 motion-reduce:transition-none sm:h-11 ${FOCUS}`;
const BTN_PRIMARY = `${BTN_BASE} bg-main text-app-bg hover:bg-main/90`;
const BTN_OUTLINE = `${BTN_BASE} border border-border-divider text-main hover:border-sub`;

function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function formatTime(isoString) {
  if (!isoString) return "--:--";
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

const BADGE_STYLES = {
  available: "border-available/30 bg-available/10 text-available",
  running: "border-occupied/30 bg-occupied/10 text-occupied",
  warning: "border-warning/30 bg-warning/10 text-warning",
  timeup: "border-occupied/40 bg-occupied/15 text-occupied",
};

const BADGE_LABELS = {
  available: "Available",
  running: "In Use",
  warning: "Ending Soon",
  timeup: "Time Up",
};

export default function ScreenCard({
  screen,
  onStartSession,
  onCheckoutPrompt,
  onExtendPrompt,
}) {
  const { name, type, status, activeSession } = screen;
  const screenIdentifier = screen.screenId || screen.id || screen._id;

  const reduceMotion = useReducedMotion();
  const [, setTick] = useState(0);
  const sawRunning = useRef(false); // true once we've watched this session count down
  const alertedFor = useRef(null); // endTime we've already played the alert for

  const isOccupied = status === "occupied";
  const endTime = activeSession?.endTime;
  const startTime = activeSession?.startTime;

  // 1s ticker. Depends on endTime (a string) so polling refreshes that hand us
  // a new activeSession object don't restart the timer or replay the alert.
  useEffect(() => {
    if (!isOccupied || !endTime) {
      sawRunning.current = false;
      return;
    }

    const end = new Date(endTime).getTime();

    const tick = () => {
      setTick((t) => t + 1);

      if (end > Date.now()) {
        sawRunning.current = true;
        return false;
      }

      // Only alert when time runs out while the card is on screen
      if (sawRunning.current && alertedFor.current !== endTime) {
        alertedFor.current = endTime;
        playTimerAlertSound();
      }
      return true;
    };

    if (tick()) return;
    const id = setInterval(() => {
      if (tick()) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [isOccupied, endTime]);

  // Derived state
  const endMs = endTime ? new Date(endTime).getTime() : 0;
  const msLeft = isOccupied ? Math.max(0, endMs - Date.now()) : 0;
  const timeUp = isOccupied && msLeft === 0;
  const isWarning = isOccupied && !timeUp && msLeft <= WARNING_MS;
  const state = !isOccupied
    ? "available"
    : timeUp
    ? "timeup"
    : isWarning
    ? "warning"
    : "running";

  const startMs = startTime ? new Date(startTime).getTime() : null;
  const totalMs =
    startMs && endMs > startMs
      ? endMs - startMs
      : activeSession?.duration
      ? activeSession.duration * 60 * 1000
      : null;
  const progress = totalMs ? Math.min(1, Math.max(0, msLeft / totalMs)) : null;

  const timerColor = timeUp
    ? "text-occupied"
    : isWarning
    ? "text-warning"
    : "text-primary-cyan";
  const barColor = isWarning ? "bg-warning" : "bg-primary-cyan";

  return (
    <article
      className={`relative flex min-h-64 flex-col rounded-xl border bg-card-panel p-3.5 transition-colors duration-150 motion-reduce:transition-none sm:min-h-72 sm:p-5 ${
        timeUp
          ? "border-occupied/50"
          : "border-border-divider hover:border-sub/40"
      }`}
    >
      {/* Time-up: border pulses 4x (~4.8s) then settles to a solid red border */}
      {timeUp && !reduceMotion && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-xl border-2 border-occupied"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: 3, ease: "easeInOut" }}
        />
      )}

      {/* Screen-reader announcement */}
      <p role="status" className="sr-only">
        {timeUp ? `Time is up on ${name}.` : ""}
      </p>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-sub">{type}</p>
          <h3 className="truncate font-heading text-lg font-bold tracking-wide text-main sm:text-xl">
            {name}
          </h3>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${BADGE_STYLES[state]}`}
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          {BADGE_LABELS[state]}
        </span>
      </div>

      {/* Body */}
      {isOccupied ? (
        <div className="mt-3 flex flex-1 flex-col justify-between gap-3 sm:mt-4 sm:gap-4">
          <div>
            <div className="flex h-5 items-center gap-1.5">
              {timeUp ? (
                <>
                  <motion.span
                    aria-hidden="true"
                    className="inline-flex text-occupied"
                    style={{ transformOrigin: "50% 0%" }}
                    animate={
                      reduceMotion
                        ? undefined
                        : { rotate: [0, -16, 14, -10, 8, -4, 0] }
                    }
                    transition={{ duration: 1, repeat: 2, repeatDelay: 0.5 }}
                  >
                    <PiBellRinging className="text-base" />
                  </motion.span>
                  <span className="text-xs font-medium text-occupied">
                    Session Ended
                  </span>
                </>
              ) : (
                <span className="text-xs text-sub">Time Remaining</span>
              )}
            </div>

            <motion.p
              key={timeUp ? "timeup" : "running"}
              role="timer"
              initial={timeUp && !reduceMotion ? { scale: 1.06 } : false}
              animate={{ scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ transformOrigin: "left center" }}
              className={`mt-1 font-mono text-3xl font-bold tabular-nums tracking-tight sm:text-4xl lg:text-[2.75rem] ${timerColor}`}
            >
              {formatRemaining(msLeft)}
            </motion.p>

            {progress !== null && (
              <div
                aria-hidden="true"
                className="mt-2.5 h-1 overflow-hidden rounded-full bg-border-divider sm:mt-3"
              >
                <div
                  className={`h-full w-full origin-left rounded-full transition-transform duration-1000 ease-linear motion-reduce:transition-none ${barColor}`}
                  style={{ transform: `scaleX(${progress})` }}
                />
              </div>
            )}
          </div>

          {/* Session details: who's playing, and when it started/ends */}
          <div className="space-y-2 border-t border-border-divider pt-2.5 sm:space-y-2.5 sm:pt-3">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:gap-4">
              <div className="min-w-0">
                <dt className="text-xs text-sub">Player</dt>
                <dd className="truncate font-medium text-main">
                  {activeSession?.player}
                </dd>
              </div>
              <div className="min-w-0 text-right">
                <dt className="text-xs text-sub">Mode</dt>
                <dd className="truncate font-medium text-sub">
                  {activeSession?.mode}
                </dd>
              </div>
            </dl>

            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border-divider/60 bg-app-bg px-2.5 py-1.5 sm:px-3 sm:py-2">
              <div className="min-w-0">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-sub">
                  Start
                </dt>
                <dd className="mt-0.5 truncate font-mono text-xs font-semibold tabular-nums text-main">
                  {formatTime(startTime)}
                </dd>
              </div>
              <div className="min-w-0 text-right">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-sub">
                  End
                </dt>
                <dd className="mt-0.5 truncate font-mono text-xs font-semibold tabular-nums text-main">
                  {formatTime(endTime)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-divider px-4 py-5 text-center sm:mt-5 sm:py-6">
          <PiGameController aria-hidden="true" className="mb-1 text-xl text-sub sm:text-2xl" />
          <p className="text-sm font-medium text-main">Ready for Player</p>
          <p className="text-xs text-sub">Start a session to begin the timer.</p>
        </div>
      )}

      {/* Actions: always visible, never hidden behind a menu */}
      <div className="mt-3 sm:mt-4">
        {isOccupied ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onExtendPrompt(screenIdentifier)}
              className={BTN_OUTLINE}
            >
              <PiClock aria-hidden="true" className="text-base" />
              Extend
            </button>
            <button
              type="button"
              onClick={() => onCheckoutPrompt(screenIdentifier)}
              className={BTN_PRIMARY}
            >
              Checkout
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onStartSession(screenIdentifier)}
            className={`${BTN_PRIMARY} w-full`}
          >
            <PiPlus aria-hidden="true" className="text-base" />
            Start Session
          </button>
        )}
      </div>
    </article>
  );
}
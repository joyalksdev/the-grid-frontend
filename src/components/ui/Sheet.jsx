// src/components/ui/Sheet.jsx
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import { PiX } from "react-icons/pi";

/* ---------- Shared styles ---------- */

export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

// 16px on mobile so iOS Safari doesn't zoom the page on focus
export const INPUT_CLASS =
  "h-11 w-full rounded-lg border border-border-divider bg-app-bg px-3 text-base text-main placeholder:text-sub/70 transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:border-primary-cyan focus-visible:ring-2 focus-visible:ring-primary-cyan/40 sm:text-sm";

export const PRIMARY_BTN = `flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-main text-sm font-semibold text-app-bg cursor-pointer touch-manipulation transition-colors duration-150 motion-reduce:transition-none hover:bg-main/90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 ${FOCUS} focus-visible:ring-offset-2 focus-visible:ring-offset-card-panel`;

/* Radio rendered as a tappable card. Native input = free arrow-key support. */
export function OptionCard({ name, value, checked, onChange, children }) {
  return (
    <label
      className={`relative flex min-h-14 cursor-pointer select-none flex-col items-center justify-center rounded-lg border px-2 py-2.5 text-center touch-manipulation transition-colors duration-150 motion-reduce:transition-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-cyan ${
        checked
          ? "border-primary-cyan bg-primary-cyan/10 text-main"
          : "border-border-divider bg-app-bg text-sub hover:border-sub/50 hover:text-main"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  );
}

/* ---------- Internals ---------- */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useIsDesktop() {
  const query = "(min-width: 640px)";
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

/**
 * Sheet
 * - Mobile (<640px): bottom drawer. Drag the handle/header down to dismiss.
 * - Desktop: centered dialog.
 * - Escape closes, focus is trapped & restored, page scroll is locked.
 *
 * Put a form's submit button in `footer` and link it with the `form` attribute.
 */
export default function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const dragControls = useDragControls();
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Scroll lock, focus trap, Escape, focus restore
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    dialogRef.current?.focus({ preventScroll: true });

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const nodes = dialogRef.current.querySelectorAll(FOCUSABLE);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = prevOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  const sheetTransition = reduceMotion
    ? { duration: 0 }
    : isDesktop
    ? { duration: 0.15, ease: "easeOut" }
    : { type: "spring", damping: 34, stiffness: 380 };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-50 flex items-end justify-center font-body sm:items-center sm:p-4"
        >
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            drag={isDesktop ? false : "y"}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            initial={
              isDesktop ? { opacity: 0, scale: 0.98, y: 8 } : { y: "100%" }
            }
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={
              isDesktop ? { opacity: 0, scale: 0.98, y: 8 } : { y: "100%" }
            }
            transition={sheetTransition}
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border-divider bg-card-panel shadow-xl shadow-black/50 focus-visible:outline-none sm:max-w-sm sm:rounded-xl sm:border-b"
          >
            {/* Drag zone: handle + header (mobile only) */}
            <div
              onPointerDown={(e) => {
                if (!isDesktop) dragControls.start(e);
              }}
              className="shrink-0 touch-none sm:touch-auto"
            >
              <div
                aria-hidden="true"
                className="flex justify-center pt-2.5 sm:hidden"
              >
                <span className="h-1 w-9 rounded-full bg-border-divider" />
              </div>

              <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3 sm:border-b sm:border-border-divider sm:py-4">
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="font-heading text-lg font-bold uppercase leading-tight tracking-wide text-main"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p className="mt-0.5 truncate text-xs text-sub">
                      {description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className={`-mr-1.5 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-sub transition-colors duration-150 hover:bg-app-bg hover:text-main motion-reduce:transition-none touch-manipulation ${FOCUS}`}
                >
                  <PiX aria-hidden="true" className="text-lg" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-2 sm:pt-5">
              {children}
            </div>

            {footer && (
              <div className="shrink-0 border-t border-border-divider bg-card-panel px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:pb-5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
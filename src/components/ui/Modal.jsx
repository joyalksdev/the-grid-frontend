// src/components/ui/Modal.jsx
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "@phosphor-icons/react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const WIDTH_CLASSES = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

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

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md", // "sm" | "md" | "lg" | "xl" | "2xl"
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

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

  if (!isOpen) return null;

  const widthClass = WIDTH_CLASSES[size] || WIDTH_CLASSES.md;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[999] flex items-end justify-center font-body sm:items-center sm:p-6"
        >
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={
              isDesktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }
            }
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={
              isDesktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : isDesktop
                ? { duration: 0.2, ease: "easeOut" }
                : { type: "spring", damping: 32, stiffness: 360 }
            }
            className={`relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border-divider bg-card-panel shadow-2xl shadow-black/85 focus-visible:outline-none ${widthClass} sm:mx-auto sm:rounded-2xl sm:border`}
          >
            {/* Mobile Drag Handle */}
            <div aria-hidden="true" className="flex justify-center pt-2.5 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-border-divider" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3 sm:border-b sm:border-border-divider sm:py-4">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="font-heading text-lg font-bold uppercase leading-tight tracking-wide text-main"
                >
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-xs text-sub">{description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-sub transition-colors hover:bg-app-bg hover:text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan cursor-pointer"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-3">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 border-t border-border-divider bg-card-panel px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:pb-4">
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
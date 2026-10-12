// src/components/ui/ConfirmModal.jsx
import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { WarningCircle, X } from "@phosphor-icons/react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
}) {
  const modalRef = useRef(null);

  // Trap focus & lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border-divider bg-card-panel p-5 shadow-2xl shadow-black/50"
        >
          <div className="flex items-start gap-4">
            <div
              className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full border ${
                danger
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                  : "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
              }`}
            >
              <WarningCircle size={24} weight="fill" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-heading text-lg font-bold text-main">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-sub">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border-divider bg-app-bg px-4 py-2 font-mono text-xs font-bold text-main transition-colors hover:border-sub/60 focus:outline-none focus:ring-2 focus:ring-primary-cyan"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-panel ${
                danger
                  ? "bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500"
                  : "bg-primary-cyan text-app-bg hover:bg-primary-cyan/90 focus:ring-primary-cyan"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
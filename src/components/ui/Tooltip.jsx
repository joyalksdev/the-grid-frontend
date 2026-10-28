// src/components/ui/Tooltip.jsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Tooltip({ children, content, position = "top", delay = 0.2 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, actualPosition: position });
  const triggerRef = useRef(null);
  let timeoutRef = useRef(null);

  const calculatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const padding = 12;
      let actualPos = position;

      // Dynamic viewport boundary flipping (Windows context menu style)
      if (position === "top" && rect.top < 45) {
        actualPos = "bottom";
      } else if (position === "bottom" && rect.bottom > window.innerHeight - 45) {
        actualPos = "top";
      } else if (position === "right" && rect.right + 120 > window.innerWidth - padding) {
        actualPos = "left";
      } else if (position === "left" && rect.left - 120 < padding) {
        actualPos = "right";
      }

      let top = 0;
      let left = 0;

      if (actualPos === "top") {
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
      } else if (actualPos === "bottom") {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
      } else if (actualPos === "right") {
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
      } else if (actualPos === "left") {
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
      }

      setCoords({ top, left, actualPosition: actualPos });
    }
  };

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, delay * 1000);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      window.addEventListener("scroll", calculatePosition, true);
      window.addEventListener("resize", calculatePosition);
    }
    return () => {
      window.removeEventListener("scroll", calculatePosition, true);
      window.removeEventListener("resize", calculatePosition);
      clearTimeout(timeoutRef.current);
    };
  }, [isVisible]);

  // Translate classes for portal positioning alignment
  const transformClasses = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2 translate-y-0",
    right: "-translate-y-1/2 translate-x-0",
    left: "-translate-y-1/2 -translate-x-full",
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className="inline-flex w-full items-center justify-inherit"
    >
      {children}
      {isVisible &&
        content &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
              }}
              className={`z-[99999] pointer-events-none whitespace-nowrap px-2.5 py-1.5 bg-card-panel border border-border-divider rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl ${
                transformClasses[coords.actualPosition]
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-wider text-main font-bold">
                {content}
              </span>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
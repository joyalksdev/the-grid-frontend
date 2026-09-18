import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, content, position = 'top', delay = 0.2 }) {
  const [isVisible, setIsVisible] = useState(false);
  let timeout;

  const showTooltip = () => {
    timeout = setTimeout(() => setIsVisible(true), delay * 1000);
  };

  const hideTooltip = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const motionVariants = {
    top: { hidden: { opacity: 0, y: 5, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } },
    bottom: { hidden: { opacity: 0, y: -5, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } },
    left: { hidden: { opacity: 0, x: 5, scale: 0.95 }, visible: { opacity: 1, x: 0, scale: 1 } },
    right: { hidden: { opacity: 0, x: -5, scale: 0.95 }, visible: { opacity: 1, x: 0, scale: 1 } },
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={motionVariants[position]}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 whitespace-nowrap px-2.5 py-1.5 bg-app-bg border border-border-divider rounded-md shadow-xl pointer-events-none ${positionClasses[position]}`}
          >
            <span className="font-mono text-[10px] uppercase tracking-wider text-main font-semibold">
              {content}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { PiCircleNotch } from 'react-icons/pi';

export default function Loader({ variant = 'spinner', className = '', lines = 3 }) {
  if (variant === 'skeleton-table') {
    return (
      <div className={`space-y-2 w-full ${className}`}>
        {/* Table Header Skeleton */}
        <motion.div 
          className="h-10 w-full bg-border-divider/30 rounded-md mb-4"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Table Rows Skeleton */}
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            className="h-14 w-full bg-card-panel border border-border-divider rounded-lg"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-card') {
    return (
      <motion.div
        className={`bg-card-panel border border-border-divider rounded-xl p-5 ${className}`}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-border-divider/50" />
          <div className="h-5 w-1/3 bg-border-divider/50 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-10 w-full bg-border-divider/30 rounded" />
          <div className="h-10 w-full bg-border-divider/30 rounded" />
        </div>
      </motion.div>
    );
  }

  if (variant === 'skeleton-form') {
    return (
      <div className={`space-y-4 ${className}`}>
        <motion.div className="h-6 w-1/4 bg-border-divider/50 rounded" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className="h-12 w-full bg-card-panel border border-border-divider rounded-lg"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 py-8 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <PiCircleNotch className="text-4xl text-primary-cyan" />
      </motion.div>
      <span className="font-mono text-[10px] text-muted uppercase tracking-widest font-semibold">
        Processing...
      </span>
    </div>
  );
}
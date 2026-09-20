// src/components/ui/Loader.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { PiCircleNotch } from 'react-icons/pi';

export default function Loader({
  variant = 'spinner',
  className = '',
  lines = 3,
  text = 'Processing...',
}) {
  const pulseAnimation = {
    opacity: [0.35, 0.75, 0.35],
  };

  const pulseTransition = {
    duration: 1.6,
    repeat: Infinity,
    ease: 'easeInOut',
  };

  // Skeleton for Data Tables (Activity / User Management)
  if (variant === 'skeleton-table') {
    return (
      <div className={`w-full space-y-3 ${className}`}>
        {/* Table Header Skeleton */}
        <motion.div
          className="h-11 w-full rounded-lg border border-border-divider/60 bg-card-panel/40"
          animate={pulseAnimation}
          transition={pulseTransition}
        />
        {/* Table Rows Skeleton */}
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <motion.div
              key={i}
              className="flex h-14 w-full items-center justify-between rounded-xl border border-border-divider bg-card-panel px-4"
              animate={pulseAnimation}
              transition={{ ...pulseTransition, delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-border-divider/50" />
                <div className="h-4 w-32 rounded bg-border-divider/40" />
              </div>
              <div className="h-4 w-20 rounded bg-border-divider/30" />
              <div className="hidden h-4 w-24 rounded bg-border-divider/30 sm:block" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Skeleton for Station Cards on Dashboard
  if (variant === 'skeleton-card') {
    return (
      <div className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            className="flex min-h-72 flex-col justify-between rounded-xl border border-border-divider bg-card-panel p-5"
            animate={pulseAnimation}
            transition={{ ...pulseTransition, delay: i * 0.12 }}
          >
            {/* Header section */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-border-divider/40" />
                <div className="h-6 w-28 rounded bg-border-divider/60" />
              </div>
              <div className="h-6 w-20 rounded-md border border-border-divider/50 bg-border-divider/20" />
            </div>

            {/* Body placeholder */}
            <div className="my-6 flex flex-1 flex-col justify-center space-y-3 rounded-lg border border-dashed border-border-divider/50 p-4">
              <div className="mx-auto size-8 rounded-full bg-border-divider/40" />
              <div className="mx-auto h-3 w-24 rounded bg-border-divider/30" />
            </div>

            {/* Action button placeholder */}
            <div className="h-11 w-full rounded-lg bg-border-divider/40" />
          </motion.div>
        ))}
      </div>
    );
  }

  // Skeleton for Settings & Form inputs
  if (variant === 'skeleton-form') {
    return (
      <div className={`space-y-5 rounded-xl border border-border-divider bg-card-panel p-6 ${className}`}>
        <motion.div
          className="h-5 w-1/3 rounded bg-border-divider/60"
          animate={pulseAnimation}
          transition={pulseTransition}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: lines * 2 }).map((_, i) => (
            <motion.div
              key={i}
              className="space-y-2"
              animate={pulseAnimation}
              transition={{ ...pulseTransition, delay: i * 0.08 }}
            >
              <div className="h-3 w-20 rounded bg-border-divider/40" />
              <div className="h-11 w-full rounded-lg border border-border-divider bg-app-bg" />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Default Spinner with Cyber Glow
  return (
    <div className={`flex flex-col items-center justify-center space-y-3 py-8 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Cyan Glow Behind Spinner */}
        <div className="absolute size-8 rounded-full bg-primary-cyan/20 blur-md" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        >
          <PiCircleNotch className="relative text-4xl text-primary-cyan" />
        </motion.div>
      </div>

      <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-sub">
        {text}
      </span>
    </div>
  );
}
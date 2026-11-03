// src/pages/NotFoundPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { WarningOctagon, House, ArrowLeft, Terminal } from "@phosphor-icons/react";
import Aurora from "../components/Aurora";

const GRID_TEXTURE = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,246,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,246,255,0.06) 1px, transparent 1px)",
  backgroundSize: "24px 24px",
  WebkitMaskImage: "radial-gradient(ellipse at center, #000 0%, transparent 70%)",
  maskImage: "radial-gradient(ellipse at center, #000 0%, transparent 70%)",
};

export default function NotFound() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-app-bg p-4 font-body sm:p-6">
      {/* Aurora WebGL Background Animation */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full">
        <Aurora
          colorStops={["#ff477e", "#376f78", "#00f5d4"]}
          amplitude={1.5}
          blend={0.65}
          height={0.48}
          speed={1.5}
          glow={0.8}
          direction="bottom"
          mouseInteraction={false}
        />
      </div>

      {/* Cyberpunk Grid Texture Overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" style={GRID_TEXTURE} />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <div className="rounded-3xl border border-border-divider/50 bg-card-panel/25 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl shadow-black/80 relative overflow-hidden">
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,20,26,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] opacity-40" />

          <div className="relative z-10 space-y-6">
            {/* Animated Warning Icon Badge */}
            <motion.div 
              animate={reduceMotion ? {} : { y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="mx-auto grid size-20 place-items-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-lg shadow-rose-500/10"
            >
              <WarningOctagon size={44} weight="fill" className="animate-pulse" />
            </motion.div>

            {/* Status Code */}
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-rose-400 uppercase">
                <Terminal size={14} /> Error 404 // Signal Lost
              </span>
              <h1 className="font-heading text-6xl font-extrabold tracking-tighter text-main sm:text-7xl">
                4<span className="text-primary-cyan">0</span>4
              </h1>
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-lg font-bold uppercase tracking-wider text-main">
                Sector Not Found in Grid Matrix
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-sub">
                The requested coordinate or navigational sector does not exist, has been restricted, or was permanently purged from the terminal.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-11 w-full sm:flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border-divider bg-app-bg/80 text-xs font-mono font-bold text-main transition-colors hover:border-primary-cyan/50 hover:text-primary-cyan"
              >
                <ArrowLeft size={16} weight="bold" />
                <span>Go Back</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/', { replace: true })}
                className="flex h-11 w-full sm:flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary-cyan text-xs font-mono font-bold text-app-bg transition-transform hover:scale-102 shadow-lg shadow-primary-cyan/20"
              >
                <House size={16} weight="bold" />
                <span>Command Center</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
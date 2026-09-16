// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-app-bg border-t border-border-divider/60 py-5 px-5 5md:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Brand & Copyright */}
        <div className="flex items-center gap-2 select-none text-muted font-mono text-xs uppercase">
          <span className="text-sub font-semibold">THE GRID</span>
          <span className="text-border-divider">|</span>
          <span>&copy; {currentYear}</span>
        </div>

        {/* Clean Static Status Badge */}
        <div className="flex items-center gap-2 text-muted text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-available"></span>
          <span className="uppercase tracking-wider">Lounge Online</span>
        </div>

        {/* Tech Spec */}
        <div className="flex items-center gap-1.5 font-mono text-xs uppercase text-muted">
          <span>STAFF PANEL</span>
        </div>

      </div>
    </footer>
  );
}
// src/components/layout/Footer.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { isAdmin } = useAuth();

  return (
    <footer className="w-full mt-auto bg-app-bg border-t border-border-divider pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col items-center gap-2 text-xs text-sub sm:flex-row sm:justify-between sm:gap-4">
        <p className="select-none">
          <span translate="no" className="font-semibold text-main">
            The Grid
          </span>
          <span aria-hidden="true" className="mx-2 text-border-divider">
            |
          </span>
          <span>&copy; {currentYear}</span>
        </p>

        <p className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-available"
          />
          <span>Lounge Online</span>
        </p>

        <p>{isAdmin ? 'Admin' : 'Staff'} Panel</p>
      </div>
    </footer>
  );
}
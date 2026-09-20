// src/components/layout/RootLayout.jsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Lenis from "lenis";
import ScrollToTop from "../common/ScrollToTop";

export default function RootLayout() {
  useEffect(() => {
    // Skip smooth scrolling for users who prefer reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 0.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let frameId;
    function raf(time) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);

  return (
    <div
      style={{ "--app-header-h": "4rem" }}
      className="relative min-h-dvh flex flex-col bg-app-bg text-main font-body selection:bg-primary-cyan/30 selection:text-primary-cyan overflow-x-hidden"
    >
      {/* Subtle Grid Background Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] rounded-lg bg-primary-cyan px-4 py-2 text-sm font-bold text-app-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main"
      >
        Skip to Main Content
      </a>

      <Navbar />

      <main
        id="main-content"
        className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8 scroll-mt-20"
      >
        <Outlet />
      </main>

      <ScrollToTop />

      <Footer />
    </div>
  );
}
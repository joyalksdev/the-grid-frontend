import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Lenis from "lenis";
import ScrollToTop from "../common/ScrollToTop";

export default function RootLayout() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 0.6,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-app-bg text-main min-h-screen flex flex-col font-body selection:bg-primary-cyan/30 selection:text-primary-cyan">
      <Navbar />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      <ScrollToTop />

      <Footer />
    </div>
  );
}
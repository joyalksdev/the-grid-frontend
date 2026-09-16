// src/components/layout/RootLayout.jsx

import React, { useEffect } from "react";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import { Outlet } from "react-router-dom";
import Lenis from "lenis"; // Updated package import

const RootLayout = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="bg-app-bg text-main min-h-screen">
      <Navbar />
      <main className="max-w-[83rem] mx-auto px-4 md:px-8 pt-24 pb-12 min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
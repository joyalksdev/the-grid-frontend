// src/components/layout/AdminLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import ScrollToTop from "../common/ScrollToTop";

export default function AdminLayout() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-app-bg font-body text-main lg:flex-row">
      {/* Background Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />

      {/* Admin Sidebar */}
      <Sidebar />

      {/* Admin Main Workspace */}
      <div className="relative z-10 flex min-h-dvh min-w-0 flex-1 flex-col pb-[72px] lg:pb-0">
        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <Footer />
      </div>

      <ScrollToTop />
    </div>
  );
}
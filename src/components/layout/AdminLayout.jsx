// src/components/layout/AdminLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

export default function AdminLayout() {
  return (
    <div className="relative min-h-dvh bg-app-bg text-main font-body flex flex-col lg:flex-row overflow-x-hidden">
      {/* Background Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />

      {/* Admin Sidebar */}
      <Sidebar />

      {/* Admin Main Workspace */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 min-h-dvh">
        <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
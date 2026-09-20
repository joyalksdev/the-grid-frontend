// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TimerProvider } from "./context/TimerContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import RootLayout from "./components/layout/RootLayout";
import SettingsLayout from "./components/layout/SettingsLayout";

import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";

import ConsoleRatesSettings from "./pages/settings/ConsoleRatesSettings";
import SecuritySettings from "./pages/settings/SecuritySettings";
import UserManagementPage from "./pages/settings/UserManagementPage";
import { SocketProvider } from "./context/SocketContext";
import Loader from "./components/ui/Loader";

function FullScreenLoader() {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-app-bg text-main overflow-hidden">
      {/* Background Grid Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      <div className="relative z-10 flex flex-col items-center  backdrop-blur-sm p-8 rounded-2xl border border-border-divider/50 shadow-2xl">
        <p className="font-mono text-xs font-bold text-primary-cyan uppercase tracking-widest animate-pulse">
          Authentication
        </p>
        <Loader variant="spinner" text="processing" />
      </div>
    </div>
  );
}

function AuthenticatedAuthRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return isAuthenticated ? <Navigate to="/" replace /> : <Auth />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/auth" element={<AuthenticatedAuthRoute />} />

          {/* Protected Console Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              element={
                <SocketProvider>
                  <TimerProvider>
                    <RootLayout />
                  </TimerProvider>
                </SocketProvider>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/profile" element={<Profile />} />

              {/* Nested Admin System Settings Routes */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/settings" element={<SettingsLayout />}>
                  <Route index element={<Navigate to="/settings/rates" replace />} />
                  <Route path="rates" element={<ConsoleRatesSettings />} />
                  <Route path="security" element={<SecuritySettings />} />
                  <Route path="users" element={<UserManagementPage />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <Toaster
        position="top-center"
        containerStyle={{
          top: 80,
          right: 20,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(18, 20, 26, 0.7)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            color: "#F8FAFC",
            fontFamily: '"Rajdhani", monospace',
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontSize: "12px",
            fontWeight: "700",
            padding: "10px 18px 10px 14px",
            borderRadius: "18px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)",
          },
          success: {
            iconTheme: { primary: "#00F5D4", secondary: "#12141A" },
          },
          error: {
            iconTheme: { primary: "#FF477E", secondary: "#12141A" },
          },
        }}
      />
    </AuthProvider>
  );
}
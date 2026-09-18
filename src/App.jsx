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
import { SocketProvider } from "./context/SocketContext";

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-[#0D0E12] flex items-center justify-center font-mono text-xs text-[#00F5D4] uppercase tracking-widest animate-pulse">
      Authenticating Console...
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
      background: "rgba(18, 20, 26, 0.7)", // Darker, highly transparent base
      backdropFilter: "blur(20px) saturate(180%)", // Strong iOS-style frosted glass
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255, 255, 255, 0.06)", // Micro-border for edge definition
      color: "#F8FAFC",
      fontFamily: '"Rajdhani", monospace',
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      fontSize: "12px",
      fontWeight: "700",
      padding: "10px 18px 10px 14px", // Compact padding, tighter on the left near the icon
      borderRadius: "18px", // Deep "squircle" radius matching the reference image
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)", // Deep ambient shadow to lift it off the UI
    },
    success: {
      iconTheme: { primary: "#00F5D4", secondary: "#12141A" },
    },
    error: {
      iconTheme: { primary: "#FF477E", secondary: "#12141A" },
    },
  }}
/>    </AuthProvider>
  );
}
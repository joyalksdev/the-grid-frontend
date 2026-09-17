// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TimerProvider } from "./context/TimerContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import RootLayout from "./components/layout/RootLayout";
import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";

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

const App = () => {
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
                <TimerProvider>
                  <RootLayout />
                </TimerProvider>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/pricing" element={<Pricing />} />
            </Route>
          </Route>

          {/* Fallback Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#161920",
            border: "1px solid #232732",
            color: "#F8FAFC",
            fontFamily: '"Rajdhani", sans-serif',
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontSize: "14px",
            fontWeight: "600",
          },
          success: {
            iconTheme: { primary: "#00F5D4", secondary: "#0D0E12" },
            style: { border: "1px solid rgba(0, 245, 212, 0.3)" },
          },
          error: {
            iconTheme: { primary: "#FF477E", secondary: "#0D0E12" },
            style: { border: "1px solid rgba(255, 71, 126, 0.3)" },
          },
        }}
      />
    </AuthProvider>
  );
};

export default App;
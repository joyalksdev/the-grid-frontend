// src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  SquaresFour,
  ClockCounterClockwise,
  Calculator,
  Gear,
  UserCircle,
  SignOut,
  CaretDown,
  List,
  X,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  // Handle outside clicks to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    toast.error("Logging out session...");
    await logout();
    navigate("/auth");
  };

  const navItems = [
    { label: "Dashboard", path: "/", icon: SquaresFour },
    { label: "Activity Logs", path: "/activity", icon: ClockCounterClockwise },
    { label: "Rates", path: "/pricing", icon: Calculator },
  ];

  if (isAdmin) {
    navItems.push({ label: "Settings", path: "/settings", icon: Gear });
  }

  // DiceBear Bottts robot avatar seeded by user identity
  const avatarSeed = encodeURIComponent(user?.name || user?.username || "GridOperator");
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}&backgroundColor=0E131F`;

  return (
    <header className="sticky top-0 z-50 bg-app-bg/90 backdrop-blur-md border-b border-border-divider font-body select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Precision Wordmark */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-105">
            <img 
              src="/logo.png" 
              alt="The Grid Logo" 
              className="h-8 w-auto object-contain" 
            />
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="font-logo font-bold text-base tracking-wider text-main uppercase">
              THE <span className="text-primary-cyan">GRID</span>
            </span>
            <span className="font-heading font-bold text-[10px] tracking-[0.22em] text-sub uppercase mt-0.5">
              GAMING LOUNGE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation (Uniform Padding & Subtle Transitions) */}
        <nav className="hidden md:flex items-center gap-1 bg-card-panel/60 border border-border-divider p-1 rounded-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-xs font-body font-medium tracking-wide flex items-center gap-2 transition-all duration-200 ${
                  active
                    ? "bg-app-bg text-main font-semibold border border-border-divider shadow-sm"
                    : "text-sub hover:text-main hover:bg-card-panel/50 border border-transparent"
                }`}
              >
                <Icon size={16} className={active ? "text-primary-cyan" : "text-sub"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Profile Menu */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            {/* Clean Trigger Button */}
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2 bg-card-panel border border-border-divider rounded-xl hover:border-sub/40 transition-all duration-200 focus:outline-none cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-lg bg-app-bg border border-border-divider overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-105">
                <img
                  src={avatarUrl}
                  alt="Operator Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="text-xs font-body font-semibold text-main">
                {user?.name || "Staff"}
              </span>

              <CaretDown
                size={12}
                className={`text-sub transition-transform duration-200 mr-1 ${
                  profileDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-56 bg-card-panel border border-border-divider rounded-xl shadow-2xl p-2 z-50"
                >
                  {/* User Profile Card Header */}
                  <div className="px-3 py-2.5 bg-app-bg/60 rounded-lg border border-border-divider/60 mb-1.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-card-panel border border-border-divider overflow-hidden shrink-0">
                      <img
                        src={avatarUrl}
                        alt="Operator Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-body font-bold text-main truncate">
                        {user?.name || "Staff"}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                            isAdmin
                              ? "bg-primary-cyan/10 text-primary-cyan border-primary-cyan/30"
                              : "bg-card-panel text-sub border-border-divider"
                          }`}
                        >
                          {user?.role || "staff"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-body text-sub hover:text-main hover:bg-app-bg/80 transition-colors"
                    >
                      <UserCircle size={16} className="text-primary-cyan" />
                      <span>My Account</span>
                    </Link>

                    <div className="my-1 border-t border-border-divider" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-body font-medium text-occupied hover:bg-occupied/10 transition-colors cursor-pointer"
                    >
                      <SignOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex items-center md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-sub hover:text-main rounded-xl bg-card-panel border border-border-divider active:scale-95 transition-transform"
          >
            {mobileMenuOpen ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-app-bg border-b border-border-divider px-4 py-3 space-y-3"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-body font-medium transition-all ${
                      active
                        ? "bg-card-panel text-main font-semibold border border-border-divider"
                        : "text-sub hover:text-main hover:bg-card-panel/50 border border-transparent"
                    }`}
                  >
                    <Icon size={18} className={active ? "text-primary-cyan" : "text-sub"} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-body font-medium text-sub hover:text-main hover:bg-card-panel/50 border border-transparent"
              >
                <UserCircle size={18} />
                <span>Profile</span>
              </Link>
            </div>

            <div className="pt-3 border-t border-border-divider flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-card-panel border border-border-divider overflow-hidden shrink-0">
                  <img src={avatarUrl} alt="Operator Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xs font-body font-semibold text-main block">
                    {user?.name || "Staff"}
                  </span>
                  <span
                    className={`font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border inline-block ${
                      isAdmin
                        ? "bg-primary-cyan/10 text-primary-cyan border-primary-cyan/30"
                        : "bg-card-panel text-sub border-border-divider"
                    }`}
                  >
                    {user?.role || "staff"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-semibold text-occupied bg-occupied/10 border border-occupied/20"
              >
                <SignOut size={14} />
                <span>Log out </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
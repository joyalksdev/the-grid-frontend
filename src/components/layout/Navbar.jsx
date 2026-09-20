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
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";
const FOCUS_OFFSET = `${FOCUS} focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg`;

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const headerRef = useRef(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuButtonRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const reduceMotion = useReducedMotion();

  // Close on outside press / Escape (returns focus so keyboard users aren't lost)
  useEffect(() => {
    function onPointerDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key !== "Escape") return;
      const active = document.activeElement;
      if (dropdownRef.current?.contains(active)) triggerRef.current?.focus();
      if (document.getElementById("mobile-menu")?.contains(active)) {
        menuButtonRef.current?.focus();
      }
      setProfileDropdownOpen(false);
      setMobileMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Close menus after navigating
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    toast.error("Signing out…");
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

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const displayName = user?.name || "Staff";
  const role = user?.role || "staff";

  // DiceBear Bottts robot avatar seeded by user identity
  const avatarSeed = encodeURIComponent(
    user?.name || user?.username || "GridOperator"
  );
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}&backgroundColor=0E131F`;

  const roleBadgeClass = `font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
    isAdmin
      ? "bg-primary-cyan/10 text-primary-cyan border-primary-cyan/30"
      : "bg-card-panel text-sub border-border-divider"
  }`;

  const fade = {
    duration: reduceMotion ? 0 : 0.15,
    ease: "easeOut",
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 h-16 bg-app-bg/90 backdrop-blur-md border-b border-border-divider font-body select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          to="/"
          className={`group flex items-center gap-3 rounded-lg ${FOCUS_OFFSET}`}
        >
          <img
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            fetchPriority="high"
            className="h-8 w-auto object-contain shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none group-hover:scale-105"
          />
          <div className="flex flex-col justify-center leading-none">
            <span
              translate="no"
              className="font-logo font-bold text-base tracking-wider text-main uppercase"
            >
              THE <span className="text-primary-cyan">GRID</span>
            </span>
            <span className="font-heading font-bold text-[10px] tracking-[0.22em] text-sub uppercase mt-0.5">
              GAMING LOUNGE
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main"
          className="hidden lg:flex items-center gap-1 bg-card-panel/60 border border-border-divider p-1 rounded-xl"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium tracking-wide transition-colors duration-150 motion-reduce:transition-none ${FOCUS} ${
                  active
                    ? "bg-app-bg text-main font-semibold border-border-divider"
                    : "text-sub hover:text-main hover:bg-card-panel/50 border-transparent"
                }`}
              >
                <Icon
                  size={16}
                  aria-hidden="true"
                  className={active ? "text-primary-cyan" : "text-sub"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop Profile Menu */}
        <div className="hidden lg:block relative" ref={dropdownRef}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setProfileDropdownOpen((open) => !open)}
            aria-expanded={profileDropdownOpen}
            aria-controls="profile-menu"
            className={`group flex items-center gap-2.5 p-1.5 pl-2 bg-card-panel border border-border-divider rounded-xl hover:border-sub/40 transition-colors duration-150 motion-reduce:transition-none cursor-pointer touch-manipulation ${FOCUS_OFFSET}`}
          >
            <span className="size-7 rounded-lg bg-app-bg border border-border-divider overflow-hidden shrink-0">
              <img
                src={avatarUrl}
                alt=""
                width={28}
                height={28}
                className="size-full object-cover"
              />
            </span>
            <span className="max-w-32 truncate text-xs font-semibold text-main">
              {displayName}
            </span>
            <CaretDown
              size={12}
              aria-hidden="true"
              className={`mr-1 shrink-0 text-sub transition-transform duration-150 motion-reduce:transition-none ${
                profileDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                id="profile-menu"
                initial={{ opacity: 0, scale: 0.98, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -4 }}
                transition={fade}
                style={{ transformOrigin: "top right" }}
                className="absolute right-0 mt-2 w-56 bg-card-panel border border-border-divider rounded-xl shadow-lg shadow-black/40 p-1.5 z-50"
              >
                <div className="flex items-center gap-3 rounded-lg border border-border-divider/60 bg-app-bg/60 px-3 py-2.5 mb-1.5">
                  <span className="size-9 rounded-lg bg-card-panel border border-border-divider overflow-hidden shrink-0">
                    <img
                      src={avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="size-full object-cover"
                    />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-xs font-bold text-main">
                      {displayName}
                    </span>
                    <span className={`${roleBadgeClass} self-start`}>
                      {role}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Link
                    to="/profile"
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-sub hover:text-main hover:bg-app-bg/80 transition-colors duration-150 motion-reduce:transition-none ${FOCUS}`}
                  >
                    <UserCircle
                      size={16}
                      aria-hidden="true"
                      className="text-primary-cyan"
                    />
                    <span>My Account</span>
                  </Link>

                  <div className="my-1 border-t border-border-divider" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-occupied hover:bg-occupied/10 transition-colors duration-150 motion-reduce:transition-none cursor-pointer ${FOCUS}`}
                  >
                    <SignOut size={16} aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile / Tablet Toggle */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          className={`lg:hidden grid size-11 place-items-center rounded-xl bg-card-panel border border-border-divider text-sub hover:text-main transition-colors duration-150 motion-reduce:transition-none cursor-pointer touch-manipulation ${FOCUS_OFFSET}`}
        >
          {mobileMenuOpen ? (
            <X size={20} aria-hidden="true" />
          ) : (
            <List size={20} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile / Tablet Menu (overlays content, no layout shift) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={fade}
            className="lg:hidden absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain bg-app-bg border-b border-border-divider"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 space-y-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <nav aria-label="Main" className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none touch-manipulation ${FOCUS} ${
                        active
                          ? "bg-card-panel text-main font-semibold border-border-divider"
                          : "text-sub hover:text-main hover:bg-card-panel/50 border-transparent"
                      }`}
                    >
                      <Icon
                        size={18}
                        aria-hidden="true"
                        className={active ? "text-primary-cyan" : "text-sub"}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <Link
                  to="/profile"
                  className={`flex items-center gap-3 rounded-lg border border-transparent px-4 py-3 text-sm font-medium text-sub hover:text-main hover:bg-card-panel/50 transition-colors duration-150 motion-reduce:transition-none touch-manipulation ${FOCUS}`}
                >
                  <UserCircle size={18} aria-hidden="true" />
                  <span>My Account</span>
                </Link>
              </nav>

              <div className="flex items-center justify-between gap-3 border-t border-border-divider pt-3 px-1">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="size-9 rounded-lg bg-card-panel border border-border-divider overflow-hidden shrink-0">
                    <img
                      src={avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="size-full object-cover"
                    />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-xs font-semibold text-main">
                      {displayName}
                    </span>
                    <span className={`${roleBadgeClass} self-start`}>
                      {role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`shrink-0 flex items-center gap-1.5 rounded-lg border border-occupied/20 bg-occupied/10 px-3.5 py-2.5 text-xs font-semibold text-occupied cursor-pointer touch-manipulation ${FOCUS}`}
                >
                  <SignOut size={14} aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
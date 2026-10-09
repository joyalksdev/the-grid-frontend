// src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  SquaresFour,
  CheckSquare,
  ClockCounterClockwise,
  Calculator,
  Gear,
  UserCircle,
  SignOut,
  CaretDown,
} from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import Sheet from "../ui/Sheet";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg";

function AccountCard({ photoUrl, avatarUrl, displayName, roleBadgeClass, role }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-divider/80 bg-app-bg/80 p-2.5 backdrop-blur-md">
      <span className="size-10 shrink-0 overflow-hidden rounded-lg border border-border-divider/80 bg-card-panel shadow-xs">
        <img
          src={photoUrl}
          alt={displayName}
          width={40}
          height={40}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = avatarUrl;
          }}
          className="size-full object-cover"
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <span className="truncate text-sm font-bold tracking-tight text-main leading-none">
          {displayName}
        </span>
        <span className={`${roleBadgeClass} mt-0.5 self-start`}>{role}</span>
      </div>
    </div>
  );
}

function AccountActions({ onNavigate, onLogout }) {
  return (
    <div className="mt-1.5 space-y-0.5 pt-1">
      <Link
        to="/profile"
        onClick={onNavigate}
        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sub transition-all duration-150 hover:bg-app-bg/80 hover:text-main ${FOCUS}`}
      >
        <UserCircle
          size={18}
          aria-hidden="true"
          className="shrink-0 text-sub group-hover:text-primary-cyan transition-colors"
        />
        <span>My Account</span>
      </Link>

      <div className="my-1 border-t border-border-divider/60" />

      <button
        type="button"
        onClick={onLogout}
        className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-occupied transition-all duration-150 hover:bg-occupied/10 ${FOCUS}`}
      >
        <SignOut
          size={18}
          aria-hidden="true"
          className="shrink-0 transition-transform group-hover:-translate-x-0.5"
        />
        <span>Sign Out</span>
      </button>
    </div>
  );
}

export default function Navbar() {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const lastScrollY = useRef(0);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const reduceMotion = useReducedMotion();

  // Desktop Smart Scroll Header (Hide on scroll down, show on scroll up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 40) {
        setIsVisible(true);
      } else if (
        currentScrollY > lastScrollY.current &&
        currentScrollY - lastScrollY.current > 8
      ) {
        setIsVisible(false);
        setProfileDropdownOpen(false);
      } else if (
        currentScrollY < lastScrollY.current &&
        lastScrollY.current - currentScrollY > 8
      ) {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function onPointerDown(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key !== "Escape") return;
      if (dropdownRef.current?.contains(document.activeElement)) {
        triggerRef.current?.focus();
      }
      setProfileDropdownOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    setProfileDropdownOpen(false);
    setAccountSheetOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    toast.error("Signing out…");
    await logout();
    navigate("/auth");
  };

  const navItems = [
    { label: "Dashboard", path: "/", icon: SquaresFour },
    { label: "Tasks", path: "/tasks", icon: CheckSquare },
    { label: "Logs", path: "/logs", icon: ClockCounterClockwise },
    { label: "Rates", path: "/pricing", icon: Calculator },
  ];

  if (isAdmin) {
    navItems.push({ label: "Settings", path: "/settings", icon: Gear });
  }

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const displayName = user?.name || user?.username || "Staff";
  const role = user?.role || "staff";

  const avatarSeed = encodeURIComponent(displayName);
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}&backgroundColor=0E131F`;
  const photoUrl = user?.photoUrl || avatarUrl;

  const roleBadgeClass = `font-mono text-[9px] uppercase tracking-wider font-bold px-1.5 py-[1px] rounded border ${
    isAdmin
      ? "bg-primary-cyan/10 text-primary-cyan border-primary-cyan/30"
      : "bg-card-panel text-sub border-border-divider"
  }`;

  return (
    <>
      {/* Desktop Header with On-Scroll Hide/Show */}
      <header
        className={`sticky top-0 z-40 hidden h-14 select-none border-b border-border-divider/80 bg-app-bg/85 font-body backdrop-blur-xl transition-transform duration-300 ease-in-out lg:block ${
          isVisible ? "translate-y-0" : "-translate-y-full shadow-none"
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
          <Link to="/" className={`group flex items-center gap-3 rounded-lg ${FOCUS}`}>
            <img
              src="/logo.png"
              alt="Logo"
              width={28}
              height={28}
              fetchPriority="high"
              className="h-7 w-auto shrink-0 object-contain transition-transform duration-300 ease-out group-hover:scale-105"
            />
            <div className="flex flex-col justify-center leading-none">
              <span translate="no" className="font-logo text-sm font-bold uppercase tracking-wider text-main">
                THE <span className="text-primary-cyan">GRID</span>
              </span>
              <span className="mt-0.5 font-heading text-[9px] font-bold uppercase tracking-[0.2em] text-sub">
                GAMING LOUNGE
              </span>
            </div>
          </Link>

          {/* Navigation Pill Bar */}
          <nav
            aria-label="Desktop Navigation"
            className="flex items-center gap-1.5 rounded-xl border border-border-divider/60 bg-card-panel/40 p-1 shadow-xs"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 ${FOCUS} ${
                    active
                      ? "bg-app-bg text-main shadow-xs ring-1 ring-border-divider/80"
                      : "text-sub hover:bg-card-panel/60 hover:text-main"
                  }`}
                >
                  <Icon
                    size={16}
                    aria-hidden="true"
                    weight={active ? "bold" : "regular"}
                    className={active ? "text-primary-cyan" : "text-sub"}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Profile Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setProfileDropdownOpen((open) => !open)}
              aria-expanded={profileDropdownOpen}
              aria-controls="profile-menu"
              className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border border-border-divider/80 bg-card-panel/80 p-1 pl-1.5 transition-all duration-150 hover:border-sub/60 ${FOCUS}`}
            >
              <span className="size-7 shrink-0 overflow-hidden rounded-lg border border-border-divider/80 bg-app-bg">
                <img
                  src={photoUrl}
                  alt={displayName}
                  width={28}
                  height={28}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = avatarUrl;
                  }}
                  className="size-full object-cover"
                />
              </span>
              <span className="max-w-28 truncate text-xs font-bold text-main">{displayName}</span>
              <CaretDown
                size={12}
                weight="bold"
                aria-hidden="true"
                className={`mr-1.5 shrink-0 text-sub transition-transform duration-200 ${
                  profileDropdownOpen ? "rotate-180 text-main" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  id="profile-menu"
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{ duration: reduceMotion ? 0 : 0.12, ease: "easeOut" }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-border-divider/80 bg-card-panel/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
                >
                  <AccountCard
                    photoUrl={photoUrl}
                    avatarUrl={avatarUrl}
                    displayName={displayName}
                    roleBadgeClass={roleBadgeClass}
                    role={role}
                  />
                  <AccountActions
                    onNavigate={() => setProfileDropdownOpen(false)}
                    onLogout={handleLogout}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Capacitor-Ready Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-divider/60 bg-app-bg/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden select-none shadow-[0_-8px_30px_rgba(0,0,0,0.4)]"
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors ${FOCUS} ${
                  active ? "text-primary-cyan font-bold" : "text-sub hover:text-main"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute inset-0 rounded-xl bg-primary-cyan/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon
                  size={20}
                  weight={active ? "fill" : "regular"}
                  className="z-10"
                  aria-hidden="true"
                />
                <span className="z-10 text-[9px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setAccountSheetOpen(true)}
            aria-label="Account Settings"
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-sub transition-colors hover:text-main ${FOCUS}`}
          >
            <span className="size-[20px] shrink-0 overflow-hidden rounded-full border border-border-divider/80 bg-card-panel shadow-xs">
              <img
                src={photoUrl}
                alt={displayName}
                width={20}
                height={20}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = avatarUrl;
                }}
                className="size-full object-cover"
              />
            </span>
            <span className="text-[9px] font-medium tracking-wide">Profile</span>
          </button>
        </div>
      </nav>

      {/* Mobile Account Bottom Sheet */}
      <Sheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
        title="Account Settings"
      >
        <div className="space-y-2 p-1">
          <AccountCard
            photoUrl={photoUrl}
            avatarUrl={avatarUrl}
            displayName={displayName}
            roleBadgeClass={roleBadgeClass}
            role={role}
          />
          <AccountActions
            onNavigate={() => setAccountSheetOpen(false)}
            onLogout={() => {
              setAccountSheetOpen(false);
              handleLogout();
            }}
          />
        </div>
      </Sheet>
    </>
  );
}
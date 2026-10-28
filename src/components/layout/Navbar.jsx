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
import { useAuth } from "../../context/AuthContext";
import { notify } from "../../utils/toastController";
import Sheet from "../ui/Sheet";
import ConfirmModal from "../ui/ConfirmModal";
import Tooltip from "../ui/Tooltip";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan focus-visible:ring-offset-1 focus-visible:ring-offset-app-bg";

// Custom Avatar Component with Letter Fallback
function UserAvatar({ src, name, className = "" }) {
  const [error, setError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setError(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  const colors = [
    "bg-rose-500/20 text-rose-500 border-rose-500/30",
    "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    "bg-blue-500/20 text-blue-500 border-blue-500/30",
    "bg-amber-500/20 text-amber-500 border-amber-500/30",
    "bg-fuchsia-500/20 text-fuchsia-500 border-fuchsia-500/30",
    "bg-primary-cyan/20 text-primary-cyan border-primary-cyan/30",
  ];
  const colorClass = colors[name ? name.charCodeAt(0) % colors.length : 0];

  return (
    <div className={`flex items-center justify-center font-bold border ${colorClass} ${className}`}>
      {initial}
    </div>
  );
}

function AccountCard({ photoUrl, displayName, roleBadgeClass, role }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-divider/80 bg-app-bg/80 p-2.5 backdrop-blur-md">
      <UserAvatar
        src={photoUrl}
        name={displayName}
        className="size-10 shrink-0 overflow-hidden rounded-lg border-border-divider/80 bg-card-panel shadow-xs"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <span className="truncate text-sm font-bold tracking-tight text-main leading-none">
          {displayName}
        </span>
        <span className={`${roleBadgeClass} mt-0.5 self-start`}>{role}</span>
      </div>
    </div>
  );
}

function AccountActions({ onNavigate, onLogoutRequest }) {
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
          className="shrink-0 text-sub transition-colors group-hover:text-primary-cyan"
        />
        <span>My Account</span>
      </Link>

      <div className="my-1 border-t border-border-divider/60" />

      <button
        type="button"
        onClick={onLogoutRequest}
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
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const reduceMotion = useReducedMotion();

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
    notify.error("Signing out…");
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
  const photoUrl = user?.photoUrl;

  const roleBadgeClass = `font-mono text-[9px] uppercase tracking-wider font-bold px-1.5 py-[1px] rounded border ${
    isAdmin
      ? "bg-primary-cyan/10 text-primary-cyan border-primary-cyan/30"
      : "bg-card-panel text-sub border-border-divider"
  }`;

  return (
    <>
      <header className="sticky top-0 z-40 hidden h-14 w-full select-none border-b border-border-divider/80 bg-app-bg/85 font-body backdrop-blur-xl lg:block">
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

          <nav
            aria-label="Desktop Navigation"
            className="flex items-center gap-1.5 rounded-xl border border-border-divider/60 bg-card-panel/40 p-1 shadow-xs"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Tooltip key={item.path} content={item.label} position="bottom" delay={0.3}>
                  <Link
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
                </Tooltip>
              );
            })}
          </nav>

          <div className="relative" ref={dropdownRef}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setProfileDropdownOpen((open) => !open)}
              aria-expanded={profileDropdownOpen}
              aria-controls="profile-menu"
              className={`group flex cursor-pointer items-center gap-2.5 rounded-xl border border-border-divider/80 bg-card-panel/80 p-1 pl-1.5 transition-all duration-150 hover:border-sub/60 ${FOCUS}`}
            >
              <UserAvatar
                src={photoUrl}
                name={displayName}
                className="size-7 shrink-0 overflow-hidden rounded-lg border-border-divider/80 bg-app-bg"
              />
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
                    displayName={displayName}
                    roleBadgeClass={roleBadgeClass}
                    role={role}
                  />
                  <AccountActions
                    onNavigate={() => setProfileDropdownOpen(false)}
                    onLogoutRequest={() => {
                      setProfileDropdownOpen(false);
                      setLogoutModalOpen(true);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-divider/60 bg-app-bg/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl select-none shadow-[0_-8px_30px_rgba(0,0,0,0.4)] lg:hidden"
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
                  active ? "font-bold text-primary-cyan" : "text-sub hover:text-main"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mobileActiveTabStaff"
                    className="absolute inset-0 rounded-xl bg-primary-cyan/10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <Icon size={20} weight={active ? "fill" : "regular"} className="z-10" aria-hidden="true" />
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
            <UserAvatar
              src={photoUrl}
              name={displayName}
              className="size-[20px] shrink-0 overflow-hidden rounded-full border-border-divider/80 bg-card-panel shadow-xs"
            />
            <span className="text-[9px] font-medium tracking-wide">Profile</span>
          </button>
        </div>
      </nav>

      <Sheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
        title="Account Settings"
      >
        <div className="space-y-2 p-1">
          <AccountCard
            photoUrl={photoUrl}
            displayName={displayName}
            roleBadgeClass={roleBadgeClass}
            role={role}
          />
          <AccountActions
            onNavigate={() => setAccountSheetOpen(false)}
            onLogoutRequest={() => {
              setAccountSheetOpen(false);
              setLogoutModalOpen(true);
            }}
          />
        </div>
      </Sheet>

      <ConfirmModal 
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of your account? You will need to log back in to access the lounge system."
        confirmText="Sign Out"
        danger={true}
      />
    </>
  );
}
// src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  SquaresFour,
  CheckSquare,
  ClockCounterClockwise,
  Calculator,
  Users,
  UserPlus,
  SignOut,
  CaretLeft,
} from "@phosphor-icons/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import Sheet from "../ui/Sheet";
import ConfirmModal from "../ui/ConfirmModal";
import Tooltip from "../ui/Tooltip";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

// On-brand fallback palette — cycles through theme tokens only, so avatars
// stay distinguishable without reaching for generic Tailwind colors.
const FALLBACK_STYLES = [
  "bg-primary-cyan/15 text-primary-cyan border-primary-cyan/30",
  "bg-tournament-primary/15 text-tournament-primary border-tournament-primary/30",
  "bg-warning/15 text-warning border-warning/30",
  "bg-available/15 text-available border-available/30",
];

function UserAvatar({ src, name, className = "" }) {
  const [error, setError] = useState(false);

  useEffect(() => setError(false), [src]);

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

  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const style = FALLBACK_STYLES[name ? name.charCodeAt(0) % FALLBACK_STYLES.length : 0];

  return (
    <div className={`flex items-center justify-center border font-mono font-bold ${style} ${className}`}>
      {initial}
    </div>
  );
}

// Fades a label out/in instead of hard-toggling it when the sidebar collapses.
function FadeLabel({ show, children, className = "" }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`overflow-hidden whitespace-nowrap ${className}`}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("grid_sidebar_collapsed") === "true";
  });

  const [mobileMenuSheetOpen, setMobileMenuSheetOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("grid_sidebar_collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    setMobileMenuSheetOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    toast.error("Signing out…");
    await logout();
    navigate("/auth");
  };

  const displayName = user?.name || user?.username || "Admin";
  const userRole = user?.role || "admin";
  const photoUrl = user?.photoUrl;

  const mainNavItems = [
    { label: "Dashboard", path: "/", icon: SquaresFour },
    { label: "Tasks", path: "/tasks", icon: CheckSquare },
    { label: "Logs", path: "/logs", icon: ClockCounterClockwise },
    { label: "Rates", path: "/pricing", icon: Calculator },
  ];

  const secondaryNavItems = [
    { label: "User Management", path: "/settings/users", icon: Users },
    { label: "Requests & Invites", path: "/settings/requests", icon: UserPlus },
  ];

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Mobile Admin Navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-divider bg-app-bg/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md select-none lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors duration-150 motion-reduce:transition-none ${FOCUS} ${
                  active ? "font-bold text-primary-cyan" : "text-sub hover:text-main"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mobileActiveTabAdmin"
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
            onClick={() => setMobileMenuSheetOpen(true)}
            aria-label="Open menu"
            className={`relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-sub transition-colors duration-150 hover:text-main motion-reduce:transition-none touch-manipulation ${FOCUS}`}
          >
            <UserAvatar
              src={photoUrl}
              name={displayName}
              className="size-5 rounded-full border border-border-divider bg-card-panel"
            />
            <span className="text-[9px] font-medium tracking-wide">Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile menu sheet */}
      <Sheet isOpen={mobileMenuSheetOpen} onClose={() => setMobileMenuSheetOpen(false)} title="Admin Settings">
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border-divider bg-app-bg p-2.5">
            <UserAvatar src={photoUrl} name={displayName} className="size-10 rounded-lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-main">{displayName}</p>
              <span className="inline-block rounded border border-primary-cyan/30 bg-primary-cyan/10 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-wider text-primary-cyan">
                {userRole}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-sub">
              System Management
            </span>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuSheetOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-main transition-colors duration-150 hover:bg-app-bg motion-reduce:transition-none ${FOCUS}`}
                >
                  <Icon size={18} aria-hidden="true" className="text-sub" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border-divider pt-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuSheetOpen(false);
                setLogoutModalOpen(true);
              }}
              className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-occupied/20 bg-occupied/10 px-3 py-3 text-sm font-bold text-occupied transition-colors duration-150 hover:bg-occupied/20 motion-reduce:transition-none ${FOCUS}`}
            >
              <SignOut size={18} aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 z-40 hidden h-screen shrink-0 flex-col justify-between border-r border-border-divider bg-card-panel p-3 select-none transition-[width] duration-300 ease-in-out lg:relative lg:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Collapse toggle — floats on the edge, same spot whether expanded or not */}
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`absolute -right-3 top-8 z-50 grid size-6 cursor-pointer place-items-center rounded-full border border-border-divider bg-card-panel text-sub shadow-sm transition-colors duration-150 hover:border-primary-cyan/40 hover:text-primary-cyan motion-reduce:transition-none touch-manipulation ${FOCUS}`}
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex motion-reduce:transition-none"
          >
            <CaretLeft size={12} weight="bold" aria-hidden="true" />
          </motion.span>
        </button>

        <div className="space-y-6">
          <div className="flex items-center px-1 py-1">
            <Link to="/" className={`flex items-center gap-3 ${collapsed ? "w-full justify-center" : ""}`}>
              <img src="/logo.png" alt="Logo" width={30} height={30} className="h-7 w-auto shrink-0 object-contain" />
              <FadeLabel show={!collapsed} className="flex flex-col leading-none">
                <span translate="no" className="font-logo text-sm font-bold uppercase tracking-wider text-main">
                  THE <span className="text-primary-cyan">GRID</span>
                </span>
                <span className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-sub">
                  ADMIN PANEL
                </span>
              </FadeLabel>
            </Link>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Desktop Sidebar Navigation">
            {[...mainNavItems, ...secondaryNavItems].map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              const navContent = (
                <NavLink
                  to={item.path}
                  className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-xs font-semibold transition-colors duration-150 motion-reduce:transition-none ${FOCUS} ${
                    collapsed ? "justify-center px-0" : "px-3"
                  } ${
                    active
                      ? "border border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                      : "border border-transparent text-sub hover:bg-app-bg hover:text-main"
                  }`}
                >
                  {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary-cyan" />}
                  <Icon
                    size={20}
                    weight={active ? "bold" : "regular"}
                    aria-hidden="true"
                    className={`shrink-0 transition-colors duration-150 motion-reduce:transition-none ${
                      active ? "text-primary-cyan" : "text-sub group-hover:text-main"
                    }`}
                  />
                  <FadeLabel show={!collapsed} className="truncate">
                    {item.label}
                  </FadeLabel>
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.path} content={item.label} position="right" delay={0.1}>
                  {navContent}
                </Tooltip>
              ) : (
                <React.Fragment key={item.path}>{navContent}</React.Fragment>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-border-divider pt-3">
          <Link
            to="/profile"
            className={`group flex items-center gap-3 rounded-xl border border-border-divider bg-app-bg p-2 transition-colors duration-150 hover:border-sub/40 motion-reduce:transition-none ${FOCUS} ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <UserAvatar src={photoUrl} name={displayName} className="size-8 shrink-0 rounded-lg" />
            <FadeLabel show={!collapsed} className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-main transition-colors duration-150 group-hover:text-primary-cyan motion-reduce:transition-none">
                {displayName}
              </p>
              <span className="inline-block font-mono text-[9px] font-bold uppercase tracking-wider text-sub">
                {userRole}
              </span>
            </FadeLabel>
          </Link>

          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-occupied/20 bg-occupied/10 py-2 text-xs font-bold text-occupied transition-colors duration-150 hover:bg-occupied/20 motion-reduce:transition-none ${FOCUS} ${
              collapsed ? "px-0" : "px-3"
            }`}
          >
            <SignOut size={18} aria-hidden="true" />
            <FadeLabel show={!collapsed}>Sign Out</FadeLabel>
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of the Admin Panel? You will need to log back in."
        confirmText="Sign Out"
        danger
      />
    </>
  );
}
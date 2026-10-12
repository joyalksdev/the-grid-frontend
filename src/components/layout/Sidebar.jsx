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
  CaretRight,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import Sheet from "../ui/Sheet";
import ConfirmModal from "../ui/ConfirmModal";
import Tooltip from "../ui/Tooltip";

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
      <nav
        aria-label="Mobile Admin Navigation Bar"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border-divider/60 bg-app-bg/90 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl select-none shadow-[0_-8px_30px_rgba(0,0,0,0.4)] lg:hidden"
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
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan ${
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
            aria-label="Open Menu"
            className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-sub transition-colors hover:text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan"
          >
            <UserAvatar
              src={photoUrl}
              name={displayName}
              className="size-[20px] rounded-full border border-border-divider/80 bg-card-panel shadow-xs"
            />
            <span className="text-[9px] font-medium tracking-wide">Menu</span>
          </button>
        </div>
      </nav>

      <Sheet
        isOpen={mobileMenuSheetOpen}
        onClose={() => setMobileMenuSheetOpen(false)}
        title="Admin Settings"
      >
        <div className="space-y-4 p-1">
          <div className="flex items-center gap-3 rounded-xl border border-border-divider/80 bg-app-bg/80 p-2.5 backdrop-blur-md">
            <UserAvatar
              src={photoUrl}
              name={displayName}
              className="size-10 rounded-lg border-border-divider"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-main">{displayName}</p>
              <span className="inline-block rounded border border-primary-cyan/30 bg-primary-cyan/10 px-1.5 py-[1px] font-mono text-[9px] font-bold uppercase tracking-wider text-primary-cyan">
                {userRole}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-sub">System Management</span>
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuSheetOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-main transition-colors hover:bg-app-bg"
                >
                  <Icon size={18} className="text-sub" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border-divider/60 pt-3">
             <button
              type="button"
              onClick={() => {
                setMobileMenuSheetOpen(false);
                setLogoutModalOpen(true);
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-occupied/20 bg-occupied/10 px-3 py-3 text-sm font-bold text-occupied transition-colors hover:bg-occupied/20 focus:outline-none focus:ring-2 focus:ring-occupied"
            >
              <SignOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </Sheet>

      <aside
        className={`sticky top-0 z-40 hidden h-screen shrink-0 flex-col justify-between border-r border-border-divider/80 bg-card-panel/85 p-3 select-none backdrop-blur-xl transition-all duration-300 ease-in-out lg:flex ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="space-y-6">
          <div className="relative flex items-center justify-between px-1 py-1">
            <Link
              to="/"
              className={`flex items-center gap-3 transition-all duration-200 ${
                collapsed ? "w-full justify-center" : ""
              }`}
            >
              <img
                src="/logo.png"
                alt="Logo"
                width={30}
                height={30}
                className="h-7 w-auto shrink-0 object-contain"
              />
              {!collapsed && (
                <div className="flex flex-col leading-none transition-opacity duration-200">
                  <span translate="no" className="font-logo text-sm font-bold uppercase tracking-wider text-main">
                    THE <span className="text-primary-cyan">GRID</span>
                  </span>
                  <span className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-sub">
                    ADMIN PANEL
                  </span>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={`grid size-7 cursor-pointer place-items-center rounded-lg border border-border-divider/80 bg-app-bg text-sub transition-all hover:border-primary-cyan/40 hover:text-primary-cyan ${
                collapsed ? "absolute -right-2 top-1/2 z-50 -translate-y-1/2 translate-x-full shadow-md" : ""
              }`}
            >
              {collapsed ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />}
            </button>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Desktop Sidebar Navigation">
            {[...mainNavItems, ...secondaryNavItems].map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              const NavContent = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${
                    collapsed ? "justify-center px-0" : "px-3"
                  } ${
                    active
                      ? "border border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan shadow-xs"
                      : "border border-transparent text-sub hover:bg-app-bg/60 hover:text-main"
                  }`}
                >
                  {active && (
                    <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-primary-cyan" />
                  )}
                  <Icon
                    size={20}
                    weight={active ? "bold" : "regular"}
                    className={`shrink-0 transition-colors ${
                      active ? "text-primary-cyan" : "text-sub group-hover:text-main"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.path} content={item.label} position="right" delay={0.1}>
                  {NavContent}
                </Tooltip>
              ) : (
                <React.Fragment key={item.path}>{NavContent}</React.Fragment>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-border-divider/60 pt-3">
          <Link
            to="/profile"
            className={`group flex items-center gap-3 rounded-xl border border-border-divider/80 bg-app-bg/50 p-2 transition-all duration-150 hover:border-sub/40 hover:bg-app-bg/90 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <UserAvatar
              src={photoUrl}
              name={displayName}
              className="size-8 shrink-0 overflow-hidden rounded-lg border-border-divider bg-card-panel"
            />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-main transition-colors group-hover:text-primary-cyan">
                  {displayName}
                </p>
                <span className="inline-block font-mono text-[9px] font-bold uppercase tracking-wider text-sub">
                  {userRole}
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-occupied/20 bg-occupied/10 py-2 text-xs font-bold text-occupied transition-colors hover:bg-occupied/20 ${
              collapsed ? "px-0" : "px-3"
            }`}
          >
            <SignOut size={18} />
            {!collapsed && <span>Sign Out</span>}
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
        danger={true}
      />
    </>
  );
}
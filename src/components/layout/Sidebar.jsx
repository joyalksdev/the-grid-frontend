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
  List,
  X,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("grid_sidebar_collapsed") === "true";
  });

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
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    toast.error("Signing out…");
    await logout();
    navigate("/auth");
  };

  const displayName = user?.name || user?.username || "Admin";
  const userRole = user?.role || "admin";

  const avatarSeed = encodeURIComponent(displayName);
  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}&backgroundColor=0E131F`;
  const photoUrl = user?.photoUrl || fallbackAvatar;

  const navItems = [
    { label: "Dashboard", path: "/", icon: SquaresFour },
    { label: "Tasks", path: "/tasks", icon: CheckSquare },
    { label: "Logs", path: "/logs", icon: ClockCounterClockwise },
    { label: "Rates", path: "/pricing", icon: Calculator },
    { label: "User Management", path: "/settings/users", icon: Users },
    { label: "Requests & Invites", path: "/settings/requests", icon: UserPlus },
  ];

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile Header Control Bar */}
      <div className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-border-divider/80 bg-card-panel/90 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" width={24} height={24} className="h-6 w-auto" />
          <span className="font-logo text-xs font-bold uppercase text-main">
            GRID <span className="text-primary-cyan">ADMIN</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-border-divider/80 bg-app-bg p-1.5 text-sub hover:text-main focus:outline-none"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X size={20} /> : <List size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-border-divider bg-card-panel p-4 shadow-2xl select-none lg:hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <Link to="/" className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="Logo" width={28} height={28} className="h-7 w-auto" />
                    <div className="flex flex-col leading-none">
                      <span className="font-logo text-sm font-bold uppercase tracking-wider text-main">
                        THE <span className="text-primary-cyan">GRID</span>
                      </span>
                      <span className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-sub">
                        ADMIN PANEL
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg p-1 text-sub hover:bg-app-bg hover:text-main"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1.5" aria-label="Mobile Drawer Navigation">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                          active
                            ? "border border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                            : "border border-transparent text-sub hover:bg-app-bg hover:text-main"
                        }`}
                      >
                        <Icon size={18} weight={active ? "bold" : "regular"} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-2 border-t border-border-divider/60 pt-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-xl border border-border-divider/80 bg-app-bg/50 p-2.5"
                >
                  <img
                    src={photoUrl}
                    alt={displayName}
                    className="size-8 rounded-lg border border-border-divider object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-main">{displayName}</p>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-sub">
                      {userRole}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-occupied/20 bg-occupied/10 px-3 py-2 text-xs font-bold text-occupied"
                >
                  <SignOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Collapsible Sidebar */}
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
                collapsed ? "absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full shadow-md z-50" : ""
              }`}
            >
              {collapsed ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />}
            </button>
          </div>

          <nav className="flex flex-col gap-1.5" aria-label="Desktop Sidebar Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${
                    collapsed ? "justify-center px-0" : "px-3"
                  } ${
                    active
                      ? "border border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan shadow-xs"
                      : "border border-transparent text-sub hover:bg-app-bg/60 hover:text-main"
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary-cyan" />
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
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-border-divider/60 pt-3">
          <Link
            to="/profile"
            title={collapsed ? displayName : undefined}
            className={`group flex items-center gap-3 rounded-xl border border-border-divider/80 bg-app-bg/50 p-2 transition-all duration-150 hover:border-sub/40 hover:bg-app-bg/90 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-border-divider bg-card-panel">
              <img
                src={photoUrl}
                alt={displayName}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackAvatar;
                }}
                className="size-full object-cover"
              />
            </div>
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
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-occupied/20 bg-occupied/10 py-2 text-xs font-bold text-occupied transition-colors hover:bg-occupied/20 ${
              collapsed ? "px-0" : "px-3"
            }`}
          >
            <SignOut size={18} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
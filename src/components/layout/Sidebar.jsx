import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  SquaresFour,
  ClockCounterClockwise,
  Calculator,
  Gear,
  UserCircle,
  SignOut,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ onNavClick }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const navItems = [
    { label: "Dashboard", path: "/", icon: SquaresFour },
    { label: "Activity Logs", path: "/activity", icon: ClockCounterClockwise },
    { label: "Price Calculator", path: "/pricing", icon: Calculator },
    { label: "Profile", path: "/profile", icon: UserCircle },
  ];

  if (isAdmin) {
    navItems.push({ label: "System Settings", path: "/settings", icon: Gear });
  }

  return (
    <aside className="w-full h-full bg-[#0D0E12] min-h-screen flex flex-col justify-between p-4 font-mono select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-3 py-4 mb-6 border-b border-[#232732]">
          <div className="w-8 h-8 rounded bg-[#00F5D4]/10 border border-[#00F5D4]/30 flex items-center justify-center font-rajdhani font-bold text-[#00F5D4] text-lg shadow-[0_0_10px_rgba(0,245,212,0.15)]">
            G
          </div>
          <div>
            <h2 className="font-rajdhani font-bold text-white tracking-widest uppercase text-base leading-none">
              THE <span className="text-[#00F5D4]">GRID</span>
            </h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Lounge Console</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavClick}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded text-xs tracking-wider uppercase transition-all ${
                    isActive
                      ? "bg-[#00F5D4]/10 text-[#00F5D4] border-l-2 border-[#00F5D4] font-bold"
                      : "text-zinc-400 hover:text-white hover:bg-[#161920]"
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Profile Footer */}
      <div className="border-t border-[#232732] pt-4">
        <div className="flex items-center justify-between px-3 py-2 bg-[#161920] rounded-lg border border-[#232732]">
          <div className="truncate pr-2">
            <p className="text-xs text-white font-bold truncate">{user?.name || user?.userId || "Operator"}</p>
            <span
              className={`inline-block text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-widest mt-0.5 ${
                isAdmin ? "bg-[#00F5D4]/20 text-[#00F5D4]" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {user?.role || "operator"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout Session"
            className="text-zinc-400 hover:text-[#FF477E] p-1.5 transition"
          >
            <SignOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
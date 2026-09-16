// src/components/Navbar.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PiPlusCircle, PiList, PiX, PiUser, PiGear, PiSignOut } from "react-icons/pi";
import Dropdown from "../ui/Dropdown";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onQuickEntry }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    toast.error("Logging out...");
    await logout();
  };

  const navLinks = [
    { path: "/", label: "Dashboard" },
    { path: "/pricing", label: "Rates" },
    { path: "/activity", label: "Session Logs" },
  ];

  const profileDropdownItems = [
    { 
      label: user ? `${user.name} (${user.role})` : "Staff Profile", 
      icon: <PiUser className="text-sm" />, 
      onClick: () => toast(`Logged in as ${user?.name || 'Operator'}`, { icon: "👤" }) 
    },
    { label: "Lounge Settings", icon: <PiGear className="text-sm" />, onClick: () => toast("Lounge settings opening...", { icon: "⚙️" }) },
    { type: "divider" },
    { label: "Log Out", icon: <PiSignOut className="text-sm" />, danger: true, onClick: handleLogout }
  ];

  return (
    <nav className="w-full bg-app-bg/90 backdrop-blur-md border-b border-border-divider px-4 py-3 md:px-8 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 select-none group">
          <img
            src="./logo.png"
            alt="The Grid Logo"
            className="w-6 h-6 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <div className="flex items-center gap-2">
            <span className="font-logo font-black tracking-wider text-main text-sm uppercase">
              THE <span className="text-primary-cyan">GRID</span>
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-primary-cyan/60 border border-border-divider px-1.5 py-0.5 rounded uppercase tracking-wider">
              Gaming Lounge
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1 bg-card-panel/60 border border-border-divider p-1 rounded-lg">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1 rounded-md font-mono text-xs uppercase tracking-wider transition-colors ${
                    active
                      ? "text-main bg-app-bg border border-border-divider font-semibold"
                      : "text-sub hover:text-main hover:bg-app-bg/40"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="h-4 w-[1px] bg-border-divider"></div>

          <button
            onClick={onQuickEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono font-semibold text-xs uppercase tracking-wider bg-main text-app-bg hover:bg-main/90 active:scale-[0.98] transition-all"
          >
            <PiPlusCircle className="text-sm" />
            <span>Quick Entry</span>
          </button>

          <Dropdown
            items={profileDropdownItems}
            align="right"
            trigger={
              <button className="w-7 h-7 rounded-full bg-card-panel border border-border-divider flex items-center justify-center overflow-hidden hover:border-sub transition-colors focus:outline-none">
                <img
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'GridAdmin'}`}
                  alt="Staff Profile"
                  className="w-full h-full object-cover"
                />
              </button>
            }
          />
        </div>

        <div className="flex items-center md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-xl text-sub hover:text-main transition-colors focus:outline-none"
          >
            {isMobileMenuOpen ? <PiX /> : <PiList />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[100%] left-0 w-full bg-app-bg border-b border-border-divider p-4 flex flex-col gap-3 shadow-xl">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors ${
                    active
                      ? "text-main bg-card-panel border border-border-divider font-semibold"
                      : "text-sub hover:text-main"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="h-[1px] bg-border-divider my-1"></div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => { onQuickEntry?.(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-md font-mono font-semibold text-xs uppercase tracking-wider bg-main text-app-bg transition-all"
            >
              <PiPlusCircle className="text-sm" />
              Quick Entry
            </button>
            <Dropdown
              items={profileDropdownItems}
              align="right"
              trigger={
                <div className="w-8 h-8 shrink-0 rounded-full bg-card-panel border border-border-divider overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'GridAdmin'}`} alt="Staff Profile" className="w-full h-full object-cover" />
                </div>
              }
            />
          </div>
        </div>
      )}
    </nav>
  );
}
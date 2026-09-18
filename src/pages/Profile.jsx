import React from "react";
import { User, ShieldCheck, EnvelopeSimple, PhoneCall } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-border-divider pb-4">
        <h1 className="font-heading text-xl md:text-2xl font-bold uppercase text-main tracking-wide flex items-center gap-2.5">
          <User size={26} className="text-primary-cyan" /> Account Profile
        </h1>
        <p className="font-body text-xs text-sub mt-1">
          Active system operator profile and assigned access privileges
        </p>
      </div>

      <div className="bg-card-panel border border-border-divider rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-border-divider">
          <div className="w-14 h-14 rounded-xl bg-primary-cyan/10 border border-primary-cyan/30 flex items-center justify-center text-primary-cyan font-mono text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <h2 className="font-body font-bold text-base text-main">
              {user?.name || "Staff Member"}
            </h2>
            <p className="font-mono text-xs text-sub mt-0.5">
              Operator ID: <span className="text-main">{user?.userId || "GRID-STAFF"}</span>
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                  isAdmin
                    ? "bg-primary-cyan/10 text-primary-cyan border-primary-cyan/30"
                    : "bg-app-bg text-sub border-border-divider"
                }`}
              >
                <ShieldCheck size={12} /> {user?.role || "Staff"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-app-bg p-4 rounded-lg border border-border-divider space-y-1">
            <span className="font-mono text-[10px] text-muted uppercase font-bold flex items-center gap-1.5">
              <EnvelopeSimple size={14} className="text-primary-cyan" /> Email Address
            </span>
            <span className="font-body text-xs font-semibold text-main block truncate">
              {user?.email || "staff@thegrid.lounge"}
            </span>
          </div>

          <div className="bg-app-bg p-4 rounded-lg border border-border-divider space-y-1">
            <span className="font-mono text-[10px] text-muted uppercase font-bold flex items-center gap-1.5">
              <PhoneCall size={14} className="text-primary-cyan" /> Contact Phone
            </span>
            <span className="font-mono text-xs font-semibold text-main block">
              {user?.phone || "+91 98765 43210"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { User, ShieldCheck, EnvelopeSimple, PhoneCall } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-mono">
      <div className="border-b border-[#232732] pb-4">
        <h1 className="text-xl md:text-2xl font-bold uppercase text-white tracking-wider flex items-center gap-2.5">
          <User size={26} className="text-[#00F5D4]" /> Account Profile
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Active system operator profile and assigned access privileges
        </p>
      </div>

      <div className="bg-[#161920] border border-[#232732] rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#232732]">
          <div className="w-14 h-14 rounded-xl bg-[#00F5D4]/10 border border-[#00F5D4]/40 flex items-center justify-center text-[#00F5D4] text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              {user?.name || "Staff Member"}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Operator ID: <span className="text-zinc-300 font-mono">{user?.userId || "GRID-STAFF"}</span>
            </p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md tracking-wider border ${
                  isAdmin
                    ? "bg-[#00F5D4]/10 text-[#00F5D4] border-[#00F5D4]/30"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                }`}
              >
                <ShieldCheck size={12} /> {user?.role || "Staff"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#0D0E12] p-4 rounded-lg border border-[#232732] space-y-1.5">
            <span className="text-zinc-500 uppercase text-[10px] font-bold flex items-center gap-1.5">
              <EnvelopeSimple size={14} className="text-[#00F5D4]" /> Email Address
            </span>
            <span className="text-white font-bold block truncate">
              {user?.email || "staff@thegrid.lounge"}
            </span>
          </div>

          <div className="bg-[#0D0E12] p-4 rounded-lg border border-[#232732] space-y-1.5">
            <span className="text-zinc-500 uppercase text-[10px] font-bold flex items-center gap-1.5">
              <PhoneCall size={14} className="text-[#00F5D4]" /> Contact Phone
            </span>
            <span className="text-white font-bold block">
              {user?.phone || "+91 98765 43210"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
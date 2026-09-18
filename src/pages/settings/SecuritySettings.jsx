import React from "react";
import { ShieldCheck, UserCheck, Key } from "@phosphor-icons/react";

export default function SecuritySettings() {
  const roles = [
    {
      role: "Admin",
      badgeClass: "bg-[#00F5D4]/10 text-[#00F5D4] border-[#00F5D4]/30",
      description: "Full system authority: Session timer control, rate matrix edits, RBAC management, and activity logs.",
      permissions: ["Manage Rates", "Session Timers", "Activity Logs", "User Roles"],
    },
    {
      role: "Operator",
      badgeClass: "bg-amber-400/10 text-amber-400 border-amber-400/30",
      description: "Standard operator authority: Start/stop console timers, view rate tables, and review active lounge sessions.",
      permissions: ["Session Timers", "View Calculator"],
    },
  ];

  return (
    <div className="space-y-6 font-mono">
      <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#232732] pb-3">
          <ShieldCheck size={20} className="text-[#00F5D4]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Role Access & Permissions Matrix
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {roles.map((item) => (
            <div
              key={item.role}
              className="bg-[#0D0E12] border border-[#232732] rounded-lg p-4 space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-[#00F5D4]" />
                  <span className="text-sm font-bold uppercase text-white tracking-wide">
                    {item.role}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${item.badgeClass}`}>
                  {item.role === "Admin" ? "Full Control" : "Limited Access"}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-body">{item.description}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                {item.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="text-[10px] uppercase font-bold px-2.5 py-1 rounded bg-[#161920] border border-[#232732] text-zinc-300 flex items-center gap-1.5"
                  >
                    <Key size={12} className="text-[#00F5D4]" />
                    <span>{perm}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}   
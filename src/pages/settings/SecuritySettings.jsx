import React from "react";
import { ShieldCheck, UserCheck, Key } from "@phosphor-icons/react";

export default function SecuritySettings() {
  const roles = [
    {
      role: "Admin",
      badgeClass: "bg-primary-cyan/10 text-primary-cyan border-primary-cyan/30",
      description: "Full system authority: Session timer control, rate matrix edits, RBAC management, and activity logs.",
      permissions: ["Manage Rates", "Session Timers", "Activity Logs", "User Roles"],
    },
    {
      role: "Operator",
      badgeClass: "bg-warning/10 text-warning border-warning/30",
      description: "Standard operator authority: Start/stop console timers, view rate tables, and review active lounge sessions.",
      permissions: ["Session Timers", "View Calculator"],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card-panel border border-border-divider rounded-xl p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-border-divider pb-3">
          <ShieldCheck size={20} className="text-primary-cyan" />
          <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-main">
            Role Access & Permissions Matrix
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {roles.map((item) => (
            <div
              key={item.role}
              className="bg-app-bg border border-border-divider rounded-lg p-4 space-y-3 hover:border-sub/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-primary-cyan" />
                  <span className="font-body font-bold text-sm text-main uppercase">
                    {item.role}
                  </span>
                </div>
                <span className={`font-mono text-[10px] font-bold uppercase px-2.5 py-1 rounded border ${item.badgeClass}`}>
                  {item.role === "Admin" ? "Full Control" : "Limited Access"}
                </span>
              </div>

              <p className="text-xs text-sub leading-relaxed font-body">{item.description}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                {item.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="font-mono text-[10px] uppercase font-bold px-2.5 py-1 rounded bg-card-panel border border-border-divider text-main flex items-center gap-1.5"
                  >
                    <Key size={12} className="text-primary-cyan" />
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
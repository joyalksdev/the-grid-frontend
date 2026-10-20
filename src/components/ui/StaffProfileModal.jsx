// src/components/ui/StaffProfileModal.jsx
import React from "react";
import { ShieldCheck, Envelope, User, CheckCircle, XCircle } from "@phosphor-icons/react";
import Sheet from "./Sheet";

export default function StaffProfileModal({ isOpen, onClose, staff }) {
  if (!staff) return null;

  const displayName = staff.name || staff.username || "Staff Member";
  const initial = (displayName.trim()?.[0] || "S").toUpperCase();
  const isAdmin = staff.role === "admin" || staff.role === "owner";

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Profile Details"
      description="System operator credentials and access information."
    >
      <div className="space-y-6 py-2">
        {/* Header Profile Card */}
        <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-border-divider bg-app-bg/60">
          <div className="relative mb-3">
            <div className="size-20 overflow-hidden rounded-full border-2 border-primary-cyan/40 bg-card-panel shadow-md grid place-item-center">
              {staff.photoUrl ? (
                <img src={staff.photoUrl} alt={displayName} className="size-full object-cover" />
              ) : (
                <span className="font-heading text-2xl font-bold text-primary-cyan">
                  {initial}
                </span>
              )}
            </div>
            <span
              className={`absolute bottom-0 right-0 grid size-5 place-items-center rounded-full border border-app-bg text-[10px] ${
                staff.isActive !== false ? "bg-emerald-500 text-white" : "bg-zinc-500 text-white"
              }`}
              title={staff.isActive !== false ? "Active Account" : "Inactive Account"}
            >
              {staff.isActive !== false ? <CheckCircle size={12} weight="fill" /> : <XCircle size={12} weight="fill" />}
            </span>
          </div>

          <h3 className="font-heading text-lg font-bold text-main">{displayName}</h3>
          <p className="font-mono text-xs text-primary-cyan">@{staff.username || "unknown"}</p>

          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                isAdmin
                  ? "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                  : "border-border-divider bg-card-panel text-sub"
              }`}
            >
              <ShieldCheck size={12} weight="fill" aria-hidden="true" />
              {staff.role || "Operator"}
            </span>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="space-y-3 rounded-2xl border border-border-divider bg-card-panel p-4 text-xs">
          <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
            <span className="flex items-center gap-2 text-sub">
              <User size={15} className="text-primary-cyan" /> Full Name
            </span>
            <span className="font-medium text-main">{displayName}</span>
          </div>

          <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
            <span className="flex items-center gap-2 text-sub">
              <Envelope size={15} className="text-primary-cyan" /> Email Address
            </span>
            <span className="font-mono text-main">{staff.email || "No email linked"}</span>
          </div>

          <div className="flex items-center justify-between pb-1">
            <span className="flex items-center gap-2 text-sub">
              <ShieldCheck size={15} className="text-primary-cyan" /> Account Status
            </span>
            <span className={`font-semibold ${staff.isActive !== false ? "text-emerald-400" : "text-rose-400"}`}>
              {staff.isActive !== false ? "Active & Authorized" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
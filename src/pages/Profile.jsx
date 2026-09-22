// src/pages/Profile.jsx
import React from "react";
import { User, ShieldCheck, EnvelopeSimple, PhoneCall, IdentificationBadge } from "@phosphor-icons/react";
import { useAuth } from "../context/AuthContext";

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
      <dt className="flex shrink-0 items-center gap-2 text-sm text-sub">
        <Icon size={16} aria-hidden="true" className="text-primary-cyan" />
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-main sm:text-right">{children}</dd>
    </div>
  );
}

export default function Profile() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-b border-border-divider pb-4">
        <h1 className="flex items-center gap-2.5 font-heading text-xl font-bold uppercase tracking-wide text-main md:text-2xl">
          <User size={26} aria-hidden="true" className="text-primary-cyan" /> Account Profile
        </h1>
        <p className="mt-1 text-xs text-sub sm:text-sm">
          Active system operator profile and assigned access privileges
        </p>
      </div>

      <section className="overflow-hidden rounded-xl border border-border-divider bg-card-panel">
        <div className="flex items-center gap-4 border-b border-border-divider p-4 sm:p-6">
          <div
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-xl border border-border-divider bg-app-bg font-mono text-2xl font-bold text-primary-cyan"
          >
            {user?.name?.[0]?.toUpperCase() || "S"}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-main">{user?.name || "Staff Member"}</h2>
            <span
              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${
                isAdmin
                  ? "border-primary-cyan/30 bg-primary-cyan/10 text-primary-cyan"
                  : "border-border-divider bg-app-bg text-sub"
              }`}
            >
              <ShieldCheck size={12} aria-hidden="true" /> {user?.role || "Staff"}
            </span>
          </div>
        </div>

        <dl className="divide-y divide-border-divider">
          <Row icon={IdentificationBadge} label="Operator ID">
            <span className="font-mono">{user?.userId || "GRID-STAFF"}</span>
          </Row>
          <Row icon={EnvelopeSimple} label="Email Address">
            {user?.email || <span className="text-sub">Not set</span>}
          </Row>
          <Row icon={PhoneCall} label="Contact Phone">
            {user?.phone ? <span className="font-mono tabular-nums">{user.phone}</span> : <span className="text-sub">Not set</span>}
          </Row>
        </dl>
      </section>
    </div>
  );
}
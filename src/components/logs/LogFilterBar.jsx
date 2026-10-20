// src/components/logs/LogFilterBar.jsx
import React, { useId, useState } from "react";
import {
  MagnifyingGlass,
  X,
  Calendar,
  Funnel,
  CaretDown,
} from "@phosphor-icons/react";
import { Segmented } from "../ui/PriceCalculator";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

const DATE_RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yest" },
  { value: "this_week", label: "Week" },
  { value: "this_month", label: "Month" },
  { value: "all", label: "All" },
];

const SCREEN_OPTIONS = [
  { value: "all", label: "All Stations" },
  { value: "Screen 1", label: "Screen 1" },
  { value: "Screen 2", label: "Screen 2" },
  { value: "Screen 3", label: "Screen 3" },
];

const COMPACT_SELECT =
  "h-9 w-full appearance-none cursor-pointer rounded-lg border border-border-divider bg-app-bg pl-2.5 pr-7 text-xs text-main transition-colors duration-150 focus:outline-none focus:border-primary-cyan";

const todayISO = () => new Date().toISOString().split("T")[0];

export default function LogFilterBar({
  isOwnerOrAdmin,
  dateRange,
  setDateRange,
  specificDate,
  setSpecificDate,
  dateMode,
  setDateMode,
  searchTerm,
  setSearchTerm,
  paymentFilter,
  setPaymentFilter,
  screenFilter,
  setScreenFilter,
  hasExtraFilters,
  onResetFilters,
}) {
  const dateInputId = useId();

  return (
    <div className="space-y-3.5 rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm">
      {/* Top Row: Date filter & Search */}
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        {/* Date Filters */}
        {isOwnerOrAdmin ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            {/* Range vs Calendar Switch for Admin */}
            <div className="flex items-center rounded-lg border border-border-divider bg-app-bg p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setDateMode("range")}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-mono font-semibold transition-colors ${
                  dateMode === "range"
                    ? "bg-card-panel text-primary-cyan shadow-sm border border-border-divider/60"
                    : "text-sub hover:text-main"
                }`}
              >
                Range
              </button>
              <button
                type="button"
                onClick={() => setDateMode("exact")}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-mono font-semibold transition-colors ${
                  dateMode === "exact"
                    ? "bg-card-panel text-primary-cyan shadow-sm border border-border-divider/60"
                    : "text-sub hover:text-main"
                }`}
              >
                Calendar
              </button>
            </div>

            {dateMode === "range" ? (
              <div className="w-full sm:w-auto overflow-x-auto">
                <Segmented
                  label="Date Range"
                  value={dateRange}
                  onChange={setDateRange}
                  options={DATE_RANGES}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-border-divider bg-app-bg px-3 py-1.5 w-full sm:w-auto">
                <label
                  htmlFor={dateInputId}
                  className="shrink-0 font-mono text-xs font-semibold text-sub"
                >
                  Date:
                </label>
                <div className="relative w-full sm:w-40">
                  <Calendar
                    size={15}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-cyan"
                  />
                  <input
                    id={dateInputId}
                    type="date"
                    value={specificDate}
                    max={todayISO()}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className={`h-8 w-full rounded-md border border-border-divider bg-card-panel pl-8 pr-2 font-mono text-xs font-bold text-main transition-colors focus:outline-none focus:border-primary-cyan ${FOCUS}`}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-border-divider bg-app-bg px-3 py-1.5 w-full lg:w-auto">
            <label
              htmlFor={dateInputId}
              className="shrink-0 font-mono text-xs font-semibold text-sub"
            >
              Date:
            </label>
            <div className="relative w-full sm:w-40">
              <Calendar
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-primary-cyan"
              />
              <input
                id={dateInputId}
                type="date"
                value={specificDate}
                max={todayISO()}
                onChange={(e) => setSpecificDate(e.target.value)}
                className={`h-8 w-full rounded-md border border-border-divider bg-card-panel pl-8 pr-2 font-mono text-xs font-bold text-main transition-colors focus:outline-none focus:border-primary-cyan ${FOCUS}`}
              />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative flex-1 lg:max-w-md">
          <MagnifyingGlass
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub"
          />
          <input
            type="search"
            placeholder="Search by player name, log ID, or station..."
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`h-10 w-full rounded-xl border border-border-divider bg-app-bg pl-10 pr-9 text-xs text-main placeholder:text-sub/60 transition-colors focus:outline-none focus:border-primary-cyan ${FOCUS}`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className={`absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-sub transition-colors hover:text-main touch-manipulation ${FOCUS}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row: Cross-Filters (Payment, Station, Reset) */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border-divider/60 pt-3 text-xs">
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sub">
          <Funnel size={13} aria-hidden="true" className="text-primary-cyan" />
          Filters
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-sub font-mono">Payment</span>
          <div className="relative w-32">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className={COMPACT_SELECT}
            >
              <option value="all">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / GPay</option>
              <option value="Split">Split</option>
            </select>
            <CaretDown
              size={12}
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-sub font-mono">Station</span>
          <div className="relative w-36">
            <select
              value={screenFilter}
              onChange={(e) => setScreenFilter(e.target.value)}
              className={COMPACT_SELECT}
            >
              {SCREEN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <CaretDown
              size={12}
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub"
            />
          </div>
        </div>

        {hasExtraFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className={`ml-auto font-mono text-xs font-semibold text-rose-400 hover:underline ${FOCUS}`}
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
// src/components/logs/LogFilterBar.jsx
import React, { useId } from "react";
import {
  MagnifyingGlass,
  X,
  Calendar,
  Funnel,
  CaretDown,
  CalendarBlank,
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
  "h-9 w-full appearance-none cursor-pointer rounded-xl border border-border-divider bg-app-bg px-3 pr-8 text-xs font-semibold text-main transition-colors duration-150 focus:outline-none focus:border-primary-cyan";

const todayISO = () => new Date().toISOString().split("T")[0];

export default function LogFilterBar({
  isOwnerOrAdmin,
  dateRange,
  setDateRange,
  specificDate,
  setSpecificDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedMonth,
  setSelectedMonth,
  availableMonths = [],
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
  const startDateId = useId();
  const endDateId = useId();
  const monthSelectId = useId();

  return (
    <div className="space-y-4 rounded-2xl border border-border-divider/80 bg-card-panel/90 p-4 shadow-lg backdrop-blur-xl sm:p-5">
      {/* ========================================================= */}
      {/* MOBILE UI (UNTOUCHED & KEPT EXACTLY AS-IS)                */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-4 md:hidden">
        {isOwnerOrAdmin ? (
          <div className="flex flex-col gap-3 w-full">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-border-divider bg-app-bg p-1 shrink-0">
              {[
                { id: "range", label: "Range" },
                { id: "custom_range", label: "Custom" },
                { id: "month", label: "Month" },
                { id: "exact", label: "Calendar" },
              ].map((mode) => (
                <button
                  key={`mob-mode-${mode.id}`}
                  type="button"
                  onClick={() => setDateMode(mode.id)}
                  className={`cursor-pointer rounded-lg py-1.5 px-1 text-center text-xs font-mono font-semibold transition-all duration-150 touch-manipulation ${
                    dateMode === mode.id
                      ? "bg-card-panel text-primary-cyan shadow-sm border border-border-divider/80 font-bold"
                      : "text-sub hover:text-main border border-transparent"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Mobile Date Controllers */}
            {dateMode === "range" ? (
              <div className="w-full overflow-x-auto pb-1">
                <Segmented
                  label="Date Range"
                  value={dateRange}
                  onChange={setDateRange}
                  options={DATE_RANGES}
                />
              </div>
            ) : dateMode === "custom_range" ? (
              <div className="flex flex-col gap-2.5 rounded-xl border border-border-divider bg-app-bg p-2.5 w-full">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={`mob-${startDateId}`} className="font-mono text-xs font-semibold text-sub shrink-0">
                    From:
                  </label>
                  <input
                    id={`mob-${startDateId}`}
                    type="date"
                    value={startDate}
                    max={endDate || todayISO()}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={`h-9 w-full rounded-lg border border-border-divider bg-card-panel px-2.5 font-mono text-xs font-bold text-main focus:outline-none focus:border-primary-cyan ${FOCUS}`}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={`mob-${endDateId}`} className="font-mono text-xs font-semibold text-sub shrink-0">
                    To:
                  </label>
                  <input
                    id={`mob-${endDateId}`}
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={todayISO()}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`h-9 w-full rounded-lg border border-border-divider bg-card-panel px-2.5 font-mono text-xs font-bold text-main focus:outline-none focus:border-primary-cyan ${FOCUS}`}
                  />
                </div>
              </div>
            ) : dateMode === "month" ? (
              <div className="flex items-center gap-2 rounded-xl border border-border-divider bg-app-bg px-3 py-2 w-full">
                <label
                  htmlFor={`mob-${monthSelectId}`}
                  className="shrink-0 font-mono text-xs font-semibold text-sub flex items-center gap-1.5"
                >
                  <CalendarBlank size={15} className="text-primary-cyan" />
                  Month:
                </label>
                <div className="relative w-full">
                  <select
                    id={`mob-${monthSelectId}`}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`${COMPACT_SELECT} pl-3 pr-8`}
                  >
                    {availableMonths.map((m) => (
                      <option key={`mob-${m.value}`} value={m.value} disabled={m.disabled}>
                        {m.label} {m.disabled ? "(No logs)" : ""}
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl border border-border-divider bg-app-bg px-3 py-2 w-full">
                <label
                  htmlFor={`mob-${dateInputId}`}
                  className="shrink-0 font-mono text-xs font-semibold text-sub flex items-center gap-1.5"
                >
                  <Calendar size={15} className="text-primary-cyan" />
                  Date:
                </label>
                <div className="relative w-full">
                  <input
                    id={`mob-${dateInputId}`}
                    type="date"
                    value={specificDate}
                    max={todayISO()}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className={`h-9 w-full rounded-lg border border-border-divider bg-card-panel px-3 font-mono text-xs font-bold text-main transition-colors focus:outline-none focus:border-primary-cyan ${FOCUS}`}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-border-divider bg-app-bg px-3 py-2 w-full">
            <label
              htmlFor={`mob-${dateInputId}`}
              className="shrink-0 font-mono text-xs font-semibold text-sub flex items-center gap-1.5"
            >
              <Calendar size={15} className="text-primary-cyan" />
              Date:
            </label>
            <div className="relative w-full">
              <input
                id={`mob-${dateInputId}`}
                type="date"
                value={specificDate}
                max={todayISO()}
                onChange={(e) => setSpecificDate(e.target.value)}
                className={`h-9 w-full rounded-lg border border-border-divider bg-card-panel px-3 font-mono text-xs font-bold text-main transition-colors focus:outline-none focus:border-primary-cyan ${FOCUS}`}
              />
            </div>
          </div>
        )}

        {/* Mobile Search Bar */}
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub"
          />
          <input
            type="search"
            placeholder="Search player name, log ID, or station..."
            autoComplete="off"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`h-11 w-full rounded-xl border border-border-divider bg-app-bg pl-10 pr-10 text-xs text-main placeholder:text-sub/60 transition-colors focus:outline-none focus:border-primary-cyan ${FOCUS}`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className={`absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-sub transition-colors hover:text-main hover:bg-card-panel touch-manipulation ${FOCUS}`}
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Mobile Bottom Row */}
        <div className="flex items-center justify-between gap-2 border-t border-border-divider/60 pt-3 text-xs">
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className={COMPACT_SELECT}
              >
                <option value="all">All Payments</option>
                <option value="Cash">Cash Only</option>
                <option value="UPI">UPI / GPay</option>
                <option value="Split">Split Payment</option>
              </select>
              <CaretDown
                size={13}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub"
              />
            </div>

            <div className="relative flex-1">
              <select
                value={screenFilter}
                onChange={(e) => setScreenFilter(e.target.value)}
                className={COMPACT_SELECT}
              >
                {SCREEN_OPTIONS.map((opt) => (
                  <option key={`mob-opt-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <CaretDown
                size={13}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub"
              />
            </div>
          </div>

          {hasExtraFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className={`font-mono text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors shrink-0 underline underline-offset-4 ${FOCUS}`}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP UI (NEWLY UPGRADED FOR LARGE SCREENS)             */}
      {/* ========================================================= */}
      <div className="hidden md:flex md:flex-col md:gap-4">
        {/* Desktop Top Row: Mode Switcher + Inline Controls + Global Search */}
        <div className="flex items-center justify-between gap-4">
          {/* Left Side: Mode Pill Bar & Controllers */}
          {isOwnerOrAdmin ? (
            <div className="flex items-center gap-3">
              {/* Segmented Mode Switcher */}
              <div className="flex items-center rounded-xl border border-border-divider bg-app-bg p-1">
                {[
                  { id: "range", label: "Range" },
                  { id: "custom_range", label: "Custom" },
                  { id: "month", label: "Month" },
                  { id: "exact", label: "Calendar" },
                ].map((mode) => (
                  <button
                    key={`desk-mode-${mode.id}`}
                    type="button"
                    onClick={() => setDateMode(mode.id)}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-mono font-bold transition-all duration-150 ${
                      dateMode === mode.id
                        ? "bg-card-panel text-primary-cyan shadow border border-border-divider/80"
                        : "text-sub hover:text-main border border-transparent"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Desktop Controllers */}
              {dateMode === "range" ? (
                <Segmented
                  label="Date Range"
                  value={dateRange}
                  onChange={setDateRange}
                  options={DATE_RANGES}
                />
              ) : dateMode === "custom_range" ? (
                <div className="flex items-center gap-2 rounded-xl border border-border-divider bg-app-bg px-3 py-1.5 shadow-inner">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-sub">From</span>
                    <input
                      id={startDateId}
                      type="date"
                      value={startDate}
                      max={endDate || todayISO()}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`h-8 w-36 rounded-lg border border-border-divider bg-card-panel px-2.5 font-mono text-xs font-bold text-main focus:outline-none focus:border-primary-cyan ${FOCUS}`}
                    />
                  </div>
                  <span className="text-sub font-mono font-bold">→</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-sub">To</span>
                    <input
                      id={endDateId}
                      type="date"
                      value={endDate}
                      min={startDate}
                      max={todayISO()}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`h-8 w-36 rounded-lg border border-border-divider bg-card-panel px-2.5 font-mono text-xs font-bold text-main focus:outline-none focus:border-primary-cyan ${FOCUS}`}
                    />
                  </div>
                </div>
              ) : dateMode === "month" ? (
                <div className="flex items-center gap-2 rounded-xl border border-border-divider bg-app-bg px-3 py-1.5 shadow-inner">
                  <CalendarBlank size={16} className="text-primary-cyan" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-sub">Month:</span>
                  <div className="relative w-48">
                    <select
                      id={monthSelectId}
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className={`${COMPACT_SELECT} h-8 pl-2.5 pr-8`}
                    >
                      {availableMonths.map((m) => (
                        <option key={`desk-${m.value}`} value={m.value} disabled={m.disabled}>
                          {m.label} {m.disabled ? "(No logs)" : ""}
                        </option>
                      ))}
                    </select>
                    <CaretDown
                      size={13}
                      aria-hidden="true"
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sub"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-border-divider bg-app-bg px-3 py-1.5 shadow-inner">
                  <Calendar size={16} className="text-primary-cyan" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-sub">Date:</span>
                  <input
                    id={dateInputId}
                    type="date"
                    value={specificDate}
                    max={todayISO()}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className={`h-8 w-40 rounded-lg border border-border-divider bg-card-panel px-2.5 font-mono text-xs font-bold text-main focus:outline-none focus:border-primary-cyan ${FOCUS}`}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-border-divider bg-app-bg px-3 py-1.5 shadow-inner">
              <Calendar size={16} className="text-primary-cyan" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-sub">Date:</span>
              <input
                id={dateInputId}
                type="date"
                value={specificDate}
                max={todayISO()}
                onChange={(e) => setSpecificDate(e.target.value)}
                className={`h-8 w-40 rounded-lg border border-border-divider bg-card-panel px-2.5 font-mono text-xs font-bold text-main focus:outline-none focus:border-primary-cyan ${FOCUS}`}
              />
            </div>
          )}

          {/* Desktop Search Bar */}
          <div className="relative w-72 lg:w-96">
            <MagnifyingGlass
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sub"
            />
            <input
              type="search"
              placeholder="Search player, log ID, station..."
              autoComplete="off"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`h-10 w-full rounded-xl border border-border-divider bg-app-bg pl-10 pr-9 text-xs font-medium text-main placeholder:text-sub/60 transition-colors focus:outline-none focus:border-primary-cyan ${FOCUS}`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className={`absolute right-2.5 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-sub transition-colors hover:text-main hover:bg-card-panel ${FOCUS}`}
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Bottom Row: Integrated Secondary Filters & Reset Action */}
        <div className="flex items-center justify-between border-t border-border-divider/60 pt-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-sub">
              <Funnel size={14} aria-hidden="true" className="text-primary-cyan" />
              Quick Filters
            </span>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-sub">Payment:</span>
              <div className="relative w-36">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className={COMPACT_SELECT}
                >
                  <option value="all">All Payments</option>
                  <option value="Cash">Cash Only</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="Split">Split Payment</option>
                </select>
                <CaretDown
                  size={13}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-sub">Station:</span>
              <div className="relative w-40">
                <select
                  value={screenFilter}
                  onChange={(e) => setScreenFilter(e.target.value)}
                  className={COMPACT_SELECT}
                >
                  {SCREEN_OPTIONS.map((opt) => (
                    <option key={`desk-opt-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <CaretDown
                  size={13}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub"
                />
              </div>
            </div>
          </div>

          {hasExtraFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className={`font-mono text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors underline underline-offset-4 cursor-pointer ${FOCUS}`}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
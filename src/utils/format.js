// src/utils/format.js
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** 150 -> "₹150" (always 0 decimals, per-locale grouping) */
export const formatINR = (amount) => inr.format(Number(amount) || 0);
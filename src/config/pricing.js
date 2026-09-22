// src/config/pricing.js
export const PRICING_MATRIX = {
  Single: {
    sessions: { 15: 50, 30: 90, 60: 160 },
    extensions: { 15: 50, 30: 80, 60: 130 }
  },
  Dual: {
    sessions: { 15: 80, 30: 140, 60: 250 },
    extensions: { 15: 80, 30: 120, 60: 190 }
  },
  Triple: {
    sessions: { 15: 100, 30: 180, 60: 310 },
    extensions: { 15: 100, 30: 160, 60: 270 }
  },
  Big: {
    sessions: { 15: 120, 30: 220, 60: 380 },
    extensions: { 15: 120, 30: 200, 60: 340 }
  },
  SimDrive: {
    sessions: { 15: 90, 30: 170, 60: 290 },
    extensions: { 15: 80, 30: 150, 60: 260 }
  }
};

export const calculateSessionCost = (mode, duration, isExtension = false) => {
  const category = isExtension ? 'extensions' : 'sessions';
  const modePricing = PRICING_MATRIX[mode];

  if (!modePricing || !modePricing[category] || !modePricing[category][duration]) {
    return 0;
  }

  return modePricing[category][duration];
};

/* ------------------------------------------------------------------ */
/*  Custom price calculator                                            */
/*  Works by combining the fixed tiers above (e.g. 45 min = 30 + 15),  */
/*  so custom prices always follow the rates in PRICING_MATRIX.        */
/* ------------------------------------------------------------------ */

export const MAX_CUSTOM_MINUTES = 720; // 12 hours
export const MAX_CUSTOM_BUDGET = 5000; // ₹

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

/** Sorted [{ minutes, price }] for a mode. Empty array if the mode is unknown. */
export const getTiers = (mode, isExtension = false) => {
  const table = PRICING_MATRIX[mode]?.[isExtension ? 'extensions' : 'sessions'] || {};
  return Object.entries(table)
    .map(([minutes, price]) => ({ minutes: Number(minutes), price: Number(price) }))
    .filter((t) => t.minutes > 0 && t.price > 0)
    .sort((a, b) => a.minutes - b.minutes);
};

const toBreakdown = (counts, tiers) =>
  [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([minutes, count]) => ({
      minutes,
      count,
      price: tiers.find((t) => t.minutes === minutes).price
    }));

/**
 * TIME -> COST
 * Cheapest combination of tiers that covers at least `minutes`.
 * 40 min (Single) -> 45 min billed (30 + 15) = ₹140, cheaper than the 1 hr tier.
 *
 * Returns { requested, minutes (billed), cost, breakdown } or null if invalid.
 */
export const calculateCustomCost = (mode, minutes, isExtension = false) => {
  const tiers = getTiers(mode, isExtension);
  const target = Math.floor(Number(minutes));
  if (!tiers.length || !(target > 0) || target > MAX_CUSTOM_MINUTES) return null;

  const unit = tiers.reduce((g, t) => gcd(g, t.minutes), 0);
  const slots = Math.ceil(target / unit);

  const best = [{ cost: 0, covered: 0 }];
  for (let i = 1; i <= slots; i++) {
    let pick = null;
    for (const tier of tiers) {
      const prev = Math.max(0, i - tier.minutes / unit);
      const cost = best[prev].cost + tier.price;
      const covered = best[prev].covered + tier.minutes;
      // cheaper wins; on a tie, the one that gives more time wins
      if (!pick || cost < pick.cost || (cost === pick.cost && covered > pick.covered)) {
        pick = { cost, covered, tier, prev };
      }
    }
    best[i] = pick;
  }

  const counts = new Map();
  for (let i = slots; i > 0; i = best[i].prev) {
    const m = best[i].tier.minutes;
    counts.set(m, (counts.get(m) || 0) + 1);
  }

  return {
    requested: target,
    minutes: best[slots].covered,
    cost: best[slots].cost,
    breakdown: toBreakdown(counts, tiers)
  };
};

/**
 * COST -> TIME
 * Most time a budget can buy. ₹100 (Single) -> 30 min for ₹90, ₹10 left over.
 *
 * Returns { budget, minutes, cost, leftover, breakdown } or null if invalid.
 * `minutes` is 0 when the budget is below the cheapest tier.
 */
export const calculateCustomTime = (mode, budget, isExtension = false) => {
  const tiers = getTiers(mode, isExtension);
  const money = Math.floor(Number(budget));
  if (!tiers.length || !(money > 0) || money > MAX_CUSTOM_BUDGET) return null;

  const best = [{ minutes: 0, cost: 0, from: 0, tier: null }];
  for (let b = 1; b <= money; b++) {
    let cur = { ...best[b - 1], from: b - 1, tier: null };
    for (const tier of tiers) {
      if (tier.price > b) continue;
      const base = best[b - tier.price];
      const minutes = base.minutes + tier.minutes;
      const cost = base.cost + tier.price;
      // more time wins; on a tie, the cheaper one wins
      if (minutes > cur.minutes || (minutes === cur.minutes && cost < cur.cost)) {
        cur = { minutes, cost, from: b - tier.price, tier };
      }
    }
    best[b] = cur;
  }

  const counts = new Map();
  for (let b = money; b > 0; b = best[b].from) {
    const t = best[b].tier;
    if (t) counts.set(t.minutes, (counts.get(t.minutes) || 0) + 1);
  }

  return {
    budget: money,
    minutes: best[money].minutes,
    cost: best[money].cost,
    leftover: money - best[money].cost,
    breakdown: toBreakdown(counts, tiers)
  };
};
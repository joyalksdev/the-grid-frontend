// src/context/PricingContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pricingService } from '../services/pricingService';
import { useSocket } from './SocketContext';
import { notify } from '../utils/toastController';

const PricingContext = createContext(null);

const DEFAULT_MATRIX = {
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

export const MAX_CUSTOM_MINUTES = 720;
export const MAX_CUSTOM_BUDGET = 5000;

export const PricingProvider = ({ children }) => {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket() || {};

  const fetchPricing = useCallback(async () => {
    try {
      const data = await pricingService.getPricing();
      if (data?.matrix) setMatrix(data.matrix);
      if (data?.offers) setOffers(data.offers);
    } catch (error) {
      console.error('Failed to load pricing config, using defaults', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  useEffect(() => {
    if (!socket) return;
    const handlePricingUpdated = (data) => {
      if (data?.matrix) setMatrix(data.matrix);
      if (data?.offers) setOffers(data.offers);
      notify.success('Pricing rates updated live');
    };

    socket.on('pricing_updated', handlePricingUpdated);
    return () => socket.off('pricing_updated', handlePricingUpdated);
  }, [socket]);

  const isOfferActive = useCallback((offer, mode) => {
    if (!offer.isActive) return false;
    if (offer.applicableModes && offer.applicableModes.length > 0) {
      if (!offer.applicableModes.includes(mode)) return false;
    }

    const now = new Date();
    if (offer.startDate && new Date(offer.startDate) > now) return false;
    if (offer.endDate && new Date(offer.endDate) < now) return false;

    if (offer.daysOfWeek && offer.daysOfWeek.length > 0) {
      if (!offer.daysOfWeek.includes(now.getDay())) return false;
    }

    if (offer.startTime && offer.endTime) {
      const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (currentTimeStr < offer.startTime || currentTimeStr > offer.endTime) {
        return false;
      }
    }

    return true;
  }, []);

  const getTiers = useCallback((mode, isExtension = false) => {
    const table = matrix[mode]?.[isExtension ? 'extensions' : 'sessions'] || {};
    return Object.entries(table)
      .map(([minutes, price]) => ({
        minutes: Number(minutes),
        price: Number(price),
      }))
      .filter((t) => t.minutes > 0 && t.price > 0)
      .sort((a, b) => a.minutes - b.minutes);
  }, [matrix]);

  const calculateSessionPricing = useCallback((mode, duration, isExtension = false) => {
    const category = isExtension ? 'extensions' : 'sessions';
    const modePricing = matrix[mode];

    if (!modePricing || !modePricing[category] || !modePricing[category][duration]) {
      const tiers = getTiers(mode, isExtension);
      const exact = tiers.find(t => t.minutes === duration);
      const base = exact ? exact.price : 0;
      return { basePrice: base, finalPrice: base, discountAmount: 0, activeOffer: null, hasDiscount: false };
    }

    const basePrice = modePricing[category][duration];
    const applicableOffers = offers.filter((o) => isOfferActive(o, mode));

    let finalPrice = basePrice;
    let appliedOffer = null;

    for (const offer of applicableOffers) {
      if (offer.discountType === 'percentage') {
        const discount = Math.round((basePrice * offer.discountValue) / 100);
        finalPrice = Math.max(0, finalPrice - discount);
        appliedOffer = offer;
      } else if (offer.discountType === 'flat') {
        finalPrice = Math.max(0, finalPrice - offer.discountValue);
        appliedOffer = offer;
      }
    }

    const discountAmount = Math.max(0, basePrice - finalPrice);

    return {
      basePrice,
      finalPrice,
      discountAmount,
      activeOffer: appliedOffer,
      hasDiscount: discountAmount > 0,
    };
  }, [matrix, offers, isOfferActive, getTiers]);

  const calculateSessionCost = useCallback((mode, duration, isExtension = false) => {
    return calculateSessionPricing(mode, duration, isExtension).finalPrice;
  }, [calculateSessionPricing]);

  const calculateCustomCost = useCallback((mode, requestedMinutes, isExtension = false) => {
    const tiers = getTiers(mode, isExtension);
    if (!tiers.length || requestedMinutes <= 0) {
      return { minutes: 0, cost: 0, baseCost: 0, breakdown: [], requested: requestedMinutes, hasDiscount: false };
    }

    let rem = requestedMinutes;
    const breakdownMap = {};
    let totalCost = 0;

    const sortedDesc = [...tiers].sort((a, b) => b.minutes - a.minutes);

    for (const tier of sortedDesc) {
      if (rem >= tier.minutes) {
        const count = Math.floor(rem / tier.minutes);
        breakdownMap[tier.minutes] = { count, minutes: tier.minutes, price: tier.price };
        totalCost += count * tier.price;
        rem %= tier.minutes;
      }
    }

    let finalMinutes = requestedMinutes - rem;
    if (rem > 0) {
      const smallestTier = tiers[0];
      if (finalMinutes === 0) {
        breakdownMap[smallestTier.minutes] = { count: 1, minutes: smallestTier.minutes, price: smallestTier.price };
        totalCost = smallestTier.price;
        finalMinutes = smallestTier.minutes;
      } else {
        const existing = breakdownMap[smallestTier.minutes] || { count: 0, minutes: smallestTier.minutes, price: smallestTier.price };
        existing.count += 1;
        breakdownMap[smallestTier.minutes] = existing;
        totalCost += smallestTier.price;
        finalMinutes += smallestTier.minutes;
      }
    }

    const breakdown = Object.values(breakdownMap);

    let finalCost = totalCost;
    let appliedOffer = null;
    const applicableOffers = offers.filter((o) => isOfferActive(o, mode));

    for (const offer of applicableOffers) {
      if (offer.discountType === 'percentage') {
        const discount = Math.round((totalCost * offer.discountValue) / 100);
        finalCost = Math.max(0, finalCost - discount);
        appliedOffer = offer;
      } else if (offer.discountType === 'flat') {
        finalCost = Math.max(0, finalCost - offer.discountValue);
        appliedOffer = offer;
      }
    }

    return {
      minutes: finalMinutes,
      cost: finalCost,
      baseCost: totalCost,
      breakdown,
      requested: requestedMinutes,
      activeOffer: appliedOffer,
      hasDiscount: totalCost > finalCost,
    };
  }, [getTiers, offers, isOfferActive]);

  const calculateCustomTime = useCallback((mode, budget, isExtension = false) => {
    const tiers = getTiers(mode, isExtension);
    if (!tiers.length || budget <= 0) return { minutes: 0, cost: 0, leftover: budget, breakdown: [] };

    let remBudget = budget;
    let totalMinutes = 0;
    const breakdownMap = {};

    const sortedDesc = [...tiers].sort((a, b) => b.price - a.price);

    for (const tier of sortedDesc) {
      if (remBudget >= tier.price) {
        const count = Math.floor(remBudget / tier.price);
        breakdownMap[tier.minutes] = { count, minutes: tier.minutes, price: tier.price };
        totalMinutes += count * tier.minutes;
        remBudget %= tier.price;
      }
    }

    return {
      minutes: totalMinutes,
      cost: budget - remBudget,
      leftover: remBudget,
      breakdown: Object.values(breakdownMap),
    };
  }, [getTiers]);

  return (
    <PricingContext.Provider
      value={{
        matrix,
        offers,
        loading,
        calculateSessionPricing,
        calculateSessionCost,
        calculateCustomCost,
        calculateCustomTime,
        getTiers,
        fetchPricing,
        MAX_CUSTOM_MINUTES,
        MAX_CUSTOM_BUDGET,
      }}
    >
      {children}
    </PricingContext.Provider>
  );
};

export const usePricing = () => {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
};
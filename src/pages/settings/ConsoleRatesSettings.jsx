import React, { useState, useEffect } from "react";
import { FloppyDisk, CurrencyInr, GameController } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { pricingService } from "../../services/pricingService";
import Loader from "../../components/ui/Loader";

export default function ConsoleRatesSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState({
    modes: { single: 100, dual: 180, big: 250, simDrive: 300 },
    addons: { extraController: 50 },
  });

  useEffect(() => {
    pricingService
      .getPricing()
      .then((data) => setPricing({ modes: data.modes, addons: data.addons }))
      .catch(() => toast.error("Failed to fetch rates configuration"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (category, key, value) => {
    setPricing((prev) => ({
      ...prev,
      [category]: { ...prev[category], [key]: Math.max(0, Number(value)) },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await pricingService.updatePricing(pricing);
      toast.success("Rates configuration updated successfully");
    } catch (err) {
      toast.error("Failed to update rates");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Loader variant="skeleton-card" />
        <Loader variant="skeleton-card" />
      </div>
    );
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSave} 
      className="space-y-5"
    >
      <div className="bg-card-panel border border-border-divider rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-border-divider pb-3">
          <CurrencyInr size={18} className="text-primary-cyan" />
          <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-main">
            Base Hourly Station Rates
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.keys(pricing.modes).map((mode) => (
            <div
              key={mode}
              className="bg-app-bg border border-border-divider rounded-lg p-3 flex items-center justify-between focus-within:border-primary-cyan/60 transition-colors"
            >
              <label className="font-mono text-xs text-sub uppercase">
                {mode} Mode
              </label>
              <div className="flex items-center gap-1.5 w-28 bg-card-panel border border-border-divider rounded-md px-2.5 py-1">
                <span className="font-mono text-muted text-xs font-bold">₹</span>
                <input
                  type="number"
                  value={pricing.modes[mode]}
                  onChange={(e) => handleChange("modes", mode, e.target.value)}
                  className="w-full bg-transparent font-mono text-main font-bold outline-none text-xs text-right"
                  min="0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card-panel border border-border-divider rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-border-divider pb-3">
          <GameController size={18} className="text-primary-cyan" />
          <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-main">
            Peripheral Add-ons
          </h2>
        </div>

        <div className="bg-app-bg border border-border-divider rounded-lg p-3 flex items-center justify-between focus-within:border-primary-cyan/60 transition-colors">
          <label className="font-mono text-xs text-sub uppercase">
            Extra Controller / Pad
          </label>
          <div className="flex items-center gap-1.5 w-28 bg-card-panel border border-border-divider rounded-md px-2.5 py-1">
            <span className="font-mono text-muted text-xs font-bold">₹</span>
            <input
              type="number"
              value={pricing.addons.extraController}
              onChange={(e) => handleChange("addons", "extraController", e.target.value)}
              className="w-full bg-transparent font-mono text-main font-bold outline-none text-xs text-right"
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-primary-cyan text-app-bg font-mono font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-primary-cyan/90 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader variant="spinner" className="py-0 h-4 w-4" /> : <FloppyDisk size={16} />}
          <span>{saving ? "Saving..." : "Save Configuration"}</span>
        </button>
      </div>
    </motion.form>
  );
}
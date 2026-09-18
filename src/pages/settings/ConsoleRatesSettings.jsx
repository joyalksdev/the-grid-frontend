import React, { useState, useEffect } from "react";
import { FloppyDisk, CurrencyInr, GameController } from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { pricingService } from "../../services/pricingService";

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
      <div className="p-6 bg-[#161920] border border-[#232732] rounded-xl text-xs font-mono text-[#00F5D4] tracking-widest uppercase animate-pulse">
        Loading system rates...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 font-mono">
      {/* Base Rates Section */}
      <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#232732] pb-3">
          <CurrencyInr size={18} className="text-[#00F5D4]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Base Hourly Station Rates
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.keys(pricing.modes).map((mode) => (
            <div
              key={mode}
              className="bg-[#0D0E12] border border-[#232732] rounded-lg p-3 flex items-center justify-between focus-within:border-[#00F5D4]/60 transition-colors"
            >
              <label className="text-xs text-zinc-300 font-medium uppercase tracking-wider">
                {mode} Mode
              </label>
              <div className="flex items-center gap-1.5 w-28 bg-[#161920] border border-[#232732] rounded-md px-2.5 py-1">
                <span className="text-zinc-500 text-xs font-bold">₹</span>
                <input
                  type="number"
                  value={pricing.modes[mode]}
                  onChange={(e) => handleChange("modes", mode, e.target.value)}
                  className="w-full bg-transparent text-white font-bold outline-none text-xs text-right"
                  min="0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Addons Section */}
      <div className="bg-[#161920] border border-[#232732] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#232732] pb-3">
          <GameController size={18} className="text-[#00F5D4]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Peripheral Add-ons
          </h2>
        </div>

        <div className="bg-[#0D0E12] border border-[#232732] rounded-lg p-3 flex items-center justify-between focus-within:border-[#00F5D4]/60 transition-colors">
          <label className="text-xs text-zinc-300 font-medium uppercase tracking-wider">
            Extra Controller / Pad
          </label>
          <div className="flex items-center gap-1.5 w-28 bg-[#161920] border border-[#232732] rounded-md px-2.5 py-1">
            <span className="text-zinc-500 text-xs font-bold">₹</span>
            <input
              type="number"
              value={pricing.addons.extraController}
              onChange={(e) => handleChange("addons", "extraController", e.target.value)}
              className="w-full bg-transparent text-white font-bold outline-none text-xs text-right"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-[#00F5D4] text-[#0D0E12] font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-[#00F5D4]/90 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <FloppyDisk size={16} />
          <span>{saving ? "Saving Changes..." : "Save Configuration"}</span>
        </button>
      </div>
    </form>
  );
}
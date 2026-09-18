// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { Gear, FloppyDisk } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';
import { pricingService } from '../../services/pricingService';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState({
    modes: { single: 100, dual: 180, big: 250, simDrive: 300 },
    addons: { extraController: 50 }
  });

  useEffect(() => {
    pricingService.getPricing()
      .then((data) => setPricing({ modes: data.modes, addons: data.addons }))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (cat, key, val) => {
    setPricing((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], [key]: Number(val) }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await pricingService.updatePricing(pricing);
      toast.success('System rates updated globally!');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 font-mono text-xs text-[#00F5D4] animate-pulse">Loading Settings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 font-mono">
      <div className="mb-8 border-b border-[#232732] pb-4">
        <h1 className="text-2xl font-bold font-rajdhani uppercase text-white tracking-wider flex items-center gap-2">
          <Gear size={28} className="text-[#00F5D4]" /> System Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Configure global base hourly rates and console parameters</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-[#161920] border border-[#232732] rounded-lg p-6">
          <h2 className="text-xs font-bold uppercase text-[#00F5D4] mb-4">Base Hourly Station Rates (₹)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(pricing.modes).map((m) => (
              <div key={m}>
                <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">{m}</label>
                <input
                  type="number"
                  value={pricing.modes[m]}
                  onChange={(e) => handleChange('modes', m, e.target.value)}
                  className="w-full bg-[#0D0E12] border border-[#232732] focus:border-[#00F5D4] text-white px-3 py-2 rounded outline-none text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#161920] border border-[#232732] rounded-lg p-6">
          <h2 className="text-xs font-bold uppercase text-[#00F5D4] mb-4">Peripheral Rates (₹)</h2>
          <div>
            <label className="text-[10px] text-zinc-400 uppercase font-bold block mb-1">Extra Controller Rate / Hr</label>
            <input
              type="number"
              value={pricing.addons.extraController}
              onChange={(e) => handleChange('addons', 'extraController', e.target.value)}
              className="w-full bg-[#0D0E12] border border-[#232732] focus:border-[#00F5D4] text-white px-3 py-2 rounded outline-none text-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#00F5D4] text-[#0D0E12] font-rajdhani font-bold uppercase tracking-wider rounded hover:bg-[#00F5D4]/80 transition disabled:opacity-50"
        >
          <FloppyDisk size={18} />
          {saving ? 'Saving Changes...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
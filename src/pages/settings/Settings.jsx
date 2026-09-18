import React, { useState, useEffect } from 'react';
import { Gear, FloppyDisk } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { pricingService } from '../../services/pricingService';
import Loader from '../../components/ui/Loader';

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

  if (loading) return <div className="max-w-4xl mx-auto p-6"><Loader variant="skeleton-form" /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto p-6 space-y-6"
    >
      <div className="border-b border-border-divider pb-4">
        <h1 className="text-2xl font-bold font-heading uppercase text-main tracking-wide flex items-center gap-2">
          <Gear size={28} className="text-primary-cyan" /> System Settings
        </h1>
        <p className="font-body text-xs text-sub mt-1">Configure global base hourly rates and console parameters</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 font-mono">
        <div className="bg-card-panel border border-border-divider rounded-xl p-6">
          <h2 className="font-heading text-xs font-bold uppercase text-primary-cyan mb-4">Base Hourly Station Rates (₹)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(pricing.modes).map((m) => (
              <div key={m}>
                <label className="text-[10px] text-muted uppercase font-bold block mb-1">{m}</label>
                <input
                  type="number"
                  value={pricing.modes[m]}
                  onChange={(e) => handleChange('modes', m, e.target.value)}
                  className="w-full bg-app-bg border border-border-divider focus:border-primary-cyan text-main px-3 py-2 rounded outline-none text-xs transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card-panel border border-border-divider rounded-xl p-6">
          <h2 className="font-heading text-xs font-bold uppercase text-primary-cyan mb-4">Peripheral Rates (₹)</h2>
          <div>
            <label className="text-[10px] text-muted uppercase font-bold block mb-1">Extra Controller Rate / Hr</label>
            <input
              type="number"
              value={pricing.addons.extraController}
              onChange={(e) => handleChange('addons', 'extraController', e.target.value)}
              className="w-full bg-app-bg border border-border-divider focus:border-primary-cyan text-main px-3 py-2 rounded outline-none text-xs transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-cyan text-app-bg font-mono font-bold uppercase tracking-wider rounded-lg hover:bg-primary-cyan/90 transition disabled:opacity-50 cursor-pointer"
        >
          <FloppyDisk size={18} />
          {saving ? 'Saving Changes...' : 'Save Configuration'}
        </button>
      </form>
    </motion.div>
  );
}
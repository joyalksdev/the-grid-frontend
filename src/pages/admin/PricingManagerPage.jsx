// src/pages/admin/PricingManagerPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Lock,
  FloppyDisk,
  Sliders,
  ArrowsCounterClockwise,
  Timer,
  Lightbulb,
  Sparkle
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import { usePricing } from "../../context/PricingContext";
import { pricingService } from "../../services/pricingService";
import { notify } from "../../utils/toastController";
import Loader from "../../components/ui/Loader";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Tooltip from "../../components/ui/Tooltip";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

export default function PricingManagerPage() {
  const { user } = useAuth();
  const { matrix, loading, fetchPricing } = usePricing();

  const canEdit = useMemo(() => {
    if (!user) return false;
    const role = (user.role || "").toLowerCase();
    const uname = (user.username || "").toLowerCase();
    const email = (user.email || "").toLowerCase();

    return (
      role === "owner" ||
      role === "admin" ||
      uname.includes("owner") ||
      uname.includes("admin") ||
      email.includes("owner")
    );
  }, [user]);

  const readOnlyTooltip = "Only owner and authorized admins can edit pricing matrix";

  const [localMatrix, setLocalMatrix] = useState(matrix);
  const [activeTab, setActiveTab] = useState("Single");
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    if (matrix) {
      setLocalMatrix(JSON.parse(JSON.stringify(matrix)));
    }
  }, [matrix]);

  const modeKeys = Object.keys(localMatrix || { Single: {} });

  const handleDurationKeyChange = (mode, category, oldDurationKey, newDurationVal) => {
    if (!canEdit) return;
    const newKey = Math.max(1, parseInt(newDurationVal, 10) || 0);
    const existingPrice = localMatrix[mode][category][oldDurationKey];

    setLocalMatrix((prev) => {
      const categoryCopy = { ...prev[mode][category] };
      delete categoryCopy[oldDurationKey];
      categoryCopy[newKey] = existingPrice;

      return {
        ...prev,
        [mode]: {
          ...prev[mode],
          [category]: categoryCopy,
        },
      };
    });
  };

  const handleRateChange = (mode, category, durationKey, val) => {
    if (!canEdit) return;
    const num = Math.max(0, parseInt(val, 10) || 0);
    setLocalMatrix((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [category]: {
          ...prev[mode]?.[category],
          [durationKey]: num,
        },
      },
    }));
  };

  const handleSaveMatrix = async () => {
    if (!canEdit) return;
    setSavingMatrix(true);
    try {
      await pricingService.updatePricing(localMatrix);
      notify.success("Base rate matrix and durations saved successfully!");
      fetchPricing();
    } catch (err) {
      notify.error(err.response?.data?.error || "Failed to update pricing rates");
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleResetDefaultsConfirm = async () => {
    if (!canEdit) return;
    setResetting(true);
    try {
      await pricingService.resetPricing();
      notify.success("Pricing matrix reset to default rates");
      fetchPricing();
    } catch (err) {
      notify.error(err.response?.data?.error || "Failed to reset pricing");
    } finally {
      setResetting(false);
      setResetModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20">
        <Loader variant="spinner" text="Loading pricing configuration from DB..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-24 font-body text-main">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 border-b border-border-divider/70 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
              Pricing & Duration Matrix
            </h1>
            {!canEdit && (
              <span
                title={readOnlyTooltip}
                className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-warning"
              >
                <Lock size={12} /> Read-Only Mode
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-sub md:text-sm">
            Configure session block durations (time) and pricing rates with live lounge synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className={`flex h-11 items-center gap-2 rounded-xl border border-border-divider bg-card-panel px-4 font-mono text-xs font-bold text-sub transition-colors hover:border-sub hover:text-main cursor-pointer ${FOCUS}`}
              >
                <ArrowsCounterClockwise size={16} />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleSaveMatrix}
                disabled={savingMatrix}
                className={`flex h-11 items-center gap-2 rounded-xl bg-primary-cyan px-5 font-mono text-xs font-bold uppercase tracking-wider text-app-bg shadow-lg transition-all hover:bg-primary-cyan/90 cursor-pointer ${FOCUS}`}
              >
                <FloppyDisk size={16} weight="bold" />
                {savingMatrix ? "Saving..." : "Save Rate Matrix"}
              </button>
            </>
          ) : (
            <Tooltip content={readOnlyTooltip}>
              <button
                type="button"
                disabled
                className="flex h-11 items-center gap-2 rounded-xl border border-border-divider bg-card-panel/50 px-5 font-mono text-xs font-bold text-sub/50 cursor-not-allowed"
              >
                <Lock size={14} /> Save Rate Matrix
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Guide Info Card */}
      <section className="relative overflow-hidden rounded-2xl border border-primary-cyan/20 bg-card-panel/70 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-2.5 border-b border-border-divider/60 pb-3 text-primary-cyan">
          <Lightbulb size={20} weight="fill" />
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-main">
            Real-Time Matrix Control
          </h3>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-sub">
          Edit minute durations and price tiers below. Changes propagate instantly via WebSockets to all connected client terminals and staff check-in dashboards upon saving.
        </p>
      </section>

      {/* Mode Selector Tabs */}
      <div className="flex overflow-x-auto border-b border-border-divider gap-2 pb-3 no-scrollbar">
        {modeKeys.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setActiveTab(mode)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${FOCUS} ${
              activeTab === mode
                ? "border-primary-cyan/60 bg-primary-cyan/15 text-primary-cyan shadow-sm"
                : "border-border-divider bg-card-panel text-sub hover:text-main"
            }`}
          >
            <Sliders size={15} />
            {mode} Mode
          </button>
        ))}
      </div>

      {/* Inputs Configuration Grid */}
      <div className="rounded-2xl border border-border-divider bg-card-panel p-5 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between border-b border-border-divider/60 pb-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-main">{activeTab} Mode Pricing Matrix</h2>
            <p className="text-xs text-sub">Modify duration tiers and associated pricing blocks.</p>
          </div>
          <span className="rounded-md border border-border-divider bg-app-bg px-2.5 py-1 font-mono text-[11px] font-bold text-primary-cyan">
            Active Configuration
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Standard Sessions Column */}
          <div className="space-y-4 rounded-xl border border-border-divider/70 bg-app-bg/50 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
              <h4 className="font-heading text-sm font-bold text-main flex items-center gap-2">
                <Clock size={17} className="text-primary-cyan" /> Standard Sessions
              </h4>
              <div className="flex gap-16 font-mono text-[10px] uppercase tracking-wider text-sub">
                <span>Duration</span>
                <span>Rate (₹)</span>
              </div>
            </div>

            <div className="space-y-3">
              {Object.keys(localMatrix?.[activeTab]?.sessions || {})
                .sort((a, b) => Number(a) - Number(b))
                .map((durKey) => {
                  const currentPrice = localMatrix[activeTab].sessions[durKey];
                  const rowContent = (
                    <div key={`session-${durKey}`} className="flex items-center justify-between gap-4 bg-card-panel/60 p-2.5 rounded-xl border border-border-divider/60">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          disabled={!canEdit}
                          value={durKey}
                          onChange={(e) =>
                            handleDurationKeyChange(activeTab, "sessions", durKey, e.target.value)
                          }
                          className={`h-10 w-24 rounded-lg border border-border-divider bg-app-bg px-2 font-mono text-sm font-bold text-main text-center ${
                            !canEdit ? "cursor-not-allowed opacity-60" : "focus:border-primary-cyan"
                          } ${FOCUS}`}
                        />
                        <span className="text-xs font-semibold text-sub font-mono">Mins</span>
                      </div>

                      <div className="relative flex items-center w-36">
                        <span className="absolute left-3 font-mono text-xs text-sub font-bold">₹</span>
                        <input
                          type="number"
                          min={0}
                          disabled={!canEdit}
                          value={currentPrice}
                          onChange={(e) =>
                            handleRateChange(activeTab, "sessions", durKey, e.target.value)
                          }
                          className={`h-10 w-full rounded-lg border border-border-divider bg-app-bg pl-7 pr-3 font-mono text-sm font-bold text-emerald-400 ${
                            !canEdit ? "cursor-not-allowed opacity-60" : "focus:border-primary-cyan"
                          } ${FOCUS}`}
                        />
                      </div>
                    </div>
                  );

                  return canEdit ? rowContent : <Tooltip key={`session-${durKey}`} content={readOnlyTooltip}>{rowContent}</Tooltip>;
                })}
            </div>
          </div>

          {/* Extension Rates Column */}
          <div className="space-y-4 rounded-xl border border-border-divider/70 bg-app-bg/50 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-border-divider/60 pb-3">
              <h4 className="font-heading text-sm font-bold text-main flex items-center gap-2">
                <Timer size={17} className="text-primary-cyan" /> Extension Rates
              </h4>
              <div className="flex gap-16 font-mono text-[10px] uppercase tracking-wider text-sub">
                <span>Duration</span>
                <span>Rate (₹)</span>
              </div>
            </div>

            <div className="space-y-3">
              {Object.keys(localMatrix?.[activeTab]?.extensions || {})
                .sort((a, b) => Number(a) - Number(b))
                .map((durKey) => {
                  const currentPrice = localMatrix[activeTab].extensions[durKey];
                  const rowContent = (
                    <div key={`ext-${durKey}`} className="flex items-center justify-between gap-4 bg-card-panel/60 p-2.5 rounded-xl border border-border-divider/60">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          disabled={!canEdit}
                          value={durKey}
                          onChange={(e) =>
                            handleDurationKeyChange(activeTab, "extensions", durKey, e.target.value)
                          }
                          className={`h-10 w-24 rounded-lg border border-border-divider bg-app-bg px-2 font-mono text-sm font-bold text-main text-center ${
                            !canEdit ? "cursor-not-allowed opacity-60" : "focus:border-primary-cyan"
                          } ${FOCUS}`}
                        />
                        <span className="text-xs font-semibold text-sub font-mono">Mins</span>
                      </div>

                      <div className="relative flex items-center w-36">
                        <span className="absolute left-3 font-mono text-xs text-sub font-bold">₹</span>
                        <input
                          type="number"
                          min={0}
                          disabled={!canEdit}
                          value={currentPrice}
                          onChange={(e) =>
                            handleRateChange(activeTab, "extensions", durKey, e.target.value)
                          }
                          className={`h-10 w-full rounded-lg border border-border-divider bg-app-bg pl-7 pr-3 font-mono text-sm font-bold text-emerald-400 ${
                            !canEdit ? "cursor-not-allowed opacity-60" : "focus:border-primary-cyan"
                          } ${FOCUS}`}
                        />
                      </div>
                    </div>
                  );

                  return canEdit ? rowContent : <Tooltip key={`ext-${durKey}`} content={readOnlyTooltip}>{rowContent}</Tooltip>;
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleResetDefaultsConfirm}
        title="Reset Rates to System Defaults"
        message="Are you sure you want to reset all session durations and rate matrix configurations to default standard values?"
        confirmText="Reset to Defaults"
        danger={true}
      />
    </div>
  );
}
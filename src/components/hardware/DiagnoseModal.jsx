// src/components/hardware/DiagnoseModal.jsx
import React, { useState } from "react";
import Modal from "../ui/Modal";
import { CheckCircle } from "@phosphor-icons/react";

const DIAGNOSTIC_STEPS = {
  Console: [
    "Verify HDMI cable & display source connection.",
    "Check USB-C controller charging & pairing sync.",
    "Inspect fan exhaust for dust accumulation or heat throttling.",
    "Perform hard restart / Safe Mode database rebuild if software freezes.",
  ],
  "PC Setup": [
    "Check DisplayPort / HDMI seating on GPU output.",
    "Verify GPU/CPU thermal readings under load.",
    "Inspect RAM seating and USB peripheral drivers.",
    "Run Windows System File Checker (sfc /scannow).",
  ],
  Audio: [
    "Inspect 3.5mm jack for debris or bent pin connectors.",
    "Verify left/right channel balance audio output.",
    "Test cable swap with spare KZ IEM earphone cord.",
  ],
  Default: [
    "Inspect physical housing for damage or loose components.",
    "Test power cable continuity and port voltage.",
    "Verify firmware/driver update status.",
  ],
};

export default function DiagnoseModal({ isOpen, onClose, device, onCompleteDiagnosis }) {
  const [completedSteps, setCompletedSteps] = useState([]);

  if (!device) return null;

  const steps = DIAGNOSTIC_STEPS[device.category] || DIAGNOSTIC_STEPS.Default;

  const toggleStep = (index) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Self-Diagnose Guide"
      description={`Troubleshooting checklist for ${device.assetId} (${device.name})`}
      size="lg"
    >
      <div className="space-y-4 font-body text-xs">
        {device.activeIssue && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Reported Issue:
            </span>
            <p className="text-main">{device.activeIssue.description}</p>
          </div>
        )}

        <div className="space-y-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-sub">
            Interactive Diagnostic Steps ({completedSteps.length}/{steps.length}):
          </span>

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isChecked = completedSteps.includes(idx);
              return (
                <label
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    isChecked
                      ? "border-emerald-500/40 bg-emerald-500/10 text-main"
                      : "border-border-divider bg-app-bg text-sub hover:text-main"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="sr-only"
                  />
                  <CheckCircle
                    size={18}
                    weight={isChecked ? "fill" : "regular"}
                    className={`shrink-0 mt-0.5 ${isChecked ? "text-emerald-400" : "text-sub"}`}
                  />
                  <span className="leading-relaxed">{step}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 rounded-xl border border-border-divider bg-app-bg font-mono text-xs font-bold text-main hover:bg-card-panel cursor-pointer"
          >
            Close Guide
          </button>
          <button
            type="button"
            onClick={() => {
              onCompleteDiagnosis(device._id);
              onClose();
            }}
            className="h-11 px-5 rounded-xl bg-primary-cyan text-app-bg font-mono text-xs font-bold uppercase tracking-wider hover:bg-primary-cyan/90 cursor-pointer shadow-md"
          >
            Proceed to Resolve
          </button>
        </div>
      </div>
    </Modal>
  );
}
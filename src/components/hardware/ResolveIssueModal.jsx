// src/components/hardware/ResolveIssueModal.jsx
import React, { useState } from "react";
import Modal from "../ui/Modal";

export default function ResolveIssueModal({ isOpen, onClose, device, onResolveIssue }) {
  const [resolutionType, setResolutionType] = useState("Repaired / Cleaned");
  const [resolutionNotes, setResolutionNotes] = useState("");

  if (!device) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    onResolveIssue(device._id, {
      resolutionType,
      notes: resolutionNotes,
      resolvedAt: new Date().toISOString().split("T")[0],
    });

    setResolutionNotes("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolve & Reactivate"
      description={`Marking ${device.assetId} as serviced and ready for active station rotation.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
            Service Action Taken
          </label>
          <select
            value={resolutionType}
            onChange={(e) => setResolutionType(e.target.value)}
            className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 text-main focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
          >
            <option value="Repaired / Cleaned">Repaired / Cleaned Internal Mechanism</option>
            <option value="Replaced Cable / Part">Replaced Cable or Component</option>
            <option value="Software Reset / Rebuilt">Software Rebuilt / Firmware Flashed</option>
            <option value="Tested No Defect Found">Tested & No Issue Found</option>
          </select>
        </div>

        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
            Resolution Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Disassembled trigger assembly, cleaned dust debris with isopropyl alcohol. Tested for 30 mins."
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            className="w-full rounded-xl border border-border-divider bg-app-bg p-3 text-main placeholder:text-sub/50 focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan resize-none"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 rounded-xl border border-border-divider bg-app-bg font-mono text-xs font-bold text-main hover:bg-card-panel cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-11 px-5 rounded-xl bg-emerald-500 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 cursor-pointer shadow-md"
          >
            Reactivate Hardware
          </button>
        </div>
      </form>
    </Modal>
  );
}
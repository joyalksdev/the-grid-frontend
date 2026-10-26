// src/components/hardware/ReportIssueModal.jsx
import React, { useState } from "react";
import Modal from "../ui/Modal";

export default function ReportIssueModal({ isOpen, onClose, device, onReportIssue }) {
  const [category, setCategory] = useState("Peripheral / Controller");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");

  if (!device) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    onReportIssue(device._id, {
      category,
      priority,
      description,
      reportedAt: new Date().toISOString().split("T")[0],
    });

    setDescription("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Issue"
      description={`Flagging issue for ${device.assetId} (${device.name})`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
            Issue Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 text-main focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
          >
            <option value="Peripheral / Controller">Peripheral / Controller</option>
            <option value="Display / Visual">Display / Visual</option>
            <option value="Power / Connectivity">Power / Connectivity</option>
            <option value="Audio / IEM">Audio / IEM</option>
            <option value="System / Software">System / Software</option>
          </select>
        </div>

        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
            Priority Level
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 text-main focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
          >
            <option value="low">Low - Minor cosmetic/usable</option>
            <option value="medium">Medium - Functional glitch</option>
            <option value="high">High - Unusable / Replacement needed</option>
          </select>
        </div>

        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
            Issue Description *
          </label>
          <textarea
            required
            rows={3}
            placeholder="e.g. Left bumper button sticking during gameplay, player reported unresponsiveness."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            className="h-11 px-5 rounded-xl bg-amber-500 text-zinc-950 font-mono text-xs font-bold uppercase tracking-wider hover:bg-amber-400 cursor-pointer shadow-md"
          >
            Flag For Maintenance
          </button>
        </div>
      </form>
    </Modal>
  );
}
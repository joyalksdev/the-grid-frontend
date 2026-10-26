// src/components/hardware/RegisterHardwareModal.jsx
import React, { useState } from "react";
import Modal from "../ui/Modal";

export default function RegisterHardwareModal({ isOpen, onClose, onRegister }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Console",
    station: "Screen 1 (PS5 Arena)",
    serialNumber: "",
    image: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.serialNumber) return;

    onRegister({
      ...formData,
      image:
        formData.image ||
        "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80",
    });

    setFormData({
      name: "",
      category: "Console",
      station: "Screen 1 (PS5 Arena)",
      serialNumber: "",
      image: "",
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Hardware"
      description="Add a new device or asset to lounge inventory."
    >
      <form id="register-hardware-form" onSubmit={handleSubmit} className="space-y-4 font-body text-xs">
        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
            Device Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. PlayStation 5 Console #5"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 text-main placeholder:text-sub/50 focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 text-main focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
            >
              <option value="Console">Console</option>
              <option value="PC Setup">PC Setup</option>
              <option value="Audio">Audio / IEM</option>
              <option value="Display">Display</option>
              <option value="Peripheral">Peripheral / Controller</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
              Station Assignment
            </label>
            <input
              type="text"
              placeholder="e.g. Screen 3"
              value={formData.station}
              onChange={(e) => setFormData({ ...formData, station: e.target.value })}
              className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 text-main placeholder:text-sub/50 focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
            Serial Number *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. PS5-8839-2049-X"
            value={formData.serialNumber}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 font-mono text-main placeholder:text-sub/50 focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
          />
        </div>

        <div>
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
            Image URL (Optional)
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 text-main placeholder:text-sub/50 focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
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
            className="h-11 px-5 rounded-xl bg-main text-app-bg font-mono text-xs font-bold uppercase tracking-wider hover:bg-main/90 cursor-pointer shadow-md"
          >
            Save Hardware
          </button>
        </div>
      </form>
    </Modal>
  );
}
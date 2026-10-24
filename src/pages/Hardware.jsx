// src/pages/Hardware.jsx
import React, { useState } from "react";
import {
  Cpu,
  Monitor,
  Printer,
  Plus,
  MagnifyingGlass,
  SlidersHorizontal,
  QrCode,
  Barcode,
  DotsThreeVertical,
  Wrench,
  CheckCircle,
  WarningCircle,
  DesktopTower,
  Headset,
  GameController
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

// Mock Data to design and test UI flows
const INITIAL_HARDWARE = [
  {
    _id: "hw_01",
    assetId: "HW-PS5-01",
    name: "PlayStation 5 Console #1",
    category: "Console",
    station: "Screen 1 (PS5 Arena)",
    serialNumber: "PS5-8839-2049-X",
    status: "active",
    image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80",
    lastMaintenance: "2026-03-10",
  },
  {
    _id: "hw_02",
    assetId: "HW-PC-04",
    name: "Custom RTX 4080 Rig #4",
    category: "PC Setup",
    station: "Screen 4 (Esports PC)",
    serialNumber: "RIG-4080-9921",
    status: "active",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80",
    lastMaintenance: "2026-02-15",
  },
  {
    _id: "hw_03",
    assetId: "HW-IEM-02",
    name: "KZ Castor Pro In-Ear Monitor",
    category: "Audio",
    station: "Screen 2 (PS5 Arena)",
    serialNumber: "KZ-CSTR-5512",
    status: "active",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80",
    lastMaintenance: "2026-04-01",
  },
  {
    _id: "hw_04",
    assetId: "HW-MON-09",
    name: "ASUS 27\" 240Hz Gaming Monitor",
    category: "Display",
    station: "Storage / Spare",
    serialNumber: "ASUS-240-7719",
    status: "maintenance",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80",
    lastMaintenance: "2026-01-20",
  },
];

export default function Hardware() {
  const [activeTab, setActiveTab] = useState("devices"); // "devices" | "studio"
  const [hardwareList, setHardwareList] = useState(INITIAL_HARDWARE);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedForPrint, setSelectedForPrint] = useState([]);

  // Filter logic
  const filteredHardware = hardwareList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || item.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Metrics calculation
  const totalCount = hardwareList.length;
  const activeCount = hardwareList.filter((i) => i.status === "active").length;
  const maintenanceCount = hardwareList.filter((i) => i.status === "maintenance").length;

  const toggleSelectForPrint = (id) => {
    setSelectedForPrint((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedForPrint.length === filteredHardware.length) {
      setSelectedForPrint([]);
    } else {
      setSelectedForPrint(filteredHardware.map((i) => i._id));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 font-body text-main">
      {/* Top Header & Summary Stats */}
      <div className="space-y-5 border-b border-border-divider/70 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
              Hardware & Asset Tags
            </h1>
            <p className="mt-1 text-xs text-sub sm:text-sm">
              Track lounge equipment, monitor station assignments, and generate physical barcode labels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => toast.success("Open Register Hardware Modal")}
            className={`flex items-center gap-2 rounded-xl bg-primary-cyan px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-app-bg shadow-lg transition-colors hover:bg-primary-cyan/90 cursor-pointer touch-manipulation ${FOCUS}`}
          >
            <Plus size={16} weight="bold" aria-hidden="true" />
            Register Hardware
          </button>
        </div>

        {/* Quick Metrics Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sub">Total Assets</p>
              <h3 className="font-heading text-2xl font-bold text-main">{totalCount}</h3>
            </div>
            <div className="grid size-10 place-items-center rounded-xl border border-border-divider bg-app-bg text-primary-cyan">
              <Cpu size={20} weight="fill" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sub">Active in Stations</p>
              <h3 className="font-heading text-2xl font-bold text-emerald-400">{activeCount}</h3>
            </div>
            <div className="grid size-10 place-items-center rounded-xl border border-border-divider bg-app-bg text-emerald-400">
              <CheckCircle size={20} weight="fill" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sub">In Maintenance</p>
              <h3 className="font-heading text-2xl font-bold text-amber-400">{maintenanceCount}</h3>
            </div>
            <div className="grid size-10 place-items-center rounded-xl border border-border-divider bg-app-bg text-amber-400">
              <WarningCircle size={20} weight="fill" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-border-divider pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("devices")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === "devices"
              ? "border border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan"
              : "border border-border-divider bg-card-panel text-sub hover:text-main"
          } ${FOCUS}`}
        >
          <DesktopTower size={15} weight="fill" aria-hidden="true" />
          Devices Inventory ({hardwareList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("studio")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === "studio"
              ? "border border-primary-cyan/40 bg-primary-cyan/10 text-primary-cyan"
              : "border border-border-divider bg-card-panel text-sub hover:text-main"
          } ${FOCUS}`}
        >
          <Barcode size={15} weight="fill" aria-hidden="true" />
          Sticker Studio {selectedForPrint.length > 0 && `(${selectedForPrint.length} selected)`}
        </button>
      </div>

      {/* TAB 1: DEVICES INVENTORY GRID */}
      {activeTab === "devices" && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass
                size={16}
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub"
              />
              <input
                type="text"
                placeholder="Search by name, asset ID, or serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full h-10 rounded-xl border border-border-divider bg-card-panel pl-10 pr-4 text-xs font-medium text-main placeholder:text-sub/60 ${FOCUS}`}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`h-10 rounded-xl border border-border-divider bg-card-panel px-3 text-xs font-semibold text-main cursor-pointer ${FOCUS}`}
              >
                <option value="all">All Categories</option>
                <option value="console">Consoles</option>
                <option value="pc setup">PC Setups</option>
                <option value="audio">Audio / IEMs</option>
                <option value="display">Displays</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`h-10 rounded-xl border border-border-divider bg-card-panel px-3 text-xs font-semibold text-main cursor-pointer ${FOCUS}`}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredHardware.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border-divider bg-card-panel/40 p-12 text-center">
              <div className="grid size-12 place-items-center rounded-2xl border border-border-divider bg-app-bg text-sub">
                <Cpu size={24} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-base font-bold text-main">No hardware assets found</h3>
              <p className="text-xs text-sub max-w-xs">Try adjusting your search or category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredHardware.map((item) => (
                <div
                  key={item._id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm transition-all hover:border-primary-cyan/40"
                >
                  <div className="space-y-3">
                    {/* Top Row: Asset Tag & Status */}
                    <div className="flex items-center justify-between">
                      <span className="rounded-md border border-border-divider bg-app-bg px-2 py-0.5 font-mono text-[11px] font-bold text-primary-cyan">
                        {item.assetId}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                          item.status === "active"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            item.status === "active" ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        {item.status}
                      </span>
                    </div>

                    {/* Image & Title Preview */}
                    <div className="flex items-center gap-3">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-border-divider bg-app-bg">
                        <img src={item.image} alt={item.name} className="size-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-sub">
                          {item.category}
                        </span>
                        <h4 className="font-heading text-base font-bold text-main truncate">
                          {item.name}
                        </h4>
                        <p className="mt-0.5 font-mono text-xs text-sub truncate">
                          📍 {item.station}
                        </p>
                      </div>
                    </div>

                    {/* Serial & Specs */}
                    <div className="rounded-xl border border-border-divider/60 bg-app-bg/60 p-2.5 space-y-1 font-mono text-[11px] text-sub">
                      <div className="flex justify-between">
                        <span>Serial:</span>
                        <span className="text-main font-semibold">{item.serialNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Serviced:</span>
                        <span className="text-main">{item.lastMaintenance}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-border-divider/60 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-sub hover:text-main">
                      <input
                        type="checkbox"
                        checked={selectedForPrint.includes(item._id)}
                        onChange={() => toggleSelectForPrint(item._id)}
                        className="rounded border-border-divider bg-app-bg text-primary-cyan focus:ring-0 cursor-pointer size-4"
                      />
                      Select for Sticker
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedForPrint([item._id]);
                        setActiveTab("studio");
                      }}
                      className="flex items-center gap-1 font-mono text-xs font-semibold text-primary-cyan hover:underline cursor-pointer"
                    >
                      <Barcode size={14} aria-hidden="true" />
                      Print Tag
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STICKER STUDIO */}
      {activeTab === "studio" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border-divider bg-card-panel p-5">
            <div>
              <h3 className="font-heading text-lg font-bold text-main">Barcode & QR Sticker Generator</h3>
              <p className="text-xs text-sub mt-0.5">
                Select items from your inventory to preview and batch-print physical adhesive asset tags.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`h-9 px-3 rounded-xl border border-border-divider bg-app-bg text-xs font-semibold text-sub hover:text-main cursor-pointer ${FOCUS}`}
              >
                {selectedForPrint.length === filteredHardware.length ? "Deselect All" : "Select All Filtered"}
              </button>
              <button
                type="button"
                disabled={selectedForPrint.length === 0}
                onClick={() => toast.success(`Sending ${selectedForPrint.length} tags to thermal printer...`)}
                className={`flex items-center gap-2 h-9 px-4 rounded-xl bg-primary-cyan text-xs font-bold uppercase tracking-wider text-app-bg shadow-md cursor-pointer hover:bg-primary-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
              >
                <Printer size={15} weight="bold" aria-hidden="true" />
                Print Selected ({selectedForPrint.length})
              </button>
            </div>
          </div>

          {/* Sticker Preview Canvas */}
          {selectedForPrint.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border-divider bg-card-panel/40 p-16 text-center">
              <div className="grid size-12 place-items-center rounded-2xl border border-border-divider bg-app-bg text-sub">
                <Barcode size={24} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-base font-bold text-main">No hardware selected for printing</h3>
              <p className="text-xs text-sub max-w-xs">
                Go back to the Devices tab and check items, or click "Select All Filtered" above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedForPrint.map((id) => {
                const item = hardwareList.find((h) => h._id === id);
                if (!item) return null;

                return (
                  <div
                    key={item._id}
                    className="relative flex flex-col justify-between overflow-hidden rounded-xl border-2 border-dashed border-primary-cyan/40 bg-white p-5 text-zinc-900 shadow-md space-y-4 font-mono"
                  >
                    <div className="flex items-start justify-between border-b border-zinc-200 pb-3">
                      <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
                          THE GRID GAMING LOUNGE
                        </span>
                        <h4 className="text-base font-bold tracking-tight text-zinc-900">
                          {item.assetId}
                        </h4>
                      </div>
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-700">
                        {item.category}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-zinc-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-zinc-600 truncate">Station: {item.station}</p>
                      <p className="text-[10px] text-zinc-500">S/N: {item.serialNumber}</p>
                    </div>

                    {/* Barcode Graphic Placeholder */}
                    <div className="flex flex-col items-center justify-center pt-2 border-t border-zinc-200 space-y-1">
                      <div className="w-full h-10 bg-zinc-900 flex items-center justify-center text-white tracking-[6px] text-xs font-bold font-mono">
                        ||| | |||| || |
                      </div>
                      <span className="text-[9px] text-zinc-500 tracking-wider">PROPERTY OF THE GRID</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
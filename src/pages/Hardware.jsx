// src/pages/Hardware.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  Plus,
  MagnifyingGlass,
  Barcode,
  Wrench,
  CheckCircle,
  WarningCircle,
  DesktopTower,
  Printer,
  DotsThreeVertical,
  Trash
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";

import Dropdown from "../components/ui/Dropdown";
import Sheet from "../components/ui/Sheet";
import ConfirmModal from "../components/ui/ConfirmModal";
import Tooltip from "../components/ui/Tooltip";
import Loader from "../components/ui/Loader";

import ReportIssueModal from "../components/hardware/ReportIssueModal";
import DiagnoseModal from "../components/hardware/DiagnoseModal";
import ResolveIssueModal from "../components/hardware/ResolveIssueModal";
import { hardwareService } from "../services/hardwareService";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-cyan";

export default function Hardware() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("devices");
  const [hardwareList, setHardwareList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedForPrint, setSelectedForPrint] = useState([]);

  // Modal / Sheet States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDiagnoseOpen, setIsDiagnoseOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

  // Form state for Sheet registration
  const [newDevice, setNewDevice] = useState({
    name: "",
    category: "Console",
    station: "Screen 1 (PS5 Arena)",
    serialNumber: "",
    image: "",
  });

  // Fetch devices from backend API
  const fetchHardware = useCallback(async () => {
    try {
      setLoading(true);
      const data = await hardwareService.getDevices({
        category: categoryFilter,
        status: statusFilter,
        search: searchTerm,
      });
      setHardwareList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch hardware error:", err);
      toast.error(err.response?.data?.message || "Failed to load hardware assets");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter, searchTerm]);

  useEffect(() => {
    fetchHardware();
  }, [fetchHardware]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!newDevice.name || !newDevice.serialNumber) return;

    try {
      const created = await hardwareService.createDevice(newDevice);
      setHardwareList((prev) => [created, ...prev]);
      setIsRegisterOpen(false);
      setNewDevice({ name: "", category: "Console", station: "Screen 1 (PS5 Arena)", serialNumber: "", image: "" });
      toast.success(`Registered ${created.name} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register hardware");
    }
  };

  const handleReportIssue = async (id, issueData) => {
    try {
      const res = await hardwareService.reportIssue(id, issueData);
      setHardwareList((prev) =>
        prev.map((item) => (item._id === id ? res.hardware || { ...item, status: "maintenance", activeIssue: issueData } : item))
      );
      toast.error("Device flagged for maintenance");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to report issue");
    }
  };

  const handleResolveIssue = async (id, resolutionData) => {
    try {
      const res = await hardwareService.resolveIssue(id, resolutionData);
      setHardwareList((prev) =>
        prev.map((item) => (item._id === id ? res.hardware || { ...item, status: "active", activeIssue: null } : item))
      );
      toast.success("Hardware reactivated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve issue");
    }
  };

  const confirmDeleteDevice = async () => {
    if (!deviceToDelete) return;
    try {
      await hardwareService.deleteDevice(deviceToDelete._id);
      setHardwareList((prev) => prev.filter((h) => h._id !== deviceToDelete._id));
      toast.success(`Deleted ${deviceToDelete.name}`);
      setDeviceToDelete(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete hardware");
    }
  };

  const toggleSelectForPrint = (id) => {
    setSelectedForPrint((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedForPrint.length === hardwareList.length) {
      setSelectedForPrint([]);
    } else {
      setSelectedForPrint(hardwareList.map((i) => i._id));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-24 font-body text-main">
      {/* Header */}
      <div className="space-y-5 border-b border-border-divider/70 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-main md:text-3xl">
              Hardware & Asset Tags
            </h1>
            <p className="mt-1 text-xs text-sub sm:text-sm">
              Manage lounge equipment, track station assignments, and print physical asset tags.
            </p>
          </div>

          <Tooltip content="Add new lounge equipment">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className={`flex items-center justify-center gap-2 rounded-xl bg-main px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-app-bg shadow-lg transition-colors hover:bg-main/90 cursor-pointer ${FOCUS}`}
            >
              <Plus size={16} weight="bold" aria-hidden="true" />
              Register Hardware
            </button>
          </Tooltip>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sub">Total Assets</p>
              <h3 className="font-heading text-2xl font-bold text-main">{hardwareList.length}</h3>
            </div>
            <div className="grid size-10 place-items-center rounded-xl border border-border-divider bg-app-bg text-primary-cyan">
              <Cpu size={20} weight="fill" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sub">Active in Stations</p>
              <h3 className="font-heading text-2xl font-bold text-emerald-400">
                {hardwareList.filter((i) => i.status === "active").length}
              </h3>
            </div>
            <div className="grid size-10 place-items-center rounded-xl border border-border-divider bg-app-bg text-emerald-400">
              <CheckCircle size={20} weight="fill" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-sub">In Maintenance</p>
              <h3 className="font-heading text-2xl font-bold text-amber-400">
                {hardwareList.filter((i) => i.status === "maintenance").length}
              </h3>
            </div>
            <div className="grid size-10 place-items-center rounded-xl border border-border-divider bg-app-bg text-amber-400">
              <WarningCircle size={20} weight="fill" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
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
          Sticker Studio {selectedForPrint.length > 0 && `(${selectedForPrint.length})`}
        </button>
      </div>

      {/* Tab A: Devices */}
      {activeTab === "devices" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass
                size={16}
                aria-hidden="true"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub"
              />
              <input
                type="text"
                placeholder="Search name, tag ID, or serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full h-10 rounded-xl border border-border-divider bg-card-panel pl-10 pr-4 text-xs text-main placeholder:text-sub/60 ${FOCUS}`}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`h-10 rounded-xl border border-border-divider bg-card-panel px-3 text-xs text-main cursor-pointer ${FOCUS}`}
              >
                <option value="all">All Categories</option>
                <option value="console">Consoles</option>
                <option value="pc setup">PC Setups</option>
                <option value="audio">Audio / IEMs</option>
                <option value="display">Displays</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`h-10 rounded-xl border border-border-divider bg-card-panel px-3 text-xs text-main cursor-pointer ${FOCUS}`}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Cards Grid / Loader */}
          {loading ? (
            <Loader variant="skeleton-card" lines={3} />
          ) : hardwareList.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border-divider bg-card-panel/40 p-16 text-center">
              <div className="grid size-12 place-items-center rounded-2xl border border-border-divider bg-app-bg text-sub">
                <Cpu size={24} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-base font-bold text-main">No hardware assets found</h3>
              <p className="text-xs text-sub max-w-xs">Try adjusting your search or category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hardwareList.map((item) => (
                <div
                  key={item._id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-divider bg-card-panel p-4 shadow-sm transition-all hover:border-primary-cyan/40"
                >
                  <div className="space-y-3">
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

                    <div className="flex items-center gap-3">
                      <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-border-divider bg-app-bg">
                        <img src={item.image} alt={item.name} className="size-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
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

                      <Dropdown
                        trigger={
                          <button
                            type="button"
                            className="grid size-8 place-items-center rounded-lg text-sub hover:bg-app-bg hover:text-main"
                          >
                            <DotsThreeVertical size={18} weight="bold" />
                          </button>
                        }
                        items={[
                          {
                            label: "Self-Diagnose",
                            icon: <Wrench size={14} />,
                            onClick: () => {
                              setSelectedDevice(item);
                              setIsDiagnoseOpen(true);
                            },
                          },
                          {
                            label: "Report Issue",
                            icon: <WarningCircle size={14} />,
                            danger: true,
                            onClick: () => {
                              setSelectedDevice(item);
                              setIsReportOpen(true);
                            },
                          },
                          { type: "divider" },
                          {
                            label: "Remove Device",
                            icon: <Trash size={14} />,
                            danger: true,
                            onClick: () => setDeviceToDelete(item),
                          },
                        ]}
                      />
                    </div>

                    {item.activeIssue && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] space-y-1">
                        <span className="font-mono font-bold uppercase text-amber-400">
                          Active Issue:
                        </span>
                        <p className="text-main leading-tight">{item.activeIssue.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border-divider/60 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-sub hover:text-main">
                      <input
                        type="checkbox"
                        checked={selectedForPrint.includes(item._id)}
                        onChange={() => toggleSelectForPrint(item._id)}
                        className="rounded border-border-divider bg-app-bg text-primary-cyan focus:ring-0 cursor-pointer size-4"
                      />
                      Sticker
                    </label>

                    {item.status === "maintenance" ? (
                      <Tooltip content="Serviced & ready for station rotation">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDevice(item);
                            setIsResolveOpen(true);
                          }}
                          className="flex items-center gap-1 font-mono text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                        >
                          <CheckCircle size={14} aria-hidden="true" />
                          Resolve & Reactivate
                        </button>
                      </Tooltip>
                    ) : (
                      <Tooltip content="Flag a hardware defect or issue">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDevice(item);
                            setIsReportOpen(true);
                          }}
                          className="flex items-center gap-1 font-mono text-xs font-semibold text-amber-400 hover:underline cursor-pointer"
                        >
                          <Wrench size={14} aria-hidden="true" />
                          Report Issue
                        </button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab B: Sticker Studio */}
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
                {selectedForPrint.length === hardwareList.length ? "Deselect All" : "Select All"}
              </button>
              <button
                type="button"
                disabled={selectedForPrint.length === 0}
                onClick={() => toast.success(`Printing ${selectedForPrint.length} thermal tags...`)}
                className={`flex items-center gap-2 h-9 px-4 rounded-xl bg-main text-xs font-bold uppercase tracking-wider text-app-bg shadow-md cursor-pointer hover:bg-main/90 disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS}`}
              >
                <Printer size={15} weight="bold" aria-hidden="true" />
                Print Selected ({selectedForPrint.length})
              </button>
            </div>
          </div>

          {selectedForPrint.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-border-divider bg-card-panel/40 p-16 text-center">
              <div className="grid size-12 place-items-center rounded-2xl border border-border-divider bg-app-bg text-sub">
                <Barcode size={24} aria-hidden="true" />
              </div>
              <h3 className="font-heading text-base font-bold text-main">No hardware selected for printing</h3>
              <p className="text-xs text-sub max-w-xs">
                Select checkboxes in the Devices tab or click "Select All" above.
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

      {/* Sheet Component for Registering Hardware */}
      <Sheet
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Hardware"
        description="Add a new device or asset to lounge inventory."
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="h-11 px-4 rounded-xl border border-border-divider bg-app-bg font-mono text-xs font-bold text-main hover:bg-card-panel cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="register-hardware-form"
              className="h-11 px-5 rounded-xl bg-main text-app-bg font-mono text-xs font-bold uppercase tracking-wider hover:bg-main/90 cursor-pointer shadow-md"
            >
              Save Hardware
            </button>
          </div>
        }
      >
        <form id="register-hardware-form" onSubmit={handleRegisterSubmit} className="space-y-4 font-body text-xs">
          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
              Device Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PlayStation 5 Console #5"
              value={newDevice.name}
              onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
              className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 text-main placeholder:text-sub/50 focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-sub mb-1">
                Category
              </label>
              <select
                value={newDevice.category}
                onChange={(e) => setNewDevice({ ...newDevice, category: e.target.value })}
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
                value={newDevice.station}
                onChange={(e) => setNewDevice({ ...newDevice, station: e.target.value })}
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
              value={newDevice.serialNumber}
              onChange={(e) => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
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
              value={newDevice.image}
              onChange={(e) => setNewDevice({ ...newDevice, image: e.target.value })}
              className="w-full h-11 rounded-xl border border-border-divider bg-app-bg px-3.5 text-main placeholder:text-sub/50 focus:border-primary-cyan focus:outline-none focus:ring-1 focus:ring-primary-cyan"
            />
          </div>
        </form>
      </Sheet>

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={!!deviceToDelete}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={confirmDeleteDevice}
        title="Delete Hardware Asset"
        message={`Are you sure you want to permanently remove ${deviceToDelete?.name} (${deviceToDelete?.assetId})? This action cannot be undone.`}
        confirmText="Delete Asset"
        cancelText="Cancel"
        danger={true}
      />

      {/* Issue & Diagnose Modals */}
      <ReportIssueModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        device={selectedDevice}
        onReportIssue={handleReportIssue}
      />

      <DiagnoseModal
        isOpen={isDiagnoseOpen}
        onClose={() => setIsDiagnoseOpen(false)}
        device={selectedDevice}
        onCompleteDiagnosis={(id) => {
          const device = hardwareList.find((h) => h._id === id);
          if (device) {
            setSelectedDevice(device);
            setIsResolveOpen(true);
          }
        }}
      />

      <ResolveIssueModal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        device={selectedDevice}
        onResolveIssue={handleResolveIssue}
      />
    </div>
  );
}
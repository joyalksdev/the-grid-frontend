// src/components/games/GameFormSheet.jsx
import React from "react";
import { Check, Cpu, Star, Eye } from "@phosphor-icons/react";
import Sheet, { INPUT_CLASS, PRIMARY_BTN } from "../ui/Sheet";
import ImageDropzone from "../ui/ImageDropzone";
import { notify } from "../../utils/toastController";
import { GAME_MODES, GAME_PLATFORMS, GAME_IMAGE_RULES } from "../../constants/games";

const SECTION_TITLE = "text-[11px] font-bold uppercase tracking-wider text-sub";

function ToggleChip({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
        active
          ? "border-primary-cyan bg-primary-cyan/10 text-primary-cyan"
          : "border-border-divider bg-card-panel text-sub hover:text-main"
      } ${className}`}
    >
      {children}
      {active && <Check size={13} weight="bold" className="shrink-0 text-primary-cyan" />}
    </button>
  );
}

function SwitchRow({ icon: Icon, label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border-divider bg-app-bg px-3.5 py-2.5 text-left cursor-pointer"
    >
      <div className="flex items-center gap-2.5">
        <Icon size={16} className={checked ? "text-primary-cyan" : "text-sub"} />
        <div>
          <p className="text-xs font-semibold text-main">{label}</p>
          <p className="text-[10px] text-sub">{description}</p>
        </div>
      </div>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary-cyan" : "bg-border-divider"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export default function GameFormSheet({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  submitting,
  form,
  setForm,
  screens,
  hardwareList,
}) {
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const toggleInArray = (key, value) =>
    setForm((prev) => {
      const list = prev[key] || [];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const toggleMode = (modeKey) =>
    setForm((prev) => {
      const has = prev.supportedModes.includes(modeKey);
      if (has && prev.supportedModes.length === 1) return prev; // keep at least one
      const supportedModes = has
        ? prev.supportedModes.filter((m) => m !== modeKey)
        : [...prev.supportedModes, modeKey];
      const recommendedMode = supportedModes.includes(prev.recommendedMode)
        ? prev.recommendedMode
        : supportedModes[0];
      return { ...prev, supportedModes, recommendedMode };
    });

  const setPlayers = (key, value) =>
    setForm((prev) => {
      const next = { ...prev, [key]: Number(value) };
      if (next.minPlayers > next.maxPlayers) {
        if (key === "minPlayers") next.maxPlayers = next.minPlayers;
        else next.minPlayers = next.maxPlayers;
      }
      return next;
    });

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Game" : "Add New Game"}
      description="Upload artwork, set play modes, and link stations."
      footer={
        <button type="submit" form="game-form" disabled={submitting} className={PRIMARY_BTN}>
          {submitting ? "Uploading & Saving..." : isEditing ? "Save Changes" : "Create Game"}
        </button>
      }
    >
      <form id="game-form" onSubmit={onSubmit} className="space-y-6">
        {/* ── Artwork ── */}
        <section className="space-y-3">
          <p className={SECTION_TITLE}>Artwork</p>
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3">
              <ImageDropzone
                label="Thumbnail"
                hint="16:9 landscape"
                aspect="16 / 9"
                required={!isEditing}
                file={form.thumbnailFile}
                existingUrl={form.thumbnailPreview}
                onChange={(file) => update({ thumbnailFile: file })}
                onError={notify.error}
                maxSizeMB={GAME_IMAGE_RULES.maxSizeMB}
                accept={GAME_IMAGE_RULES.accept}
              />
            </div>
            <div className="col-span-2">
              <ImageDropzone
                label="Cover"
                hint="3:4 poster"
                aspect="3 / 4"
                required={!isEditing}
                file={form.coverFile}
                existingUrl={form.coverPreview}
                onChange={(file) => update({ coverFile: file })}
                onError={notify.error}
                maxSizeMB={GAME_IMAGE_RULES.maxSizeMB}
                accept={GAME_IMAGE_RULES.accept}
              />
            </div>
          </div>
        </section>

        {/* ── Details ── */}
        <section className="space-y-3">
          <p className={SECTION_TITLE}>Details</p>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-main">Game Title</label>
            <input
              type="text"
              required
              placeholder="e.g., EA Sports FC 26"
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Genre</label>
              <input
                type="text"
                required
                placeholder="e.g., Sports, Racing"
                value={form.genre}
                onChange={(e) => update({ genre: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => update({ platform: e.target.value })}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                {GAME_PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-main">Short Description</label>
              <span className="font-mono text-[10px] text-sub">{form.description.length}/500</span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="One or two lines shown on the website game card."
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>
        </section>

        {/* ── Play Modes ── */}
        <section className="space-y-3">
          <p className={SECTION_TITLE}>Play Modes</p>

          <div>
            <label className="mb-2 block text-xs font-medium text-main">Supported Modes</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GAME_MODES.map((mode) => (
                <ToggleChip
                  key={mode.key}
                  active={form.supportedModes.includes(mode.key)}
                  onClick={() => toggleMode(mode.key)}
                >
                  <span className="text-left">
                    <span className="block">{mode.label}</span>
                    <span className="block text-[10px] font-normal text-sub">{mode.sub}</span>
                  </span>
                </ToggleChip>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Recommended</label>
              <select
                value={form.recommendedMode}
                onChange={(e) => update({ recommendedMode: e.target.value })}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                {GAME_MODES.filter((m) => form.supportedModes.includes(m.key)).map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Min Players</label>
              <select
                value={form.minPlayers}
                onChange={(e) => setPlayers("minPlayers", e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-main">Max Players</label>
              <select
                value={form.maxPlayers}
                onChange={(e) => setPlayers("maxPlayers", e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Stations ── */}
        <section className="space-y-3">
          <p className={SECTION_TITLE}>Stations</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border-divider bg-app-bg p-3 sm:grid-cols-3">
            {screens.length === 0 ? (
              <p className="col-span-full text-[11px] italic text-sub">No screens found.</p>
            ) : (
              screens.map((screen) => (
                <ToggleChip
                  key={screen._id}
                  active={form.availableScreens.includes(screen._id)}
                  onClick={() => toggleInArray("availableScreens", screen._id)}
                  className="font-mono"
                >
                  {screen.name}
                </ToggleChip>
              ))
            )}
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-main">
              <Cpu size={14} className="text-primary-cyan" /> Hardware (Consoles / Peripherals)
            </label>
            <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-border-divider bg-app-bg p-3 sm:grid-cols-2">
              {hardwareList.length === 0 ? (
                <p className="col-span-full text-[11px] italic text-sub">No hardware assets found.</p>
              ) : (
                hardwareList.map((hw) => (
                  <ToggleChip
                    key={hw._id}
                    active={form.assignedHardware.includes(hw._id)}
                    onClick={() => toggleInArray("assignedHardware", hw._id)}
                    className="font-mono"
                  >
                    <span className="truncate text-left">
                      <span className="block truncate font-bold">{hw.name}</span>
                      <span className="block text-[10px] font-normal text-sub">
                        {hw.assetId} • {hw.station}
                      </span>
                    </span>
                  </ToggleChip>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── Visibility ── */}
        <section className="space-y-2">
          <p className={SECTION_TITLE}>Visibility</p>
          <SwitchRow
            icon={Eye}
            label="Active on Website"
            description="Hidden games stay in the catalog but aren't bookable."
            checked={form.isActive}
            onChange={(v) => update({ isActive: v })}
          />
          <SwitchRow
            icon={Star}
            label="Featured"
            description="Pinned to the top of the library and highlighted."
            checked={form.isFeatured}
            onChange={(v) => update({ isFeatured: v })}
          />
        </section>
      </form>
    </Sheet>
  );
}

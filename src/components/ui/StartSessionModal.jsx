// src/components/ui/StartSessionModal.jsx
import { useState, useEffect, useMemo } from "react";
import { calculateSessionCost } from "../../config/pricing";
import { formatINR } from "../../utils/format";
import Sheet, { OptionCard, INPUT_CLASS, PRIMARY_BTN } from "./Sheet";
import PriceCalculator from "./PriceCalculator";

const MODE_OPTIONS = [
  { value: "SimDrive", label: "SimDrive", detail: "Wheel Setup", simOnly: true },
  { value: "Single", label: "Single", detail: "1 Player" },
  { value: "Dual", label: "Dual", detail: "2 Players" },
  { value: "Triple", label: "Triple", detail: "3 Players" },
  { value: "Big", label: "Big Mode", detail: "4 Players" },
];

const COLS = { 3: "grid-cols-3", 4: "grid-cols-4" };

export default function StartSessionModal({ screen, isOpen, onClose, onSubmit }) {
  const [player, setPlayer] = useState("");
  const [mode, setMode] = useState("Single");
  const [duration, setDuration] = useState(30); // minutes, or "custom"
  const [custom, setCustom] = useState(null); // { minutes, cost } from the calculator

  const screenIdentifier = screen?.screenId || screen?.id || screen?._id;
  const isSimDriveScreen =
    Number(screenIdentifier) === 1 ||
    screen?.type?.toLowerCase().includes("hybrid");

  useEffect(() => {
    if (isOpen && screen) {
      setPlayer("");
      const defaultMode = isSimDriveScreen ? "SimDrive" : "Single";
      setMode(defaultMode);
      setDuration(30);
      setCustom(null);
    }
  }, [isOpen, screen, isSimDriveScreen]);

  const isCustom = duration === "custom";

  const calculatedCost = useMemo(
    () => (isCustom ? custom?.cost || 0 : calculateSessionCost(mode, duration, false)),
    [isCustom, custom, mode, duration]
  );
  const billedMinutes = isCustom ? custom?.minutes || 0 : duration;

  const modes = MODE_OPTIONS.filter((o) => !o.simOnly || isSimDriveScreen);
  const durations = [15, 30, 60];

  const getPlayersCount = (selectedMode) => {
    if (selectedMode === "SimDrive" || selectedMode === "Single") return 1;
    if (selectedMode === "Dual") return 2;
    if (selectedMode === "Triple") return 3;
    if (selectedMode === "Party") return 7;
    return 4;
  };

  const handleModeChange = (value) => {
    setMode(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!calculatedCost || calculatedCost <= 0 || !billedMinutes || billedMinutes <= 0) {
      return;
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + billedMinutes * 60 * 1000);

    onSubmit({
      screenId: screenIdentifier,
      player: player.trim() || "Guest",
      mode,
      playersCount: getPlayersCount(mode),
      duration: billedMinutes,
      cost: calculatedCost,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
    });

    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Start Session"
      description={screen?.name}
      footer={
        <button
          type="submit"
          form="start-session-form"
          disabled={!calculatedCost || calculatedCost <= 0}
          className={PRIMARY_BTN}
        >
          Start Session
        </button>
      }
    >
      <form
        id="start-session-form"
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="start-player-name"
            className="mb-1.5 block text-sm font-medium text-main"
          >
            Player Name
          </label>
          <input
            id="start-player-name"
            name="player"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            placeholder="e.g., Rahul…"
            className={INPUT_CLASS}
          />
          <p className="mt-1.5 text-xs text-sub">Leave blank to use Guest.</p>
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-main">
            Gaming Mode
          </legend>
          <div
            className={`grid gap-2 ${
              modes.length >= 4 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3"
            }`}
          >
            {modes.map((o) => (
              <OptionCard
                key={`mode-option-${o.value}`}
                name="start-mode"
                value={o.value}
                checked={mode === o.value}
                onChange={() => handleModeChange(o.value)}
              >
                <span className="text-sm font-semibold">{o.label}</span>
                <span className="text-xs text-sub">{o.detail}</span>
              </OptionCard>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-main">
            Session Time
          </legend>
          <div className={`grid gap-2 ${COLS[durations.length + 1]}`}>
            {durations.map((mins) => (
              <OptionCard
                key={`dur-option-${mins}`}
                name="start-duration"
                value={mins}
                checked={duration === mins}
                onChange={() => setDuration(mins)}
              >
                <span className="font-mono text-sm font-bold tabular-nums">
                  {mins === 60 ? "1\u00A0Hr" : `${mins}\u00A0Mins`}
                </span>
              </OptionCard>
            ))}
            <OptionCard
              key="dur-option-custom"
              name="start-duration"
              value="custom"
              checked={isCustom}
              onChange={() => setDuration("custom")}
            >
              <span className="text-sm font-semibold">Custom</span>
            </OptionCard>
          </div>
        </fieldset>

        {isCustom && <PriceCalculator mode={mode} onChange={setCustom} />}

        <div className="flex items-center justify-between rounded-lg border border-border-divider bg-app-bg p-4">
          <span className="text-sm text-sub">Session Total</span>
          <span className="font-mono text-2xl font-bold tabular-nums text-available">
            {formatINR(calculatedCost)}
          </span>
        </div>
      </form>
    </Sheet>
  );
}
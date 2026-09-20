// src/components/ui/StartSessionModal.jsx
import { useState, useEffect, useMemo } from "react";
import { calculateSessionCost } from "../../config/pricing";
import { formatINR } from "../../utils/format";
import Sheet, { OptionCard, INPUT_CLASS, PRIMARY_BTN } from "./Sheet";

const MODE_OPTIONS = [
  { value: "SimDrive", label: "SimDrive", detail: "Wheel Setup", simOnly: true },
  { value: "Single", label: "Single", detail: "1 Player" },
  { value: "Dual", label: "Dual", detail: "2 Players" },
  { value: "Big", label: "Big Mode", detail: "4 Players" },
];

export default function StartSessionModal({ screen, isOpen, onClose, onSubmit }) {
  const [player, setPlayer] = useState("");
  const [mode, setMode] = useState("Single");
  const [duration, setDuration] = useState(30);

  const screenIdentifier = screen?.screenId || screen?.id || screen?._id;
  const isSimDriveScreen =
    Number(screenIdentifier) === 1 ||
    screen?.type?.toLowerCase().includes("hybrid");

  useEffect(() => {
    if (isOpen && screen) {
      setPlayer("");
      const defaultMode = isSimDriveScreen ? "SimDrive" : "Single";
      setMode(defaultMode);
      setDuration(defaultMode === "SimDrive" ? 60 : 30);
    }
  }, [isOpen, screen, isSimDriveScreen]);

  const calculatedCost = useMemo(
    () => calculateSessionCost(mode, duration, false),
    [mode, duration]
  );

  const modes = MODE_OPTIONS.filter((o) => !o.simOnly || isSimDriveScreen);
  const durations = mode === "SimDrive" ? [15, 60] : [15, 30, 60];

  const getPlayersCount = (selectedMode) => {
    if (selectedMode === "SimDrive" || selectedMode === "Single") return 1;
    if (selectedMode === "Dual") return 2;
    if (selectedMode === "Party") return 7;
    return 4;
  };

  const handleModeChange = (value) => {
    setMode(value);
    if (value === "SimDrive" && duration === 30) setDuration(60);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60 * 1000);

    onSubmit({
      screenId: screenIdentifier,
      player: player.trim() || "Guest",
      mode,
      playersCount: getPlayersCount(mode),
      duration,
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
          disabled={!calculatedCost}
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
              modes.length === 4 ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            {modes.map((o) => (
              <OptionCard
                key={o.value}
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
          <div
            className={`grid gap-2 ${
              durations.length === 2 ? "grid-cols-2" : "grid-cols-3"
            }`}
          >
            {durations.map((mins) => (
              <OptionCard
                key={mins}
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
          </div>
        </fieldset>

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
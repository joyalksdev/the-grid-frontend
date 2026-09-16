// src/components/ui/StartSessionModal.jsx
import { useState, useEffect } from "react";
import { PiX } from "react-icons/pi";
import { calculateSessionCost } from "../../config/pricing";

export default function StartSessionModal({ screen, isOpen, onClose, onSubmit }) {
  const [player, setPlayer] = useState("");
  const [mode, setMode] = useState("Single");
  const [duration, setDuration] = useState(30);
  const [calculatedCost, setCalculatedCost] = useState(0);

  const screenIdentifier = screen?.screenId || screen?.id || screen?._id;
  const isSimDriveScreen = Number(screenIdentifier) === 1 || screen?.type?.toLowerCase().includes("hybrid");

  useEffect(() => {
    if (isOpen && screen) {
      setPlayer("");
      const defaultMode = isSimDriveScreen ? "SimDrive" : "Single";
      setMode(defaultMode);
      setDuration(defaultMode === "SimDrive" ? 60 : 30);
    }
  }, [isOpen, screen, isSimDriveScreen]);

  useEffect(() => {
    setCalculatedCost(calculateSessionCost(mode, duration, false));
  }, [mode, duration]);

  if (!isOpen) return null;

  const getAvailableDurations = () => {
    if (mode === "SimDrive") return [15, 60];
    return [15, 30, 60];
  };

  const getPlayersCount = (selectedMode) => {
    if (selectedMode === "SimDrive" || selectedMode === "Single") return 1;
    if (selectedMode === "Dual") return 2;
    if (selectedMode === "Party") return 7;
    return 4;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-sm bg-card-panel border border-border-divider rounded-xl overflow-hidden shadow-2xl">
        <div className="border-b border-border-divider px-5 py-4 flex items-center justify-between bg-app-bg/50">
          <h3 className="font-heading font-bold text-base uppercase tracking-wider text-main">
            Start Session: <span className="text-primary-cyan">{screen?.name}</span>
          </h3>
          <button onClick={onClose} className="text-sub hover:text-main text-lg transition-colors">
            <PiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
              Player Name
            </label>
            <input
              type="text"
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              placeholder="Enter player name"
              className="w-full bg-app-bg border border-border-divider rounded-md px-3 py-2 text-main focus:outline-none focus:border-sub font-body text-sm transition-colors placeholder:text-muted"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
              Gaming Mode
            </label>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                if (e.target.value === "SimDrive" && duration === 30) setDuration(60);
              }}
              className="w-full bg-app-bg border border-border-divider rounded-md px-3 py-2 text-main focus:outline-none focus:border-sub font-mono text-xs uppercase"
            >
              {isSimDriveScreen && <option value="SimDrive">SimDrive Wheel Setup</option>}
              <option value="Single">Single (1 Player)</option>
              <option value="Dual">Dual (2 Players)</option>
              <option value="Big">Big Mode (4 Players)</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-muted mb-1.5">
              Session Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {getAvailableDurations().map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`py-2 rounded-md font-mono text-xs border transition-colors ${
                    duration === mins
                      ? "border-primary-cyan text-primary-cyan bg-app-bg font-bold"
                      : "border-border-divider text-sub bg-app-bg/50 hover:border-sub"
                  }`}
                >
                  {mins === 60 ? "1 Hr" : `${mins} Mins`}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-app-bg p-3.5 border border-border-divider rounded-md flex justify-between items-center my-2">
            <span className="font-mono text-xs uppercase text-muted">Session Total</span>
            <span className="font-mono text-xl font-bold text-available">₹{calculatedCost || 0}</span>
          </div>

          <button
            type="submit"
            disabled={!calculatedCost}
            className="w-full py-2.5 bg-main disabled:opacity-50 hover:bg-main/90 text-app-bg font-mono uppercase font-bold text-xs tracking-wider rounded-md transition-colors"
          >
            Start Session
          </button>
        </form>
      </div>
    </div>
  );
}
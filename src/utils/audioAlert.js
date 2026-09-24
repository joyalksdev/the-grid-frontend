// src/utils/audioAlert.js
// Synthesized alert (no audio file needed). Browsers block sound until the
// user has interacted with the page once, so we unlock on the first gesture.

let ctx = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

export function unlockAudio() {
  const c = getContext();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

if (typeof window !== "undefined") {
  ["pointerdown", "keydown", "touchstart"].forEach((evt) =>
    window.addEventListener(evt, unlockAudio, { passive: true })
  );
}

// [frequency Hz, start offset s]
const CHIME = [
  [880, 0],
  [1174.66, 0.16],
  [880, 0.32],
];
const NOTE_LENGTH = 0.18;
const ROUNDS = 7;
const ROUND_GAP = 0.9;

/** Plays a three-round chime. Returns false if the browser blocked audio. */
export function playTimerAlertSound() {
  const c = getContext();
  if (!c) return false;

  if (c.state === "suspended") {
    c.resume().catch(() => {});
    return false;
  }

  const start = c.currentTime + 0.02;

  for (let round = 0; round < ROUNDS; round++) {
    CHIME.forEach(([freq, offset]) => {
      const t = start + round * ROUND_GAP + offset;
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + NOTE_LENGTH);

      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + NOTE_LENGTH + 0.02);
    });
  }

  // Haptic nudge on phones that support it
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }

  return true;
}
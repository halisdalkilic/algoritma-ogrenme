/**
 * Ses + titreşim geri bildirimi. Sesler dosya indirmeden Web Audio ile sentezlenir
 * (site hafif kalır, CSP'ye yeni kaynak gerekmez). Titreşim yalnızca destekleyen
 * cihazlarda (çoğunlukla Android) çalışır; iOS Safari `navigator.vibrate` sunmaz.
 */

export type Cue = "correct" | "wrong" | "complete" | "celebrate" | "tap";

type Note = { f: number; t: number; d: number; type?: OscillatorType; gain?: number };

// Notalar: f = frekans (Hz), t = başlangıç (sn), d = süre (sn)
const SOUNDS: Record<Cue, Note[]> = {
  correct: [
    { f: 659.25, t: 0, d: 0.12, type: "triangle" }, // Mi
    { f: 987.77, t: 0.09, d: 0.22, type: "triangle" }, // Si
  ],
  wrong: [
    { f: 311.13, t: 0, d: 0.14, type: "sine", gain: 0.5 },
    { f: 233.08, t: 0.11, d: 0.24, type: "sine", gain: 0.5 },
  ],
  complete: [
    { f: 523.25, t: 0, d: 0.14, type: "triangle" },
    { f: 659.25, t: 0.11, d: 0.14, type: "triangle" },
    { f: 783.99, t: 0.22, d: 0.14, type: "triangle" },
    { f: 1046.5, t: 0.33, d: 0.4, type: "triangle" },
  ],
  celebrate: [
    { f: 783.99, t: 0, d: 0.1, type: "square", gain: 0.25 },
    { f: 987.77, t: 0.08, d: 0.1, type: "square", gain: 0.25 },
    { f: 1174.66, t: 0.16, d: 0.1, type: "square", gain: 0.25 },
    { f: 1567.98, t: 0.24, d: 0.5, type: "triangle" },
  ],
  tap: [{ f: 880, t: 0, d: 0.04, type: "sine", gain: 0.2 }],
};

const VIBRATION: Record<Cue, number | number[]> = {
  correct: 18,
  wrong: [30, 60, 30],
  complete: [20, 40, 20, 40, 60],
  celebrate: [30, 50, 30, 50, 120],
  tap: 8,
};

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function playSound(cue: Cue) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + 0.01;
  const master = ac.createGain();
  master.gain.value = 0.18;
  master.connect(ac.destination);
  for (const n of SOUNDS[cue]) {
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.value = n.f;
    // Tık sesini önlemek için yumuşak atak ve sönüm
    const t0 = start + n.t;
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(n.gain ?? 1, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d);
    osc.connect(env).connect(master);
    osc.start(t0);
    osc.stop(t0 + n.d + 0.02);
  }
}

/** AudioContext'i ilk kullanıcı dokunuşunda hazırlar: ilk geri bildirimde oluşturma gecikmesi yaşanmaz. */
function primeAudio() {
  try {
    audio();
  } catch {
    // ses kullanılamıyor
  }
}
if (typeof window !== "undefined") window.addEventListener("pointerdown", primeAudio, { once: true, passive: true });

/** Ayarlara göre ses ve/veya titreşim çalar. Hiçbir hata kullanıcı akışını bozmaz. */
export function cue(kind: Cue, settings: { sound: boolean; haptics: boolean }) {
  try {
    if (settings.sound) playSound(kind);
    if (settings.haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(VIBRATION[kind]);
    }
  } catch {
    // ses/titreşim kullanılamıyor — sessizce devam
  }
}

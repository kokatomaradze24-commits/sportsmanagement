import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sound effects via Web Audio API. No external assets, no dependencies.
 * - click: short crisp tick (UI feedback)
 * - cash: layered "ka-ching" coin/register sound for marking payment as paid
 * - hover: very subtle high-pitched tick
 * - success: rising chime
 *
 * Respects a per-user mute toggle persisted in localStorage.
 */

const STORAGE_KEY = "sounds-muted-v1";

type Ctx = AudioContext;

let sharedCtx: Ctx | null = null;

function getCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  if (sharedCtx) return sharedCtx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    sharedCtx = new AC();
  } catch {
    return null;
  }
  return sharedCtx;
}

function envelope(
  ctx: Ctx,
  destination: AudioNode,
  startTime: number,
  attack: number,
  decay: number,
  peak: number,
): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay);
  gain.connect(destination);
  return gain;
}

function tone(
  ctx: Ctx,
  destination: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType,
  peak: number,
  attack = 0.005,
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  const gain = envelope(ctx, destination, startTime, attack, duration, peak);
  osc.connect(gain);
  osc.start(startTime);
  osc.stop(startTime + attack + duration + 0.05);
}

function playClick(ctx: Ctx, master: GainNode) {
  const t = ctx.currentTime;
  // Short percussive tick: square + quick decay
  tone(ctx, master, 1800, t, 0.03, "square", 0.18, 0.002);
  tone(ctx, master, 900, t + 0.005, 0.04, "sine", 0.12, 0.002);
}

function playHover(ctx: Ctx, master: GainNode) {
  const t = ctx.currentTime;
  tone(ctx, master, 2400, t, 0.02, "sine", 0.04, 0.001);
}

function playSuccess(ctx: Ctx, master: GainNode) {
  const t = ctx.currentTime;
  tone(ctx, master, 660, t, 0.12, "triangle", 0.15);
  tone(ctx, master, 880, t + 0.08, 0.16, "triangle", 0.15);
  tone(ctx, master, 1320, t + 0.18, 0.22, "triangle", 0.12);
}

function playCash(ctx: Ctx, master: GainNode) {
  const t = ctx.currentTime;
  // Layer 1: bright "ding" of register bell — two harmonically related sines
  tone(ctx, master, 1760, t, 0.35, "sine", 0.22, 0.002);
  tone(ctx, master, 2637, t + 0.005, 0.32, "sine", 0.16, 0.002);
  tone(ctx, master, 3520, t + 0.01, 0.25, "sine", 0.08, 0.002);

  // Layer 2: short noise burst (coin shimmer / drawer click)
  const bufferSize = Math.floor(ctx.sampleRate * 0.25);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    // decaying white noise
    const decay = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * decay * decay;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 3500;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(t);
  noise.stop(t + 0.3);

  // Layer 3: low "thunk" of drawer
  tone(ctx, master, 180, t + 0.18, 0.15, "sine", 0.18, 0.005);

  // Layer 4: secondary chime (delayed echo)
  tone(ctx, master, 2093, t + 0.18, 0.4, "sine", 0.1, 0.003);
}

export type SoundName = "click" | "hover" | "success" | "cash";

function playSound(name: SoundName, muted: boolean) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  // Resume on first user gesture (browsers suspend audio until interaction)
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);

  switch (name) {
    case "click":
      playClick(ctx, master);
      break;
    case "hover":
      playHover(ctx, master);
      break;
    case "success":
      playSuccess(ctx, master);
      break;
    case "cash":
      playCash(ctx, master);
      break;
  }
}

export function useSounds() {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  // Resume context on first interaction
  const armedRef = useRef(false);
  useEffect(() => {
    if (armedRef.current) return;
    const arm = () => {
      armedRef.current = true;
      const ctx = getCtx();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
  }, []);

  const setMuted = useCallback((v: boolean) => {
    setMutedState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      // ignore
    }
  }, []);

  const toggleMuted = useCallback(() => setMuted(!muted), [muted, setMuted]);

  const play = useCallback(
    (name: SoundName) => {
      playSound(name, muted);
    },
    [muted],
  );

  return { play, muted, setMuted, toggleMuted };
}

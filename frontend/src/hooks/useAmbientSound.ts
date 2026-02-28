import { useEffect, useRef } from "react";

// C major pentatonic — always sounds pleasant
const NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

// Ascending + descending arpeggio pattern indices
const PATTERN = [0, 1, 2, 3, 4, 3, 5, 2, 3, 1, 4, 0, 2, 5, 1, 3];

function scheduleChime(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  at: number,
  volume: number
) {
  // Primary sine wave
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = freq;

  // Slight inharmonic overtone gives a bell/chime quality
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = freq * 2.756;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(volume, at + 0.015);
  env.gain.exponentialRampToValueAtTime(0.001, at + 3.5);

  const env2 = ctx.createGain();
  env2.gain.setValueAtTime(0, at);
  env2.gain.linearRampToValueAtTime(volume * 0.3, at + 0.01);
  env2.gain.exponentialRampToValueAtTime(0.001, at + 1.2);

  osc1.connect(env);
  osc2.connect(env2);
  env.connect(dest);
  env2.connect(dest);

  osc1.start(at);
  osc2.start(at);
  osc1.stop(at + 4.0);
  osc2.stop(at + 1.5);
}

export function useAmbientSound(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const patternIndexRef = useRef(0);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!active) {
      // Fade out and tear down
      if (masterRef.current && ctxRef.current) {
        masterRef.current.gain.setTargetAtTime(0, ctxRef.current.currentTime, 0.8);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const ctx = ctxRef.current;
      setTimeout(() => {
        ctx?.close();
      }, 3000);
      ctxRef.current = null;
      masterRef.current = null;
      return;
    }

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Master gain — fade in over 2s
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 2.5);
    master.connect(ctx.destination);
    masterRef.current = master;

    // Soft low drone for warmth (two detuned sines)
    const droneFreqs = [65.41, 65.61]; // C2, very slightly detuned for shimmer
    droneFreqs.forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const droneGain = ctx.createGain();
      droneGain.gain.value = 0.04;
      osc.connect(droneGain);
      droneGain.connect(master);
      osc.start();
    });

    // Schedule chimes in a looping arpeggio pattern
    const scheduleNext = () => {
      if (!activeRef.current || !ctxRef.current || ctxRef.current !== ctx) return;
      const idx = PATTERN[patternIndexRef.current % PATTERN.length];
      patternIndexRef.current++;
      scheduleChime(ctx, master, NOTES[idx], ctx.currentTime, 0.07);
      const interval = 1600 + Math.random() * 600;
      timerRef.current = setTimeout(scheduleNext, interval);
    };

    // Handle browser autoplay restriction
    const tryStart = () => {
      ctx.resume().then(scheduleNext);
    };

    if (ctx.state === "running") {
      scheduleNext();
    } else {
      const events = ["click", "keydown", "touchstart"] as const;
      const onInteraction = () => {
        events.forEach((e) => document.removeEventListener(e, onInteraction));
        tryStart();
      };
      events.forEach((e) => document.addEventListener(e, onInteraction, { once: true }));
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setTimeout(() => ctx.close(), 2000);
      ctxRef.current = null;
      masterRef.current = null;
    };
  }, [active]);
}

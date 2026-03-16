import { useCallback, useRef } from "react";

export function useNotificationSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;

      // Play two pleasant tones (success chime)
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(587.33, now, 0.15);        // D5
      playTone(783.99, now + 0.15, 0.25); // G5
    } catch {
      // Audio not available
    }
  }, []);

  return { playSound };
}

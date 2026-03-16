import { useState, useEffect, useCallback, useRef } from "react";

interface UseCooldownOptions {
  key: string;
  durationMs: number;
}

interface UseCooldownResult {
  isCooling: boolean;
  remainingSeconds: number;
  startCooldown: () => void;
}

export function useCooldown({ key, durationMs }: UseCooldownOptions): UseCooldownResult {
  const [remainingMs, setRemainingMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getRemainingFromStorage = useCallback(() => {
    const stored = localStorage.getItem(key);
    if (!stored) return 0;
    const endTime = parseInt(stored, 10);
    const remaining = endTime - Date.now();
    return remaining > 0 ? remaining : 0;
  }, [key]);

  useEffect(() => {
    const remaining = getRemainingFromStorage();
    if (remaining > 0) {
      setRemainingMs(remaining);
    }
  }, [getRemainingFromStorage]);

  useEffect(() => {
    if (remainingMs <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      const remaining = getRemainingFromStorage();
      if (remaining <= 0) {
        setRemainingMs(0);
        localStorage.removeItem(key);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setRemainingMs(remaining);
      }
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingMs > 0, getRemainingFromStorage, key]);

  const startCooldown = useCallback(() => {
    const endTime = Date.now() + durationMs;
    localStorage.setItem(key, endTime.toString());
    setRemainingMs(durationMs);
  }, [key, durationMs]);

  return {
    isCooling: remainingMs > 0,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    startCooldown,
  };
}

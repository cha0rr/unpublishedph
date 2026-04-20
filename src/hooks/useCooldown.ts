import { useCallback, useEffect, useState } from "react";

interface UseCooldownOptions {
  key: string;
  durationMs: number;
}

interface UseCooldownResult {
  isCooling: boolean;
  remainingSeconds: number;
  startCooldown: () => void;
}

// Cooldown desativado: botões de gerar ficam sempre disponíveis.
// Mantemos os mesmos hooks internos para preservar compatibilidade com Fast Refresh.
export function useCooldown({ key }: UseCooldownOptions): UseCooldownResult {
  const [_remaining] = useState(0);

  useEffect(() => {
    try { localStorage.removeItem(key); } catch {}
  }, [key]);

  const startCooldown = useCallback(() => {
    // no-op
  }, []);

  return {
    isCooling: false,
    remainingSeconds: _remaining,
    startCooldown,
  };
}

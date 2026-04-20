import { useCallback, useEffect } from "react";

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
export function useCooldown({ key }: UseCooldownOptions): UseCooldownResult {
  useEffect(() => {
    // Limpa qualquer cooldown remanescente persistido em sessões anteriores.
    try { localStorage.removeItem(key); } catch {}
  }, [key]);

  const startCooldown = useCallback(() => {
    // no-op
  }, []);

  return {
    isCooling: false,
    remainingSeconds: 0,
    startCooldown,
  };
}

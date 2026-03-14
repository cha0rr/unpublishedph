import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type GeneratorState = "idle" | "generating" | "polling" | "success" | "error";

function getSimulatedProgress(elapsedMs: number): number {
  const totalEstimate = 30000;
  const ratio = elapsedMs / totalEstimate;
  const progress = Math.min(95, Math.round(100 * (1 - Math.exp(-2.5 * ratio))));
  return Math.max(1, progress);
}

interface ImageGeneratorResult {
  state: GeneratorState;
  resultUrl: string | null;
  error: string | null;
  progress: number;
  statusText: string;
  generate: (prompt: string, model: string) => Promise<void>;
  reset: () => void;
}

export function useImageGenerator(): ImageGeneratorResult {
  const [state, setState] = useState<GeneratorState>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const cancelledRef = useRef(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startProgressSimulation = useCallback(() => {
    startTimeRef.current = Date.now();
    progressTimerRef.current = setInterval(() => {
      if (cancelledRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const simulated = getSimulatedProgress(elapsed);
      setProgress(simulated);
      setStatusText(`Processando imagem... ${simulated}%`);
    }, 300);
  }, []);

  const stopProgressSimulation = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopProgressSimulation();
    };
  }, [stopProgressSimulation]);

  const pollHistory = useCallback(async (uuid: string) => {
    const maxAttempts = 60;
    const interval = 5000;
    let consecutiveNetworkErrors = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (cancelledRef.current) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geminigen-image-history`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ uuid }),
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data) throw new Error("Resposta inválida.");
        consecutiveNetworkErrors = 0;

        if (data.status === 2) {
          let finalUrl = data.generate_result;
          if (!finalUrl && data.generated_image?.length > 0) {
            const img = data.generated_image[0];
            finalUrl = img.image_url || img.file_download_url;
          }
          if (!finalUrl) finalUrl = data.thumbnail_url;
          return finalUrl || null;
        }

        if (data.status === 3) {
          throw new Error(data.error_message || "Falha ao gerar imagem.");
        }
      } catch (err: any) {
        consecutiveNetworkErrors++;
        if (consecutiveNetworkErrors >= 5) {
          throw new Error("Conexão perdida ao verificar status.");
        }
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error("Tempo limite excedido.");
  }, []);

  const generate = useCallback(async (prompt: string, model: string) => {
    cancelledRef.current = false;
    setState("generating");
    setResultUrl(null);
    setError(null);
    setProgress(0);
    setStatusText("Enviando solicitação...");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geminigen-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ prompt, model }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar imagem.");

      const uuid = data.uuid;
      if (!uuid) throw new Error("UUID da geração não retornado.");

      setState("polling");
      startProgressSimulation();
      const finalUrl = await pollHistory(uuid);
      stopProgressSimulation();

      if (finalUrl) {
        setProgress(100);
        setResultUrl(finalUrl);
        setState("success");
        setStatusText("Imagem pronta!");
      } else {
        throw new Error("URL do resultado não encontrada.");
      }
    } catch (err: any) {
      stopProgressSimulation();
      setError(err.message || "Erro inesperado.");
      setState("error");
      setStatusText("");
    }
  }, [pollHistory, startProgressSimulation, stopProgressSimulation]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    stopProgressSimulation();
    setState("idle");
    setResultUrl(null);
    setError(null);
    setProgress(0);
    setStatusText("");
  }, [stopProgressSimulation]);

  return { state, resultUrl, error, progress, statusText, generate, reset };
}

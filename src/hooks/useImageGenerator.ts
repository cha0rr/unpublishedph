import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";

type GeneratorState = "idle" | "generating" | "polling" | "success" | "error";

function getSimulatedProgress(elapsedMs: number): number {
  const totalEstimate = 30000;
  const ratio = elapsedMs / totalEstimate;
  const progress = Math.min(95, Math.round(100 * (1 - Math.exp(-2.5 * ratio))));
  return Math.max(1, progress);
}

export interface ImageGenerateParams {
  prompt: string;
  model: string;
  aspect_ratio?: string;
  resolution?: string;
  output_format?: string;
  style?: string;
  ref_history?: string;
  file_urls?: string[];
  file_base64?: ImageReferencePayload[] | string[];
}

export interface ImageReferencePayload {
  data: string;
  mimeType?: string;
  fileName?: string;
}

interface ImageGeneratorResult {
  state: GeneratorState;
  resultUrl: string | null;
  error: string | null;
  progress: number;
  statusText: string;
  generate: (params: ImageGenerateParams) => Promise<void>;
  reset: () => void;
}

export function useImageGenerator(): ImageGeneratorResult {
  const { playSound } = useNotificationSound();
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
    const maxAttempts = 120;
    const baseInterval = 5000;
    let consecutiveNetworkErrors = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (cancelledRef.current) return;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geminigen-image-history`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ uuid }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (res.status === 401 || res.status === 403) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        if (!res.ok) {
          consecutiveNetworkErrors++;
          if (consecutiveNetworkErrors >= 10) {
            throw new Error("Servidor indisponível. Tente novamente mais tarde.");
          }
          const backoff = Math.min(baseInterval + consecutiveNetworkErrors * 3000, 15000);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        const data = await res.json();
        if (!data) {
          consecutiveNetworkErrors++;
          await new Promise((resolve) => setTimeout(resolve, baseInterval));
          continue;
        }
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
        if (err.message === "Sessão expirada. Faça login novamente." ||
            err.message === "Servidor indisponível. Tente novamente mais tarde." ||
            err.message?.includes("Falha ao gerar")) {
          throw err;
        }
        consecutiveNetworkErrors++;
        if (consecutiveNetworkErrors >= 10) {
          throw new Error("Conexão perdida ao verificar status. Verifique sua internet.");
        }
        const backoff = Math.min(baseInterval + consecutiveNetworkErrors * 3000, 15000);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, baseInterval));
    }

    throw new Error("Tempo limite excedido.");
  }, []);

  const generate = useCallback(async (params: ImageGenerateParams) => {
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
          body: JSON.stringify(params),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        const detailMsg = data.details?.message || data.details?.error || data.details?.detail || '';
        const mainMsg = data.error || '';
        const finalMsg = mainMsg && mainMsg !== 'Erro na API GeminiGen.'
          ? mainMsg
          : detailMsg || mainMsg || "Erro ao gerar imagem.";
        throw new Error(finalMsg);
      }

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
        playSound();
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

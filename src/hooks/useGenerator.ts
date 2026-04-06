import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type GeneratorState = "idle" | "generating" | "polling" | "success" | "error";

function getSimulatedProgress(elapsedMs: number): number {
  const totalEstimate = 50000;
  const ratio = elapsedMs / totalEstimate;
  const progress = Math.min(95, Math.round(100 * (1 - Math.exp(-2.5 * ratio))));
  return Math.max(1, progress);
}

export interface GenerateParams {
  prompt: string;
  aspectRatio: string;
  resolution?: string;
  model?: string;
  modeImage?: "none" | "ingredient" | "frame";
  refImages?: File[];
  duration?: string;
  mode?: string;
}

interface GeneratorResult {
  state: GeneratorState;
  resultUrl: string | null;
  resultUuid: string | null;
  error: string | null;
  progress: number;
  statusText: string;
  generate: (params: GenerateParams) => Promise<void>;
  reset: () => void;
  setResultUrl: (url: string) => void;
  setSuccessState: (url: string, uuid?: string) => void;
}

export function useGenerator(): GeneratorResult {
  const { playSound } = useNotificationSound();
  const [state, setState] = useState<GeneratorState>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultUuid, setResultUuid] = useState<string | null>(null);
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
      setStatusText(`Processando vídeo... ${simulated}%`);
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
    const interval = 5000;
    let consecutiveNetworkErrors = 0;
    const maxConsecutiveNetworkErrors = 12;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (cancelledRef.current) return;

      let data: any;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");

        const res = await fetch(`${SUPABASE_URL}/functions/v1/geminigen-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ uuid }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
        if (!data) throw new Error("Resposta de histórico inválida.");
        consecutiveNetworkErrors = 0;
      } catch (networkErr: any) {
        consecutiveNetworkErrors++;
        console.warn(`Poll network error (attempt ${attempt + 1}, consecutive: ${consecutiveNetworkErrors}):`, networkErr.message);
        if (consecutiveNetworkErrors >= maxConsecutiveNetworkErrors) {
          throw new Error("Conexão perdida ao verificar status do vídeo.");
        }
        const backoff = Math.min(interval * Math.pow(1.5, consecutiveNetworkErrors - 1), 30000);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      // Check for policy violation errors regardless of status
      const errMsg = data.error_message || "";
      if (errMsg.includes("PUBLIC_ERROR") || errMsg.includes("violation of Google")) {
        throw new Error("Reescreva seu prompt, pois contem palavras impróprias ou material de terceiros.");
      }

      const status = Number(data.status);

      if (status === 2) {
        let finalUrl = data.generate_result;
        if (!finalUrl && data.generated_video?.length > 0) {
          const vid = data.generated_video[0];
          finalUrl = vid.video_url || vid.file_download_url;
        }
        if (!finalUrl) finalUrl = data.thumbnail_url;
        return finalUrl || null;
      }

      if (status === 3) {
        const errCode = data.error_code ? ` (Código: ${data.error_code})` : "";
        throw new Error(errMsg + errCode || "Falha ao gerar vídeo.");
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error("Tempo limite excedido ao gerar vídeo. Verifique seus créditos no dashboard da GeminiGen ou tente novamente.");
  }, []);

  const generate = useCallback(async (params: GenerateParams) => {
    const { prompt, aspectRatio, resolution = "720p", model = "veo-3.1-fast", modeImage = "none", refImages = [], duration, mode } = params;
    cancelledRef.current = false;
    setState("generating");
    setResultUrl(null);
    setResultUuid(null);
    setError(null);
    setProgress(0);
    setStatusText("Enviando solicitação...");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");

      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("resolution", resolution);
      formData.append("aspect_ratio", aspectRatio);
      formData.append("model", model);

      if (duration) formData.append("duration", duration);
      if (mode) formData.append("mode", mode);

      if (modeImage !== "none" && refImages.length > 0) {
        formData.append("mode_image", modeImage);
        for (const file of refImages) {
          formData.append("ref_images", file, file.name);
        }
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/geminigen-video`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.detail || data?.message || `Erro ao gerar vídeo (HTTP ${res.status}).`);

      const uuid = data?.uuid;
      if (!uuid) throw new Error("UUID da geração não retornado.");

      setState("polling");
      startProgressSimulation();
      const finalUrl = await pollHistory(uuid);
      stopProgressSimulation();

      if (finalUrl) {
        setProgress(100);
        setResultUrl(finalUrl);
        setResultUuid(uuid);
        setState("success");
        setStatusText("Vídeo pronto!");
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
    setResultUuid(null);
    setError(null);
    setProgress(0);
    setStatusText("");
  }, [stopProgressSimulation]);

  const setSuccessState = useCallback((url: string, uuid?: string) => {
    cancelledRef.current = true;
    stopProgressSimulation();
    setState("success");
    setResultUrl(url);
    if (uuid) setResultUuid(uuid);
    setError(null);
    setProgress(100);
    setStatusText("Vídeo pronto!");
  }, [stopProgressSimulation]);

  return { state, resultUrl, resultUuid, error, progress, statusText, generate, reset, setResultUrl, setSuccessState };
}

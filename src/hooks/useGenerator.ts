import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type GeneratorState = "idle" | "generating" | "polling" | "success" | "error";

// Simulated progress curve: starts fast, slows down, never reaches 100%
function getSimulatedProgress(elapsedMs: number): number {
  const totalEstimate = 50000; // 50s estimate
  const ratio = elapsedMs / totalEstimate;
  const progress = Math.min(95, Math.round(100 * (1 - Math.exp(-2.5 * ratio))));
  return Math.max(1, progress);
}

interface UseGeneratorOptions {
  type: "image" | "video";
}

interface GeneratorResult {
  state: GeneratorState;
  resultUrl: string | null;
  error: string | null;
  progress: number;
  statusText: string;
  generate: (prompt: string, aspectRatio: string, referenceImage?: File) => Promise<void>;
  reset: () => void;
}

export function useGenerator({ type }: UseGeneratorOptions): GeneratorResult {
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
    const maxAttempts = 60;
    const interval = 5000;
    let consecutiveNetworkErrors = 0;
    const maxConsecutiveNetworkErrors = 5;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (cancelledRef.current) return;

      let data: any;
      try {
        // Use the user's session token for authentication
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
        console.warn(`Poll network error (attempt ${attempt + 1}):`, networkErr.message);
        if (consecutiveNetworkErrors >= maxConsecutiveNetworkErrors) {
          throw new Error("Conexão perdida ao verificar status do vídeo.");
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
        continue;
      }

      // API status checks — throw immediately, no retry
      const status = data.status;

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
        throw new Error(data.error_message || data.error_code || "Falha ao gerar vídeo.");
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error("Tempo limite excedido ao gerar vídeo.");
  }, []);

  const generate = useCallback(async (prompt: string, aspectRatio: string, referenceImage?: File) => {
    cancelledRef.current = false;
    setState("generating");
    setResultUrl(null);
    setError(null);
    setProgress(0);
    setStatusText("Enviando solicitação...");

    try {
      const body: Record<string, string> = {
        prompt,
        resolution: "720p",
        aspect_ratio: aspectRatio,
      };

      if (referenceImage) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(referenceImage);
        });
        body.reference_image = base64;
      }

      const { data, error: fnError } = await supabase.functions.invoke("geminigen-video", { body });

      if (fnError) throw new Error(fnError.message);

      const uuid = data?.uuid;
      if (!uuid) {
        throw new Error("UUID da geração não retornado.");
      }

      setState("polling");
      startProgressSimulation();
      const finalUrl = await pollHistory(uuid);
      stopProgressSimulation();

      if (finalUrl) {
        setProgress(100);
        setResultUrl(finalUrl);
        setState("success");
        setStatusText("Vídeo pronto!");
      } else {
        throw new Error("URL do resultado não encontrada.");
      }
    } catch (err: any) {
      stopProgressSimulation();
      setError(err.message || "Erro inesperado.");
      setState("error");
      setStatusText("");
    }
  }, [pollHistory]);

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

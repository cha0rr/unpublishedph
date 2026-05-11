import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { normalizeMediaUrl } from "@/lib/normalizeMediaUrl";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = "idle" | "generating" | "polling" | "success" | "error";

export interface StoryboardScene {
  prompt: string;
  duration: 6 | 10;
}

export interface StoryboardParams {
  scenes: StoryboardScene[];
  aspect_ratio: "landscape" | "portrait" | "square";
  resolution: "480p" | "720p";
}

function getSimulatedProgress(elapsedMs: number, totalDuration: number): number {
  // Storyboards take longer — estimate ~15s per second of output
  const totalEstimate = Math.max(60000, totalDuration * 15000);
  const ratio = elapsedMs / totalEstimate;
  const progress = Math.min(95, Math.round(100 * (1 - Math.exp(-2.5 * ratio))));
  return Math.max(1, progress);
}

export function useStoryboardGenerator() {
  const { playSound } = useNotificationSound();
  const [state, setState] = useState<State>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultUuid, setResultUuid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => { cancelledRef.current = true; stopTimer(); }, [stopTimer]);

  const startTimer = useCallback((totalDuration: number) => {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (cancelledRef.current) return;
      const elapsed = Date.now() - startRef.current;
      const sim = getSimulatedProgress(elapsed, totalDuration);
      setProgress(sim);
      setStatusText(`Renderizando storyboard... ${sim}%`);
    }, 500);
  }, []);

  const pollHistory = useCallback(async (uuid: string) => {
    const maxAttempts = 240; // ~20 min
    const interval = 5000;
    let netErrors = 0;
    const maxNetErrors = 12;

    for (let i = 0; i < maxAttempts; i++) {
      if (cancelledRef.current) return null;
      let data: any;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Sessão expirada.");

        const res = await fetch(`${SUPABASE_URL}/functions/v1/geminigen-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uuid }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
        netErrors = 0;
      } catch (e: any) {
        netErrors++;
        if (netErrors >= maxNetErrors) throw new Error("Conexão perdida.");
        await new Promise(r => setTimeout(r, Math.min(interval * Math.pow(1.5, netErrors - 1), 30000)));
        continue;
      }

      const errMsg = data.error_message || "";
      if (errMsg.includes("PUBLIC_ERROR") || errMsg.includes("violation of Google")) {
        throw new Error("Reescreva seu prompt, pois contem palavras impróprias ou material de terceiros.");
      }

      const status = Number(data.status);
      if (status === 2) {
        let url = data.generate_result;
        if (!url && data.generated_video?.length > 0) {
          const vid = data.generated_video[0];
          url = vid.video_url || vid.file_download_url;
        }
        return normalizeMediaUrl(url) || null;
      }
      if (status === 3) {
        const code = data.error_code ? ` (Código: ${data.error_code})` : "";
        throw new Error(errMsg + code || "Falha ao gerar storyboard.");
      }
      await new Promise(r => setTimeout(r, interval));
    }
    throw new Error("Tempo limite excedido ao gerar storyboard.");
  }, []);

  const generate = useCallback(async (params: StoryboardParams) => {
    cancelledRef.current = false;
    setState("generating");
    setResultUrl(null); setResultUuid(null); setError(null);
    setProgress(0); setStatusText("Enviando solicitação...");

    const totalDuration = params.scenes.reduce((s, x) => s + x.duration, 0);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Faça login novamente.");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/geminigen-video-storyboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || `Erro HTTP ${res.status}`);
      }
      const uuid = data?.uuid;
      if (!uuid) {
        throw new Error(data?.error || "Provedor não retornou identificador da geração. Tente novamente.");
      }

      setState("polling");
      startTimer(totalDuration);
      const finalUrl = await pollHistory(uuid);
      stopTimer();

      if (finalUrl) {
        setProgress(100);
        setResultUrl(finalUrl);
        setResultUuid(uuid);
        setState("success");
        setStatusText("Storyboard pronto!");
        playSound();
      } else {
        throw new Error("URL do resultado não encontrada.");
      }
    } catch (err: any) {
      stopTimer();
      setError(err.message || "Erro inesperado.");
      setState("error");
      setStatusText("");
    }
  }, [pollHistory, startTimer, stopTimer, playSound]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    stopTimer();
    setState("idle"); setResultUrl(null); setResultUuid(null);
    setError(null); setProgress(0); setStatusText("");
  }, [stopTimer]);

  return { state, resultUrl, resultUuid, error, progress, statusText, generate, reset };
}

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type GeneratorState = "idle" | "generating" | "polling" | "success" | "error";

interface UseGeneratorOptions {
  type: "image" | "video";
}

interface GeneratorResult {
  state: GeneratorState;
  resultUrl: string | null;
  error: string | null;
  progress: number;
  statusText: string;
  generate: (prompt: string, aspectRatio: string) => Promise<void>;
  reset: () => void;
}

export function useGenerator({ type }: UseGeneratorOptions): GeneratorResult {
  const [state, setState] = useState<GeneratorState>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => { cancelledRef.current = true; };
  }, []);

  const pollHistory = useCallback(async (uuid: string) => {
    const maxAttempts = 60;
    const interval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (cancelledRef.current) return;

      const { data, error: fnError } = await supabase.functions.invoke("geminigen-history", {
        body: { uuid },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data) throw new Error("Resposta de histórico inválida.");

      const status = data.status;
      const pct = data.status_percentage ?? 0;
      setProgress(pct);
      setStatusText(`Processando vídeo... ${pct}%`);

      if (status === 2) {
        let finalUrl = data.generate_result;

        if (!finalUrl && data.generated_video?.length > 0) {
          const vid = data.generated_video[0];
          finalUrl = vid.video_url || vid.file_download_url;
        }

        if (!finalUrl) {
          finalUrl = data.thumbnail_url;
        }

        return finalUrl || null;
      }

      if (status === 3) {
        throw new Error(data.error_message || "Falha ao gerar vídeo.");
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error("Tempo limite excedido ao gerar vídeo.");
  }, []);

  const generate = useCallback(async (prompt: string, aspectRatio: string) => {
    cancelledRef.current = false;
    setState("generating");
    setResultUrl(null);
    setError(null);
    setProgress(0);
    setStatusText("Enviando solicitação...");

    try {
      const functionName = type === "image" ? "geminigen-image" : "geminigen-video";

      const body = type === "image"
        ? {
            prompt,
            aspect_ratio: aspectRatio,
            output_format: "jpeg",
            resolution: "1K",
            style: "Photorealistic",
          }
        : {
            prompt,
            resolution: "720p",
            aspect_ratio: aspectRatio,
          };

      const { data, error: fnError } = await supabase.functions.invoke(functionName, { body });

      if (fnError) throw new Error(fnError.message);

      const uuid = data?.uuid;
      if (!uuid) {
        throw new Error("UUID da geração não retornado.");
      }

      setState("polling");
      const finalUrl = await pollHistory(uuid);

      if (finalUrl) {
        setResultUrl(finalUrl);
        setState("success");
        setStatusText(type === "image" ? "Imagem pronta." : "Vídeo pronto.");
      } else {
        throw new Error("URL do resultado não encontrada.");
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
      setState("error");
      setStatusText("");
    }
  }, [type, pollHistory]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setState("idle");
    setResultUrl(null);
    setError(null);
    setProgress(0);
    setStatusText("");
  }, []);

  return { state, resultUrl, error, progress, statusText, generate, reset };
}

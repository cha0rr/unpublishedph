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
  progress: string;
  generate: (prompt: string, aspectRatio: string) => Promise<void>;
  reset: () => void;
}

export function useGenerator({ type }: UseGeneratorOptions): GeneratorResult {
  const [state, setState] = useState<GeneratorState>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const pollHistory = useCallback(
    (uuid: string) => {
      setState("polling");
      setProgress("Aguardando processamento...");

      intervalRef.current = setInterval(async () => {
        try {
          const { data, error: fnError } = await supabase.functions.invoke("geminigen-history", {
            body: { uuid },
          });

          if (fnError) throw new Error(fnError.message);

          const status = data?.status;

          if (status === 2) {
            cleanup();
            const url = data?.output?.[0] || data?.output_url || data?.result?.url;
            if (url) {
              setResultUrl(url);
              setState("success");
              setProgress("");
            } else {
              setError("Geração concluída mas URL não encontrada na resposta.");
              setState("error");
              setProgress("");
            }
          } else if (status === 3) {
            cleanup();
            setError(data?.error_message || "A geração falhou.");
            setState("error");
            setProgress("");
          } else {
            setProgress(`Processando... (status: ${status ?? "aguardando"})`);
          }
        } catch (err: any) {
          cleanup();
          setError(err.message || "Erro ao consultar status.");
          setState("error");
          setProgress("");
        }
      }, 3000);
    },
    [cleanup]
  );

  const generate = useCallback(
    async (prompt: string, aspectRatio: string) => {
      cleanup();
      setState("generating");
      setResultUrl(null);
      setError(null);
      setProgress("Enviando prompt...");

      try {
        const functionName = type === "image" ? "geminigen-image" : "geminigen-video";

        const { data, error: fnError } = await supabase.functions.invoke(functionName, {
          body: { prompt, aspect_ratio: aspectRatio },
        });

        if (fnError) throw new Error(fnError.message);

        const uuid = data?.uuid || data?.id || data?.request_id;
        if (!uuid) {
          throw new Error("UUID não retornado pela API.");
        }

        pollHistory(uuid);
      } catch (err: any) {
        setError(err.message || "Erro ao iniciar geração.");
        setState("error");
        setProgress("");
      }
    },
    [type, pollHistory, cleanup]
  );

  const reset = useCallback(() => {
    cleanup();
    setState("idle");
    setResultUrl(null);
    setError(null);
    setProgress("");
  }, [cleanup]);

  return { state, resultUrl, error, progress, generate, reset };
}

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, FastForward } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ExtendVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  videoUuid: string;
  aspectRatio: string;
  resolution: string;
  model: string;
  onExtended: (newVideoUrl: string, newUuid: string) => void;
}

type ExtendState = "idle" | "generating" | "polling" | "success" | "error";

function getSimulatedProgress(elapsedMs: number): number {
  const totalEstimate = 50000;
  const ratio = elapsedMs / totalEstimate;
  return Math.max(1, Math.min(95, Math.round(100 * (1 - Math.exp(-2.5 * ratio)))));
}

export function ExtendVideoDialog({
  open,
  onOpenChange,
  videoUrl,
  videoUuid,
  aspectRatio,
  resolution,
  model,
  onExtended,
}: ExtendVideoDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<ExtendState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const cancelledRef = useRef(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const stopProgress = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      stopProgress();
    };
  }, [stopProgress]);

  useEffect(() => {
    if (open) {
      setPrompt("");
      setState("idle");
      setError(null);
      setProgress(0);
      setStatusText("");
      cancelledRef.current = false;
    } else {
      cancelledRef.current = true;
      stopProgress();
    }
  }, [open, stopProgress]);

  const pollHistory = useCallback(async (uuid: string): Promise<string | null> => {
    const maxAttempts = 120;
    const interval = 5000;
    let consecutiveErrors = 0;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (cancelledRef.current) return null;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) throw new Error("Sessão expirada.");

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
        const data = await res.json();
        if (!data) throw new Error("Resposta inválida.");
        consecutiveErrors = 0;

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
          throw new Error(data.error_message || "Falha ao estender vídeo.");
        }
      } catch (err: any) {
        consecutiveErrors++;
        if (consecutiveErrors >= 12) throw new Error("Conexão perdida.");
        const backoff = Math.min(interval * Math.pow(1.5, consecutiveErrors - 1), 30000);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }

      await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error("Tempo limite excedido.");
  }, []);

  const handleExtend = useCallback(async () => {
    if (!prompt.trim() || !videoUuid) return;
    cancelledRef.current = false;
    setState("generating");
    setError(null);
    setProgress(0);
    setStatusText("Enviando solicitação de extensão...");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/geminigen-video-extend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ref_history: videoUuid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const newUuid = data?.uuid;
      if (!newUuid) throw new Error("UUID da geração não retornado.");

      setState("polling");
      startTimeRef.current = Date.now();
      progressTimerRef.current = setInterval(() => {
        if (cancelledRef.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const sim = getSimulatedProgress(elapsed);
        setProgress(sim);
        setStatusText(`Gerando continuação... ${sim}%`);
      }, 300);

      const extensionUrl = await pollHistory(newUuid);
      stopProgress();

      if (cancelledRef.current) return;
      if (!extensionUrl) throw new Error("URL do resultado não encontrada.");

      setProgress(100);
      setState("success");
      setStatusText("Vídeo estendido pronto!");
      onExtended(extensionUrl, newUuid);
      setTimeout(() => onOpenChange(false), 800);
    } catch (err: any) {
      stopProgress();
      if (cancelledRef.current) return;
      setError(err.message || "Erro inesperado.");
      setState("error");
      setStatusText("");
    }
  }, [prompt, videoUrl, videoUuid, pollHistory, stopProgress, onExtended, onOpenChange]);

  const isLoading = state === "generating" || state === "polling";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isLoading) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <FastForward className="h-5 w-5 text-primary" />
            Continuar este vídeo
          </DialogTitle>
          <DialogDescription>
            Descreva a continuação do vídeo gerado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className={`overflow-hidden rounded-xl border border-border/30 bg-muted/20 ${aspectRatio === "9:16" ? "aspect-[9/16] max-w-[200px] mx-auto" : "aspect-video"}`}>
            <video src={videoUrl} className="h-full w-full object-cover" muted loop autoPlay playsInline />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              {aspectRatio}
            </Badge>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              {resolution}
            </Badge>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              {model}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <Textarea
              placeholder="Descreva como o vídeo deve continuar..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              maxLength={4000}
              className="min-h-[80px] resize-none border-border/40 bg-muted/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/40 text-sm"
            />
            <p className={`text-xs text-right ${prompt.length > 3600 ? "text-destructive" : "text-muted-foreground"}`}>
              {prompt.length}/4000
            </p>
          </div>

          {isLoading && statusText && (
            <div className="space-y-2 rounded-lg border border-border/30 bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{statusText}</p>
              </div>
              {progress > 0 && <Progress value={progress} className="h-1.5" />}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleExtend}
            disabled={!prompt.trim() || isLoading}
            className="w-full h-10 rounded-lg bg-gradient-to-r from-primary/80 to-primary text-primary-foreground hover:from-primary hover:to-primary/90 shadow-[0_0_15px_hsl(196_89%_61%/0.3)]"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Gerando continuação...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Gerar continuação</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

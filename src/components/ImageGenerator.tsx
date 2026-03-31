import { useState, useRef } from "react";
import { Sparkles, Download, RotateCcw, AlertCircle, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useImageGenerator } from "@/hooks/useImageGenerator";
import { useCooldown } from "@/hooks/useCooldown";
import { supabase } from "@/integrations/supabase/client";

const models = [
  { value: "nano-banana-2", label: "Nano Banana 2" },
  { value: "nano-banana-pro", label: "Nano Banana Pro" },
];

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("nano-banana-2");
  const { state, resultUrl, error, progress, statusText, generate, reset } = useImageGenerator();
  const { isCooling, remainingSeconds, startCooldown } = useCooldown({ key: "ph_image_cooldown", durationMs: 90000 });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    startCooldown();
    generate({ prompt: prompt.trim(), model });
  };

  const isProcessing = state === "generating" || state === "polling";

  const formatCooldown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Prompt Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Prompt</label>
        <Textarea
          placeholder="Descreva a imagem que deseja gerar..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isProcessing}
          maxLength={2000}
          className="min-h-[120px] bg-card/50 border-border/50 backdrop-blur-sm resize-none focus:border-primary/50"
        />
        <p className={`text-xs text-right ${prompt.length > 1800 ? "text-destructive" : "text-muted-foreground"}`}>
          {prompt.length}/2000
        </p>
      </div>

      {/* Model Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Modelo</label>
        <Select value={model} onValueChange={setModel} disabled={isProcessing}>
          <SelectTrigger className="bg-card/50 border-border/50 backdrop-blur-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isProcessing || !prompt.trim() || isCooling}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Gerando...
          </>
        ) : isCooling ? (
          <>Aguarde {formatCooldown(remainingSeconds)}</>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Gerar Imagem
          </>
        )}
      </Button>

      {/* Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">{statusText}</p>
        </div>
      )}

      {/* Error */}
      {state === "error" && error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" className="mt-2 text-destructive hover:text-destructive" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" /> Tentar novamente
            </Button>
          </div>
        </div>
      )}

      {/* Result */}
      {state === "success" && resultUrl && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card/30">
            <img src={resultUrl} alt="Imagem gerada" className="w-full h-auto" />
          </div>
          <div className="flex gap-3">
            <Button asChild className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <a href={resultUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" /> Download
              </a>
            </Button>
            <Button variant="outline" className="border-border/50" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Nova Imagem
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

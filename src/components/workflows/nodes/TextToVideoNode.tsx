import { useState } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { useAuth } from "@/hooks/useAuth";
import { WorkflowCard } from "../WorkflowCard";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Film, Loader2, Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { GROK_ASPECT_OPTIONS, GROK_DURATION_OPTIONS, GROK_MODE_OPTIONS, GROK_VALID_ASPECTS } from "./grok-options";

interface NodeProps {
  id: string;
  x: number;
  y: number;
  onRemove: () => void;
}

const VEO_MODELS = [
  { value: "veo-3-fast", label: "Veo 3 Fast", pro: false },
  { value: "veo-3.1-fast", label: "Veo 3.1 Fast", pro: false },
  { value: "grok-3", label: "Grok 3", pro: true },
];

export function TextToVideoNode({ id, x, y, onRemove }: NodeProps) {
  const { profile, isAdmin } = useAuth();
  const isPro = (profile?.plan === "pro" && profile?.status === "approved") || isAdmin;

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("veo-3-fast");
  const [aspect, setAspect] = useState("9:16");
  const [resolution, setResolution] = useState("720p");
  const [grokMode, setGrokMode] = useState("normal");
  const [grokDuration, setGrokDuration] = useState("6");

  const isGrok = model === "grok-3";

  const { state, resultUrl, error, progress, statusText, generate } = useGenerator();
  const isLoading = state === "generating" || state === "polling";

  const handleModelChange = (v: string) => {
    if (v === "grok-3" && !isPro) {
      toast.error("O modelo Grok 3 está disponível apenas no plano Pro.");
      return;
    }
    setModel(v);
    if (v === "grok-3") {
      if (!GROK_VALID_ASPECTS.includes(aspect)) setAspect("9:16");
      setResolution("720p");
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim() || isLoading) return;
    if (isGrok && !isPro) {
      toast.error("O modelo Grok 3 está disponível apenas no plano Pro.");
      return;
    }
    generate({
      prompt: prompt.trim(),
      aspectRatio: aspect,
      resolution: isGrok ? "720p" : resolution,
      model,
      modeImage: "none",
      duration: isGrok ? grokDuration : "8",
      ...(isGrok ? { mode: grokMode } : {}),
    });
  };

  return (
    <WorkflowCard
      id={id}
      x={x}
      y={y}
      title="Texto → Vídeo"
      icon={<Film className="h-4 w-4 text-primary" />}
      onRemove={onRemove}
    >
      <Textarea
        placeholder="Descreva o vídeo que deseja gerar..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value.slice(0, 4000))}
        rows={4}
        disabled={isLoading}
        className="resize-none"
      />

      <Select value={model} onValueChange={handleModelChange} disabled={isLoading}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {VEO_MODELS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              <span className="flex items-center gap-1.5">
                {m.label}
                {m.pro && !isPro && <Lock className="h-3 w-3 text-amber-500" />}
                {m.pro && <span className="text-[10px] text-amber-500">Pro</span>}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isGrok ? (
        <div className="grid grid-cols-2 gap-2">
          <Select value={aspect} onValueChange={setAspect} disabled={isLoading}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GROK_ASPECT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={grokDuration} onValueChange={setGrokDuration} disabled={isLoading}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GROK_DURATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={grokMode} onValueChange={setGrokMode} disabled={isLoading}>
            <SelectTrigger className="h-9 col-span-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GROK_MODE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>Modo: {o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Select value={aspect} onValueChange={setAspect} disabled={isLoading}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="9:16">Vertical 9:16</SelectItem>
              <SelectItem value="16:9">Horizontal 16:9</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resolution} onValueChange={setResolution} disabled={isLoading}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="720p">720p</SelectItem>
              <SelectItem value="1080p">1080p</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading || (isGrok && !isPro)}
        className="w-full"
        size="sm"
      >
        {isLoading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-2" /> Gerar Vídeo</>
        )}
      </Button>

      {isLoading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">{statusText}</p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {resultUrl && (
        <video src={resultUrl} controls className="w-full rounded-md border border-primary/20" />
      )}
    </WorkflowCard>
  );
}
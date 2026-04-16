import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCooldown } from "@/hooks/useCooldown";
import { useDailyGenerationCount } from "@/hooks/useDailyGenerationCount";
import { useStoryboardGenerator, StoryboardScene } from "@/hooks/useStoryboardGenerator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, Plus, Trash2, RotateCcw, Download, Monitor, Smartphone, Square, Clock, Film } from "lucide-react";
import { toast } from "sonner";

const MAX_TOTAL = 45;
const MAX_SCENES = 10;
const MIN_SCENES = 2;

interface SceneState extends StoryboardScene {
  id: string;
}

const ASPECT_OPTIONS = [
  { value: "landscape", label: "Landscape", icon: Monitor },
  { value: "portrait", label: "Portrait", icon: Smartphone },
  { value: "square", label: "Square", icon: Square },
] as const;

const newScene = (duration: 6 | 10 = 6): SceneState => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  prompt: "",
  duration,
});

export function StoryboardGenerator() {
  const { profile, isAdmin } = useAuth();
  const canAccess = isAdmin || profile?.plan === "pro";

  const [scenes, setScenes] = useState<SceneState[]>([newScene(6), newScene(6)]);
  const [aspectRatio, setAspectRatio] = useState<"landscape" | "portrait" | "square">("landscape");
  const [resolution, setResolution] = useState<"480p" | "720p">("720p");

  const { isCooling, remainingSeconds, startCooldown } = useCooldown({ key: "ph_storyboard_cooldown", durationMs: 90000 });
  const { count: dailyCount, limit: dailyLimit, isLimitReached } = useDailyGenerationCount("video");

  const { state, resultUrl, error, progress, statusText, generate, reset } = useStoryboardGenerator();
  const isLoading = state === "generating" || state === "polling";

  const totalDuration = scenes.reduce((s, x) => s + x.duration, 0);
  const allFilled = scenes.every(s => s.prompt.trim().length > 0);

  const updateScene = (id: string, patch: Partial<SceneState>) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const addScene = () => {
    if (scenes.length >= MAX_SCENES) return;
    const next = newScene(6);
    if (totalDuration + 6 > MAX_TOTAL) {
      toast.error(`Duração máxima de ${MAX_TOTAL}s seria excedida.`);
      return;
    }
    setScenes(prev => [...prev, next]);
  };

  const removeScene = (id: string) => {
    if (scenes.length <= MIN_SCENES) {
      toast.error(`Mínimo de ${MIN_SCENES} cenas.`);
      return;
    }
    setScenes(prev => prev.filter(s => s.id !== id));
  };

  const setSceneDuration = (id: string, d: 6 | 10) => {
    const target = scenes.find(s => s.id === id);
    if (!target) return;
    const newTotal = totalDuration - target.duration + d;
    if (newTotal > MAX_TOTAL) {
      toast.error(`Duração total não pode ultrapassar ${MAX_TOTAL}s.`);
      return;
    }
    updateScene(id, { duration: d });
  };

  const handleGenerate = () => {
    if (!canAccess) {
      toast.error("Storyboard disponível apenas no plano Pro.");
      return;
    }
    if (!allFilled) {
      toast.error("Preencha o prompt de todas as cenas.");
      return;
    }
    if (totalDuration > MAX_TOTAL) {
      toast.error(`Duração total excede ${MAX_TOTAL}s.`);
      return;
    }
    startCooldown();
    generate({
      scenes: scenes.map(({ prompt, duration }) => ({ prompt: prompt.trim(), duration })),
      aspect_ratio: aspectRatio,
      resolution,
    });
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const r = await fetch(resultUrl);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "storyboard.mp4";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(resultUrl, "_blank");
    }
  };

  const canGenerate = allFilled && !isLoading && !isCooling && !isLimitReached && canAccess;
  const formatCool = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`;

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 space-y-4">
        {/* Scenes */}
        <div className="space-y-3">
          {scenes.map((scene, idx) => (
            <div key={scene.id} className="rounded-xl border border-border/40 bg-background/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
                    {idx + 1}
                  </div>
                  <span className="text-xs font-medium text-foreground">Cena {idx + 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleGroup
                    type="single"
                    value={String(scene.duration)}
                    onValueChange={(v) => v && setSceneDuration(scene.id, Number(v) as 6 | 10)}
                    className="gap-1"
                  >
                    <ToggleGroupItem value="6" className="h-7 px-2 text-[11px] data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-border/40">
                      <Clock className="h-3 w-3 mr-1" /> 6s
                    </ToggleGroupItem>
                    <ToggleGroupItem value="10" className="h-7 px-2 text-[11px] data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-border/40">
                      <Clock className="h-3 w-3 mr-1" /> 10s
                    </ToggleGroupItem>
                  </ToggleGroup>
                  {scenes.length > MIN_SCENES && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeScene(scene.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                placeholder={`Descreva a cena ${idx + 1}...`}
                value={scene.prompt}
                onChange={(e) => updateScene(scene.id, { prompt: e.target.value })}
                disabled={isLoading}
                maxLength={4000}
                className="min-h-[60px] resize-none text-sm bg-transparent"
              />
            </div>
          ))}

          {scenes.length < MAX_SCENES && (
            <Button
              variant="outline" size="sm"
              onClick={addScene}
              disabled={isLoading || totalDuration + 6 > MAX_TOTAL}
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar Cena
            </Button>
          )}
        </div>

        {/* Total duration progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Duração total</span>
            <span className={totalDuration > MAX_TOTAL ? "text-destructive font-medium" : "text-foreground font-medium"}>
              {totalDuration}s / {MAX_TOTAL}s
            </span>
          </div>
          <Progress value={(totalDuration / MAX_TOTAL) * 100} className="h-1.5" />
        </div>

        {/* Aspect ratio */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Orientação</p>
          <ToggleGroup
            type="single"
            value={aspectRatio}
            onValueChange={(v) => v && setAspectRatio(v as any)}
            className="justify-start gap-1"
          >
            {ASPECT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <ToggleGroupItem
                  key={opt.value} value={opt.value}
                  className="text-xs px-3 h-8 rounded-lg data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-border/40"
                >
                  <Icon className="h-3.5 w-3.5 mr-1" /> {opt.label}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>

        {/* Resolution */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Resolução</p>
          <ToggleGroup
            type="single"
            value={resolution}
            onValueChange={(v) => v && setResolution(v as any)}
            className="justify-start gap-1"
          >
            <ToggleGroupItem value="480p" className="text-xs px-3 h-8 rounded-lg data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-border/40">480p</ToggleGroupItem>
            <ToggleGroupItem value="720p" className="text-xs px-3 h-8 rounded-lg data-[state=on]:bg-primary/20 data-[state=on]:text-primary border border-border/40">720p</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {!isAdmin && (
          <p className={`text-xs font-medium text-right ${isLimitReached ? "text-destructive" : "text-muted-foreground"}`}>
            {dailyCount}/{dailyLimit} gerações hoje
          </p>
        )}

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando storyboard...</>
          ) : isCooling ? (
            <>Aguarde {formatCool(remainingSeconds)}</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Gerar Storyboard ({totalDuration}s)</>
          )}
        </Button>
      </div>

      {/* Progress */}
      {isLoading && (
        <div className="rounded-2xl border border-border/50 bg-card/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{statusText}</span>
            <span className="text-foreground font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Error */}
      {state === "error" && error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 space-y-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Tentar novamente
          </Button>
        </div>
      )}

      {/* Result */}
      {state === "success" && resultUrl && (
        <div className="rounded-2xl border border-border/50 bg-card/60 p-3 space-y-3">
          <video
            src={resultUrl}
            controls
            autoPlay
            loop
            className="w-full rounded-xl bg-black"
          />
          <div className="flex gap-2">
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-1" /> Baixar Storyboard
            </Button>
            <Button variant="outline" onClick={reset}>
              <Film className="h-4 w-4 mr-1" /> Novo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { useCooldown } from "@/hooks/useCooldown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { ExtendVideoDialog } from "@/components/ExtendVideoDialog";
import { SequentialVideoPlayer } from "@/components/SequentialVideoPlayer";
import { Sparkles, Loader2, RotateCcw, X, Upload, Film, ImageIcon, Cpu, Layers, Download, FastForward } from "lucide-react";
type ModeImage = "none" | "ingredient";

const MODEL_OPTIONS = [
  { value: "veo-3-fast", label: "Veo 3 Fast" },
  { value: "veo-3.1-fast", label: "Veo 3.1 Fast" },
];

const MODE_LIMITS: Record<ModeImage, number> = {
  none: 0,
  ingredient: 3,
};

export function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [model, setModel] = useState("veo-3.1-fast");
  const [modeImage, setModeImage] = useState<ModeImage>("none");
  const [extendOpen, setExtendOpen] = useState(false);
  const [videoSegments, setVideoSegments] = useState<string[]>([]);

  const [refImages, setRefImages] = useState<File[]>([]);
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state, resultUrl, resultUuid, error, progress, statusText, generate, reset, setSuccessState } = useGenerator();
  const { isCooling, remainingSeconds, startCooldown } = useCooldown({ key: "ph_video_cooldown", durationMs: 90000 });

  const isLoading = state === "generating" || state === "polling";
  const maxImages = MODE_LIMITS[modeImage];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && refImages.length < maxImages) {
      setRefImages((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => setRefPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setRefImages((prev) => prev.filter((_, i) => i !== index));
    setRefPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setRefImages([]);
    setRefPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleModeChange = (val: string) => {
    if (!val) return;
    setModeImage(val as ModeImage);
    clearAllFiles();
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    startCooldown();
    generate({
      prompt: prompt.trim(),
      aspectRatio,
      resolution,
      model,
      modeImage: refImages.length > 0 ? modeImage : "none",
      refImages,
    });
  };

  const canGenerate = prompt.trim().length > 0 && !isLoading && !isCooling;

  const formatCooldown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 space-y-3 transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_20px_hsl(196_89%_61%/0.1)]">
        <Textarea
          placeholder="Descreva o vídeo que deseja gerar..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          maxLength={4000}
          className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
        />
        <p className={`text-xs text-right ${prompt.length > 3600 ? "text-destructive" : "text-muted-foreground"}`}>
          {prompt.length}/4000
        </p>

        {/* Model selector */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Cpu className="h-3 w-3" /> Modelo
          </p>
          <ToggleGroup
            type="single"
            value={model}
            onValueChange={(v) => v && setModel(v)}
            className="justify-start gap-1"
          >
            {MODEL_OPTIONS.map((opt) => (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                className="text-xs px-3 h-8 rounded-lg data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/30 border border-border/40"
              >
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Image Reference Type selector */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" /> Image Reference Type
          </p>
          <ToggleGroup
            type="single"
            value={modeImage}
            onValueChange={handleModeChange}
            className="justify-start gap-1"
          >
            <ToggleGroupItem
              value="none"
              className="text-xs px-3 h-8 rounded-lg data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/30 border border-border/40"
            >
              <Film className="h-3.5 w-3.5 mr-1" />
              Sem referência
            </ToggleGroupItem>
            <ToggleGroupItem
              value="ingredient"
              className="text-xs px-3 h-8 rounded-lg data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/30 border border-border/40"
            >
              <ImageIcon className="h-3.5 w-3.5 mr-1" />
              Ingredient Images
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Reference Images upload */}
        {modeImage !== "none" && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-1">
              Ingredient Images — <span className="text-muted-foreground/70">Envie até 3 imagens de referência como ingredientes</span>
            </p>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <div className="flex gap-2 flex-wrap">
              {refPreviews.map((preview, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-border/50 w-24 h-24 bg-muted/20">
                  <img src={preview} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {refImages.length < maxImages && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px]">Upload</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <ToggleGroup type="single" value={aspectRatio} onValueChange={(v) => v && setAspectRatio(v)} className="gap-1">
              <ToggleGroupItem value="16:9" className="text-xs px-3 h-9 rounded-lg data-[state=on]:bg-muted data-[state=on]:text-foreground">16:9</ToggleGroupItem>
              <ToggleGroupItem value="9:16" className="text-xs px-3 h-9 rounded-lg data-[state=on]:bg-muted data-[state=on]:text-foreground">9:16</ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup type="single" value={resolution} onValueChange={(v) => v && setResolution(v)} className="gap-1">
              <ToggleGroupItem value="720p" className="text-xs px-3 h-9 rounded-lg data-[state=on]:bg-muted data-[state=on]:text-foreground">720p</ToggleGroupItem>
              <ToggleGroupItem value="1080p" className="text-xs px-3 h-9 rounded-lg data-[state=on]:bg-muted data-[state=on]:text-foreground">1080p</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {state !== "idle" && (
              <Button variant="outline" size="sm" onClick={reset} disabled={isLoading} className="h-9 w-9 p-0 rounded-lg border-border/50">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="h-9 rounded-lg bg-gradient-to-r from-primary/80 to-primary px-5 text-primary-foreground hover:from-primary hover:to-primary/90 shadow-[0_0_15px_hsl(196_89%_61%/0.3)]"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
              ) : isCooling ? (
                <>Aguarde {formatCooldown(remainingSeconds)}</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Gerar</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      {isLoading && statusText && (
        <div className="space-y-2 rounded-xl border border-border/30 bg-card/40 p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{statusText}</p>
          </div>
          {progress > 0 && <Progress value={progress} className="h-1.5" />}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Result */}
      {state === "success" && resultUrl && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">{statusText}</p>
          <SequentialVideoPlayer
            segments={videoSegments.length > 0 ? videoSegments : [resultUrl]}
            aspectRatio={aspectRatio}
          />
          <div className="flex gap-3 flex-wrap">
            <Button asChild className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <a href={resultUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" /> Download
              </a>
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setExtendOpen(true)}
            >
              <FastForward className="h-4 w-4 mr-2" /> Estender Vídeo
            </Button>
            <Button variant="outline" className="border-border/50" onClick={() => { reset(); setVideoSegments([]); }}>
              <RotateCcw className="h-4 w-4 mr-2" /> Novo Vídeo
            </Button>
          </div>

          <ExtendVideoDialog
            open={extendOpen}
            onOpenChange={setExtendOpen}
            videoUrl={resultUrl}
            videoUuid={resultUuid || ""}
            aspectRatio={aspectRatio}
            resolution={resolution}
            model={model}
            onExtended={(newUrl, newUuid) => {
              setVideoSegments(prev => {
                const segments = prev.length > 0 ? prev : [resultUrl!];
                return [...segments, newUrl];
              });
              setSuccessState(newUrl, newUuid);
            }}
          />
        </div>
      )}
    </div>
  );
}

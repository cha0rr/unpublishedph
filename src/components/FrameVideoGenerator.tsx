import { useState, useRef } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, RotateCcw, Upload, X, Cpu } from "lucide-react";

const MODEL_OPTIONS = [
  { value: "veo-3-fast", label: "Veo 3 Fast" },
  { value: "veo-3.1", label: "Veo 3.1" },
  { value: "veo-3.1-fast", label: "Veo 3.1 Fast" },
];

export function FrameVideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [model, setModel] = useState("veo-3.1-fast");
  const [firstFrame, setFirstFrame] = useState<File | null>(null);
  const [lastFrame, setLastFrame] = useState<File | null>(null);
  const [firstPreview, setFirstPreview] = useState<string | null>(null);
  const [lastPreview, setLastPreview] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const lastInputRef = useRef<HTMLInputElement>(null);

  const { state, resultUrl, error, progress, statusText, generate, reset } = useGenerator();

  const isLoading = state === "generating" || state === "polling";

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleGenerate = () => {
    if (!prompt.trim() || !firstFrame || !lastFrame) return;
    const files: File[] = [firstFrame, lastFrame];
    generate({ prompt: prompt.trim(), aspectRatio, resolution, model, modeImage: "frame", files });
  };

  return (
    <div className="w-full space-y-4">
      {/* Frame uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Frame Inicial</label>
          <input ref={firstInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, setFirstFrame, setFirstPreview)} className="hidden" />
          {firstPreview ? (
            <div className="relative group rounded-xl overflow-hidden border border-border/50 aspect-video bg-card/40">
              <img src={firstPreview} alt="Frame inicial" className="w-full h-full object-cover" />
              <button onClick={() => removeFile(setFirstFrame, setFirstPreview, firstInputRef)} className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
          ) : (
            <button onClick={() => firstInputRef.current?.click()} disabled={isLoading} className="flex flex-col items-center justify-center gap-2 w-full aspect-video rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors disabled:opacity-50">
              <Upload className="h-6 w-6" />
              <span className="text-xs">Upload</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Frame Final</label>
          <input ref={lastInputRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e, setLastFrame, setLastPreview)} className="hidden" />
          {lastPreview ? (
            <div className="relative group rounded-xl overflow-hidden border border-border/50 aspect-video bg-card/40">
              <img src={lastPreview} alt="Frame final" className="w-full h-full object-cover" />
              <button onClick={() => removeFile(setLastFrame, setLastPreview, lastInputRef)} className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
          ) : (
            <button onClick={() => lastInputRef.current?.click()} disabled={isLoading} className="flex flex-col items-center justify-center gap-2 w-full aspect-video rounded-xl border border-dashed border-border/50 bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors disabled:opacity-50">
              <Upload className="h-6 w-6" />
              <span className="text-xs">Upload</span>
            </button>
          )}
        </div>
      </div>

      {/* Prompt + controls */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 space-y-3 transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_20px_hsl(196_89%_61%/0.1)]">
        <Textarea
          placeholder="Descreva o movimento entre os frames..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
        />

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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
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
              disabled={isLoading || !prompt.trim() || !firstFrame || !lastFrame}
              className="h-9 rounded-lg bg-gradient-to-r from-primary/80 to-primary px-5 text-primary-foreground hover:from-primary hover:to-primary/90 shadow-[0_0_15px_hsl(196_89%_61%/0.3)]"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
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
          <div className={`overflow-hidden rounded-xl border border-border/30 bg-card/40 ${aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16] max-w-sm mx-auto"}`}>
            <video src={resultUrl} controls autoPlay loop className="h-full w-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}

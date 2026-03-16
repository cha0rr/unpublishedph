import { useState, useRef } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, RotateCcw, X, Upload, Film, ImageIcon } from "lucide-react";

type ModeImage = "none" | "ingredient" | "frame";

export function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");
  const [modeImage, setModeImage] = useState<ModeImage>("none");

  // Ingredient mode: single image
  const [ingredientFile, setIngredientFile] = useState<File | null>(null);
  const [ingredientPreview, setIngredientPreview] = useState<string | null>(null);
  const ingredientInputRef = useRef<HTMLInputElement>(null);

  // Frame mode: start + optional end
  const [frameStartFile, setFrameStartFile] = useState<File | null>(null);
  const [frameStartPreview, setFrameStartPreview] = useState<string | null>(null);
  const [frameEndFile, setFrameEndFile] = useState<File | null>(null);
  const [frameEndPreview, setFrameEndPreview] = useState<string | null>(null);
  const frameStartInputRef = useRef<HTMLInputElement>(null);
  const frameEndInputRef = useRef<HTMLInputElement>(null);

  const { state, resultUrl, error, progress, statusText, generate, reset } = useGenerator();

  const isLoading = state === "generating" || state === "polling";

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleModeChange = (val: string) => {
    if (!val) return;
    setModeImage(val as ModeImage);
    // Clear files when switching modes
    clearFile(setIngredientFile, setIngredientPreview, ingredientInputRef);
    clearFile(setFrameStartFile, setFrameStartPreview, frameStartInputRef);
    clearFile(setFrameEndFile, setFrameEndPreview, frameEndInputRef);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    const files: File[] = [];
    if (modeImage === "ingredient" && ingredientFile) {
      files.push(ingredientFile);
    } else if (modeImage === "frame") {
      if (frameStartFile) files.push(frameStartFile);
      if (frameEndFile) files.push(frameEndFile);
    }
    generate({ prompt: prompt.trim(), aspectRatio, resolution, modeImage, files });
  };

  const canGenerate = prompt.trim().length > 0 && !isLoading;

  const ImageUploadSlot = ({
    label,
    preview,
    inputRef,
    onSelect,
    onClear,
  }: {
    label: string;
    preview: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onClear: () => void;
  }) => (
    <div className="flex-1">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <input ref={inputRef} type="file" accept="image/*" onChange={onSelect} className="hidden" />
      {preview ? (
        <div className="relative group rounded-xl overflow-hidden border border-border/50 aspect-video bg-muted/20">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-1.5 right-1.5 flex items-center justify-center h-6 w-6 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-border/40 bg-muted/10 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs">Upload</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-4">
      {/* Main input area */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 space-y-3 transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_20px_hsl(196_89%_61%/0.1)]">
        <Textarea
          placeholder="Descreva o vídeo que deseja gerar..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
        />

        {/* Mode selector */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Modo de referência</p>
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
              Ingrediente
            </ToggleGroupItem>
            <ToggleGroupItem
              value="frame"
              className="text-xs px-3 h-8 rounded-lg data-[state=on]:bg-primary/20 data-[state=on]:text-primary data-[state=on]:border-primary/30 border border-border/40"
            >
              <Film className="h-3.5 w-3.5 mr-1" />
              Frame
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Conditional upload areas */}
        {modeImage === "ingredient" && (
          <div className="max-w-xs">
            <ImageUploadSlot
              label="Imagem de referência"
              preview={ingredientPreview}
              inputRef={ingredientInputRef}
              onSelect={(e) => handleFileSelect(e, setIngredientFile, setIngredientPreview)}
              onClear={() => clearFile(setIngredientFile, setIngredientPreview, ingredientInputRef)}
            />
          </div>
        )}

        {modeImage === "frame" && (
          <div className="flex gap-3">
            <ImageUploadSlot
              label="Frame Inicial"
              preview={frameStartPreview}
              inputRef={frameStartInputRef}
              onSelect={(e) => handleFileSelect(e, setFrameStartFile, setFrameStartPreview)}
              onClear={() => clearFile(setFrameStartFile, setFrameStartPreview, frameStartInputRef)}
            />
            <ImageUploadSlot
              label="Frame Final (opcional)"
              preview={frameEndPreview}
              inputRef={frameEndInputRef}
              onSelect={(e) => handleFileSelect(e, setFrameEndFile, setFrameEndPreview)}
              onClear={() => clearFile(setFrameEndFile, setFrameEndPreview, frameEndInputRef)}
            />
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <ToggleGroup
              type="single"
              value={aspectRatio}
              onValueChange={(v) => v && setAspectRatio(v)}
              className="gap-1"
            >
              <ToggleGroupItem
                value="16:9"
                className="text-xs px-3 h-9 rounded-lg data-[state=on]:bg-muted data-[state=on]:text-foreground"
              >
                16:9
              </ToggleGroupItem>
              <ToggleGroupItem
                value="9:16"
                className="text-xs px-3 h-9 rounded-lg data-[state=on]:bg-muted data-[state=on]:text-foreground"
              >
                9:16
              </ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup
              type="single"
              value={resolution}
              onValueChange={(v) => v && setResolution(v)}
              className="gap-1"
            >
              <ToggleGroupItem
                value="720p"
                className="text-xs px-3 h-9 rounded-lg data-[state=on]:bg-muted data-[state=on]:text-foreground"
              >
                720p
              </ToggleGroupItem>
              <ToggleGroupItem
                value="1080p"
                className="text-xs px-3 h-9 rounded-lg data-[state=on]:bg-muted data-[state=on]:text-foreground"
              >
                1080p
              </ToggleGroupItem>
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
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar
                </>
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
          <div
            className={`overflow-hidden rounded-xl border border-border/30 bg-card/40 ${
              aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16] max-w-sm mx-auto"
            }`}
          >
            <video src={resultUrl} controls autoPlay loop className="h-full w-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );
}

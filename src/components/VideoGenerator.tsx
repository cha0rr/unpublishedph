import { useState, useRef } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, RotateCcw, Plus, X, Image as ImageIcon } from "lucide-react";

export function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, resultUrl, error, progress, statusText, generate, reset } = useGenerator({ type: "video" });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generate(prompt.trim(), aspectRatio, referenceImage ?? undefined);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setReferencePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReferenceImage(null);
    setReferencePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isLoading = state === "generating" || state === "polling";

  return (
    <div className="w-full space-y-4">
      {/* Main input area */}
      <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 space-y-3 transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_20px_hsl(196_89%_61%/0.1)]">
        <Textarea
          placeholder="Digite suas ideias aqui..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          className="min-h-[80px] resize-none border-0 bg-transparent p-0 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
        />

        {/* Reference image preview */}
        {referencePreview && (
          <div className="flex items-start gap-2">
            <div className="relative group rounded-lg overflow-hidden border border-border/50 w-20 h-20">
              <img src={referencePreview} alt="Referência" className="w-full h-full object-cover" />
              <button
                onClick={removeImage}
                className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>
            <span className="text-xs text-muted-foreground mt-1">Imagem de referência</span>
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
              title="Adicionar imagem de referência"
            >
              {referenceImage ? <ImageIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>

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
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {state !== "idle" && (
              <Button variant="outline" size="sm" onClick={reset} disabled={isLoading} className="h-9 w-9 p-0 rounded-lg border-border/50">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
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

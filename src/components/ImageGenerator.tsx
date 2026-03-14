import { useState } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ImageIcon, Loader2, RotateCcw } from "lucide-react";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const { state, resultUrl, error, progress, generate, reset } = useGenerator({ type: "image" });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generate(prompt.trim(), aspectRatio);
  };

  const isLoading = state === "generating" || state === "polling";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="h-5 w-5" />
          Gerar Imagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Descreva a imagem que deseja gerar..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          className="min-h-[100px] resize-none"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Proporção</p>
            <ToggleGroup
              type="single"
              value={aspectRatio}
              onValueChange={(v) => v && setAspectRatio(v)}
              className="justify-start"
            >
              <ToggleGroupItem value="16:9" className="text-xs px-3">
                16:9
              </ToggleGroupItem>
              <ToggleGroupItem value="9:16" className="text-xs px-3">
                9:16
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex gap-2">
            {state !== "idle" && (
              <Button variant="outline" size="sm" onClick={reset} disabled={isLoading}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                "Gerar"
              )}
            </Button>
          </div>
        </div>

        {progress && (
          <div className="flex items-center gap-2 rounded-md bg-muted p-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{progress}</p>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {state === "success" && resultUrl && (
          <div
            className={`overflow-hidden rounded-lg border bg-muted ${
              aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16] max-w-sm mx-auto"
            }`}
          >
            <img
              src={resultUrl}
              alt="Imagem gerada"
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

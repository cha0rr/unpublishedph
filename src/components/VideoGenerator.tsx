import { useState } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { VideoIcon, Loader2, RotateCcw } from "lucide-react";

export function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const { state, resultUrl, error, progress, statusText, generate, reset } = useGenerator({ type: "video" });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    generate(prompt.trim(), aspectRatio);
  };

  const isLoading = state === "generating" || state === "polling";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <VideoIcon className="h-5 w-5" />
          Gerar Vídeo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Descreva o vídeo que deseja gerar..."
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
              <ToggleGroupItem value="16:9" className="text-xs px-3">16:9</ToggleGroupItem>
              <ToggleGroupItem value="9:16" className="text-xs px-3">9:16</ToggleGroupItem>
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

        {isLoading && statusText && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{statusText}</p>
            </div>
            {progress > 0 && <Progress value={progress} className="h-2" />}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {state === "success" && resultUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{statusText}</p>
            <div
              className={`overflow-hidden rounded-lg border bg-muted ${
                aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16] max-w-sm mx-auto"
              }`}
            >
              <video src={resultUrl} controls autoPlay loop className="h-full w-full object-cover" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

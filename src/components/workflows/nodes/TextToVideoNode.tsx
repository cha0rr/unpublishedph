import { useState } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { WorkflowCard } from "../WorkflowCard";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Film, Loader2, Sparkles } from "lucide-react";

interface NodeProps {
  id: string;
  x: number;
  y: number;
  onRemove: () => void;
}

/** Único modelo disponível (SnapGen). */
const MODEL = "veo-3.1-fast";

export function TextToVideoNode({ id, x, y, onRemove }: NodeProps) {
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("9:16");
  const [resolution, setResolution] = useState("720p");

  const { state, resultUrl, error, progress, statusText, generate } = useGenerator();
  const isLoading = state === "generating" || state === "polling";

  const handleGenerate = () => {
    if (!prompt.trim() || isLoading) return;
    generate({
      prompt: prompt.trim(),
      aspectRatio: aspect,
      resolution,
      model: MODEL,
      modeImage: "none",
      duration: "8",
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

      <p className="text-[11px] text-muted-foreground">Modelo: <span className="text-foreground">Veo 3.1 Fast</span></p>

      {(

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
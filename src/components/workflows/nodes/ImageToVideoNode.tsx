import { useState } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { WorkflowCard } from "../WorkflowCard";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Video, Loader2, Sparkles, Upload, X } from "lucide-react";

interface NodeProps {
  id: string;
  x: number;
  y: number;
  onRemove: () => void;
}

export function ImageToVideoNode({ id, x, y, onRemove }: NodeProps) {
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("9:16");
  const [refImage, setRefImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { state, resultUrl, error, progress, statusText, generate } = useGenerator();
  const isLoading = state === "generating" || state === "polling";

  const handleFile = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRefImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleGenerate = () => {
    if (!prompt.trim() || !refImage || isLoading) return;
    generate({
      prompt: prompt.trim(),
      aspectRatio: aspect,
      resolution: "720p",
      model: "veo-3-fast",
      modeImage: "ingredient",
      refImages: [refImage],
      duration: "8",
    });
  };

  return (
    <WorkflowCard
      id={id}
      x={x}
      y={y}
      title="Imagem → Vídeo"
      icon={<Video className="h-4 w-4 text-primary" />}
      onRemove={onRemove}
    >
      {previewUrl ? (
        <div className="relative rounded-md overflow-hidden border border-primary/20">
          <img src={previewUrl} alt="Referência" className="w-full max-h-40 object-cover" />
          <button
            type="button"
            onClick={() => handleFile(null)}
            disabled={isLoading}
            className="absolute top-1 right-1 p-1 rounded bg-background/80 hover:bg-destructive/80 text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors py-6 cursor-pointer">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Carregar imagem de referência</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isLoading}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}

      <Textarea
        placeholder="Como a imagem deve se animar..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value.slice(0, 4000))}
        rows={3}
        disabled={isLoading}
        className="resize-none"
      />

      <Select value={aspect} onValueChange={setAspect} disabled={isLoading}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="9:16">Vertical 9:16</SelectItem>
          <SelectItem value="16:9">Horizontal 16:9</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || !refImage || isLoading}
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
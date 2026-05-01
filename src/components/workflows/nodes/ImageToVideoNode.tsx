import { useEffect, useState } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { WorkflowCard } from "../WorkflowCard";
import { useWorkflow, urlToFile } from "../WorkflowContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Video, Loader2, Sparkles, Upload, X, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";

interface NodeProps {
  id: string;
  x: number;
  y: number;
  onRemove: () => void;
}

const MODEL_OPTIONS = [
  { value: "veo-3-fast", label: "Veo 3 Fast" },
  { value: "veo-3.1-fast", label: "Veo 3.1 Fast" },
];

export function ImageToVideoNode({ id, x, y, onRemove }: NodeProps) {
  const { imageOutputs } = useWorkflow();

  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("9:16");
  const [resolution, setResolution] = useState("720p");
  const [model, setModel] = useState("veo-3-fast");
  const [refImage, setRefImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [linkedNodeId, setLinkedNodeId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const { state, resultUrl, error, progress, statusText, generate } = useGenerator();
  const isLoading = state === "generating" || state === "polling";

  // If linked source disappears (node removed), clear the link
  useEffect(() => {
    if (linkedNodeId && !imageOutputs.some((o) => o.nodeId === linkedNodeId)) {
      setLinkedNodeId(null);
      setRefImage(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [imageOutputs, linkedNodeId, previewUrl]);

  // When linked, refresh ref image whenever the source URL changes
  useEffect(() => {
    if (!linkedNodeId) return;
    const source = imageOutputs.find((o) => o.nodeId === linkedNodeId);
    if (!source) return;
    let cancelled = false;
    setLinking(true);
    urlToFile(source.url, "linked-input")
      .then((file) => {
        if (cancelled) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setRefImage(file);
        setPreviewUrl(URL.createObjectURL(file));
      })
      .catch(() => {
        if (!cancelled) toast.error("Não foi possível carregar a imagem conectada.");
      })
      .finally(() => {
        if (!cancelled) setLinking(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedNodeId, imageOutputs.find((o) => o.nodeId === linkedNodeId)?.url]);

  const handleFile = (file: File | null) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRefImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setLinkedNodeId(null);
  };

  const handleLinkChange = (value: string) => {
    if (value === "__none__") {
      setLinkedNodeId(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setRefImage(null);
      setPreviewUrl(null);
      return;
    }
    setLinkedNodeId(value);
  };

  const handleGenerate = () => {
    if (!prompt.trim() || !refImage || isLoading) return;
    generate({
      prompt: prompt.trim(),
      aspectRatio: aspect,
      resolution,
      model,
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
      {/* Connection input */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          <Link2 className="h-3 w-3" />
          Conectar imagem do canvas
        </label>
        <Select value={linkedNodeId ?? "__none__"} onValueChange={handleLinkChange} disabled={isLoading}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Nenhuma conexão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <span className="flex items-center gap-2"><Unlink className="h-3 w-3" /> Sem conexão (upload manual)</span>
            </SelectItem>
            {imageOutputs.map((o) => (
              <SelectItem key={o.nodeId} value={o.nodeId}>
                {o.nodeLabel} · {o.nodeId.slice(-5)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {imageOutputs.length === 0 && !linkedNodeId && (
          <p className="text-[10px] text-muted-foreground">
            Gere uma imagem em outro nó (Texto → Imagem ou Avatar) para conectá-la aqui.
          </p>
        )}
      </div>

      {/* Image preview / upload */}
      {linking ? (
        <div className="flex items-center justify-center gap-2 rounded-md border border-primary/20 py-6 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando imagem conectada...
        </div>
      ) : previewUrl ? (
        <div className="relative rounded-md overflow-hidden border border-primary/20">
          <img src={previewUrl} alt="Referência" className="w-full max-h-40 object-cover" />
          {linkedNodeId && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary/90 text-primary-foreground text-[10px] font-medium flex items-center gap-1">
              <Link2 className="h-2.5 w-2.5" /> Conectado
            </div>
          )}
          {!linkedNodeId && (
            <button
              type="button"
              onClick={() => handleFile(null)}
              disabled={isLoading}
              className="absolute top-1 right-1 p-1 rounded bg-background/80 hover:bg-destructive/80 text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors py-6 cursor-pointer">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Carregar imagem manualmente</span>
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

      <Select value={model} onValueChange={setModel} disabled={isLoading}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {MODEL_OPTIONS.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || !refImage || isLoading || linking}
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

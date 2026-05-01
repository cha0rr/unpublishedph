import { useEffect, useState } from "react";
import { useGenerator } from "@/hooks/useGenerator";
import { useAuth } from "@/hooks/useAuth";
import { WorkflowCard } from "../WorkflowCard";
import { NodePort } from "../NodePort";
import { useWorkflow, urlToFile } from "../WorkflowContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Video, Loader2, Sparkles, Upload, X, Link2, Lock } from "lucide-react";
import { toast } from "sonner";
import { GROK_ASPECT_OPTIONS, GROK_DURATION_OPTIONS, GROK_MODE_OPTIONS, GROK_VALID_ASPECTS } from "./grok-options";

interface NodeProps {
  id: string;
  x: number;
  y: number;
  onRemove: () => void;
}

const MODEL_OPTIONS = [
  { value: "veo-3-fast", label: "Veo 3 Fast", pro: false },
  { value: "veo-3.1-fast", label: "Veo 3.1 Fast", pro: false },
  { value: "grok-3", label: "Grok 3", pro: true },
];

export function ImageToVideoNode({ id, x, y, onRemove }: NodeProps) {
  const { profile, isAdmin } = useAuth();
  const isPro = (profile?.plan === "pro" && profile?.status === "approved") || isAdmin;
  const { imageOutputs, getConnectedSource } = useWorkflow();

  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("9:16");
  const [resolution, setResolution] = useState("720p");
  const [model, setModel] = useState("veo-3-fast");
  const [grokMode, setGrokMode] = useState("normal");
  const [grokDuration, setGrokDuration] = useState("6");

  const [refImage, setRefImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const isGrok = model === "grok-3";
  const sourceNodeId = getConnectedSource(id);
  const sourceUrl = sourceNodeId ? imageOutputs.find((o) => o.nodeId === sourceNodeId)?.url ?? null : null;

  const { state, resultUrl, error, progress, statusText, generate } = useGenerator();
  const isLoading = state === "generating" || state === "polling";

  // Refresh ref image whenever connected source URL changes
  useEffect(() => {
    if (!sourceUrl) {
      // Connection cleared
      if (previewUrl && refImage?.name?.startsWith("linked-")) {
        URL.revokeObjectURL(previewUrl);
        setRefImage(null);
        setPreviewUrl(null);
      }
      return;
    }
    let cancelled = false;
    setLinking(true);
    urlToFile(sourceUrl, "linked-input")
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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceUrl]);

  const handleFile = (file: File | null) => {
    if (sourceUrl) return; // upload disabled while connected
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRefImage(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleModelChange = (v: string) => {
    if (v === "grok-3" && !isPro) {
      toast.error("O modelo Grok 3 está disponível apenas no plano Pro.");
      return;
    }
    setModel(v);
    if (v === "grok-3") {
      if (!GROK_VALID_ASPECTS.includes(aspect)) setAspect("9:16");
      setResolution("720p");
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim() || !refImage || isLoading) return;
    if (isGrok && !isPro) {
      toast.error("O modelo Grok 3 está disponível apenas no plano Pro.");
      return;
    }
    generate({
      prompt: prompt.trim(),
      aspectRatio: aspect,
      resolution: isGrok ? "720p" : resolution,
      model,
      modeImage: "ingredient",
      refImages: [refImage],
      duration: isGrok ? grokDuration : "8",
      ...(isGrok ? { mode: grokMode } : {}),
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
      inputPort={<NodePort nodeId={id} side="in" active={!!sourceUrl} label="img" />}
    >
      <p className="text-[11px] text-muted-foreground">
        Arraste um fio do nó <span className="text-primary">Texto → Imagem</span> ou <span className="text-primary">Avatar</span> até a porta à esquerda, ou faça upload manual.
      </p>

      {/* Image preview / upload */}
      {linking ? (
        <div className="flex items-center justify-center gap-2 rounded-md border border-primary/20 py-6 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando imagem conectada...
        </div>
      ) : previewUrl ? (
        <div className="relative rounded-md overflow-hidden border border-primary/20">
          <img src={previewUrl} alt="Referência" className="w-full max-h-40 object-cover" />
          {sourceUrl && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary/90 text-primary-foreground text-[10px] font-medium flex items-center gap-1">
              <Link2 className="h-2.5 w-2.5" /> Conectado
            </div>
          )}
          {!sourceUrl && (
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
        <label className={`flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors py-6 ${sourceUrl ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {sourceUrl ? "Aguardando imagem conectada..." : "Carregar imagem manualmente"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isLoading || !!sourceUrl}
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

      <Select value={model} onValueChange={handleModelChange} disabled={isLoading}>
        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {MODEL_OPTIONS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              <span className="flex items-center gap-1.5">
                {m.label}
                {m.pro && !isPro && <Lock className="h-3 w-3 text-amber-500" />}
                {m.pro && <span className="text-[10px] text-amber-500">Pro</span>}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isGrok ? (
        <div className="grid grid-cols-2 gap-2">
          <Select value={aspect} onValueChange={setAspect} disabled={isLoading}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GROK_ASPECT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={grokDuration} onValueChange={setGrokDuration} disabled={isLoading}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GROK_DURATION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={grokMode} onValueChange={setGrokMode} disabled={isLoading}>
            <SelectTrigger className="h-9 col-span-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GROK_MODE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>Modo: {o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
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
        disabled={!prompt.trim() || !refImage || isLoading || linking || (isGrok && !isPro)}
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
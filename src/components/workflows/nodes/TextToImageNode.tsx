import { useEffect, useState } from "react";
import { useImageGenerator } from "@/hooks/useImageGenerator";
import { useAuth } from "@/hooks/useAuth";
import { WorkflowCard } from "../WorkflowCard";
import { useWorkflow } from "../WorkflowContext";
import { NodePort } from "../NodePort";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ImageIcon, Loader2, Lock, Sparkles } from "lucide-react";

interface NodeProps {
  id: string;
  x: number;
  y: number;
  onRemove: () => void;
}

export function TextToImageNode({ id, x, y, onRemove }: NodeProps) {
  const { profile, isAdmin } = useAuth();
  const isPro = (profile?.plan === "pro" && profile?.status === "approved") || isAdmin;
  const { registerImage, unregisterImage } = useWorkflow();

  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const { state, resultUrl, error, progress, statusText, generate } = useImageGenerator();
  const isLoading = state === "generating" || state === "polling";

  // Register output for downstream nodes
  useEffect(() => {
    if (resultUrl) {
      registerImage({ nodeId: id, nodeLabel: "Texto → Imagem", url: resultUrl });
    }
    return () => {
      unregisterImage(id);
    };
  }, [resultUrl, id, registerImage, unregisterImage]);

  const handleGenerate = () => {
    if (!prompt.trim() || isLoading) return;
    generate({
      prompt: prompt.trim(),
      model: "nano-banana-pro",
      aspect_ratio: aspect,
      output_format: "png",
    });
  };

  return (
    <WorkflowCard
      id={id}
      x={x}
      y={y}
      title="Texto → Imagem"
      icon={<ImageIcon className="h-4 w-4 text-primary" />}
      onRemove={onRemove}
      outputPort={<NodePort nodeId={id} side="out" active={!!resultUrl} label="img" />}
    >
      {!isPro ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
          <Lock className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Disponível apenas para o plano Pro.</span>
        </div>
      ) : null}

      <Textarea
        placeholder="Descreva a imagem que deseja gerar..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value.slice(0, 4000))}
        rows={4}
        disabled={isLoading || !isPro}
        className="resize-none"
      />

      <div className="flex items-center gap-2">
        <Select value={aspect} onValueChange={setAspect} disabled={isLoading || !isPro}>
          <SelectTrigger className="h-9 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">Quadrado 1:1</SelectItem>
            <SelectItem value="9:16">Vertical 9:16</SelectItem>
            <SelectItem value="16:9">Horizontal 16:9</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading || !isPro}
        className="w-full"
        size="sm"
      >
        {isLoading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-2" /> Gerar Imagem</>
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
        <div className="rounded-md overflow-hidden border border-primary/20">
          <img src={resultUrl} alt="Resultado" className="w-full h-auto" />
        </div>
      )}
    </WorkflowCard>
  );
}

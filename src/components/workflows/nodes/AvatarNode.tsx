import { useEffect, useState } from "react";
import { useImageGenerator } from "@/hooks/useImageGenerator";
import { useAuth } from "@/hooks/useAuth";
import { WorkflowCard } from "../WorkflowCard";
import { useWorkflow } from "../WorkflowContext";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, Loader2, Lock, Sparkles, Link2 } from "lucide-react";

interface NodeProps {
  id: string;
  x: number;
  y: number;
  onRemove: () => void;
}

export function AvatarNode({ id, x, y, onRemove }: NodeProps) {
  const { profile, isAdmin } = useAuth();
  const isPro = (profile?.plan === "pro" && profile?.status === "approved") || isAdmin;
  const { registerImage, unregisterImage } = useWorkflow();

  const [prompt, setPrompt] = useState("");
  const { state, resultUrl, error, progress, statusText, generate } = useImageGenerator();
  const isLoading = state === "generating" || state === "polling";

  useEffect(() => {
    if (resultUrl) {
      registerImage({ nodeId: id, nodeLabel: "Avatar", url: resultUrl });
    }
    return () => {
      unregisterImage(id);
    };
  }, [resultUrl, id, registerImage, unregisterImage]);

  const handleGenerate = () => {
    if (!prompt.trim() || isLoading || !isPro) return;
    const fullPrompt = `Influencer digital fotorrealista em fundo de estúdio branco infinito, plano médio, iluminação suave de retrato. ${prompt.trim()}`;
    generate({
      prompt: fullPrompt,
      model: "nano-banana-pro",
      aspect_ratio: "9:16",
      output_format: "png",
    });
  };

  return (
    <WorkflowCard
      id={id}
      x={x}
      y={y}
      title="Criação de Avatar"
      icon={<User className="h-4 w-4 text-primary" />}
      onRemove={onRemove}
    >
      {!isPro && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
          <Lock className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Disponível apenas para o plano Pro.</span>
        </div>
      )}

      <Textarea
        placeholder="Descreva o influencer (idade, gênero, cabelo, pele, estilo)..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value.slice(0, 4000))}
        rows={4}
        disabled={isLoading || !isPro}
        className="resize-none"
      />

      <Button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isLoading || !isPro}
        className="w-full"
        size="sm"
      >
        {isLoading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
        ) : (
          <><Sparkles className="h-4 w-4 mr-2" /> Gerar Avatar</>
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
        <>
          <div className="rounded-md overflow-hidden border border-primary/20">
            <img src={resultUrl} alt="Avatar" className="w-full h-auto" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-primary/80 bg-primary/5 border border-primary/20 rounded px-2 py-1">
            <Link2 className="h-3 w-3" />
            <span>Saída disponível para o nó Imagem → Vídeo</span>
          </div>
        </>
      )}
    </WorkflowCard>
  );
}

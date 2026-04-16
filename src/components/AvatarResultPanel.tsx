import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, RefreshCw, ImageIcon, UserPlus, Loader2 } from "lucide-react";

interface AvatarResultPanelProps {
  resultUrl: string | null;
  isGenerating: boolean;
  progress: number;
  statusText: string;
  onReset: () => void;
  onSaveCharacter?: () => void;
  canSave?: boolean;
  isSaving?: boolean;
}

export function AvatarResultPanel({
  resultUrl,
  isGenerating,
  progress,
  statusText,
  onReset,
  onSaveCharacter,
  canSave,
  isSaving,
}: AvatarResultPanelProps) {
  if (resultUrl) {
    return (
      <div className="flex flex-col items-center gap-3">
        <img
          src={resultUrl}
          alt="Avatar gerado"
          crossOrigin="anonymous"
          className="w-full rounded-xl border border-border/50 shadow-lg"
        />
        <div className="flex gap-3 w-full">
          <a href={resultUrl} download target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10">
              <Download className="h-4 w-4 mr-2" /> Baixar
            </Button>
          </a>
          <Button onClick={onReset} variant="outline" className="flex-1 border-border text-foreground">
            <RefreshCw className="h-4 w-4 mr-2" /> Nova
          </Button>
        </div>
        {canSave && onSaveCharacter && (
          <Button
            onClick={onSaveCharacter}
            disabled={isSaving}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-2" /> Salvar este personagem</>
            )}
          </Button>
        )}
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="aspect-[9/16] rounded-xl border border-border/50 bg-muted/20 flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-full max-w-[200px] space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">{statusText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-[9/16] rounded-xl border border-border/30 bg-muted/10 flex flex-col items-center justify-center gap-3">
      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground/50">Seu avatar aparecerá aqui</p>
    </div>
  );
}

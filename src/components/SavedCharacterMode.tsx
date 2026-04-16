import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useImageGenerator, ImageReferencePayload } from "@/hooks/useImageGenerator";
import { useCooldown } from "@/hooks/useCooldown";
import { AvatarResultPanel } from "@/components/AvatarResultPanel";
import { Loader2, Upload, X, Sparkles, UserCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface SavedCharacter {
  imageUrl: string;
  base64?: string;
  mimeType?: string;
  fileName?: string;
}

interface SavedCharacterModeProps {
  character: SavedCharacter;
  onRemoveCharacter: () => void;
}

export function SavedCharacterMode({ character, onRemoveCharacter }: SavedCharacterModeProps) {
  const { state, resultUrl, error, progress, statusText, generate, reset } = useImageGenerator();
  const { isCooling, remainingSeconds, startCooldown } = useCooldown({ key: "avatar-maker", durationMs: 90000 });

  const [prompt, setPrompt] = useState("");
  const [objectImage, setObjectImage] = useState<ImageReferencePayload | null>(null);
  const [objectPreview, setObjectPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo deve ter no máximo 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setObjectImage({ data: base64, mimeType: file.type, fileName: file.name });
      setObjectPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeObject = () => {
    setObjectImage(null);
    setObjectPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Descreva o que a personagem está fazendo.");
      return;
    }
    const lines: string[] = [
      "Use [Imagem 1] como referência visual da personagem, mantendo total semelhança facial, corporal, cor de pele, cabelo e olhos.",
    ];
    if (objectImage) {
      lines.push("Use [Imagem 2] como referência do objeto/cenário descrito abaixo.");
    }
    lines.push("", prompt.trim());
    lines.push(
      "\nA imagem deve ter iluminação cinematográfica profissional, qualidade de fotografia editorial, com pele realista mostrando poros e texturas naturais."
    );

    const hasCharacterBase64 = !!character.base64;
    const objectDataUrl = objectPreview || undefined;

    const fileBase64 = hasCharacterBase64
      ? [
          {
            data: character.base64!,
            mimeType: character.mimeType,
            fileName: character.fileName || "character.png",
          } satisfies ImageReferencePayload,
          ...(objectImage ? [objectImage] : []),
        ]
      : undefined;

    const fileUrls = !hasCharacterBase64
      ? [character.imageUrl, ...(objectDataUrl ? [objectDataUrl] : [])]
      : undefined;

    await generate({
      prompt: lines.join("\n"),
      model: "nano-banana-2",
      aspect_ratio: "9:16",
      ...(fileBase64 ? { file_base64: fileBase64 } : {}),
      ...(fileUrls ? { file_urls: fileUrls } : {}),
    });
    startCooldown();
  };

  const isGenerating = state === "generating" || state === "polling";
  const canGenerate = !isGenerating && !isCooling && prompt.trim().length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <div className="space-y-5">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
            {error}
            <Button size="sm" variant="ghost" className="ml-2" onClick={reset}>Tentar novamente</Button>
          </div>
        )}

        {/* Active character card */}
        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary/40 bg-primary/5">
          <img
            src={character.imageUrl}
            alt="Personagem ativa"
            className="h-20 w-20 rounded-lg object-cover border border-border"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-primary">
              <UserCheck className="h-4 w-4" />
              <span className="text-sm font-semibold">Personagem ativa</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Esta personagem será mantida em todas as próximas gerações.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveCharacter}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Remover
          </Button>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-semibold">
            O que a personagem está fazendo?
          </Label>
          <Textarea
            placeholder="Descreva ações, roupas, pose, expressão, ambiente, ângulo de câmera, iluminação..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={4000}
            className="bg-muted/30 border-border min-h-[140px]"
          />
          <p className="text-xs text-muted-foreground text-right">{prompt.length}/4000</p>
        </div>

        {/* Object reference */}
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-semibold">
            Imagem-objeto da cena (opcional)
          </Label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" /> Upload
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {objectPreview && (
              <div className="relative">
                <img
                  src={objectPreview}
                  alt="Objeto"
                  className="h-16 w-16 rounded-lg object-cover border border-border"
                />
                <button
                  onClick={removeObject}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Máximo 5MB. Cite no prompt como <span className="font-mono">[Imagem 2]</span>.
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
          ) : isCooling ? (
            `Aguarde ${remainingSeconds}s`
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Gerar nova foto</>
          )}
        </Button>
      </div>

      {/* Right: Result */}
      <div className="lg:sticky lg:top-24 lg:self-start order-first lg:order-last">
        <AvatarResultPanel
          resultUrl={resultUrl}
          isGenerating={isGenerating}
          progress={progress}
          statusText={statusText}
          onReset={reset}
        />
      </div>
    </div>
  );
}

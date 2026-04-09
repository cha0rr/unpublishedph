import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useImageGenerator, ImageReferencePayload } from "@/hooks/useImageGenerator";
import { useCooldown } from "@/hooks/useCooldown";
import {
  Loader2, Download, RefreshCw, Upload, X, Sparkles,
  Palette, Waves, User, Eye, Fingerprint, Ruler, PersonStanding,
  type LucideIcon,
} from "lucide-react";

const CATEGORIES: {
  key: string;
  label: string;
  icon: LucideIcon;
  options: string[];
}[] = [
  { key: "hairColor", label: "Cor do Cabelo", icon: Palette, options: ["Preto", "Castanho escuro", "Castanho claro", "Loiro", "Ruivo", "Platinado", "Rosa", "Azul", "Branco"] },
  { key: "hairType", label: "Tipo de Cabelo", icon: Waves, options: ["Liso", "Ondulado", "Cacheado", "Crespo", "Curto", "Raspado", "Trançado"] },
  { key: "skinColor", label: "Cor da Pele", icon: User, options: ["Pele clara", "Pele branca", "Pele morena clara", "Pele morena", "Pele negra", "Pele asiática"] },
  { key: "eyeColor", label: "Cor dos Olhos", icon: Eye, options: ["Castanho", "Verde", "Azul", "Mel", "Cinza", "Preto"] },
  { key: "skinTexture", label: "Textura da Pele", icon: Fingerprint, options: ["Lisa", "Sardas", "Manchas solares", "Sinais/pintas", "Acne leve", "Cicatrizes"] },
  { key: "height", label: "Altura", icon: Ruler, options: ["Baixa", "Média", "Alta"] },
  { key: "bodyType", label: "Corpo", icon: PersonStanding, options: ["Magra", "Atlética", "Mediana", "Curvilínea", "Plus size"] },
];

function buildPrompt(fields: Record<string, string>, hasRef: boolean): string {
  const lines = [
    "Gere uma foto ultra-realista de uma influencer digital feminina com as seguintes características:",
    `- Cabelo: ${fields.hairColor}, ${fields.hairType}`,
    `- Pele: ${fields.skinColor}, textura ${fields.skinTexture.toLowerCase()}, realista e detalhada`,
    `- Olhos: ${fields.eyeColor}`,
    `- Corpo: ${fields.bodyType}, altura ${fields.height.toLowerCase()}`,
  ];
  if (fields.environment?.trim()) {
    lines.push(`- Ambiente: ${fields.environment.trim()}`);
  }
  if (fields.extra?.trim()) {
    lines.push(`\nDetalhes adicionais: ${fields.extra.trim()}`);
  }
  if (hasRef) {
    lines.push("\nUse [Imagem 1] como referência visual para construir a aparência da influencer, mantendo semelhança facial e corporal.");
  }
  lines.push(
    "\nA imagem deve ter qualidade fotográfica profissional, com pele realista mostrando poros, texturas naturais e iluminação adequada ao ambiente."
  );
  return lines.join("\n");
}

interface AvatarMakerFormProps {
  selections: Record<string, string>;
  onSelectionsChange: (s: Record<string, string>) => void;
}

export function AvatarMakerForm({ selections, onSelectionsChange }: AvatarMakerFormProps) {
  const { state, resultUrl, error, progress, statusText, generate, reset } = useImageGenerator();
  const { isCooling, remainingSeconds, startCooldown } = useCooldown({ key: "avatar-maker", durationMs: 90000 });

  const [environment, setEnvironment] = useState("");
  const [extra, setExtra] = useState("");
  const [refImage, setRefImage] = useState<ImageReferencePayload | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const select = (key: string, value: string) =>
    onSelectionsChange({ ...selections, [key]: value });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo deve ter no máximo 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setRefImage({ data: base64, mimeType: file.type, fileName: file.name });
      setRefPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeRef = () => {
    setRefImage(null);
    setRefPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleGenerate = async () => {
    const prompt = buildPrompt({ ...selections, environment, extra }, !!refImage);
    await generate({
      prompt,
      model: "nano-banana-2",
      aspect_ratio: "9:16",
      ...(refImage ? { file_base64: [refImage] } : {}),
    });
    startCooldown();
  };

  const isGenerating = state === "generating" || state === "polling";
  const canGenerate = !isGenerating && !isCooling;

  if (state === "success" && resultUrl) {
    return (
      <div className="flex flex-col items-center gap-6">
        <img src={resultUrl} alt="Avatar gerado" className="w-full max-w-md rounded-xl border border-border/50 shadow-lg" />
        <div className="flex gap-3">
          <a href={resultUrl} download target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
              <Download className="h-4 w-4 mr-2" /> Baixar
            </Button>
          </a>
          <Button onClick={reset} variant="outline" className="border-border text-foreground">
            <RefreshCw className="h-4 w-4 mr-2" /> Nova geração
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isGenerating && (
        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">{statusText}</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
          {error}
          <Button size="sm" variant="ghost" className="ml-2" onClick={reset}>Tentar novamente</Button>
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const selected = selections[cat.key];
        return (
          <div key={cat.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <Label className="text-foreground text-sm font-medium">{cat.label}</Label>
              <Badge variant="secondary" className="text-xs">{selected}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => select(cat.key, opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selected === opt
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="space-y-2">
        <Label className="text-foreground">Ambiente</Label>
        <Textarea
          placeholder="Ex: praia ao pôr do sol, estúdio fotográfico, cidade à noite..."
          value={environment}
          onChange={(e) => setEnvironment(e.target.value)}
          maxLength={300}
          className="bg-muted/30 border-border"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Descrição extra (opcional)</Label>
        <Textarea
          placeholder="Detalhes adicionais: roupas, pose, expressão, acessórios..."
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          maxLength={500}
          className="bg-muted/30 border-border"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Foto de referência (opcional)</Label>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {refPreview && (
            <div className="relative">
              <img src={refPreview} alt="Referência" className="h-16 w-16 rounded-lg object-cover border border-border" />
              <button onClick={removeRef} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Máximo 5MB. A IA usará como base para a aparência.</p>
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
          <><Sparkles className="h-4 w-4 mr-2" /> Gerar Avatar</>
        )}
      </Button>
    </div>
  );
}

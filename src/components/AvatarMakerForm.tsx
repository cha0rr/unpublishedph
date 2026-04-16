import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useImageGenerator, ImageReferencePayload } from "@/hooks/useImageGenerator";
import { useCooldown } from "@/hooks/useCooldown";
import { AvatarResultPanel } from "@/components/AvatarResultPanel";
import {
  Loader2, Upload, X, Sparkles,
} from "lucide-react";

type OptionDef = { label: string; emoji: string };

const CATEGORIES: {
  key: string;
  label: string;
  options: OptionDef[];
}[] = [
  {
    key: "hairColor", label: "Cor do Cabelo",
    options: [
      { label: "Preto", emoji: "⚫" },
      { label: "Castanho escuro", emoji: "🟤" },
      { label: "Castanho claro", emoji: "🍂" },
      { label: "Loiro", emoji: "🟡" },
      { label: "Ruivo", emoji: "🔴" },
      { label: "Platinado", emoji: "⚪" },
      { label: "Rosa", emoji: "🩷" },
      { label: "Azul", emoji: "🔵" },
      { label: "Branco", emoji: "🤍" },
    ],
  },
  {
    key: "hairType", label: "Tipo de Cabelo",
    options: [
      { label: "Liso", emoji: "📏" },
      { label: "Ondulado", emoji: "〰️" },
      { label: "Cacheado", emoji: "🌀" },
      { label: "Crespo", emoji: "☁️" },
      { label: "Curto", emoji: "✂️" },
      { label: "Raspado", emoji: "🪒" },
      { label: "Trançado", emoji: "🪢" },
    ],
  },
  {
    key: "skinColor", label: "Cor da Pele",
    options: [
      { label: "Pele clara", emoji: "👋🏻" },
      { label: "Pele branca", emoji: "👋🏼" },
      { label: "Pele morena clara", emoji: "👋🏽" },
      { label: "Pele morena", emoji: "👋🏾" },
      { label: "Pele negra", emoji: "👋🏿" },
      { label: "Pele asiática", emoji: "👋" },
    ],
  },
  {
    key: "eyeColor", label: "Cor dos Olhos",
    options: [
      { label: "Castanho", emoji: "🟤" },
      { label: "Verde", emoji: "🟢" },
      { label: "Azul", emoji: "🔵" },
      { label: "Mel", emoji: "🟡" },
      { label: "Cinza", emoji: "⚪" },
      { label: "Preto", emoji: "⚫" },
    ],
  },
  {
    key: "skinTexture", label: "Textura da Pele",
    options: [
      { label: "Lisa", emoji: "✨" },
      { label: "Sardas", emoji: "🔹" },
      { label: "Manchas solares", emoji: "☀️" },
      { label: "Sinais/pintas", emoji: "🔘" },
      { label: "Acne leve", emoji: "💧" },
      { label: "Cicatrizes", emoji: "⚡" },
    ],
  },
  {
    key: "height", label: "Altura",
    options: [
      { label: "Baixa", emoji: "📐" },
      { label: "Média", emoji: "📏" },
      { label: "Alta", emoji: "📐" },
    ],
  },
  {
    key: "bodyType", label: "Corpo",
    options: [
      { label: "Magra", emoji: "🧍‍♀️" },
      { label: "Atlética", emoji: "💪" },
      { label: "Mediana", emoji: "🙆‍♀️" },
      { label: "Curvilínea", emoji: "💃" },
      { label: "Plus size", emoji: "🤗" },
    ],
  },
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      {/* Left: Form */}
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
            {error}
            <Button size="sm" variant="ghost" className="ml-2" onClick={reset}>Tentar novamente</Button>
          </div>
        )}

        {CATEGORIES.map((cat) => {
          const selected = selections[cat.key];
          return (
            <div key={cat.key} className="space-y-2">
              <Label className="text-foreground text-sm font-semibold">{cat.label}</Label>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
                {cat.options.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => select(cat.key, opt.label)}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all aspect-square text-center ${
                      selected === opt.label
                        ? "border-primary bg-primary/15 shadow-md shadow-primary/10"
                        : "border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border"
                    }`}
                  >
                    <span className="text-2xl leading-none">{opt.emoji}</span>
                    <span className="text-[10px] leading-tight font-medium text-muted-foreground line-clamp-2">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="space-y-2">
          <Label className="text-foreground text-sm font-semibold">Ambiente</Label>
          <Textarea
            placeholder="Ex: praia ao pôr do sol, estúdio fotográfico, cidade à noite..."
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            maxLength={300}
            className="bg-muted/30 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground text-sm font-semibold">Descrição extra (opcional)</Label>
          <Textarea
            placeholder="Detalhes adicionais: roupas, pose, expressão, acessórios..."
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            maxLength={500}
            className="bg-muted/30 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground text-sm font-semibold">Foto de referência (opcional)</Label>
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

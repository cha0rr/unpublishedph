import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useImageGenerator, ImageReferencePayload } from "@/hooks/useImageGenerator";
import { useCooldown } from "@/hooks/useCooldown";
import { AvatarResultPanel } from "@/components/AvatarResultPanel";
import { SavedCharacterMode, SavedCharacter } from "@/components/SavedCharacterMode";
import { toast } from "sonner";
import {
  Loader2, Upload, X, Sparkles, ChevronLeft, ChevronRight,
} from "lucide-react";

type OptionDef = { label: string; emoji: string };

const SAVED_CHARACTER_KEY = "avatar-maker-saved-character";

const CATEGORIES: {
  key: string;
  label: string;
  options: OptionDef[];
}[] = [
  {
    key: "age", label: "Idade Aproximada",
    options: [
      { label: "18–22 anos", emoji: "🌸" },
      { label: "23–27 anos", emoji: "💫" },
      { label: "28–32 anos", emoji: "✨" },
      { label: "33–37 anos", emoji: "💎" },
      { label: "38–45 anos", emoji: "🌟" },
      { label: "46–55 anos", emoji: "👑" },
    ],
  },
  {
    key: "gender", label: "Gênero",
    options: [
      { label: "Feminino", emoji: "👩" },
      { label: "Masculino", emoji: "👨" },
    ],
  },
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
  {
    key: "cameraAngle", label: "Ângulo de Câmera",
    options: [
      { label: "Close-up frontal", emoji: "📸" },
      { label: "Plano médio", emoji: "🎬" },
      { label: "Plano americano", emoji: "🎥" },
      { label: "Low angle", emoji: "⬆️" },
      { label: "High angle", emoji: "⬇️" },
      { label: "3/4 perfil", emoji: "🎭" },
      { label: "Over the shoulder", emoji: "👤" },
      { label: "Dutch angle", emoji: "🔄" },
    ],
  },
  {
    key: "lighting", label: "Iluminação",
    options: [
      { label: "Rembrandt", emoji: "🎨" },
      { label: "Butterfly", emoji: "🦋" },
      { label: "Split lighting", emoji: "🌗" },
      { label: "Golden hour", emoji: "🌅" },
      { label: "Rim light", emoji: "🌟" },
      { label: "Luz natural difusa", emoji: "☁️" },
      { label: "Neon/RGB", emoji: "💜" },
      { label: "Luz dura", emoji: "☀️" },
    ],
  },
];

const TOTAL_STEPS = CATEGORIES.length + 1;
const DEFAULT_ENVIRONMENT = "estúdio fotográfico totalmente branco, fundo infinito branco";

function buildPrompt(fields: Record<string, string>, hasRef: boolean): string {
  const isFemale = fields.gender === "Feminino";
  const genderLabel = isFemale ? "influencer digital feminina" : "influencer digital masculino";
  const lines = [
    `Gere uma foto ultra-realista de um(a) ${genderLabel} com as seguintes características:`,
    `- Idade aparente: ${fields.age}`,
    `- Cabelo: ${fields.hairColor}, ${fields.hairType}`,
    `- Pele: ${fields.skinColor}, textura ${fields.skinTexture?.toLowerCase() || "lisa"}, realista e detalhada`,
    `- Olhos: ${fields.eyeColor}`,
    `- Corpo: ${fields.bodyType}, altura ${fields.height?.toLowerCase() || "média"}`,
  ];
  if (fields.cameraAngle) {
    lines.push(`- Ângulo de câmera: ${fields.cameraAngle}`);
  }
  if (fields.lighting) {
    lines.push(`- Iluminação: ${fields.lighting}`);
  }
  lines.push(`- Ambiente: ${DEFAULT_ENVIRONMENT}`);
  if (fields.extra?.trim()) {
    lines.push(`\nDetalhes adicionais: ${fields.extra.trim()}`);
  }
  if (hasRef) {
    lines.push("\nUse [Imagem 1] como referência visual para construir a aparência da influencer, mantendo semelhança facial e corporal.");
  }
  lines.push(
    "\nA imagem deve ter iluminação cinematográfica profissional, qualidade de fotografia editorial, com pele realista mostrando poros, texturas naturais e composição de câmera intencional."
  );
  return lines.join("\n");
}

async function urlToBase64ViaFetch(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("Falha ao baixar imagem");
  const blob = await res.blob();
  const mimeType = blob.type || "image/png";
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  return await urlToBase64ViaFetch(url);
}

interface AvatarMakerFormProps {
  selections: Record<string, string>;
  onSelectionsChange: (s: Record<string, string>) => void;
}

export function AvatarMakerForm({ selections, onSelectionsChange }: AvatarMakerFormProps) {
  const { state, resultUrl, error, progress, statusText, generate, reset } = useImageGenerator();
  const { isCooling, remainingSeconds, startCooldown } = useCooldown({ key: "avatar-maker", durationMs: 90000 });

  const [step, setStep] = useState(0);
  const [extra, setExtra] = useState("");
  const [refImage, setRefImage] = useState<ImageReferencePayload | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [savedCharacter, setSavedCharacter] = useState<SavedCharacter | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved character from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_CHARACTER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedCharacter;
        if (parsed?.imageUrl) setSavedCharacter(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const select = (key: string, value: string) => {
    onSelectionsChange({ ...selections, [key]: value });
    if (step < CATEGORIES.length - 1) {
      setTimeout(() => setStep((s) => Math.min(s + 1, CATEGORIES.length)), 300);
    } else if (step === CATEGORIES.length - 1) {
      setTimeout(() => setStep(CATEGORIES.length), 300);
    }
  };

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
    const prompt = buildPrompt({ ...selections, extra }, !!refImage);
    await generate({
      prompt,
      model: "nano-banana-pro",
      aspect_ratio: "9:16",
      ...(refImage ? { file_base64: [refImage] } : {}),
    });
    startCooldown();
  };

  const handleSaveCharacter = async () => {
    if (!resultUrl) return;
    setIsSaving(true);
    try {
      let character: SavedCharacter;
      try {
        const { base64, mimeType } = await urlToBase64(resultUrl);
        character = {
          imageUrl: resultUrl,
          base64,
          mimeType,
          fileName: "personagem.png",
        };
      } catch (err) {
        console.warn("[avatar-maker] fetch/base64 falhou; salvando referência por URL", err);
        character = {
          imageUrl: resultUrl,
          fileName: "personagem.png",
        };
      }

      localStorage.setItem(SAVED_CHARACTER_KEY, JSON.stringify(character));
      setSavedCharacter(character);
      toast.success("Personagem salva! Use-a nas próximas gerações.");
      reset();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCharacter = () => {
    localStorage.removeItem(SAVED_CHARACTER_KEY);
    setSavedCharacter(null);
    toast("Personagem removida. Você pode criar uma nova.");
  };

  const isGenerating = state === "generating" || state === "polling";
  const canGenerate = !isGenerating && !isCooling;
  const isFinalStep = step === CATEGORIES.length;
  const progressValue = ((step + 1) / TOTAL_STEPS) * 100;

  // If there's a saved character, render the saved character mode instead of the wizard
  if (savedCharacter) {
    return (
      <SavedCharacterMode
        character={savedCharacter}
        onRemoveCharacter={handleRemoveCharacter}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      {/* Left: Wizard */}
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
            {error}
            <Button size="sm" variant="ghost" className="ml-2" onClick={reset}>Tentar novamente</Button>
          </div>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Passo {step + 1} de {TOTAL_STEPS}</span>
            <span>{isFinalStep ? "Detalhes finais" : CATEGORIES[step]?.label}</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Category step */}
        {!isFinalStep && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300" key={step}>
            <Label className="text-foreground text-lg font-semibold">{CATEGORIES[step].label}</Label>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
              {CATEGORIES[step].options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => select(CATEGORIES[step].key, opt.label)}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all aspect-square text-center ${
                    selections[CATEGORIES[step].key] === opt.label
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
        )}

        {/* Final step */}
        {isFinalStep && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" key="final">

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
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          {!isFinalStep && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.min(CATEGORIES.length, s + 1))}
            >
              Pular <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Right: Result */}
      <div className="lg:sticky lg:top-24 lg:self-start order-first lg:order-last">
        <AvatarResultPanel
          resultUrl={resultUrl}
          isGenerating={isGenerating}
          progress={progress}
          statusText={statusText}
          onReset={reset}
          onSaveCharacter={handleSaveCharacter}
          canSave={!!resultUrl && !savedCharacter}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}

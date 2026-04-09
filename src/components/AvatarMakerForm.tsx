import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useImageGenerator, ImageReferencePayload } from "@/hooks/useImageGenerator";
import { useCooldown } from "@/hooks/useCooldown";
import { Loader2, Download, RefreshCw, Upload, X, Sparkles } from "lucide-react";

const HAIR_COLORS = ["Preto", "Castanho escuro", "Castanho claro", "Loiro", "Ruivo", "Platinado", "Rosa", "Azul", "Branco"];
const HAIR_TYPES = ["Liso", "Ondulado", "Cacheado", "Crespo", "Curto", "Raspado", "Trançado"];
const SKIN_COLORS = ["Pele clara", "Pele branca", "Pele morena clara", "Pele morena", "Pele negra", "Pele asiática"];
const EYE_COLORS = ["Castanho", "Verde", "Azul", "Mel", "Cinza", "Preto"];
const SKIN_TEXTURES = ["Lisa", "Sardas", "Manchas solares", "Sinais/pintas", "Acne leve", "Cicatrizes"];
const HEIGHTS = ["Baixa", "Média", "Alta"];
const BODY_TYPES = ["Magra", "Atlética", "Mediana", "Curvilínea", "Plus size"];

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

export function AvatarMakerForm() {
  const { state, resultUrl, error, progress, statusText, generate, reset } = useImageGenerator();
  const { isCooling, remainingSeconds, startCooldown } = useCooldown({ key: "avatar-maker", durationMs: 90000 });

  const [hairColor, setHairColor] = useState("Preto");
  const [hairType, setHairType] = useState("Liso");
  const [skinColor, setSkinColor] = useState("Pele morena");
  const [eyeColor, setEyeColor] = useState("Castanho");
  const [skinTexture, setSkinTexture] = useState("Lisa");
  const [height, setHeight] = useState("Média");
  const [bodyType, setBodyType] = useState("Mediana");
  const [environment, setEnvironment] = useState("");
  const [extra, setExtra] = useState("");
  const [refImage, setRefImage] = useState<ImageReferencePayload | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    const prompt = buildPrompt(
      { hairColor, hairType, skinColor, eyeColor, skinTexture, height, bodyType, environment, extra },
      !!refImage
    );
    await generate({
      prompt,
      model: "nano-banana-2",
      aspect_ratio: "2:3",
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Cor do Cabelo" value={hairColor} onChange={setHairColor} options={HAIR_COLORS} />
        <Field label="Tipo de Cabelo" value={hairType} onChange={setHairType} options={HAIR_TYPES} />
        <Field label="Cor da Pele" value={skinColor} onChange={setSkinColor} options={SKIN_COLORS} />
        <Field label="Cor dos Olhos" value={eyeColor} onChange={setEyeColor} options={EYE_COLORS} />
        <Field label="Textura da Pele" value={skinTexture} onChange={setSkinTexture} options={SKIN_TEXTURES} />
        <Field label="Altura" value={height} onChange={setHeight} options={HEIGHTS} />
        <Field label="Corpo" value={bodyType} onChange={setBodyType} options={BODY_TYPES} />
      </div>

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

function Field({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground text-sm">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-muted/30 border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

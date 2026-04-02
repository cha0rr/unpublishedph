import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useImageGenerator, ImageGenerateParams } from "@/hooks/useImageGenerator";
// supabase import removed - no longer needed for storage upload
import { Navbar } from "@/components/landing/Navbar";
import { TechBackground } from "@/components/landing/TechBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ImageIcon,
  Sparkles,
  Download,
  RotateCcw,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";

const MODELS = [
  { value: "nano-banana-pro", label: "Nano Banana Pro" },
  { value: "nano-banana-2", label: "Nano Banana 2" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1 (Quadrado)" },
  { value: "16:9", label: "16:9 (Paisagem)" },
  { value: "9:16", label: "9:16 (Retrato)" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "3:2", label: "3:2" },
  { value: "2:3", label: "2:3" },
];

const RESOLUTIONS = [
  { value: "auto", label: "Auto (padrão)" },
  { value: "1024x1024", label: "1024×1024" },
  { value: "1280x720", label: "1280×720" },
  { value: "720x1280", label: "720×1280" },
];

const OUTPUT_FORMATS = [
  { value: "png", label: "PNG" },
  { value: "jpg", label: "JPG" },
  { value: "webp", label: "WebP" },
];

const STYLES = [
  { value: "auto", label: "Auto" },
  { value: "realistic", label: "Realista" },
  { value: "anime", label: "Anime" },
  { value: "digital-art", label: "Arte Digital" },
  { value: "cinematic", label: "Cinematográfico" },
  { value: "fantasy", label: "Fantasia" },
  { value: "3d-render", label: "3D Render" },
  { value: "illustration", label: "Ilustração" },
];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const imageUrlToBase64 = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return fileToBase64(new File([blob], "ref.png", { type: blob.type }));
};

const cleanBase64 = (dataUrl: string): string => {
  const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : dataUrl;
};

export default function BusinessStudioImages() {
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { state, resultUrl, error, progress, statusText, generate, reset } =
    useImageGenerator();

  const isPro = profile?.plan === "pro" && profile?.status === "approved";
  const isBusiness =
    profile?.plan === "business" && profile?.status === "approved";
  const hasAccess = isAdmin || isBusiness || isPro;

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("nano-banana-pro");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("auto");
  const [outputFormat, setOutputFormat] = useState("png");
  const [style, setStyle] = useState("auto");
  const [referenceFiles, setReferenceFiles] = useState<{ file: File | null; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && (!user || !hasAccess)) {
      navigate("/");
    }
  }, [loading, user, hasAccess, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) return null;

  const isProcessing = state === "generating" || state === "polling";

  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Selecione apenas arquivos de imagem.");
      return;
    }
    setReferenceFiles(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeReference = (index: number) => {
    setReferenceFiles(prev => {
      const item = prev[index];
      if (item.file) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAllReferences = () => {
    referenceFiles.forEach(r => { if (r.file) URL.revokeObjectURL(r.preview); });
    setReferenceFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const useResultAsReference = () => {
    if (!resultUrl) return;
    setReferenceFiles(prev => [...prev, { file: null, preview: resultUrl }]);
  };


  const handleGenerate = async () => {
    if (!prompt.trim() || isProcessing) return;

    let fileUrls: string[] | undefined;
    const uploadedPaths: string[] = [];

    if (referenceFiles.length > 0) {
      setUploading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) throw new Error("Usuário não autenticado.");

        const urls: string[] = [];
        for (const ref of referenceFiles) {
          if (ref.file) {
            const ext = ref.file.name.split(".").pop() || "png";
            const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error: uploadError } = await supabase.storage.from("image-references").upload(path, ref.file);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from("image-references").getPublicUrl(path);
            urls.push(urlData.publicUrl);
            uploadedPaths.push(path);
          } else {
            urls.push(ref.preview);
          }
        }
        fileUrls = urls;
      } catch (err: any) {
        alert("Erro ao fazer upload: " + (err.message || "Tente novamente."));
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const params: ImageGenerateParams = {
      prompt: prompt.trim(),
      model,
      aspect_ratio: aspectRatio,
      resolution,
      output_format: outputFormat,
      style: style !== "auto" ? style : undefined,
      file_urls: fileUrls,
    };

    try {
      await generate(params);
    } finally {
      if (uploadedPaths.length > 0) {
        try {
          await supabase.storage.from("image-references").remove(uploadedPaths);
        } catch {}
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <TechBackground />
      <Navbar />
      <main className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Studio de Imagens
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-display">
              Crie imagens com IA
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Gere imagens profissionais usando modelos avançados de
              inteligência artificial.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="glass rounded-2xl p-6 border border-border/50 space-y-5">
              {/* Prompt */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Prompt</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Descreva a imagem que deseja gerar..."
                  className="min-h-[120px] bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground resize-none"
                  disabled={isProcessing}
                  maxLength={4000}
                />
                <p className={`text-xs text-right ${prompt.length > 3600 ? "text-destructive" : "text-muted-foreground"}`}>
                  {prompt.length}/4000
                </p>
              </div>

              {/* Model + Aspect Ratio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Modelo</Label>
                  <Select value={model} onValueChange={setModel} disabled={isProcessing}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Proporção
                  </Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isProcessing}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ar) => (
                        <SelectItem key={ar.value} value={ar.value}>
                          {ar.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resolution + Format */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    Resolução
                  </Label>
                  <Select value={resolution} onValueChange={setResolution} disabled={isProcessing}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOLUTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Formato</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat} disabled={isProcessing}>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTPUT_FORMATS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Style */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Estilo</Label>
                <Select value={style} onValueChange={setStyle} disabled={isProcessing}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Reference Upload */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">
                  Imagens de referência (opcional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use [Imagem 1], [Imagem 2]... no prompt para referenciar cada imagem.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  disabled={isProcessing}
                />
                {referenceFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {referenceFiles.map((ref, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-border/50 bg-card/30 group">
                        <img src={ref.preview} alt={`Imagem ${index + 1}`} className="w-full h-24 object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground text-center">
                          Imagem {index + 1}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 bg-background/80 hover:bg-background h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeReference(index)}
                          disabled={isProcessing}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border/50 bg-card/30 hover:border-primary/40 hover:bg-card/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {referenceFiles.length > 0 ? "Adicionar mais uma imagem" : "Clique para selecionar uma imagem de referência"}
                  </span>
                  <span className="text-xs text-muted-foreground/60">JPG, PNG ou WebP · Máx. 5MB</span>
                </button>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isProcessing || uploading}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando referência...
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Gerar Imagem
                  </>
                )}
              </Button>
            </div>

            {/* Right: Result */}
            <div className="glass rounded-2xl p-6 border border-border/50 flex flex-col">
              <Label className="text-foreground font-medium mb-4">
                Resultado
              </Label>

              <div className="flex-1 flex items-center justify-center min-h-[400px]">
                {state === "idle" && (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>Sua imagem aparecerá aqui</p>
                  </div>
                )}

                {isProcessing && (
                  <div className="w-full space-y-4 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      {statusText}
                    </p>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {state === "error" && (
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                    <p className="text-sm text-destructive">{error}</p>
                    <Button
                      variant="outline"
                      onClick={reset}
                      className="border-border/50"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Tentar novamente
                    </Button>
                  </div>
                )}

                {state === "success" && resultUrl && (
                  <div className="w-full space-y-4">
                    <div className="rounded-xl overflow-hidden border border-border/30">
                      <img
                        src={resultUrl}
                        alt="Imagem gerada"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-border/50"
                        onClick={() => window.open(resultUrl, "_blank")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        className="border-border/50"
                        onClick={useResultAsReference}
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Usar como referência
                      </Button>
                      <Button
                        variant="outline"
                        className="border-border/50"
                        onClick={reset}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Nova imagem
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useImageGenerator, ImageGenerateParams } from "@/hooks/useImageGenerator";
import { Navbar } from "@/components/landing/Navbar";
import { TechBackground } from "@/components/landing/TechBackground";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  { value: "1024x1024", label: "1024×1024" },
  { value: "1280x720", label: "1280×720" },
  { value: "720x1280", label: "720×1280" },
  { value: "1920x1080", label: "1920×1080" },
  { value: "1080x1920", label: "1080×1920" },
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

export default function BusinessStudioImages() {
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { state, resultUrl, error, progress, statusText, generate, reset } =
    useImageGenerator();

  const isBusiness =
    profile?.plan === "business" && profile?.status === "approved";
  const hasAccess = isAdmin || isBusiness;

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("nano-banana-pro");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1024x1024");
  const [outputFormat, setOutputFormat] = useState("png");
  const [style, setStyle] = useState("auto");
  const [refHistory, setRefHistory] = useState("");
  const [fileUrlsText, setFileUrlsText] = useState("");

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

  const handleGenerate = () => {
    if (!prompt.trim() || isProcessing) return;

    const fileUrls = fileUrlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    const params: ImageGenerateParams = {
      prompt: prompt.trim(),
      model,
      aspect_ratio: aspectRatio,
      resolution,
      output_format: outputFormat,
      style: style !== "auto" ? style : undefined,
      ref_history: refHistory.trim() || undefined,
      file_urls: fileUrls.length > 0 ? fileUrls : undefined,
    };

    generate(params);
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
                />
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

              {/* Ref History */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">
                  Referência (UUID anterior)
                </Label>
                <Input
                  value={refHistory}
                  onChange={(e) => setRefHistory(e.target.value)}
                  placeholder="UUID de uma geração anterior (opcional)"
                  className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
                  disabled={isProcessing}
                />
              </div>

              {/* File URLs */}
              <div className="space-y-2">
                <Label className="text-foreground font-medium">
                  URLs de referência (uma por linha)
                </Label>
                <Textarea
                  value={fileUrlsText}
                  onChange={(e) => setFileUrlsText(e.target.value)}
                  placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                  className="min-h-[80px] bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground resize-none text-sm"
                  disabled={isProcessing}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isProcessing}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
              >
                {isProcessing ? (
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
                        className="flex-1 border-border/50"
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

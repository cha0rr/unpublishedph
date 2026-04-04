import { useState, useEffect } from "react";
import { TechBackground } from "@/components/landing/TechBackground";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, Film, ImageIcon, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ExtendVideoDialog } from "@/components/ExtendVideoDialog";

interface Generation {
  id: string;
  prompt: string;
  model: string;
  image_url: string | null;
  created_at: string | null;
  aspect_ratio: string | null;
  uuid: string | null;
  resolution: string | null;
}

const MeuHistorico = () => {
  const { user, isApproved, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"videos" | "images">("videos");
  const [extendItem, setExtendItem] = useState<Generation | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/login");
      else if (!isApproved && !isAdmin) navigate("/login");
    }
  }, [user, isApproved, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("image_generations")
        .select("id, prompt, model, image_url, created_at, aspect_ratio, uuid, resolution")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      setGenerations(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isApproved && !isAdmin)) return null;

  const videos = generations.filter((g) => g.model.startsWith("veo"));
  const images = generations.filter((g) => !g.model.startsWith("veo"));
  const items = tab === "videos" ? videos : images;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <TechBackground />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      <Navbar />
      <div className="relative mx-auto w-full max-w-5xl px-4 pt-24 sm:pt-28 pb-20">
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Meu <span className="text-primary">Histórico</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seus vídeos e imagens gerados anteriormente
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={tab === "videos" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("videos")}
            className={tab === "videos" ? "bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground"}
          >
            <Film className="h-4 w-4 mr-1" /> Vídeos ({videos.length})
          </Button>
          <Button
            variant={tab === "images" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("images")}
            className={tab === "images" ? "bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground"}
          >
            <ImageIcon className="h-4 w-4 mr-1" /> Imagens ({images.length})
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>Nenhum {tab === "videos" ? "vídeo" : "imagem"} gerado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden group"
              >
                {/* Preview */}
                <div className="aspect-video bg-muted/20 relative">
                  {tab === "videos" && item.image_url ? (
                    <video
                      src={item.image_url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => {
                        const v = e.target as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  ) : item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      Sem preview
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground/70">
                      {item.model} • {item.created_at ? format(new Date(item.created_at), "dd/MM/yy HH:mm") : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      {tab === "videos" && item.image_url && item.uuid && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                          onClick={() => setExtendItem(item)}
                          title="Estender vídeo"
                        >
                          <FastForward className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {item.image_url && (
                        <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary hover:bg-primary/10">
                          <a href={item.image_url} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {extendItem && extendItem.image_url && extendItem.uuid && (
        <ExtendVideoDialog
          open={!!extendItem}
          onOpenChange={(open) => { if (!open) setExtendItem(null); }}
          videoUrl={extendItem.image_url}
          videoUuid={extendItem.uuid}
          aspectRatio={extendItem.aspect_ratio || "16:9"}
          resolution={extendItem.resolution || "720p"}
          model={extendItem.model}
          onExtended={() => {
            setExtendItem(null);
          }}
        />
      )}
      <Footer />
    </div>
  );
};

export default MeuHistorico;

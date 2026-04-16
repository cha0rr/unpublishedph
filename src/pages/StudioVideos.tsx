import { TechBackground } from "@/components/landing/TechBackground";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { VideoGenerator } from "@/components/VideoGenerator";
import { StoryboardGenerator } from "@/components/StoryboardGenerator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2, Lock, Film, Layers } from "lucide-react";
import { toast } from "sonner";

const StudioVideos = () => {
  const { user, isApproved, isAdmin, profile, loading } = useAuth();
  const navigate = useNavigate();
  const canAccessStoryboard = isAdmin || profile?.plan === "pro";

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (!isApproved && !isAdmin) {
        navigate("/login");
      }
    }
  }, [user, isApproved, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (!isApproved && !isAdmin)) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <TechBackground />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[300px] bg-primary/3 rounded-full blur-[100px]" />

      <Navbar />
      <div className="relative mx-auto w-full max-w-3xl px-4 pt-24 sm:pt-28 pb-20">
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Studio <span className="text-neon-cyan">Videos</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Geração ilimitada de vídeos com IA
          </p>
        </div>

        <Tabs
          defaultValue="video"
          className="w-full"
          onValueChange={(v) => {
            if (v === "storyboard" && !canAccessStoryboard) {
              toast.error("Storyboard disponível apenas no plano Pro.");
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-card/60 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="video" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Film className="h-4 w-4 mr-2" /> Gerar Vídeo
            </TabsTrigger>
            <TabsTrigger
              value="storyboard"
              disabled={!canAccessStoryboard}
              className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              {!canAccessStoryboard && <Lock className="h-3 w-3 mr-1" />}
              <Layers className="h-4 w-4 mr-2" /> Storyboard
              <Badge className="ml-2 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                Pro
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video">
            <VideoGenerator />
          </TabsContent>
          <TabsContent value="storyboard">
            <StoryboardGenerator />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default StudioVideos;

import { useState } from "react";
import { TechBackground } from "@/components/landing/TechBackground";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { VideoGenerator } from "@/components/VideoGenerator";
import { FrameVideoGenerator } from "@/components/FrameVideoGenerator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2, Lock, Video, Frame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Tab = "generate" | "frame";

const StudioVideos = () => {
  const { user, profile, isApproved, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  const canAccessFrame = profile?.plan === "pro" || isAdmin;

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

  const handleFrameClick = () => {
    if (!canAccessFrame) {
      toast.error("Disponível apenas no plano Pro");
      return;
    }
    setActiveTab("frame");
  };

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

        {/* Tab switcher */}
        <div className="mb-8 flex items-center gap-1 rounded-xl bg-card/40 p-1 border border-white/[0.06]">
          <button
            onClick={() => setActiveTab("generate")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === "generate"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            <Video className="h-4 w-4" />
            Gerar Vídeo
          </button>
          <button
            onClick={handleFrameClick}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              !canAccessFrame
                ? "opacity-60 cursor-not-allowed text-muted-foreground border border-transparent"
                : activeTab === "frame"
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {!canAccessFrame && <Lock className="h-3.5 w-3.5" />}
            Frame Mode
            <Badge className="ml-1 bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
              Pro
            </Badge>
          </button>
        </div>

        {activeTab === "generate" ? <VideoGenerator /> : <FrameVideoGenerator />}
      </div>
      <Footer />
    </div>
  );
};

export default StudioVideos;

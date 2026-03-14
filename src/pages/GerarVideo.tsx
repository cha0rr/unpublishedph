import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { VideoGenerator } from "@/components/VideoGenerator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const GerarVideo = () => {
  const { user, isApproved, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 pt-28 pb-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gerador de <span className="text-gradient-cyan">Vídeos</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Veo 3.1 — Geração ilimitada de vídeos com IA
          </p>
        </div>
        <VideoGenerator />
      </div>
      <Footer />
    </div>
  );
};

export default GerarVideo;

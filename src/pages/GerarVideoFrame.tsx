import { TechBackground } from "@/components/landing/TechBackground";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FrameVideoGenerator } from "@/components/FrameVideoGenerator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const GerarVideoFrame = () => {
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <TechBackground />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[300px] bg-primary/3 rounded-full blur-[100px]" />

      <Navbar />
      <div className="relative mx-auto w-full max-w-2xl px-4 pt-24 sm:pt-28 pb-20">
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gerador de <span className="text-neon-cyan">Vídeos</span> — Frame Mode
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Envie um frame inicial e final para gerar o vídeo intermediário com IA
          </p>
        </div>
        <FrameVideoGenerator />
      </div>
      <Footer />
    </div>
  );
};

export default GerarVideoFrame;

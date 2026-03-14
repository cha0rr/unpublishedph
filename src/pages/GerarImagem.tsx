import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { TechBackground } from "@/components/landing/TechBackground";
import { ImageGenerator } from "@/components/ImageGenerator";
import { Loader2, ImageIcon } from "lucide-react";

export default function GerarImagem() {
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const isBusiness = profile?.plan === "business" && profile?.status === "approved";
  const hasAccess = isAdmin || isBusiness;

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

  return (
    <div className="min-h-screen bg-background relative">
      <TechBackground />
      <Navbar />
      <main className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Gerador de Imagens</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-display">
              Crie imagens com IA
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Gere imagens profissionais usando modelos avançados de inteligência artificial.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8 border border-border/50">
            <ImageGenerator />
          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { TechBackground } from "@/components/landing/TechBackground";
import { AvatarMakerForm } from "@/components/AvatarMakerForm";
import { AvatarPreview } from "@/components/AvatarPreview";
import { Loader2, UserRound } from "lucide-react";

const CATEGORY_DEFAULTS: Record<string, string> = {
  hairColor: "Preto",
  hairType: "Liso",
  skinColor: "Pele morena",
  eyeColor: "Castanho",
  skinTexture: "Lisa",
  height: "Média",
  bodyType: "Mediana",
};

export default function AvatarMaker() {
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [selections, setSelections] = useState<Record<string, string>>(CATEGORY_DEFAULTS);

  const isPro = profile?.plan === "pro" && profile?.status === "approved";
  const hasAccess = isAdmin || isPro;

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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <UserRound className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Avatar Maker</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-display">
              Crie sua Influencer Digital
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Personalize cada detalhe da aparência e gere imagens ultra-realistas com IA.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Preview - mobile top, desktop right (order reversed via lg:order) */}
            <div className="lg:order-2 lg:w-72 flex-shrink-0">
              <div className="lg:sticky lg:top-28">
                <div className="glass rounded-2xl p-6 border border-border/50">
                  <AvatarPreview selections={selections} />
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 lg:order-1">
              <div className="glass rounded-2xl p-6 md:p-8 border border-border/50">
                <AvatarMakerForm
                  selections={selections}
                  onSelectionsChange={setSelections}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

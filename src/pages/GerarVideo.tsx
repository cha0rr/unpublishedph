import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { VideoGenerator } from "@/components/VideoGenerator";

const GerarVideo = () => {
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

import { VideoGenerator } from "@/components/VideoGenerator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            PH Labs Studio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            VEO 3.1 Fast — Geração de vídeos com IA no Brasil
          </p>
        </div>

        <VideoGenerator />
      </div>
    </div>
  );
};

export default Index;

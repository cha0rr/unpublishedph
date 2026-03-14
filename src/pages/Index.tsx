import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGenerator } from "@/components/ImageGenerator";
import { VideoGenerator } from "@/components/VideoGenerator";
import { ImageIcon, VideoIcon } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            GeminiGen Studio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gere imagens e vídeos com inteligência artificial
          </p>
        </div>

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Imagem
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" />
              Vídeo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="image">
            <ImageGenerator />
          </TabsContent>
          <TabsContent value="video">
            <VideoGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

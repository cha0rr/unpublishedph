import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const GerarImagem = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 pt-28 pb-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gerador de <span className="text-gradient-cyan">Imagens</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Geração de imagens com IA — Em breve
          </p>
        </div>
        <div className="glass-card p-12 text-center">
          <p className="text-lg text-muted-foreground">🚀 Em breve disponível</p>
          <p className="mt-2 text-sm text-muted-foreground">
            O gerador de imagens está sendo finalizado e estará disponível em breve.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GerarImagem;

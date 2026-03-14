import { Link } from "react-router-dom";
import logo from "@/assets/logo.jpeg";

const links = {
  Produto: ["Gerador de Vídeo", "Planos", "API"],
  Empresa: ["Sobre", "Blog", "Contato", "Carreiras"],
  Legal: ["Termos de Uso", "Privacidade", "Cookies"],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid gap-8 sm:gap-12 grid-cols-2 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="PH Studio" className="h-9 w-auto rounded-lg" />
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Plataforma de geração de vídeos com inteligência artificial.
              Desenvolvido por PH Labs.
            </p>
            <div className="mt-6 flex gap-4">
              {["X", "In", "YT"].map((s) => (
                <div key={s} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-pointer">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="mb-4 text-sm font-semibold text-foreground">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-16 border-t border-white/[0.06] pt-6 sm:pt-8 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PH Labs. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

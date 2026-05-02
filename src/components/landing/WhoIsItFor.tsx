import { motion } from "framer-motion";
import { EyeOff, ShoppingBag, Users, Bot, Package } from "lucide-react";

const personas = [
  { icon: EyeOff, title: "Criadores dark", desc: "Quem quer faturar sem expor o rosto." },
  { icon: ShoppingBag, title: "Afiliados TikTok Shop", desc: "Volume de criativos por produto, todo dia." },
  { icon: Users, title: "Donos de páginas de nicho", desc: "Fatos, mistério, esporte, motivacional, autos." },
  { icon: Bot, title: "Criadores de influencers IA", desc: "Avatares próprios para vender ofertas." },
  { icon: Package, title: "Sellers digitais / PLR / drop", desc: "Tráfego orgânico para infoprodutos e dropshipping." },
];

export function WhoIsItFor() {
  return (
    <section className="relative py-16 sm:py-24 bg-navy-light/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Para <span className="text-gradient-cyan">quem é isso?</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Construído para quem trata redes sociais como negócio — não como hobby.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {personas.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-card p-5 flex items-start gap-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
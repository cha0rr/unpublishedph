import { motion } from "framer-motion";
import { ShoppingBag, Instagram, Youtube, Link2, Package, Moon } from "lucide-react";

const cases = [
  { icon: ShoppingBag, label: "TikTok Shop" },
  { icon: Instagram, label: "Instagram Shop" },
  { icon: Youtube, label: "YouTube Shop" },
  { icon: Link2, label: "Afiliados" },
  { icon: Package, label: "Produtos próprios" },
  { icon: Moon, label: "Conteúdo dark" },
];

export function UseCasesSection() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          className="mb-10 sm:mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Perfeito para quem <span className="text-gradient-cyan">vende ou cria conteúdo</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
          {cases.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="glass-card flex items-center gap-3 p-4 sm:p-5"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm sm:text-base font-medium text-foreground">{c.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

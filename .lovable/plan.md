# Reposicionamento da Landing Page — All-in-One

Reescrita completa da copy e adição de duas novas seções (Dor e Diferencial), mantendo o design system atual (Navy + Cyan, glass-cards, motion).

## Nova ordem das seções em `src/pages/Index.tsx`

```text
Navbar
HeroSection           (texto novo)
PainSection           (NOVA — "várias ferramentas vs você")
SolutionSection       (substitui BenefitsSection — bullets do "tudo em um")
HowItWorks            (3 passos novos)
UseCasesSection       (NOVA — TikTok Shop, IG Shop, YT Shop, afiliados, dark…)
ShowcaseSection       (mantida — vira "Exemplos")
DifferentialSection   (NOVA — all-in-one)
PricingSection        (reforço "Substitui várias ferramentas")
FinalCTA              (texto novo)
Footer
```

## Mudanças por arquivo

### 1. `HeroSection.tsx` — copy nova
- Badge: "Tudo em um só lugar — Roteiros, Imagens & Vídeos com IA"
- H1: **"Crie vídeos para vender nas redes — sem precisar de várias ferramentas"** (com "várias ferramentas" em gradient cyan)
- Subheadline: "Roteiros, prompts, imagens e vídeos com IA em um único lugar. Tudo que você precisa para TikTok Shop, Instagram e YouTube."
- CTA: "Começar agora" (rola para `#planos`)
- Microcopy abaixo do CTA: "Sem apps extras. Sem complicação."
- Bullets de prova substituídos por: "Roteiros · Imagens · Vídeos · Prompts"

### 2. `PainSection.tsx` (NOVO)
Layout de duas colunas em desktop, empilhado em mobile:
- Coluna esquerda — "Antes": cards riscados com ChatGPT / Midjourney / Editor / App de legenda + texto "horas perdidas".
- Coluna direita — "Agora com PH Studio": um único card cyan glow com ícone Sparkles + "Tudo em um fluxo".
- Headline: "Cansado de usar várias ferramentas pra criar um único vídeo?"

### 3. `SolutionSection.tsx` (NOVO, substitui `BenefitsSection`)
- Headline: "Agora você faz tudo dentro de um único sistema"
- 5 bullets com ícones (FileText, Wand2, ImageIcon, Video, Send):
  - Gere roteiros prontos para venda
  - Crie prompts automaticamente
  - Produza imagens com IA
  - Anime e transforme em vídeos
  - Pronto para postar nas redes
- Texto de fechamento destacado: "Do zero ao vídeo pronto em minutos."

### 4. `HowItWorks.tsx` — passos atualizados
- 01 — Escreva sua ideia (ou nem isso) — "Envie a imagem do produto ou tema"
- 02 — A IA cria tudo — "Roteiro + imagens + vídeo"
- 03 — Baixe e poste — "Pronto para vender"

### 5. `UseCasesSection.tsx` (NOVO)
- Headline: "Perfeito para quem vende ou cria conteúdo"
- Grid 3×2 de chips/cards: TikTok Shop · Instagram Shop · YouTube Shop · Afiliados · Produtos próprios · Conteúdo dark
- Cada item com ícone Lucide e leve hover.

### 6. `ShowcaseSection` — apenas título atualizado para "O que você pode criar" com subtítulo "Vídeos de produto · UGC com IA · Conteúdo dark · Anúncios para social commerce".

### 7. `DifferentialSection.tsx` (NOVO)
- Layout centralizado, large quote feel.
- Headline: "Você não precisa mais montar um quebra-cabeça de ferramentas"
- Parágrafo conforme copy.
- Linha de fechamento em destaque: "Menos esforço. Mais produção. Mais resultado."

### 8. `PricingSection.tsx` — reforço
- Adicionar pequeno badge acima do título: "Substitui ChatGPT + Midjourney + Editor + Apps de legenda"
- Em cada plano, adicionar uma linha de feature inicial: "Substitui várias ferramentas".

### 9. `FinalCTA.tsx` — copy nova
- H2: "Tudo que você precisa para criar vídeos está aqui"
- Sub: "Pare de perder tempo com ferramentas. Comece a produzir de verdade."
- Botão: "Criar meu primeiro vídeo" → leva para `#planos`.

### 10. `Index.tsx`
Importar e ordenar as seções conforme o wireframe novo.

## Notas de design
- Mantém a estética atual: `glass-card`, gradiente cyan em palavras-chave, motion via framer-motion (fade + y) com `viewport={{ once: true }}`.
- Sem novas dependências, sem alterações no design system.
- Responsivo (mobile-first) seguindo o padrão das seções existentes.
- Sem mudanças em rotas, backend, banco ou edge functions.

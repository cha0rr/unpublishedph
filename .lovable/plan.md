# Reposicionamento da landing — "Perfis que vendem sem você aparecer"

Objetivo: trocar o eixo de venda de "IA que cria vídeos" para "máquina de criar perfis dark/anônimos que vendem sozinhos", com paleta premium dark-money, copy mais agressiva, novas seções de posicionamento e prova social, e reestruturação de planos.

## 1. Design system — nova paleta + tipografia

Atualizar `src/index.css` e `tailwind.config.ts`:

- Novos tokens HSL em `:root`:
  - `--background` → `#050B14` (preto azulado)
  - `--card` / `--surface` → `#0B1A2B` (azul profundo)
  - `--primary` → `#00D4FF` (azul neon — CTAs secundários e highlights)
  - `--accent-purple` → `#7B61FF` (roxo IA — selos, badges de poder)
  - `--money` → `#00FF9C` (verde neon — apenas CTAs principais "ganhar/escalar")
  - `--border` mais sutil em branco/4%
- Tipografia: trocar `Space Grotesk`/`Inter` por **Satoshi** (display, via Fontshare CDN) + manter `Inter` no body. Headings com `letter-spacing: -0.03em`.
- Novos utilitários:
  - `.glow-money` (sombra verde neon suave nos CTAs principais)
  - `.glow-purple` (sombra roxa para badges "IA")
  - `.glass-premium` (blur 20px, borda `white/8`, fundo `white/3`) — substitui o atual `glass-card` quando precisamos de mais profundidade.
  - `.text-gradient-money` (gradiente cyan → verde) para números/highlights de receita.
- Manter retrocompatibilidade: `cyan` continua mapeado para o novo `--primary` para não quebrar componentes internos.

## 2. Hero (`HeroSection.tsx`) — reescrita

- Badge: "Marca fantasma · 100% anônimo" (com ponto roxo).
- H1: **"Crie perfis que vendem todos os dias —"** + linha quebrada **"sem aparecer."** (a palavra "vendem" em gradiente money, "sem aparecer" em cyan).
- Subheadline: "Gere vídeos, influencers IA e conteúdo viral em escala para TikTok, Instagram e YouTube."
- CTA principal (verde money, glow): **"Criar meu primeiro perfil agora"** → rola para `#planos`.
- CTA secundário (outline cyan): **"Ver como funciona"** → rola para `#como-funciona`.
- Pílulas de baixo: "Anônimo", "Múltiplas contas", "Monetização integrada".
- Lado direito: substituir `HeroAnimation` por um **mock de dashboard "Painel de Perfis"**:
  - Card glass com 3 "perfis" listados (avatares IA + nichos: "Cartomante", "Review Dark", "UGC Feminino"), cada um com métrica fake (views, vendas).
  - Pequeno gráfico de barras animado.
  - Linha de status pulsando "3 perfis publicando agora".
  - Tudo em CSS/SVG — sem assets externos.

## 3. Nova seção: "O que você pode criar em minutos"

Inserir entre Hero e Benefits — novo arquivo `ProofValueSection.tsx`. Grid 2x2 ou 4 cards verticais (9:16) com:
- Influencer IA feminina vendendo produto
- Review sem rosto (mãos + produto)
- Canal dark automatizado (tela preta + voz + texto)
- UGC fake com IA

Cada card usa thumbnail mockada (gradiente + ícone + label). Reaproveitar mídias do `ShowcaseSection` quando possível (a seção já existe — manter como "rolagem viva" depois).

## 4. Benefits (`BenefitsSection.tsx`) — copy nova

Trocar para linguagem dinheiro/escala:
- "Automatize vendas" — afiliados rodando 24/7 com IA
- "Escala de perfis" — múltiplas contas, conteúdo único em cada
- "Conteúdo invisível" — você nunca aparece, a IA é o rosto
- "Marca fantasma" — branding de nicho sem identidade real

Headline: "Tudo o que uma equipe de 10 pessoas faria — você sozinho, no automático."

## 5. Nova seção: "Para quem é isso?"

Novo arquivo `ForWhoSection.tsx`. Inserir após Benefits. 5 cards compactos com ícone:
- Criadores dark (sem aparecer)
- Afiliados TikTok Shop
- Donos de páginas de nicho
- Criadores de influencers IA
- Vendedores de PLR/produtos digitais

## 6. How It Works (`HowItWorks.tsx`) — refresh "money-oriented"

Steps:
- 01 — Escolha o nicho (dark, UGC, influencer IA, review)
- 02 — Gere vídeos + avatar IA em segundos
- 03 — Poste e escale múltiplas contas
- 04 (novo) — **Monetize** com afiliados, produtos ou tráfego (ícone money, destaque verde)

Trocar grid `md:grid-cols-3` para `md:grid-cols-4`.

## 7. Nova seção: Prova social

Novo arquivo `SocialProofSection.tsx`. Inserir antes de Pricing. Conteúdo:
- 3 cards de "resultado" (mockup honesto — rótulo "Exemplo de uso"):
  - Conta @nicho.dark — "1.2M views em 14 dias"
  - Conta @ugc.ia — "R$ 8.430 em vendas afiliadas"
  - Conta @influencer.ai — "32k seguidores em 30 dias"
- Linha de "logos/plataformas suportadas": TikTok, Instagram, YouTube Shorts, Kwai.
- Disclaimer pequeno: "Resultados ilustrativos baseados em casos de uso reais da plataforma."

## 8. Pricing (`PricingSection.tsx`) — reposicionar

Trocar de 2 planos para 3, com posicionamento mais premium (decisão a confirmar — ver perguntas):
- **Starter — R$ 59/mês** — 1 conta, vídeos ilimitados, 9:16
- **Growth — R$ 97/mês** ⭐ Mais popular — múltiplos perfis, avatar IA, gerador de roteiros
- **Scale — R$ 197/mês** — escala ilimitada, suporte prioritário, consultoria semanal

Headline: "Feito para quem quer escalar múltiplas contas."
CTAs: verde money no plano destacado, outline cyan nos demais.
**Importante:** isso muda a regra de negócio (hoje só existem `basico` e `pro` no Supabase + edge functions de gating). Vou confirmar com você antes de mexer no schema.

## 9. Final CTA + Navbar + Footer

- `FinalCTA.tsx`: "Pronto para construir sua primeira marca fantasma?" + botão verde money.
- `Navbar.tsx`: trocar copy "Começar" por "Criar perfil grátis"; ajustar cores para a nova paleta.
- `TechBackground.tsx`: aumentar saturação roxa/cyan no grid pulsante para combinar com a paleta dark money.

## 10. Index.tsx — nova ordem

```text
TechBackground
Navbar
HeroSection                (reescrito)
ProofValueSection          (novo)
BenefitsSection            (copy nova)
ForWhoSection              (novo)
HowItWorks                 (4 passos)
ShowcaseSection            (mantido)
SocialProofSection         (novo)
PricingSection             (reestruturado)
FinalCTA
Footer
```

## Detalhes técnicos

- Todos os tokens em **HSL** no `index.css`, expostos via `tailwind.config.ts` (`colors.money`, `colors.purple-ai`).
- Fonte Satoshi via `<link>` em `index.html` (Fontshare é gratuito, sem API key).
- Animações com `framer-motion` já existente — sem libs novas.
- Sem mudanças em backend/Supabase, **exceto** se você aprovar o plano de 3 tiers (aí faço migração separada).
- Mantenho `RegistroDialog` funcional; só adapto `selectedPlan` para os novos slugs se você confirmar a mudança de planos.

## Pontos a confirmar antes de implementar

1. **Planos**: passar de 2 (Básico/Pro) para 3 (Starter/Growth/Scale) muda preço, slugs no Supabase e gating das edge functions. Posso (a) só atualizar visualmente mantendo `basico/pro` por trás, (b) fazer a refatoração completa com migração, ou (c) manter os preços atuais.
2. **Prova social**: posso usar números/handles ilustrativos com disclaimer, ou você prefere deixar a seção pronta mas vazia para você preencher depois com prints reais?
3. **Hero direito**: substituir `HeroAnimation` pelo dashboard mock, ou manter o atual e só trocar a copy do lado esquerdo?
4. **Verde money nos CTAs**: aplicar só no CTA principal do hero e do pricing destacado, ou em todos os CTAs primários do site?

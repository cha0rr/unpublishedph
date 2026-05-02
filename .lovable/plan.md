
# Reestruturação da Landing Page — High Conversion

Reposicionar a landing de "criar vídeos com IA" para "automatizar perfis que vendem sem aparecer", com linguagem orientada a dinheiro, anonimato e escala.

## Alerta importante sobre os planos

Você pediu para subir os preços (Starter R$59 / Growth R$97 / Scale R$197+). **Atualmente o sistema tem apenas 2 planos integrados ao backend: `basico` (R$ 49,90) e `pro` (R$ 69,90)** — eles estão amarrados ao banco, RPCs, gates de feature (Studio Imagens, Avatar Maker, DeepSeek) e fluxo de ativação manual via WhatsApp.

Mexer no preço/estrutura de planos **na landing apenas** é seguro (visual). Mas criar 3 tiers reais exigiria migração de banco, novos gates, novo fluxo de cobrança. Por isso vou propor **duas opções** e pedir sua decisão antes de executar.

## Mudanças por seção

### 1. HeroSection.tsx
- Headline: **"Crie perfis que vendem todos os dias — sem aparecer."**
- Highlight em cyan na palavra "vendem" e/ou "sem aparecer".
- Subheadline: "Gere vídeos, influencers IA e conteúdo viral em escala para TikTok, Instagram e YouTube."
- Badge superior: trocar "Geração Ilimitada" por "Marca fantasma · Conteúdo invisível · Escala em piloto automático".
- CTA primário: **"🔥 Criar meu primeiro perfil agora"** → rola para `#planos`.
- CTA secundário (novo, ghost): "Testar sem aparecer" → também `#planos`.
- Trust pills inferiores: trocar para "Dark creators", "TikTok Shop / Afiliados", "Influencers IA".

### 2. Nova seção: `WhatYouCanCreate.tsx` (Prova de valor imediata)
Inserir logo após o Hero, antes de Benefits. Título: **"O que você pode criar em minutos"**. Grid 2x2 com cards (ícone + título + 1 linha):
- Influencer IA feminina vendendo produto
- Vídeos estilo "review sem rosto"
- Canal dark automatizado
- UGC fake com IA

Reaproveita estilo `glass-card` e tokens já existentes.

### 3. BenefitsSection.tsx — reescrever copy
Manter layout, trocar textos para vocabulário orientado a venda/escala/anonimato:
- "Automatize vendas" — Perfis que postam, engajam e convertem sem você aparecer.
- "Escale múltiplos perfis" — Conteúdo único por conta, sem deixar rastro de duplicidade.
- "Marca fantasma" — Crie influencers IA que vendem por você 24/7.
- "Conteúdo invisível" — UGC, dark e nicho gerados em volume com 1 clique.

Título da seção: "Por que criadores estão migrando pro PH Studio".

### 4. Nova seção: `WhoIsItFor.tsx` (Posicionamento)
Inserir após Benefits. Título: **"Para quem é isso?"**. Lista com ícones:
- Criadores dark (sem aparecer)
- Afiliados TikTok Shop
- Donos de páginas de nicho
- Criadores de influencers IA
- Sellers de produtos digitais / PLR / dropshipping

### 5. HowItWorks.tsx — reescrever
- 01 → **Escolha o nicho** (dark, UGC, influencer IA, review sem rosto…)
- 02 → **Gere vídeos + avatar IA** em escala
- 03 → **Poste e escale múltiplas contas** em automático
- Card extra (4º, destacado em cyan): **💰 "Monetize com afiliados, TikTok Shop ou produtos digitais"**.

### 6. Nova seção: `SocialProof.tsx` (Prova social)
Antes de PricingSection. Grid de "prints" mockados (cards estilizados — não imagens reais para evitar fake explícito). 3 cards com:
- Métrica grande (1.2M views, 487k views, R$ 12.4k em comissões)
- Legenda curta ("Conta de cartomante – 14 dias", "Afiliado TikTok Shop – nicho beleza", "Página dark de fatos – 1º mês")
- Mini barra/gráfico decorativo

Aviso visual sutil: "Resultados de criadores usando IA. Performance individual varia."

### 7. PricingSection.tsx — escolher direção (PRECISO DA SUA DECISÃO)

**Opção A — Apenas visual (recomendado para não quebrar backend):**
- Manter os 2 planos atuais (basico R$49,90 / pro R$69,90).
- Renomear na UI: "Starter" e "Growth".
- Adicionar copy "Feito para quem quer escalar múltiplas contas".
- Adicionar 3º card "Scale — Em breve / Lista de espera" (R$197+) somente visual, com botão que abre WhatsApp ou formulário.

**Opção B — Reestruturar planos de verdade:**
- Criar 3 tiers reais (Starter R$59, Growth R$97, Scale R$197).
- Exige: migração no banco (`profiles.plan` enum), novos gates em todas as Edge Functions, ajuste do fluxo de ativação, atualização da memória de pricing-plans, possível impacto em assinantes atuais.
- Trabalho considerável (1-2h adicionais).

### 8. FinalCTA.tsx — reescrever
- Headline: "Pare de aparecer. **Comece a vender.**"
- Sub: "Lance seu primeiro perfil fantasma hoje e escale em piloto automático."
- CTA: "🔥 Criar meu primeiro perfil agora".

### 9. Index.tsx — nova ordem
```
Hero
WhatYouCanCreate   (novo)
Benefits           (copy reescrita)
WhoIsItFor         (novo)
HowItWorks         (4 passos)
ShowcaseSection    (mantido)
SocialProof        (novo)
PricingSection     (ajustado)
FinalCTA           (reescrito)
Footer
```

## Detalhes técnicos
- Todas as novas seções seguem o padrão: `motion.div` com `whileInView`, `glass-card`, tokens `text-gradient-cyan`, `bg-navy-light/30` alternado.
- Sem novas dependências — usa `framer-motion`, `lucide-react`, `Button` já existentes.
- Mobile-first mantido (mesmos breakpoints `sm:` / `md:` / `lg:`).
- Atualizar memória `mem://business/product-positioning` com o novo posicionamento ("marca fantasma / sem aparecer / vendas automáticas").

## Pergunta antes de executar

Qual caminho seguir nos planos?
- **A)** Só visual (rápido, sem risco) — renomeia para Starter/Growth, mantém preços atuais, adiciona "Scale em breve".
- **B)** Reestruturar planos reais (Starter R$59 / Growth R$97 / Scale R$197) — requer migração de banco e ajustes em várias Edge Functions.

Vou aguardar sua resposta para essa decisão antes de executar.

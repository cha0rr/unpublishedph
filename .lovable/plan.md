

## Plano: Expandir copy da landing para incluir vídeos virais além de UGC

### Contexto
A landing está focada apenas em UGC, mas o público também cria vídeos virais em nichos como cartomante, fazendeiros, frutas falantes e notícias para crescer contas rapidamente.

### Alterações

**1. `src/components/landing/HeroSection.tsx`**
- Badge: "UGC com IA para TikTok" → "Vídeos com IA para TikTok — Geração Ilimitada"
- Título: "Cresça contas no TikTok com **vídeos gerados por IA**" (mais amplo que só UGC)
- Subtítulo: "Crie UGC, vídeos virais de cartomante, fazendeiros, frutas falantes, notícias e muito mais para escalar contas no TikTok."
- Tags de rodapé: "UGC & Vídeos Virais", "TikTok Shop", "Venda de contas"

**2. `src/components/landing/BenefitsSection.tsx`**
- Título: "Por que usar PH Studio para **TikTok**?" (manter)
- Reescrever cards:
  1. "Vídeos Virais com IA" — Cartomante, fazendeiros, frutas falantes, notícias... crie qualquer nicho viral.
  2. "UGC Realista" — Reviews, unboxings e depoimentos que parecem orgânicos.
  3. "Escale Múltiplas Contas" — Conteúdo único para cada conta, sem esforço.
  4. "Geração Ilimitada" — Sem limites. Crie quantos vídeos precisar para crescer rápido.

**3. `src/components/landing/ShowcaseSection.tsx`**
- Título: "Exemplos de **vídeos para TikTok**"
- Subtítulo: "UGC, virais, nichos criativos — veja o que você pode criar."
- Reescrever labels dos items para misturar nichos:
  1. "Cartomante / Místico" (tipo: Viral)
  2. "Fazendeiro / Rural" (tipo: Viral)
  3. "Frutas Falantes" (tipo: Viral)
  4. "Notícias & Fatos" (tipo: Viral)
  5. "Review de Produto" (tipo: UGC)
  6. "Unboxing / Depoimento" (tipo: UGC)

**4. `src/components/landing/HowItWorks.tsx`**
- Passo 1: "Descreva seu vídeo" — "UGC, cartomante, fazendeiro, frutas falantes, notícias... descreva o que quiser."
- Passos 2 e 3: manter como estão

**5. `src/components/landing/FinalCTA.tsx`**
- Subtítulo: "Comece a gerar vídeos virais e UGC agora. Sem limites, sem complicação."

**6. `src/components/landing/Footer.tsx`**
- Descrição: "Plataforma de vídeos com IA para criadores e vendedores no TikTok."

### Sem alterações estruturais
Apenas copy e labels. Nenhum componente novo.


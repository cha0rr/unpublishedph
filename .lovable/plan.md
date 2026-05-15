## Objetivo

Deixar claro na página `/gerar-roteiro` que o usuário pode gerar **roteiros e prompts** para três finalidades:
1. Vídeos virais
2. Vídeos UGC
3. Criativos para vendas

E atualizar os exemplos para refletir esses três casos de uso.

## Alterações em `src/pages/GerarRoteiro.tsx`

### 1. Atualizar o cabeçalho e subtítulo
- Manter o título "Gerador de Roteiros & Prompts".
- Adicionar logo abaixo (ou no estado vazio) uma frase curta de posicionamento:
  > "Crie roteiros e prompts para vídeos virais, UGC e criativos para vendas."

### 2. Substituir `EXAMPLE_PROMPTS`
Trocar a lista atual por 6 exemplos agrupados em 3 categorias (2 por categoria), exibidos com um pequeno rótulo de categoria:

- **Vídeos Virais**
  - "Gere um roteiro de Notícias Virais com gancho nos primeiros 3 segundos"
  - "Crie um prompt de vídeo de Frutas Falantes para viralizar no TikTok"
- **Vídeos UGC**
  - "Gere um roteiro UGC de unboxing autêntico para Instagram Reels"
  - "Crie um prompt de UGC estilo 'POV: testei esse produto por 7 dias'"
- **Criativos para Vendas**
  - "Gere um roteiro de criativo de vendas com gatilho de escassez"
  - "Crie um prompt de anúncio de produto com CTA forte para TikTok Shop"

### 3. UI do estado vazio
- Renderizar as 3 categorias como blocos (ou chips agrupados), cada um com ícone:
  - Vídeos Virais → `Flame` (lucide)
  - Vídeos UGC → `Users`
  - Criativos para Vendas → `ShoppingBag`
- Cada exemplo continua clicável (chama `sendMessage(example)`) para enviar o prompt direto ao chat — hoje os exemplos são apenas decorativos, então isso também torna o estado vazio funcional.

## Fora de escopo
- Nenhuma mudança em backend, edge functions, ou no modelo (DeepSeek Chat).
- Sem mexer em outras páginas (Studio Videos, Showcase, etc.).

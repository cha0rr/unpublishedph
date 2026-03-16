

## Plano: Atualizar fluxos de vídeo do PH Studio

### Resumo das mudanças

6 arquivos modificados para adicionar seleção de modelo, corrigir envio de arquivos e padronizar edge functions.

---

### 1. `src/hooks/useGenerator.ts` — Adicionar `model` ao GenerateParams

- Adicionar campo `model` ao `GenerateParams` (default `veo-3.1-fast`)
- Enviar `model` no FormData junto com os demais campos
- Sem outras mudanças na lógica de polling (já funciona)

### 2. `src/components/VideoGenerator.tsx` — Seletor de modelo + correção ingrediente

- Adicionar estado `model` com default `veo-3.1-fast`
- Adicionar ToggleGroup com 3 opções: `veo-3-fast`, `veo-3.1`, `veo-3.1-fast`
- Passar `model` para `generate()`
- No modo `none`: não enviar `mode_image` nem arquivos
- No modo `ingredient`: enviar `mode_image=ingredient` e arquivo no campo `files`

### 3. `src/components/FrameVideoGenerator.tsx` — Seletor de modelo + usar useGenerator

- Adicionar estado `model` e ToggleGroup igual ao VideoGenerator
- Migrar de polling inline para usar `useGenerator` hook (padronização)
- Enviar `mode_image=frame`, modelo selecionado, e frames no campo `files` (primeiro o inicial, depois o final)
- Chamar a edge function `geminigen-video` (unificada) em vez de `geminigen-video-frame`
- Usar token do usuário autenticado (atualmente usa `SUPABASE_KEY` como Bearer — bug de auth)

### 4. `supabase/functions/geminigen-video/index.ts` — Aceitar modelo do frontend

- Ler campo `model` do FormData recebido (em vez de fixar no código)
- No modo `ingredient`: enviar imagem no campo `files` (corrigir de `image` para `files`)
- No modo `frame`: manter lógica de 2 arquivos no campo `files`
- No modo `none`: não enviar `mode_image`
- Gravar o modelo real no `image_generations`
- Resposta padronizada: `{ success: true, uuid, status }`

### 5. `supabase/functions/geminigen-video-frame/index.ts` — Manter mas aceitar modelo

- Aceitar campo `model` do FormData (para caso de chamada direta)
- Resposta padronizada: `{ success: true, uuid, status }`
- Corrigir para usar modelo recebido em vez de fixo

### 6. Visual

- ToggleGroup de modelo seguirá o mesmo estilo dos toggles existentes (border ciano, bg primary/20 quando ativo)
- Posicionado acima dos controles de aspect ratio na toolbar

---

### Detalhes técnicos

**Correção principal do ingrediente**: A edge function envia `image` mas a API GeminiGen espera `files`. Trocar para `files`.

**Bug de auth no FrameVideoGenerator**: O polling usa `Bearer ${SUPABASE_KEY}` em vez do token do usuário. Isso pode causar falhas de auth. Será corrigido ao migrar para `useGenerator`.

**Padronização**: Ambos os fluxos passarão pelo mesmo hook `useGenerator`, que chama `geminigen-video`. A edge function `geminigen-video-frame` será mantida como fallback mas o fluxo principal será unificado.


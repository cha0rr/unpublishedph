

## Plano: Adicionar geração de vídeo com Grok 3 (plano Pro)

### Resumo
Adicionar o modelo Grok 3 como nova opção ao lado dos modelos Veo existentes na página de geração de vídeo. Ao selecionar Grok 3, a interface muda para exibir as opções específicas desse modelo (orientação expandida, duração, modo de geração). Disponível apenas para usuários do plano Pro e admins.

### Etapas

**1. Atualizar `VideoGenerator.tsx` — nova UI para Grok 3**
- Adicionar `grok-3` ao `MODEL_OPTIONS`
- Quando Grok 3 selecionado, exibir:
  - **Generation Mode**: dropdown com Normal, Extremely Crazy, Extremely Spicy or Crazy, Custom
  - **Orientação expandida**: Landscape (16:9), Portrait (9:16), Square (1:1), Vertical (2:3), Horizontal (3:2) — com ícones visuais como na imagem
  - **Resolução**: apenas 480p (Standard) e 720p (High) — ocultar 1080p
  - **Duração**: 6s, 10s (radio buttons)
  - **Image Reference**: botão "Select Image" para enviar 1 imagem de referência
- Ocultar o seletor de "Image Reference Type" (ingredient/none) quando Grok selecionado — usar botão próprio
- Passar `duration`, `mode`, `grokAspectRatio` no `generate()`
- Verificar plano do usuário via `useAuth()` — se não for Pro nem admin, desabilitar/ocultar Grok 3 com tooltip "Disponível no plano Pro"

**2. Atualizar `useGenerator.ts` — novos parâmetros**
- Adicionar `duration`, `mode` a `GenerateParams`
- Quando modelo for `grok-3`, anexar `duration` e `mode` ao FormData

**3. Atualizar Edge Function `geminigen-video`**
- Detectar modelo `grok-3` e rotear para `/uapi/v1/video-gen/grok`
- Converter aspect ratio: `16:9` → `landscape`, `9:16` → `portrait`, `1:1` → `square`, `2:3` → `vertical`, `3:2` → `horizontal`
- Adicionar `duration` e `mode` ao FormData
- Usar campo `files` em vez de `ref_images` para imagens de referência
- Não enviar `watermark` para Grok

**4. Atualizar `ExtendVideoDialog.tsx`**
- Passar `model` no body da requisição de extensão para que a edge function saiba qual endpoint usar

**5. Atualizar Edge Function `geminigen-video-extend`**
- Receber campo `model` do cliente
- Quando `grok-3`, rotear para `/uapi/v1/video-extend/grok` (mesmo padrão de endpoint)

### Restrição de acesso
- Grok 3 visível para todos, mas clicável apenas para plano Pro e admins
- Usuários do plano Básico veem badge "Pro" e tooltip informando que precisam do plano Pro

### Detalhes técnicos
- Conversão de aspect ratio feita na edge function (mapeamento string)
- Duração padrão: `6`, modo padrão: `normal`
- Campo `files` (não `ref_images`) para upload de imagens no Grok
- Nenhuma alteração de banco de dados necessária
- O extend do Grok pode não existir na API (404 na doc) — implementar tentativa e tratar erro gracefully


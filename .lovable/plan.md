

## Plano: Nova aba "Storyboard" no Studio Videos (Vídeo Longo - 54s)

### Resumo
Adicionar uma aba "Storyboard" ao lado de "Gerar Vídeo" na página Studio Videos. O Storyboard permite criar vídeos multi-cena (2-10 cenas, máx 45s) usando a API `video-storyboard/grok`. Inclui editor dinâmico de cenas com controle de duração individual e um novo Edge Function dedicado.

### Arquivos

**1. `src/pages/StudioVideos.tsx`** — Adicionar sistema de abas
- Importar `Tabs, TabsList, TabsTrigger, TabsContent`
- Aba "Gerar Vídeo" renderiza `<VideoGenerator />`
- Aba "Storyboard" renderiza `<StoryboardGenerator />`
- Badge "Pro" na aba Storyboard + cadeado para usuários básicos

**2. `src/components/StoryboardGenerator.tsx`** — Novo componente
- Interface de cenas dinâmicas (adicionar/remover cenas, mín 2, máx 10)
- Cada cena: campo de prompt + toggle de duração (6s ou 10s)
- Barra de progresso mostrando duração total vs máximo 45s
- Seletores: aspect_ratio (landscape/portrait/square), resolution (480p/720p)
- Botão "Gerar Storyboard" que chama a nova Edge Function
- Usa `useGenerator` existente para polling do resultado (mesmo padrão de UUID + history)
- Restrição de acesso: apenas Pro/Admin (toast de bloqueio para básico)
- Exibição do resultado com player de vídeo + download

**3. `supabase/functions/geminigen-video-storyboard/index.ts`** — Nova Edge Function
- Recebe: `scenes` (JSON array), `aspect_ratio`, `resolution`
- Validações: mín 2 cenas, máx 10, duração total ≤ 45s, durações 6 ou 10
- Verifica auth + plano Pro/Admin
- Chama `POST https://api.geminigen.ai/uapi/v1/video-storyboard/grok` com FormData
- Registra na tabela `image_generations` com model `grok-storyboard`
- Retorna UUID para polling via `geminigen-history` existente

**4. `src/hooks/useGenerator.ts`** — Pequeno ajuste
- Adicionar método `generateStoryboard` ou permitir que `generate` aceite um body JSON alternativo (para envio de scenes como JSON em vez de FormData com prompt único)
- Alternativa: criar um hook `useStoryboardGenerator` que reutiliza a lógica de polling

### Detalhes Técnicos

**Estrutura da cena no frontend:**
```typescript
interface Scene {
  id: string;
  prompt: string;
  duration: 6 | 10;
}
```

**Payload para a Edge Function:**
```json
{
  "scenes": [
    { "prompt": "...", "duration": 6 },
    { "prompt": "...", "duration": 10 }
  ],
  "aspect_ratio": "landscape",
  "resolution": "720p"
}
```

**Edge Function → API GeminiGen:**
- Envia como `multipart/form-data` com `scenes` como JSON string
- `aspect_ratio`, `resolution`, `model=grok-video`

**Controle de acesso:**
- Apenas plano Pro ou Admin
- Daily limit compartilhado (conta como 1 geração no limite de 30/dia)
- Model registrado como `grok-storyboard` na tabela `image_generations`

### UI do Storyboard
```text
┌─────────────────────────────────────────┐
│  [Gerar Vídeo]  [Storyboard 🔒 Pro]    │
├─────────────────────────────────────────┤
│  Cena 1                          [6s ▼] │
│  ┌─────────────────────────────────┐    │
│  │ Prompt da cena 1...             │    │
│  └─────────────────────────────────┘    │
│  Cena 2                         [10s ▼] │
│  ┌─────────────────────────────────┐    │
│  │ Prompt da cena 2...             │    │
│  └─────────────────────────────────┘    │
│  [+ Adicionar Cena]                     │
│                                         │
│  Duração total: 16s / 45s  ████░░░░     │
│                                         │
│  Orientação: [Landscape] [Portrait] ... │
│  Resolução:  [480p] [720p]              │
│                                         │
│  [         Gerar Storyboard         ]   │
└─────────────────────────────────────────┘
```


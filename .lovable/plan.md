

## Plano: Funcionalidade Extend Video

### Contexto

O projeto usa a API GeminiGen (`api.geminigen.ai/uapi/v1/video-gen/veo`) para gerar vídeos. A API Veo 3.1 suporta "scene extension" passando o vídeo fonte como arquivo junto com um novo prompt. A GeminiGen provavelmente expõe isso via o mesmo endpoint com um parâmetro de vídeo ou um endpoint dedicado.

### Arquivos a criar/modificar

**1. Nova Edge Function `supabase/functions/geminigen-video-extend/index.ts`**
- Recebe JSON com: `prompt`, `sourceVideoUrl`, `aspectRatio`, `resolution`
- Faz download do vídeo fonte via URL
- Envia para a API GeminiGen com o vídeo como arquivo (`ref_images` ou campo `video`) + prompt + `mode_image: "extend"` (ou parâmetro equivalente)
- Inclui autenticação, verificação de plano/role, rate limiting (mesma lógica das outras Edge Functions)
- Retorna `{ success, uuid, status }`

**2. Novo componente `src/components/ExtendVideoDialog.tsx`**
- Modal premium com visual coerente (bordas border/50, backdrop-blur, gradiente azul/ciano)
- Conteúdo:
  - Preview do vídeo atual (player compacto)
  - Título "Continuar este vídeo"
  - Descrição "Descreva a continuação do vídeo gerado"
  - Textarea para novo prompt (max 2000 chars)
  - Aspect ratio e qualidade (resolution) exibidos como badges readonly
  - Botão "Gerar continuação" com gradiente primary
- Estados internos:
  - Loading com texto "Gerando continuação..." + spinner + progress bar
  - Erro com mensagem amigável
- Ao concluir: chama callback `onExtended(newVideoUrl)` e fecha o modal

**3. Modificar `src/components/VideoGenerator.tsx`**
- Na seção de resultado (state === "success"), adicionar botão "Estender Vídeo" ao lado de Download e Novo Vídeo
- Manter estado `currentVideo` com `{ videoUrl, aspectRatio, resolution, prompt }`
- Quando extend concluir: substituir `resultUrl` pelo novo vídeo, atualizar prompt
- O vídeo estendido pode ser estendido novamente (loop)

**4. Atualizar `supabase/config.toml`**
- Registrar `[functions.geminigen-video-extend]` com `verify_jwt = false`

### Fluxo

```text
Vídeo gerado → Clica "Estender Vídeo" → Modal abre
  → Preview do vídeo + textarea + configs readonly
  → Clica "Gerar continuação"
  → Edge Function baixa vídeo, envia para GeminiGen com novo prompt
  → Poll via geminigen-history (reutiliza useGenerator existente)
  → Novo vídeo substitui o atual
  → Pronto para novo extend
```

### Detalhes técnicos

- A Edge Function faz `fetch(sourceVideoUrl)` para obter o vídeo como blob, depois monta FormData com o arquivo + prompt + aspect_ratio + resolution + model
- O polling reutiliza a mesma Edge Function `geminigen-history` já existente
- O `ExtendVideoDialog` terá seu próprio hook de estado para geração (similar a useGenerator mas simplificado, ou reutiliza useGenerator com params diferentes)
- Ícone: `FastForward` ou `ArrowRightFromLine` do lucide-react


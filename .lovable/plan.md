

## Plano: Corrigir Extend Video - Usar Last Frame como Referência

### Problema Raiz

A API GeminiGen (`api.geminigen.ai/uapi/v1/video-gen/veo`) **não reconhece** os parâmetros `mode_video: "extend"` e `ref_video`. Ela simplesmente ignorou esses campos e gerou um vídeo novo do zero, usando apenas o prompt.

Conforme a documentação oficial do GeminiGen no GitHub, o fluxo de "Extend Video" funciona selecionando o **último frame** do vídeo gerado e usando-o como referência de imagem com `mode_image: "frame"`.

### Solução

Extrair o último frame do vídeo no **client-side** (via canvas) e enviá-lo como imagem de referência com `mode_image: "frame"`.

### Alterações

**1. `src/components/ExtendVideoDialog.tsx`**
- Antes de enviar a requisição, extrair o último frame do vídeo usando um elemento `<video>` + `<canvas>`
- A função `extractLastFrame()` vai:
  - Criar um video element, definir `currentTime` para a duração total
  - Capturar o frame via `canvas.toBlob()`
  - Retornar um `File` com a imagem do último frame
- Enviar o frame como `FormData` (não mais JSON) para a edge function, com o campo `ref_images`

**2. `supabase/functions/geminigen-video-extend/index.ts`**
- Mudar de `req.json()` para `req.formData()`
- Remover o download do vídeo fonte (não é mais necessário)
- Usar `mode_image: "frame"` em vez de `mode_video: "extend"`
- Enviar a imagem do último frame como `ref_images` (campo que a API já reconhece)
- Remover `ref_video` completamente

### Fluxo Corrigido

```text
Vídeo gerado → Clica "Estender Vídeo"
  → Client extrai último frame via canvas
  → Envia FormData: prompt + lastFrame (imagem) + aspect_ratio + resolution + model
  → Edge Function recebe FormData
  → Monta request para GeminiGen com mode_image="frame" + ref_images=[lastFrame]
  → API reconhece o frame e gera continuação visual coerente
  → Poll via geminigen-history → novo vídeo substitui o atual
```

### Detalhes Técnicos

- A extração do frame usa `HTMLVideoElement.currentTime = video.duration` seguido de `canvas.drawImage()` e `canvas.toBlob('image/png')`
- O vídeo precisa ter CORS habilitado (`crossOrigin = "anonymous"`) para a extração funcionar - se falhar por CORS, o frame será enviado via proxy na edge function como fallback
- O campo `ref_images` com `mode_image: "frame"` já é um padrão funcional usado no `geminigen-video-frame` existente




## Plano: Usar endpoint nativo de extensão de vídeo da API GeminiGen

### Problema
O código atual extrai o último frame do vídeo e envia como imagem para o endpoint genérico `/video-gen/veo` com `mode_image: "frame"`. Isso gera um vídeo novo independente, sem continuidade real com o original.

### Solução
A API GeminiGen tem um endpoint dedicado para extensão: `POST /uapi/v1/video-extend/veo` que aceita apenas `prompt` + `ref_history` (UUID do vídeo original). Model, aspect ratio e resolution são herdados automaticamente. Isso elimina toda a lógica de extração de frames.

### Alterações

**1. Expor o UUID da geração no `useGenerator.ts`**
- Adicionar estado `resultUuid` ao hook
- Salvá-lo quando o polling completa com sucesso (o UUID já está disponível na chamada `generate`)
- Exportar `resultUuid` no retorno do hook

**2. Simplificar `ExtendVideoDialog.tsx`**
- Remover prop `videoUrl` como URL para processamento (manter apenas para preview)
- Adicionar prop `videoUuid: string` (UUID da geração original)
- Remover toda a função `extractLastFrame` e a lógica de proxy/canvas
- O `handleExtend` agora envia apenas JSON `{ prompt, ref_history: videoUuid }` para a edge function
- Remover estados `"extracting"` (não existe mais essa etapa)
- Remover props `aspectRatio`, `resolution`, `model` como parâmetros de envio (a API herda automaticamente), manter apenas para exibição visual nos badges

**3. Simplificar `geminigen-video-extend/index.ts`**
- Remover o modo proxy (GET) inteiro - não é mais necessário
- Aceitar JSON com `{ prompt, ref_history }` em vez de FormData
- Chamar `https://api.geminigen.ai/uapi/v1/video-extend/veo` com FormData contendo apenas `prompt` e `ref_history`
- Remover toda lógica de `mode_image`, `files`, `resolution`, `aspect_ratio`, `model` do envio à API

**4. Atualizar `VideoGenerator.tsx`**
- Passar `videoUuid` (do `useGenerator`) para `ExtendVideoDialog`

### Fluxo simplificado

```text
Vídeo gerado (UUID salvo) → Clica "Estender Vídeo"
  → Digita prompt de continuação
  → Envia { prompt, ref_history: UUID } para edge function
  → Edge function repassa para /uapi/v1/video-extend/veo
  → Poll até pronto → Exibe vídeo estendido (já concatenado pela API)
```

### Detalhes técnicos
- O endpoint `/video-extend/veo` retorna o mesmo formato de resposta (com `uuid` para polling)
- O polling existente (`geminigen-history`) funciona igual para o novo UUID
- A API herda model, aspect ratio e resolution do vídeo original automaticamente


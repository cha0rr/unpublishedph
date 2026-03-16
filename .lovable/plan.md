

## Diagnóstico

A geração foi enviada com sucesso (status 200, UUID retornado), mas a **API GeminiGen falhou durante o processamento** com o erro `GEMINI_GENERATION_ERROR: "Generation failed. Please try again later. Error code:"`.

Dados da requisição no banco:
- `mode_image: frame`, mas apenas **1 imagem** foi enviada (`ref_images=[object File]`)
- `model: veo-3.1-fast`, `resolution: 1080p`, `aspect_ratio: 9:16`

A API recebeu a imagem (há um `reference_item` com thumbnail), mas o status final é 3 (failed). Possíveis causas:
1. O modo `frame` pode exigir **2 imagens obrigatórias** (início + final) na API GeminiGen, e apenas 1 foi enviada
2. Erro transitório da API GeminiGen

## Plano de correção

### 1. Melhorar mensagem de erro no frontend
No `useGenerator.ts`, quando `status === 3`, exibir o `error_code` junto com o `error_message` para dar mais contexto ao usuário.

### 2. Validação no modo Frame
No `VideoGenerator.tsx`, quando `modeImage === "frame"` e o usuário tem apenas 1 imagem, trocar o hint para deixar claro que o frame final é opcional, e enviar normalmente. Se a API falhar consistentemente com 1 frame, considerar exigir 2.

### 3. Adicionar logs na edge function history
No `geminigen-history/index.ts`, adicionar `console.log` do response para facilitar diagnóstico futuro de falhas da API.

### Nota importante
O erro `GEMINI_GENERATION_ERROR` vem da API GeminiGen, não do código. Se o problema persistir mesmo com 2 frames, é uma limitação/instabilidade do lado da GeminiGen.


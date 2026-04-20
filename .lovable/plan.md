

## Diagnóstico

Log da edge function:
```
GeminiGen storyboard error: 400
{"detail":{"error_code":"INVALID_INPUT","error_message":"Invalid input field: ('body','scenes'), Field required"}}
```

A API espera o campo chamado **`scenes`** no **body JSON** (não `story_board_config`, não multipart/form-data). A tentativa anterior de usar `story_board_config[i][campo]` em `FormData` foi rejeitada porque:
1. o nome correto é `scenes`;
2. o endpoint espera `Content-Type: application/json` com array nativo, não chaves indexadas em multipart.

## Correção

### `supabase/functions/geminigen-video-storyboard/index.ts`

Trocar o envio multipart por JSON puro:

```ts
const payload = {
  scenes: sanitizedScenes.map((s, i) => ({
    prompt: s.prompt,
    duration: s.duration,
    mode: s.mode,
    scene_index: i,
  })),
  aspect_ratio,
  resolution,
  model: 'grok-video',
};

const response = await fetch('https://api.geminigen.ai/uapi/v1/video-storyboard/grok', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});
```

Manter:
- todas as validações (30s, 6/10s, 2-10 cenas, aspect/resolution);
- logs do `input_text` e `story_board_config` retornados para confirmar que cada cena é interpretada individualmente;
- gravação em `image_generations` com `request_payload` refletindo o novo formato JSON.

## Validação após o deploy

1. Storyboard com 3 cenas distintas (praia / floresta / deserto), 18s total → deve gerar com cenas visuais separadas.
2. Conferir nos logs: `input_text` deve listar prompts separados, **sem** `|` concatenando tudo.
3. Conferir `story_board_config` no `response_payload` da tabela `image_generations`.

## Arquivos a alterar

- `supabase/functions/geminigen-video-storyboard/index.ts` (somente o bloco de montagem do request: trocar `FormData` por JSON e usar campo `scenes`).

## Pontos de atenção

- Se ainda der 400 reclamando de outro campo, o log da função vai indicar exatamente qual — ajustamos pontualmente.
- UI e hook continuam intactos; o problema é 100% no formato do request enviado à GeminiGen.


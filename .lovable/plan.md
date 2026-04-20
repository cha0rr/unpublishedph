
## Objetivo
Corrigir de vez o erro do Storyboard alinhando a edge function ao formato oficial documentado pela GeminiGen.

## Diagnóstico
A documentação oficial de `https://docs.geminigen.ai/resources/8.grok-storyboard` mostra que o endpoint:

```text
POST /uapi/v1/video-storyboard/grok
Content-Type: multipart/form-data
```

e exige:

```text
scenes = JSON string
aspect_ratio = string
resolution = string
model = grok-video
```

Exemplo oficial:
```bash
--form 'scenes=[{"prompt":"...","duration":6,"mode":"custom"}]'
```

Hoje o projeto está enviando para a GeminiGen:

```ts
Content-Type: application/json
body: JSON.stringify({ scenes: [...] })
```

Por isso a API responde:
```text
Invalid input field: ('body', 'scenes'), Field required
```

Ela não está procurando `scenes` em JSON puro; está esperando um campo multipart chamado `scenes` contendo uma string JSON.

Também há dois desvios secundários em relação à doc:
1. estamos enviando `scene_index`, que não aparece no contrato oficial;
2. estamos logando `story_board_config`, campo que a documentação não define como parte da resposta do endpoint.

## O que vou corrigir

### 1) Ajustar `supabase/functions/geminigen-video-storyboard/index.ts`
Manter o request do frontend para a edge function em JSON como está hoje, mas converter internamente para `FormData` antes de chamar a GeminiGen:

```ts
const outForm = new FormData();
outForm.append("scenes", JSON.stringify(
  sanitizedScenes.map((s) => ({
    prompt: s.prompt,
    duration: s.duration,
    mode: "custom",
  }))
));
outForm.append("aspect_ratio", aspect_ratio);
outForm.append("resolution", resolution);
outForm.append("model", "grok-video");
```

E enviar assim:
```ts
await fetch("https://api.geminigen.ai/uapi/v1/video-storyboard/grok", {
  method: "POST",
  headers: { "x-api-key": apiKey },
  body: outForm,
});
```

Importante:
- não definir manualmente `Content-Type`;
- deixar o runtime montar o boundary de multipart automaticamente.

### 2) Remover campos não documentados do payload externo
Não enviar mais:
```ts
scene_index
```

Para reduzir risco de rejeição por validação estrita.

### 3) Corrigir logs de diagnóstico
Trocar logs para refletir o formato real enviado, por exemplo:

```text
format: multipart/scenes-json-string
scenes_count
totalDuration
aspect_ratio
resolution
```

E no response log, priorizar campos documentados:
- `uuid`
- `status`
- `input_text`
- `estimated_credit`
- `error_code`
- `error_message`

Remover dependência de `story_board_config` como sinal de sucesso.

### 4) Manter a regra de erro amigável
Preservar a regra já planejada:
- se a GeminiGen não retornar `uuid`, tratar como falha;
- nunca retornar falso sucesso ao frontend;
- mostrar a mensagem real da API ao usuário.

### 5) Não alterar a UI neste passo
O frontend do storyboard já envia `scenes`, `aspect_ratio` e `resolution` corretamente para a edge function.
O problema está apenas no formato do request da edge para a GeminiGen.

## Arquivos a alterar
- `supabase/functions/geminigen-video-storyboard/index.ts`

## Validação após a correção
Validar com um storyboard simples de 3 cenas bem diferentes:
1. praia ensolarada
2. floresta escura com neblina
3. deserto vermelho ao pôr do sol

Critérios de sucesso:
- a edge function não retorna mais `Field required`;
- a resposta inicial contém `uuid`;
- o frontend entra em polling normalmente;
- o vídeo final mostra cenas distintas;
- os logs mostram envio em `multipart/scenes-json-string`.

## Observação técnica
A documentação oficial também informa limite máximo total de `45s`, enquanto o projeto hoje restringe a `30s`. Isso não causa o erro atual. A correção principal é o formato multipart com `scenes` serializado como string JSON. O limite de 30s pode continuar como regra interna do produto, se desejado.

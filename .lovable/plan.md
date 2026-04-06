
Plano: corrigir erro "[object Object]" e o 400 real do Grok na geração de vídeo

### O que identifiquei
Os logs da edge function mostram a causa real do erro:
- A API do Grok rejeita `aspect_ratio: "vertical"`
- Para Grok, o valor aceito é `"2:3"` e não `"vertical"`

Trecho confirmado nos logs:
```text
Invalid input field ... aspect_ratio
Input should be 'landscape', 'portrait', 'square', '3:2' or '2:3'
input_value='vertical'
```

Além disso, o erro aparece como `[object Object]` porque:
- a edge function pode retornar `data.detail` como objeto
- o frontend em `src/hooks/useGenerator.ts` faz `new Error(data?.error || data?.detail || data?.message ...)`
- quando `data.detail` é objeto, ele vira `[object Object]`

### Implementação proposta

**1. Corrigir o mapeamento de aspect ratio no Grok**
Arquivo: `supabase/functions/geminigen-video/index.ts`

Ajustar `GROK_ASPECT_MAP` para enviar apenas valores aceitos pela API:
- `16:9` → `landscape`
- `9:16` → `portrait`
- `1:1` → `square`
- `2:3` → `2:3`
- `3:2` → `3:2`

Isso corrige a falha real de HTTP 400 no Grok.

**2. Garantir que a edge function sempre retorne erro em texto**
Arquivo: `supabase/functions/geminigen-video/index.ts`

Criar uma extração mais segura da mensagem, priorizando:
- `data.error` se for string
- `data.message` se for string
- `data.detail.error_message`
- `data.detail.message`
- mensagens de `data.errors[]`
- `JSON.stringify(data.detail)` como fallback final
- erro genérico por último

Objetivo: nunca devolver objeto bruto no campo `error`.

**3. Sanitizar o erro no frontend antes de exibir**
Arquivo: `src/hooks/useGenerator.ts`

Trocar a leitura direta do erro por um helper que converta qualquer retorno em string legível, por exemplo:
- `error.message`
- `error.error_message`
- `detail.error_message`
- `detail.message`
- arrays de erros
- fallback seguro

Assim, mesmo se o backend ainda devolver estrutura aninhada, a UI não exibirá `[object Object]`.

### Resultado esperado
Depois dessa correção:
- Grok com proporção `2:3` deixa de falhar por parâmetro inválido
- o usuário verá a mensagem real do erro quando houver outra rejeição da API
- o sistema fica mais resistente a respostas estruturadas da GeminiGen

### Detalhes técnicos
Arquivos afetados:
- `supabase/functions/geminigen-video/index.ts`
- `src/hooks/useGenerator.ts`

Não precisa alterar banco de dados nem schema.

Risco baixo:
- mudança localizada
- compatível com o fluxo atual
- melhora tanto a correção funcional quanto a legibilidade do erro

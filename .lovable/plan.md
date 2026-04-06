

## Plano: Corrigir erro HTTP 400 na geração Grok e melhorar diagnóstico

### Problema
Os logs mostram que a API GeminiGen retorna `status: 400` com `uuid: undefined` para requisições Grok, mas o corpo da resposta de erro não é logado — apenas `data.error` e `data.message` (ambos `null`). Sem ver a resposta completa, é impossível saber o motivo exato da rejeição. Além disso, o cliente recebe um erro genérico "HTTP 400" sem detalhes.

### Etapas

**1. Edge Function `geminigen-video/index.ts` — logar resposta completa e extrair erro**
- Logar `JSON.stringify(data)` completo quando `response.ok` é `false`, para revelar o motivo real do 400
- Extrair mensagem de erro de campos alternativos (`data.detail`, `data.msg`, `data.errors`, primeiro nível do objeto)
- Retornar a mensagem de erro real ao cliente no campo `error`

**2. Edge Function — remover campo `model` do FormData para Grok**
- A documentação da API Grok mostra que `model` é obrigatório, mas a edge function já envia `model: "grok-3"`. Verificar se o campo `resolution: "720p"` é aceito (docs mostram 480p como default mas 720p como opção válida)
- Não enviar campos desnecessários que possam causar rejeição

**3. Frontend `useGenerator.ts` — melhorar exibição do erro**
- Quando a resposta tiver `data.error` com detalhes, exibir ao usuário em vez de "HTTP 400"

### Detalhes técnicos
- O log completo do response body vai aparecer nos Edge Function logs do Supabase, permitindo diagnóstico rápido
- Nenhuma alteração de banco de dados necessária
- Deploy automático da edge function após edição


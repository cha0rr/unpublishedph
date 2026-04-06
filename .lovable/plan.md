

## Plano: Melhorar mensagem de erro na geração de imagens

### Problema
Quando a API GeminiGen retorna erro, a edge function envia `{ error: 'Erro na API GeminiGen.', details: responseData }` mas o cliente só lê `data.error`, perdendo os detalhes reais do erro. Isso mostra uma mensagem genérica sem ajudar o usuário a entender o que aconteceu (ex: créditos insuficientes, prompt inválido, rate limit da API externa, etc.).

### Etapas

**1. Edge Function `geminigen-image/index.ts` — incluir detalhes no campo `error`**
- Extrair a mensagem real de `responseData` (campos como `message`, `error`, `detail`) e concatenar na mensagem de erro
- Aplicar a mesma detecção de violação de política que já existe no polling de vídeo (ex: `PUBLIC_ERROR_SEXUAL`, copyright) para retornar mensagem amigável
- Logar o `responseData` completo no console para debug

**2. Cliente `useImageGenerator.ts` — ler `details` como fallback**
- Se `data.error` for genérico ("Erro na API GeminiGen."), verificar `data.details?.message` ou `data.details?.error` para mensagem mais específica

### Detalhes técnicos
- A API GeminiGen pode retornar erros variados (rate limit, créditos, conteúdo bloqueado)
- O `console.error` na edge function permite debugar via logs do Supabase
- Nenhuma alteração de banco de dados necessária


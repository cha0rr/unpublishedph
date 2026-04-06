

## Plano: Remover limite de 10 gerações por hora

### Resumo
Remover o rate limiting de 10 gerações/hora de todas as 4 edge functions que o implementam.

### Etapas

**1. Remover rate limiting de 4 edge functions**

Em cada uma das seguintes funções, remover a constante `RATE_LIMIT_PER_HOUR` e o bloco `if (!isAdmin) { ... }` que verifica o limite:

- `supabase/functions/geminigen-video/index.ts`
- `supabase/functions/geminigen-video-extend/index.ts`
- `supabase/functions/geminigen-video-frame/index.ts`
- `supabase/functions/geminigen-image/index.ts`

**2. Deploy das 4 funções atualizadas**

### Detalhes técnicos
- O cooldown de 90s no frontend permanece ativo como proteção contra spam acidental
- Nenhuma alteração de banco de dados necessária


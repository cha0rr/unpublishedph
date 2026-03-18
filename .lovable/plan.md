

## Auditoria de Segurança das APIs de IA

### 1. Chaves Secretas — Exposição no Frontend

**Resultado: OK.** A `GEMINIGEN_API_KEY` nunca é referenciada no código frontend (`src/`). Todas as chamadas do cliente vão para Edge Functions do Supabase (`/functions/v1/geminigen-*`), que mantêm a chave apenas no servidor via `Deno.env.get('GEMINIGEN_API_KEY')`. Nenhuma chave de IA está no `.env` do frontend.

### 2. Autenticação — Bloqueio de Requisições Inválidas

**Resultado: OK.** Todas as 3 Edge Functions de geração (`geminigen-video`, `geminigen-image`, `geminigen-video-frame`) validam JWT via `auth.getUser()` e verificam plano/role antes de prosseguir. Requisições não autenticadas ou de usuários não aprovados recebem 401/403.

### 3. Rate Limiting — VULNERABILIDADE ENCONTRADA

**Resultado: Ausente nas Edge Functions de geração.** Embora exista um cooldown de 90 segundos no frontend (via `useCooldown`), isso é trivialmente contornável — um atacante pode chamar as Edge Functions diretamente via `curl` sem respeitar o cooldown, gerando centenas de chamadas e gastando créditos da API GeminiGen.

### 4. Problema Secundário: Plano Desatualizado na `geminigen-image`

A Edge Function de imagem ainda verifica `plan === 'business'` (linha 65) em vez de `plan === 'pro'`, o que significa que **nenhum usuário consegue gerar imagens** atualmente (o plano Business foi removido).

---

## Plano de Correção

### A. Implementar Rate Limiting no Backend (3 Edge Functions)

Adicionar verificação server-side nas funções `geminigen-video`, `geminigen-image` e `geminigen-video-frame`. A lógica consultará a tabela `image_generations` para contar gerações recentes por usuário:

- **Limite**: 10 gerações por hora por usuário (admins isentos)
- **Mecanismo**: Contar registros em `image_generations` com `created_at` nos últimos 60 minutos para o `user_id`
- **Resposta**: HTTP 429 com mensagem clara de "limite atingido"

```text
Fluxo:
Request → Auth → Plan Check → Rate Limit Check → API Call
                                    ↓ (se excedido)
                               429 "Limite de X gerações/hora atingido"
```

### B. Corrigir Verificação de Plano na `geminigen-image`

Alterar a verificação de `plan === 'business'` para `plan === 'pro'` para alinhar com a nova estrutura de planos.

### C. Sanitização de Prompt

Adicionar limite de tamanho ao campo `prompt` (max 2000 caracteres) nas 3 Edge Functions para evitar abuso com prompts excessivamente longos.

### Arquivos Afetados

| Arquivo | Alteração |
|---|---|
| `supabase/functions/geminigen-video/index.ts` | Rate limit + sanitização de prompt |
| `supabase/functions/geminigen-image/index.ts` | Rate limit + correção plano `pro` + sanitização |
| `supabase/functions/geminigen-video-frame/index.ts` | Rate limit + sanitização de prompt |


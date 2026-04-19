

## Objetivo
Permitir que o admin gerencie os limites diários de gerações (vídeo e imagem) via painel `/admin`, sem precisar editar código.

## Estado atual
- Limite hoje é **hardcoded = 30/dia** em 3 lugares:
  - `supabase/functions/geminigen-video/index.ts` (linha ~95)
  - `supabase/functions/geminigen-image/index.ts` (similar)
  - `src/hooks/useDailyGenerationCount.ts` (`DAILY_LIMIT = 30`)
- Aplica-se igualmente a todos os usuários não-admin, sem distinção de plano.

## Proposta

### 1. Nova tabela `daily_limits`
| coluna | tipo | descrição |
|---|---|---|
| `id` | uuid PK | |
| `key` | text UNIQUE | `'video_basico'`, `'video_pro'`, `'image_basico'`, `'image_pro'` |
| `limit_value` | int | quantidade/dia (0 = ilimitado) |
| `enabled` | boolean | se `false`, sem limite |
| `updated_at` | timestamptz | |

RLS:
- SELECT: qualquer `authenticated` (precisa ler para mostrar contador)
- INSERT/UPDATE/DELETE: somente admin (`has_role`)

Seed inicial: 4 linhas com `limit_value=30, enabled=true`.

### 2. Nova aba no painel admin
**Arquivo novo**: `src/pages/AdminLimites.tsx`  
**Rota**: `/admin/limites` + link no menu admin existente.

UI (tabela editável):
- Lista as 4 chaves (Vídeo Básico, Vídeo Pro, Imagem Básico, Imagem Pro)
- Campos: Input numérico (limite), Switch (ativo/inativo), botão Salvar
- Botão "Adicionar novo limite" (chave customizada — opcional, escopo futuro)

### 3. Backend — ler limite dinamicamente
Em `geminigen-video/index.ts` e `geminigen-image/index.ts`:
```ts
const planKey = profile?.plan === 'pro' ? 'video_pro' : 'video_basico';
const { data: limitRow } = await adminClient
  .from('daily_limits').select('limit_value, enabled').eq('key', planKey).single();
if (limitRow?.enabled && (count ?? 0) >= limitRow.limit_value) { /* 429 */ }
```

### 4. Frontend — contador dinâmico
`useDailyGenerationCount.ts`:
- Buscar `limit_value` da tabela `daily_limits` baseado em `type` + `plan` do usuário.
- Retornar `limit` dinâmico em vez do hardcoded 30.

### 5. Memória
Atualizar `mem://business/pricing-plans` e criar `mem://tech/admin-daily-limits` documentando:
- Limites configuráveis via painel
- Chaves: `video_basico|video_pro|image_basico|image_pro`
- `enabled=false` → sem limite

## Diagrama
```text
Admin /admin/limites
   │ UPDATE daily_limits
   ▼
[ daily_limits table ]
   ▲                    ▲
   │ SELECT             │ SELECT (server-side)
   │                    │
useDailyGenerationCount  geminigen-video / geminigen-image
   (UI contador)         (enforcement 429)
```

## Arquivos
- **Migration**: criar tabela + RLS + seed
- **Novo**: `src/pages/AdminLimites.tsx`
- **Editar**: `src/App.tsx` (rota), `src/pages/Admin.tsx` (link de menu), `src/hooks/useDailyGenerationCount.ts`, `supabase/functions/geminigen-video/index.ts`, `supabase/functions/geminigen-image/index.ts`
- **Memória**: criar `mem://tech/admin-daily-limits`, atualizar `mem://index.md`

## Pontos de atenção
- Admin sempre ignora limite (já é a regra).
- Plano `pro` e `basico` agora podem ter limites diferentes — vantagem comercial.
- `enabled=false` = ilimitado (útil para promoções).


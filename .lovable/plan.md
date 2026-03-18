

## Auditoria IDOR — Proteção de Dados Gerados

### Diagnóstico Atual

**1. RLS na tabela `image_generations` — Análise:**

| Política | Comando | Condição | Status |
|---|---|---|---|
| Users can read own generations | SELECT | `auth.uid() = user_id` | OK |
| Users can update own generations | UPDATE | `auth.uid() = user_id` | OK |
| Service can insert generations | INSERT | `auth.uid() = user_id` | OK |
| Admins can read all | SELECT | `has_role(admin)` | OK |
| Admins can update all | UPDATE | `has_role(admin)` | OK |
| DELETE | — | — | **Bloqueado (nenhuma policy)** — OK |

**Resultado: RLS está correto.** Usuários só podem SELECT/UPDATE seus próprios registros. DELETE está bloqueado para todos. Admins podem ver/editar tudo. Não há vulnerabilidade IDOR na tabela `image_generations`.

**2. Storage — Sem risco direto:**
Não existem buckets de Storage no Supabase. As imagens/vídeos gerados ficam hospedados na API externa GeminiGen (URLs externas como `api.geminigen.ai`), não no Supabase Storage. Portanto, não há políticas de Storage para configurar.

**3. Edge Functions de histórico — Proteção IDOR:**
As funções `geminigen-history` e `geminigen-image-history` já filtram por `user_id` ao atualizar registros (`eq('uuid', uuid).eq('user_id', userId)`). Porém, a **consulta à API GeminiGen** usa apenas o `uuid` — se um usuário adivinhar o UUID de outro, a API externa retorna os dados. A Edge Function não valida se o UUID pertence ao usuário antes de consultar.

**Vulnerabilidade encontrada:** Um usuário autenticado pode consultar o histórico de geração de outro usuário se souber/adivinhar o UUID, pois a Edge Function faz `fetch` à API GeminiGen sem verificar a propriedade do UUID no banco local.

### Plano de Correção

#### A. Validar propriedade do UUID nas Edge Functions de histórico

Nas funções `geminigen-history` e `geminigen-image-history`, antes de chamar a API GeminiGen, verificar se o UUID pertence ao usuário autenticado:

```typescript
const { data: record } = await adminClient
  .from('image_generations')
  .select('id')
  .eq('uuid', uuid)
  .eq('user_id', userId)
  .single();

if (!record) return 403 "Acesso negado a este recurso."
```

Isso impede que um usuário consulte gerações de outros usuários mesmo conhecendo o UUID.

### Arquivos Afetados

| Arquivo | Alteração |
|---|---|
| `supabase/functions/geminigen-history/index.ts` | Validar propriedade do UUID antes de consultar API |
| `supabase/functions/geminigen-image-history/index.ts` | Validar propriedade do UUID antes de consultar API |



## Objetivo
Corrigir o erro “UUID não retornado” no Storyboard para que:
1. o usuário receba a mensagem real do problema;
2. o frontend bloqueie combinações que a API não aceita;
3. o backend não exponha falso “sucesso” quando a GeminiGen rejeitar a geração.

## Diagnóstico
Pelos logs, a causa real não é ausência aleatória de UUID. A API externa está recusando a solicitação:
```text
TOTAL_DURATION_EXCEEDED
Total duration 42s exceeds the maximum 30s allowed for Grok storyboard.
```

Hoje existe um desalinhamento:
- UI permite até 45s (`StoryboardGenerator.tsx`)
- Edge function valida até 45s (`geminigen-video-storyboard/index.ts`)
- API GeminiGen aceita só 30s para storyboard Grok

Além disso, o frontend trata qualquer `HTTP 200` como sucesso inicial e só depois tenta ler `uuid`, então quando o backend devolve:
```json
{ "success": false, "uuid": null, "error": "..." }
```
o usuário vê “UUID não retornado” em vez do erro real.

## O que vou corrigir

### 1. Alinhar o limite real do storyboard para 30s
Atualizar para 30s em todos os pontos:
- `src/components/StoryboardGenerator.tsx`
- `supabase/functions/geminigen-video-storyboard/index.ts`
- mensagem visual de limite total

Também ajustar textos de erro para deixar claro:
- máximo total = 30s
- cenas continuam 6s ou 10s
- máximo prático de cenas continua compatível com esse teto

### 2. Corrigir o tratamento de resposta no frontend
Em `src/hooks/useStoryboardGenerator.ts`:
- após `res.json()`, validar `data.success`
- se `success === false`, lançar `data.error`
- se `success === true` mas `uuid` vier vazio, mostrar erro amigável do provedor, não “UUID não retornado” genérico
- manter polling só quando houver UUID válido

Resultado esperado:
- erro real aparece para o usuário
- não entra em fluxo de polling inválido

### 3. Tornar a edge function mais explícita quando a API rejeitar
Em `supabase/functions/geminigen-video-storyboard/index.ts`:
- considerar falha quando `response.ok` vier sem `uuid`
- retornar `success: false` com mensagem específica
- registrar melhor o motivo nos logs e no `image_generations`
- manter resposta JSON consistente

### 4. Revisar a UX para evitar novas tentativas inválidas
No `StoryboardGenerator.tsx`:
- barra/contador de duração limitada a 30s
- botão de adicionar cena e troca 6s/10s respeitando 30s
- mensagens do toast e do card de erro refletindo a regra real

## Arquivos a alterar
- `src/components/StoryboardGenerator.tsx`
- `src/hooks/useStoryboardGenerator.ts`
- `supabase/functions/geminigen-video-storyboard/index.ts`

## Validação
Vou validar estes cenários:
1. storyboard com 24s/30s → deve gerar normalmente
2. storyboard com 36s/42s → deve ser bloqueado na UI antes do envio
3. resposta da API com `success:false` e `uuid:null` → deve exibir a mensagem real
4. resposta `200` sem UUID → deve virar erro amigável, nunca polling

## Detalhes técnicos
```text
UI (30s máx) -> Hook valida success/error -> Edge envia para GeminiGen
                                           -> se falhar: success:false + error real
                                           -> se sucesso: uuid válido -> polling
```

A correção principal não é “inventar UUID”; é impedir requests inválidos e parar de mascarar o erro real da API com a mensagem “UUID não retornado”.

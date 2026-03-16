

## Plano de Implementação

O pedido envolve 5 funcionalidades distintas. Segue o plano:

### 1. Botão de download no vídeo gerado (`VideoGenerator.tsx`)
Adicionar um botão de download abaixo do vídeo renderizado, similar ao que já existe no `ImageGenerator.tsx`. Usar `<a href={resultUrl} download>` com ícone de Download.

### 2. Notificação sonora ao concluir geração (vídeo e imagem)
- Criar um hook `useNotificationSound` que toca um som curto usando a Web Audio API (gerar um beep programático, sem necessidade de arquivo externo).
- Chamar o som nos hooks `useGenerator.ts` e `useImageGenerator.ts` quando o estado mudar para `"success"`.

### 3. Cooldown de 1min30s após clicar em gerar
- Nos componentes `VideoGenerator.tsx` e `ImageGenerator.tsx`, ao clicar em "Gerar":
  - Salvar timestamp em estado + `localStorage` (para persistir entre re-renders).
  - Iniciar countdown de 90 segundos que desabilita o botão.
  - Exibir tempo restante no botão (ex: "Aguarde 1:23").
- Criar um hook `useCooldown` reutilizável para ambos os geradores.

### 4. Bloqueio de múltiplas abas
- Usar a `BroadcastChannel` API no `App.tsx`:
  - Ao carregar, enviar mensagem de "ping" no canal.
  - Se outra aba responder, exibir tela de bloqueio e impedir uso.
  - A aba ativa responde aos pings com "pong".
- Alternativa de fallback: usar `localStorage` com eventos `storage` para browsers sem suporte a BroadcastChannel.

### 5. Notificar admin sobre tentativas de múltiplas abas
- Criar uma nova tabela `tab_violations` no Supabase com colunas: `id`, `user_id`, `email`, `created_at`.
- Quando uma segunda aba for detectada e o usuário estiver autenticado, inserir um registro nessa tabela via Supabase client.
- No painel admin (`Admin.tsx` ou `AdminGenerations.tsx`), adicionar uma seção/aba mostrando as tentativas recentes de violação de múltiplas abas com email, data e contagem.

### Detalhes técnicos

**Novo hook `src/hooks/useCooldown.ts`**: Aceita `key` (localStorage key) e `durationMs` (90000). Retorna `{ isCooling, remainingSeconds, startCooldown }`.

**Novo hook `src/hooks/useNotificationSound.ts`**: Usa `AudioContext` para gerar um beep de 440Hz por 300ms. Retorna `{ playSound }`.

**Novo componente `src/components/TabGuard.tsx`**: Wrapper que usa BroadcastChannel, exibe overlay de bloqueio, e registra violação no Supabase.

**Nova tabela `tab_violations`**:
```sql
CREATE TABLE public.tab_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.tab_violations ENABLE ROW LEVEL SECURITY;
-- Admins podem ler tudo
CREATE POLICY "Admins can read violations" ON public.tab_violations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Usuários autenticados podem inserir (próprios)
CREATE POLICY "Users can insert own violations" ON public.tab_violations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

**Arquivos modificados**:
- `src/components/VideoGenerator.tsx` — botão download + cooldown
- `src/components/ImageGenerator.tsx` — cooldown + som
- `src/hooks/useGenerator.ts` — som na conclusão
- `src/hooks/useImageGenerator.ts` — som na conclusão
- `src/App.tsx` — wrapping com TabGuard

**Arquivos criados**:
- `src/hooks/useCooldown.ts`
- `src/hooks/useNotificationSound.ts`
- `src/components/TabGuard.tsx`


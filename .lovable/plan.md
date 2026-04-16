
## Plano: Limite de 30 gerações por dia (vídeos e imagens)

### Resumo
Limitar a 30 gerações/dia para vídeos e 30 gerações/dia para imagens, exceto para admins. Enforcement principal no servidor (edge functions), com feedback no frontend.

### Alterações server-side

**1. `supabase/functions/geminigen-video/index.ts`** — Após o check de `isAdmin`/`isApproved` (linha ~88), adicionar:
- Se não for admin, contar registros em `image_generations` onde `user_id = userId` e `model` in (`veo-3-fast`, `veo-3.1-fast`, `grok-3`) e `created_at >= hoje 00:00 UTC`
- Se count >= 30, retornar 429 com mensagem "Limite diário de 30 gerações de vídeo atingido."

**2. `supabase/functions/geminigen-video-frame/index.ts`** — Mesmo check após autenticação/role, usando os mesmos modelos de vídeo.

**3. `supabase/functions/geminigen-video-extend/index.ts`** — Mesmo check (extensão conta como geração de vídeo).

**4. `supabase/functions/geminigen-image/index.ts`** — Após o check de plano Pro (linha ~139), adicionar:
- Se não for admin, contar registros onde `model` in (`nano-banana-2`, `nano-banana-pro`) e `created_at >= hoje 00:00 UTC`
- Se count >= 30, retornar 429 com mensagem "Limite diário de 30 gerações de imagem atingido."

### Alterações frontend (feedback visual)

**5. `src/components/VideoGenerator.tsx`** — Antes do botão gerar, consultar a contagem de gerações do dia via query em `image_generations` e exibir "X/30 gerações hoje". Desabilitar botão se >= 30 (a menos que admin).

**6. `src/components/ImageGenerator.tsx`** — Mesma lógica de contagem e exibição.

**7. `src/components/FrameVideoGenerator.tsx`** — Mesma lógica (compartilha contador de vídeo).

### Lógica da query de contagem (server-side)
```sql
SELECT count(*) FROM image_generations 
WHERE user_id = $userId 
  AND model IN ('veo-3-fast','veo-3.1-fast','grok-3') 
  AND created_at >= now()::date
```

### Arquivos
- **Editar**: `supabase/functions/geminigen-video/index.ts`
- **Editar**: `supabase/functions/geminigen-video-frame/index.ts`
- **Editar**: `supabase/functions/geminigen-video-extend/index.ts`
- **Editar**: `supabase/functions/geminigen-image/index.ts`
- **Editar**: `src/components/VideoGenerator.tsx`
- **Editar**: `src/components/ImageGenerator.tsx`
- **Editar**: `src/components/FrameVideoGenerator.tsx`

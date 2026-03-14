

## Plano: Gerador de Imagens + Admin Generations

### 1. Database — Criar tabela `image_generations`

```sql
CREATE TABLE public.image_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL,
  plan text,
  model text NOT NULL,
  prompt text NOT NULL,
  uuid text, -- UUID da GeminiGen
  status text DEFAULT 'pending',
  status_percentage integer DEFAULT 0,
  image_url text,
  used_credit numeric DEFAULT 0,
  estimated_credit numeric DEFAULT 0,
  ai_credit numeric DEFAULT 0,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

-- Business/admin users can read own generations
CREATE POLICY "Users can read own generations"
  ON public.image_generations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "Admins can read all generations"
  ON public.image_generations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert only for authenticated (edge function uses service role)
CREATE POLICY "Service can insert generations"
  ON public.image_generations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update own
CREATE POLICY "Users can update own generations"
  ON public.image_generations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can update all
CREATE POLICY "Admins can update all generations"
  ON public.image_generations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
```

### 2. Edge Function — `geminigen-image`

Arquivo: `supabase/functions/geminigen-image/index.ts`

- Valida JWT via `getClaims()` para obter user_id
- Consulta `profiles` e `user_roles` usando service role client para verificar se é `business` ou `admin`
- Bloqueia se não for business/admin
- Valida que o `model` é `nano-banana-2` ou `nano-banana-pro`
- Envia POST para `https://api.geminigen.ai/uapi/v1/image-gen` com FormData (prompt, model)
- Insere registro em `image_generations` com request/response payload
- Retorna uuid e dados

### 3. Edge Function — `geminigen-image-history`

Arquivo: `supabase/functions/geminigen-image-history/index.ts`

- Valida JWT (business/admin apenas)
- Recebe `uuid` no body
- Consulta `GET https://api.geminigen.ai/uapi/v1/history/{uuid}`
- Atualiza registro em `image_generations`: status, status_percentage, image_url, used_credit, estimated_credit, ai_credit, response_payload
- Retorna dados

### 4. Config — `supabase/config.toml`

Adicionar:
```toml
[functions.geminigen-image]
verify_jwt = false

[functions.geminigen-image-history]
verify_jwt = false
```

(geminigen-image já existe no config)

### 5. Frontend — Página `/gerar-imagem`

Arquivo: `src/pages/GerarImagem.tsx`

- Acesso restrito: business (plan === 'business' && approved) ou admin
- Componente `ImageGenerator` com:
  - Campo de prompt
  - Seletor de modelo: `nano-banana-2` / `nano-banana-pro`
  - Botão gerar → chama edge function `geminigen-image`
  - Polling via `geminigen-image-history` com barra de progresso
  - Exibe imagem resultado
- Visual: mesma identidade (dark navy, ciano, TechBackground)

### 6. Frontend — Página `/admin/generations`

Arquivo: `src/pages/AdminGenerations.tsx`

- Acesso restrito: admin only
- Cards de resumo no topo:
  - Total de gerações
  - Total de créditos usados
  - Gerações por modelo (nano-banana-2 / nano-banana-pro)
- Tabela de logs: usuário (email), modelo, uuid, status, used_credit, data
- Visual: glass cards, dark navy, ciano accent, tipografia clean

### 7. Rotas e Navbar

- `src/App.tsx`: adicionar rotas `/gerar-imagem` e `/admin/generations`
- `src/components/landing/Navbar.tsx`: adicionar link "Gerar Imagem" para business/admin, link "Gerações" no menu admin

### 8. Hook — `useImageGenerator`

Arquivo: `src/hooks/useImageGenerator.ts`

- Similar ao `useGenerator` mas para imagens
- Chama `geminigen-image` para gerar
- Polling via `geminigen-image-history`
- Progress simulation

### Resumo de arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `supabase/functions/geminigen-image/index.ts` |
| Criar | `supabase/functions/geminigen-image-history/index.ts` |
| Criar | `src/pages/GerarImagem.tsx` |
| Criar | `src/components/ImageGenerator.tsx` |
| Criar | `src/hooks/useImageGenerator.ts` |
| Criar | `src/pages/AdminGenerations.tsx` |
| Editar | `supabase/config.toml` |
| Editar | `src/App.tsx` |
| Editar | `src/components/landing/Navbar.tsx` |
| Migration | Tabela `image_generations` |


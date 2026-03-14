

## Plano: Corrigir endpoint da API + Expandir gerador de imagens

### Problema
O endpoint `https://api.geminigen.ai/uapi/v1/image-gen/{model}` retorna 404. A documentação indica que o correto é `POST https://api.geminigen.ai/uapi/v1/generate_image`.

### Alterações

#### 1. Migração — Adicionar colunas à tabela `image_generations`

Novas colunas: `aspect_ratio`, `resolution`, `style`, `output_format`, `provider`, `thumbnail_small`, `file_size`, `error_code`, `error_message`.

#### 2. Edge Function `geminigen-image` — Reescrever

- Endpoint: `POST https://api.geminigen.ai/uapi/v1/generate_image`
- Receber corpo como JSON do frontend (prompt, model, aspect_ratio, resolution, output_format, style, ref_history, file_urls)
- Montar `FormData` no backend com todos os campos
- Enviar com `x-api-key` header
- Salvar log com todos os novos campos (aspect_ratio, resolution, style, output_format, provider='geminigen')
- Manter validação JWT + business/admin check

#### 3. Edge Function `geminigen-image-history` — Atualizar

- Atualizar registro com campos adicionais: `thumbnail_small`, `file_size`, `error_code`, `error_message`

#### 4. Página `/business/studio-images` — Criar

- Acesso: business + admin
- Campos: prompt (textarea), model (select), aspect_ratio (select), resolution (select), output_format (select), style (select), ref_history (input), upload múltiplo de imagens, campo de URLs de referência (textarea, uma por linha)
- Botão gerar → chama edge function
- Polling automático com barra de progresso
- Exibe imagem final com download
- Visual: dark navy, ciano, glass cards, TechBackground

#### 5. Página `/admin/generations` — Atualizar

- Adicionar coluna `file_size` na tabela de logs

#### 6. Hook `useImageGenerator` — Atualizar

- Aceitar parâmetros expandidos (aspect_ratio, resolution, output_format, style, ref_history, file_urls)
- Enviar todos no POST

#### 7. Rotas e Navbar

- `App.tsx`: adicionar rota `/business/studio-images`
- `Navbar.tsx`: trocar link "Gerar Imagem" de `/gerar-imagem` para `/business/studio-images`

### Arquivos

| Ação | Arquivo |
|------|---------|
| Migration | Adicionar colunas a `image_generations` |
| Reescrever | `supabase/functions/geminigen-image/index.ts` |
| Editar | `supabase/functions/geminigen-image-history/index.ts` |
| Criar | `src/pages/BusinessStudioImages.tsx` |
| Editar | `src/hooks/useImageGenerator.ts` |
| Editar | `src/pages/AdminGenerations.tsx` |
| Editar | `src/App.tsx` |
| Editar | `src/components/landing/Navbar.tsx` |


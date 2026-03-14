

## Plano: Renomear site e remover geração de imagens

### Alterações

1. **`index.html`** — Atualizar `<title>` e meta tags (og:title, twitter:title, description) para "PH Labs Studio - VEO 3.1 Fast Brasil"

2. **`src/pages/Index.tsx`** — Remover o sistema de Tabs (imagem/vídeo) e exibir apenas o `VideoGenerator` diretamente. Atualizar título e subtítulo da página.

3. **Remover `src/components/ImageGenerator.tsx`** — Arquivo não mais necessário.

4. **`supabase/functions/geminigen-image/index.ts`** — Pode ser mantido ou removido. Recomendo remover para manter o projeto limpo.

5. **`src/hooks/useGenerator.ts`** — Limpar referências específicas de imagem (blocos `generated_image`, condicionais de `type === "image"`), mantendo apenas o fluxo de vídeo.


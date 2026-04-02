

## Plano: Corrigir referência de imagem no Studio Imagens

### Problema

A página `BusinessStudioImages.tsx` ainda usa o fluxo antigo de upload para o Supabase Storage (`file_urls`), que não funciona porque a Edge Function não consegue acessar as URLs. O componente `ImageGenerator.tsx` já foi corrigido anteriormente para usar `file_base64`, mas o Studio Imagens não recebeu a mesma correção.

### Solução

Atualizar `src/pages/BusinessStudioImages.tsx` para converter as imagens de referência em Base64 no cliente e enviá-las via `file_base64` (mesmo padrão já usado no `ImageGenerator.tsx`), eliminando o upload para o Storage.

### Alterações

**`src/pages/BusinessStudioImages.tsx`**:
- Adicionar funções utilitárias `fileToBase64`, `imageUrlToBase64` e `cleanBase64` (mesmas do `ImageGenerator.tsx`)
- Reescrever `handleGenerate` para converter referências em Base64 em vez de fazer upload para o Storage
- Enviar `file_base64` nos parâmetros em vez de `file_urls`
- Remover toda a lógica de upload/cleanup do Storage (`supabase.storage.from("image-references")`)


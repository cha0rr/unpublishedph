

## Plano: Múltiplas imagens de referência com labels

### Problema
Atualmente o Studio Imagens aceita apenas 1 imagem de referência. O usuário quer poder adicionar várias, cada uma rotulada como "Imagem 1", "Imagem 2", etc., para poder referenciá-las no prompt.

### Alterações

**`src/pages/BusinessStudioImages.tsx`**

1. **Trocar estados singulares por arrays**:
   - `referenceFile: File | null` → `referenceFiles: { file: File | null; preview: string }[]`
   - Cada entrada tem um `file` (null quando vem de URL do resultado) e `preview` (objectURL ou resultUrl)

2. **UI de referências**:
   - Exibir grid de imagens adicionadas, cada uma com label "Imagem 1", "Imagem 2", etc. e botão X para remover individualmente
   - Após a última imagem adicionada, sempre mostrar um botão "+" / área de upload para adicionar mais
   - Dica no prompt: "Use [Imagem 1], [Imagem 2]... no prompt para referenciar"

3. **handleGenerate**:
   - Fazer upload de todos os arquivos em sequência para o bucket `image-references`
   - Coletar todas as URLs públicas em `file_urls: string[]`
   - Após geração, limpar todos os uploads do bucket

4. **"Usar como referência"**:
   - Adiciona o resultUrl como nova entrada no array (em vez de substituir)

### Mesma alteração no `src/components/ImageGenerator.tsx`
- Aplicar o mesmo padrão de múltiplas referências para manter consistência entre Pro e Business

### Nenhuma alteração na edge function
- `file_urls` já aceita array com múltiplos elementos




## Plano: Upload de imagem de referência na geração de imagens

### Problema
O usuário quer enviar uma imagem local como referência para a geração. A edge function já aceita `file_urls` (array de URLs), mas não há como fazer upload de arquivo local.

### Solução
Criar um bucket Supabase Storage para uploads temporários de referência. No frontend, o usuário seleciona um arquivo, faz upload para o bucket, obtém a URL pública e envia como `file_urls` na geração.

### Alterações

**1. Migration -- Criar bucket `image-references` (público)**
- Bucket público para que a API GeminiGen consiga acessar a URL
- RLS: usuários autenticados podem fazer upload; leitura pública

**2. `src/components/ImageGenerator.tsx`**
- Adicionar estado `referenceFile` (File | null) e `referencePreview` (string para preview local)
- Área de upload com `<input type="file" accept="image/*">` estilizada como drop zone
- Preview da imagem selecionada com botão de remover (X)
- No `handleGenerate`: fazer upload do arquivo para `image-references/{userId}/{timestamp}.ext` via Supabase Storage, obter URL pública, passar como `file_urls: [publicUrl]`
- Botão "Usar como referência" no resultado (copia URL do resultado gerado para referência)

**3. Nenhuma alteração na edge function** -- já aceita `file_urls`

### Fluxo
```text
1. Usuário seleciona imagem local → preview aparece
2. Digita prompt descrevendo o que quer
3. Clica "Gerar Imagem"
4. Upload do arquivo → obtém URL pública → envia para API
5. Resultado aparece → botão "Usar como referência" disponível
```

### Detalhes técnicos
- Upload via `supabase.storage.from('image-references').upload(path, file)`
- URL pública via `supabase.storage.from('image-references').getPublicUrl(path)`
- Aceitar apenas imagens (jpg, png, webp) até 5MB
- Preview local via `URL.createObjectURL(file)`


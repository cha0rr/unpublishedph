

## Plano: Upload de imagem de referência no Studio Imagens

### Problema
O `BusinessStudioImages.tsx` ainda usa campos de texto para URLs de referência e UUID de referência. Precisa ser substituído por upload de arquivo local, igual ao `ImageGenerator.tsx`.

### Abordagem
Reutilizar o mesmo padrão do `ImageGenerator.tsx`: upload para o bucket `image-references` (já existe), obter URL pública, enviar como `file_urls`. Após a geração completar (sucesso ou erro), deletar o arquivo do bucket automaticamente para não acumular.

### Alterações

**1. `src/pages/BusinessStudioImages.tsx`**
- Remover estados `refHistory` e `fileUrlsText`
- Remover os dois campos de UI correspondentes (input UUID e textarea URLs)
- Adicionar estados `referenceFile`, `referencePreview`, `uploading` e ref `fileInputRef`
- Adicionar área de upload com preview (mesmo padrão do ImageGenerator)
- No `handleGenerate`: fazer upload para `image-references/{userId}/{timestamp}.ext`, obter URL pública, enviar como `file_urls`
- Após geração (sucesso/erro): deletar o arquivo do bucket via `supabase.storage.from('image-references').remove([path])`
- Adicionar botão "Usar como referência" no resultado

**2. `supabase/functions/geminigen-image/index.ts`**
- Adicionar suporte ao parâmetro `files` da API: quando `file_urls` contém URLs, baixar os arquivos na edge function e reenviá-los como campo `files` no FormData (multipart), alinhando com a documentação da API
- Manter também suporte a `file_urls` direto para compatibilidade

**3. Nenhuma edge function de limpeza necessária** -- o frontend deleta o arquivo do bucket após a geração finalizar

### Fluxo
```text
1. Usuário seleciona imagem local → preview aparece
2. Digita prompt
3. Clica "Gerar Imagem"
4. Upload para bucket → URL pública → envio para API
5. Geração completa → deleta arquivo do bucket
6. Botão "Usar como referência" no resultado
```


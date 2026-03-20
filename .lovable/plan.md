

## Plano: Remover concatenação FFmpeg e exibir resultado direto da API

### Problema
O carregamento do ffmpeg.wasm no navegador é muito lento para concatenar os vídeos. O site geminigen.ai exibe diretamente o resultado da extensão como o novo vídeo atual.

### Solução
Remover toda a lógica de concatenação com FFmpeg. Quando a extensão finalizar, simplesmente substituir o vídeo atual pelo novo clipe retornado pela API (que já tem continuidade visual via `ref_history`). Isso é exatamente o que o geminigen.ai faz.

### Alterações

**1. `src/components/ExtendVideoDialog.tsx`**
- Remover import de `concatVideos`
- Remover estado `"concatenating"` e toda lógica associada
- Após polling concluir e obter a URL do vídeo estendido, chamar `onExtended(extensionUrl, newUuid)` diretamente
- Remover referência ao `accessToken` para concat

**2. `src/lib/videoConcat.ts`**
- Deletar o arquivo inteiro (não é mais necessário)

**3. `supabase/functions/geminigen-video-extend/index.ts`**
- Remover o modo proxy GET inteiro (era usado apenas para download de vídeos para concatenação)
- Manter apenas o POST para extensão

**4. `package.json`**
- Remover dependências `@ffmpeg/ffmpeg` e `@ffmpeg/util`

### Resultado
O fluxo fica muito mais rápido: API retorna o clipe estendido, ele substitui o vídeo atual imediatamente. O UUID é atualizado para permitir extensões sucessivas.


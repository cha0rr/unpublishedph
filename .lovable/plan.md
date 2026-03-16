

## Plano: Remover marca d'água dos vídeos gerados

### Diagnóstico

A resposta da API GeminiGen retorna `"has_watermark": 0`, mas os vídeos chegam com marca d'água. Isso indica que a API requer o envio explícito do parâmetro `watermark` no FormData da requisição para desativar a marca d'água no vídeo gerado.

### Solução

Adicionar `outForm.append('watermark', 'false')` no FormData enviado para a API GeminiGen em ambas as edge functions:

1. **`supabase/functions/geminigen-video/index.ts`** -- Adicionar `watermark=false` ao FormData antes do envio
2. **`supabase/functions/geminigen-video-frame/index.ts`** -- Mesmo ajuste

Ambas as functions precisam ser redeployadas após a alteração.

### Observação

Se após essa alteração os vídeos ainda vierem com marca d'água, o problema pode ser uma configuração da conta na API GeminiGen (plano que força watermark), e não do código. Nesse caso, será necessário verificar diretamente no dashboard da GeminiGen.


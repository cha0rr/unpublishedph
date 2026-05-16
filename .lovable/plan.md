## Plano revisado

Vamos corrigir o erro mantendo o DeepSeek como provedor principal, sem migrar para Lovable AI.

1. **Manter DeepSeek no fluxo sem imagem**
   - Preservar `DEEPSEEK_API_KEY` e a chamada para `https://api.deepseek.com/chat/completions` em `supabase/functions/deepseek-chat/index.ts`.
   - Não trocar o modelo de texto para Lovable AI.

2. **Remover o streaming direto do DeepSeek para o navegador**
   - O erro atual acontece porque a Edge Function repassa `response.body` diretamente para o browser; quando o upstream demora/corta o stream, o navegador recebe uma conexão quebrada e mostra `NetworkError`.
   - Ajustar o fluxo sem imagem para usar DeepSeek com `stream: false` e retornar uma resposta JSON completa.
   - Isso evita o proxy de stream instável sem abandonar o DeepSeek.

3. **Adicionar timeout e erro claro**
   - Usar `AbortController` na chamada ao DeepSeek para não deixar a função pendurada.
   - Se DeepSeek falhar, expirar ou retornar erro, responder com JSON e CORS corretamente, por exemplo: “DeepSeek demorou para responder. Tente novamente com um prompt menor.”
   - Tratar status como `401`, `429`, `402`/créditos e erros gerais com mensagens úteis.

4. **Atualizar o frontend para aceitar os dois formatos**
   - Em `src/pages/GerarRoteiro.tsx`, manter compatibilidade com streaming para respostas que ainda venham nesse formato.
   - Adicionar suporte a resposta JSON completa `{ content: "..." }` para o fluxo DeepSeek sem imagem.
   - Melhorar o toast para exibir a mensagem real do backend em vez de apenas `NetworkError` quando houver resposta JSON.

5. **Manter o fluxo com imagem separado**
   - O fluxo com imagem continua usando o provedor multimodal já existente.
   - A correção solicitada foca no caso sem imagem, que hoje usa DeepSeek e está falhando.

## Resultado esperado

Ao enviar um prompt sem imagem no Gerador de Roteiros, o app continuará usando DeepSeek, mas deixará de quebrar a conexão de streaming e passará a exibir o roteiro gerado ou um erro claro quando a API externa não responder.
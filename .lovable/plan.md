
Objetivo: corrigir o erro “Tempo limite excedido ao gerar vídeo” atacando a causa real (não só UX), com rastreabilidade do processo.

Diagnóstico já confirmado
- O job de vídeo é criado com sucesso (UUID retornado e salvo em `image_generations`).
- O polling em `useGenerator` termina por timeout porque não recebe estado final.
- Há erro recorrente no webhook (`geminigen-webhook`): `Unrecognized algorithm name`, indicando falha na validação de assinatura (MD5 via `crypto.subtle.digest('MD5')`).
- Isso sugere que eventos assíncronos de conclusão estão chegando, mas o webhook está quebrando antes de processar.

Plano de implementação
1) Corrigir validação de assinatura do webhook
- Arquivo: `supabase/functions/geminigen-webhook/index.ts`
- Substituir cálculo MD5 por implementação compatível com Deno (sem `crypto.subtle.digest('MD5')`).
- Manter verificação RSA da assinatura.
- Garantir resposta 200 quando o evento é válido.

2) Fazer o webhook atualizar o status real da geração
- Arquivo: `supabase/functions/geminigen-webhook/index.ts`
- Após validar assinatura, mapear payload para `image_generations` por `uuid`:
  - `status`: processing/completed/failed
  - `status_percentage`
  - `video_url` (quando houver)
  - `error_code` / `error_message`
  - `response_payload` completo para auditoria

3) Melhorar endpoint de histórico para vídeo
- Arquivo: `supabase/functions/geminigen-history/index.ts`
- Coagir status para número (`Number(data.status)`) e suportar retorno em string.
- Atualizar também `image_generations` durante polling (igual já existe em `geminigen-image-history`), para termos telemetria consistente.

4) Fortalecer o polling do frontend
- Arquivo: `src/hooks/useGenerator.ts`
- Ler status de forma resiliente (número/string).
- Exibir erro mais específico com contexto (ex.: “job criado mas sem conclusão da API”).
- (Opcional) manter timeout atual, mas com mensagem clara quando o backend está recebendo eventos e não finalizando.

5) Adicionar logs mínimos de diagnóstico no start de vídeo
- Arquivo: `supabase/functions/geminigen-video/index.ts`
- Logar metadados de resposta da GeminiGen (uuid, status inicial, erro), sem expor segredo.

Detalhes técnicos (implementação)
```text
Cliente (/gerar-video)
   -> geminigen-video (cria job, retorna uuid)
   -> polling geminigen-history
GeminiGen
   -> chama geminigen-webhook com evento assinado
Webhook (corrigido)
   -> valida assinatura
   -> atualiza image_generations com status final/url
Polling
   -> lê status final e encerra com sucesso/erro real
```

Critérios de aceite
- Um vídeo de teste sai de `processing` para `completed` sem timeout falso.
- Se falhar no provedor, UI mostra erro real da API (não apenas timeout genérico).
- Logs de webhook deixam de mostrar `Unrecognized algorithm name`.
- Registro em `image_generations` passa a refletir status final e URL quando disponível.

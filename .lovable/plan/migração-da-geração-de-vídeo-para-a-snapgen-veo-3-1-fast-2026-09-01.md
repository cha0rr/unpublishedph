# Migração da geração de vídeo para a SnapGen (Veo 3.1 Fast)

## Objetivo

Trocar o provedor de geração de vídeo do Studio Videos e dos nós de workflow da GeminiGen para a SnapGen (`https://api.snapgen.ai`), oferecendo **apenas o modelo Veo 3.1 Fast**. Imagens, roteiros e demais recursos continuam como estão.

## O que muda para o usuário

- O seletor de modelo de vídeo deixa de existir (ou passa a mostrar só "Veo 3.1 Fast"). Grok 3 sai das telas de vídeo.
- O restante do fluxo continua igual: prompt, proporção, resolução, duração, imagem de referência, barra de progresso, som ao concluir, histórico.
- Nada muda em Studio Images, Avatar Maker e Gerador de Roteiros.

## Autenticação (login programático)

A SnapGen usa Bearer JWT de conta, e o token expira. O backend fará login automático:

1. Novos secrets: `SNAPGEN_EMAIL` e `SNAPGEN_PASSWORD`.
2. Um módulo compartilhado `supabase/functions/_shared/snapgen.ts` faz login, guarda o JWT em cache na memória da função e o renova quando expira ou quando a API responde 401.
3. O token nunca chega ao frontend.

Ponto em aberto: o endpoint exato de login da SnapGen. Primeiro passo da implementação é sondar a API (rotas do padrão `/api/auth/login` / `/api/user/login`) e confirmar o formato do retorno antes de fechar a função.

## Turnstile

O exemplo enviado veio do site (`Origin: https://snapgen.ai`), onde o Turnstile é gerado no navegador — não é possível gerar isso no servidor. A implementação testará a chamada server-to-server **sem** `turnstile_token`. Se a API recusar, avisarei e discutiremos alternativas (chave de API oficial da SnapGen ou proxy com token do navegador); não haverá tentativa de burlar a proteção.

## Detalhes técnicos

**Nova função `supabase/functions/snapgen-video/index.ts`** (substitui o uso de `geminigen-video` no fluxo de vídeo):

- Mantém tudo que já existe: validação de JWT do usuário, checagem de `profiles.status = 'approved'` / admin, limite diário via `daily_limits`, sanitização do prompt (4000 chars), registro em `image_generations`.
- Remove a lógica de Grok, de variantes (2 versões) e de outros modelos.
- Monta `multipart/form-data` para `POST https://api.snapgen.ai/api/video-gen/veo` com: `prompt`, `model=veo-3.1-fast`, `aspect_ratio`, `duration`, `resolution`, `enhance_prompt`, e quando houver imagem: `mode_image` (`frame` ou `ingredient`) + `ref_images`.
- Cabeçalho `Authorization: Bearer <jwt do login>`.
- Resposta da SnapGen traz `uuid` e `status` numérico (0 = fila) — mesmo formato já esperado pelo cliente.

**Nova função `supabase/functions/snapgen-history/index.ts`**:

- Espelha `geminigen-history`, apontando para o host da SnapGen (`https://api.snapgen.ai/api/history/{uuid}`, confirmado na sondagem inicial), com o mesmo Bearer.
- Mantém: verificação de que o UUID pertence ao usuário, `normalizeMediaUrl` nas URLs retornadas e preferência pela URL já salva no banco quando existir.
- Semântica de status preservada: 2 = concluído, 3 = falha.

**Frontend**:

- `src/hooks/useGenerator.ts`: chamar `snapgen-video` e `snapgen-history`; remover o parâmetro `variants` e o caminho de múltiplos UUIDs.
- `src/components/VideoGenerator.tsx`: remover seleção de modelo (fixo em `veo-3.1-fast`) e o que restar de Grok.
- `src/components/workflows/nodes/ImageToVideoNode.tsx` e `TextToVideoNode.tsx`: remover as opções de modelo/Grok e os controles específicos de Grok.
- `src/components/workflows/nodes/grok-options.ts` deixa de ser usado nesses nós.

**Fora do escopo desta migração** (continuam na GeminiGen): `geminigen-image`, `geminigen-image-history`, `geminigen-video-extend`, `geminigen-video-frame`, `geminigen-video-storyboard`, webhook.

## Validação

1. Sondar login e history da SnapGen com chamadas reais antes de escrever o fluxo final.
2. Disparar uma geração real de teste (texto → vídeo 9:16) e acompanhar o polling até o vídeo tocar no player.
3. Conferir os logs da edge function em caso de erro e confirmar o registro em `image_generations`.

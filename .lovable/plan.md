
Plano conciso para corrigir o problema “estender vídeo” (hoje sai só um clipe novo)

1) Diagnóstico confirmado
- O frontend e a edge function já estão chamando o endpoint correto `/uapi/v1/video-extend/veo` com `prompt + ref_history`.
- Pelos logs/rede, a resposta da GeminiGen retorna um novo `generated_video` (8s) e `reference_item` do último frame, ou seja: continuidade visual, mas não arquivo unido.
- Portanto, para entregar o que você quer (arquivo único), precisamos concatenar o vídeo original + continuação no app.

2) Implementar concatenação real (arquivo único)
- Criar utilitário `src/lib/videoConcat.ts` com ffmpeg.wasm (`@ffmpeg/ffmpeg` + `@ffmpeg/util`) carregado sob demanda.
- Fluxo do utilitário:
  - baixar vídeo original + vídeo da continuação (com fallback via proxy da edge function para evitar CORS),
  - escrever ambos no FS virtual do ffmpeg,
  - concatenar em MP4 único,
  - retornar `Blob` final.

3) Atualizar fluxo do modal de extensão
- Arquivo: `src/components/ExtendVideoDialog.tsx`
- Manter geração via `video-extend/veo` como está.
- Após polling concluir e obter URL da continuação:
  - entrar em novo estado “Concatenando vídeos...”,
  - chamar `videoConcat` com `videoUrl` atual + `finalUrl` da continuação,
  - criar `blob:` URL do arquivo final,
  - enviar para `onExtended` junto com o UUID novo da extensão.

4) Corrigir UUID para extensões sucessivas
- Hoje `setSuccessState` atualiza só URL, não atualiza `resultUuid`.
- Ajustar:
  - `useGenerator.ts`: `setSuccessState(url, uuid?)` para atualizar também `resultUuid`.
  - `VideoGenerator.tsx`: receber `onExtended(newUrl, newUuid)` e salvar ambos.
- Resultado: se clicar “Estender Vídeo” de novo, usará o UUID da última extensão (encadeamento correto).

5) Proxy seguro para download de mídia (se CORS bloquear fetch binário)
- Arquivo: `supabase/functions/geminigen-video-extend/index.ts`
- Adicionar rota de proxy autenticada (GET) para baixar URLs da GeminiGen/R2 com whitelist de host.
- Manter POST atual intacto para geração.
- Isso evita quebra de concatenação no navegador por CORS.

6) Ajuste secundário detectado no console
- Warning de ref no `Badge` dentro do dialog.
- Corrigir `src/components/ui/badge.tsx` para `React.forwardRef` (evita warnings no fluxo de extensão).

7) Validação final (E2E)
- Gerar vídeo base → estender → confirmar que player e download exibem arquivo único (duração ≈ soma dos dois).
- Fazer segunda extensão em cima do resultado para validar encadeamento por UUID atualizado.
- Conferir logs:
  - `geminigen-video-extend` (POST ok + proxy quando usado),
  - `geminigen-history` (status 2 e URL final),
  - sem erros de CORS no console.

Resumo técnico
```text
Antes:
base video + extend clip (substitui URL) => parece vídeo novo

Depois:
base video + extend clip --(ffmpeg.wasm concat)--> single mp4
                                            |
                                 preview + download final
```

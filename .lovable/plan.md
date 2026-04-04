
Objetivo
- Fazer o botão “Baixar vídeo longo” gerar 1 arquivo único com o vídeo inicial + todas as extensões da timeline, na ordem correta.

Diagnóstico
- Hoje `src/components/VideoGenerator.tsx` usa `new Blob(blobs)` em `handleMergeDownload`.
- Isso não concatena vídeos MP4 de verdade; apenas junta bytes, então o arquivo final pode ficar inválido ou o botão parecer que “não faz nada”.
- O fluxo atual também alterna entre `resultUrl` e `videoSegments`, o que facilita bugs de usar só o último vídeo em vez da sequência inteira.

Plano de implementação
1. Normalizar a fonte de verdade dos segmentos em `src/components/VideoGenerator.tsx`
- Garantir que a geração inicial já grave `videoSegments = [primeiroVideo]`.
- Manter cada extensão como append nessa mesma lista.
- Fazer o botão “Baixar vídeo longo” usar sempre `videoSegments` completo, nunca `resultUrl` isolado.

2. Trocar a pseudo-concatenação por merge real
- Extrair a lógica para um helper dedicado (ex.: `src/lib/mergeVideoSegments.ts`).
- Implementar merge client-side com `ffmpeg.wasm`, carregado sob demanda quando o usuário clicar no botão.
- Fluxo: baixar cada segmento da timeline -> escrever no FS virtual -> montar arquivo de concat -> gerar um único vídeo final.
- O download final sempre incluirá: `[primeiro vídeo, extensão 1, extensão 2, ...]`.

3. Melhorar o feedback do botão
- Manter `isMerging` e adicionar progresso textual, como “Unificando 2/4”.
- Remover o fallback silencioso atual que tenta baixar partes separadas.
- Mostrar erro visível (toast ou mensagem inline) se algum segmento falhar, em vez de apenas voltar o botão ao estado clicável.

4. Validar persistência e ordem
- Confirmar que, após recarregar a página, o estado restaurado do `localStorage` continua permitindo baixar o vídeo longo com todos os segmentos.
- Confirmar que o arquivo final respeita exatamente a ordem da timeline e sempre começa pelo primeiro vídeo gerado.

Detalhes técnicos
- `new Blob([segment1, segment2, ...])` não produz um MP4 concatenado válido; é preciso fazer concat/remux real.
- Para não pesar o carregamento normal da página, o ffmpeg deve ser lazy-loaded só no clique do botão.
- Preferência por saída única em `.mp4`; se a origem bloquear `fetch` por CORS, o app deve falhar de forma explícita com mensagem clara, porque isso impede merge no navegador.
- Não há necessidade de alterar banco ou schema para esta correção.

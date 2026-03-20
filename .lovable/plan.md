

## Diagnóstico

A API `/video-extend/veo` da GeminiGen retorna apenas o **clipe de continuação** (8s), não um arquivo com o vídeo original + extensão concatenados. Isso é uma limitação da API -- ela gera a continuação visual mas não junta os dois arquivos.

O código atual simplesmente substitui o `resultUrl` pelo URL do novo clipe, fazendo parecer que o vídeo original sumiu.

## Solução: Player sequencial com lista de segmentos

Em vez de substituir o vídeo, manter uma **lista de segmentos** (URLs) e reproduzi-los em sequência automática. Quando um segmento termina, o próximo começa imediatamente, dando a impressão de um vídeo único.

### Alterações

**1. `src/components/VideoGenerator.tsx`**
- Substituir `resultUrl` (string única) por `videoSegments: string[]` (lista de URLs)
- Quando a geração inicial termina: `segments = [url]`
- Quando uma extensão termina: `segments = [...segments, newExtensionUrl]`
- O UUID de referência para próxima extensão é sempre o último UUID retornado
- Substituir o `<video>` simples por um componente `SequentialVideoPlayer`
- O download baixa apenas o segmento atual (ou todos individualmente)

**2. Novo componente `src/components/SequentialVideoPlayer.tsx`**
- Recebe `segments: string[]` e `aspectRatio: string`
- Mantém `currentIndex` no estado
- Ao reproduzir: quando o vídeo atual emite `onEnded`, avança para `currentIndex + 1`
- Quando chega ao último segmento e termina, volta ao primeiro (loop completo)
- Mostra indicador visual: "Segmento 2/3" discreto no canto
- Controles: play/pause, botão para avançar/voltar segmento
- Transição suave entre segmentos (preload do próximo)

**3. `src/components/ExtendVideoDialog.tsx`**
- `onExtended` já retorna `(newUrl, newUuid)` -- sem mudanças necessárias

**4. `src/hooks/useGenerator.ts`**
- Sem mudanças -- o estado de segmentos fica no componente `VideoGenerator`

### Fluxo

```text
Gera vídeo → segments = [url1], uuid = uuid1
  → Estende → segments = [url1, url2], uuid = uuid2
  → Estende de novo → segments = [url1, url2, url3], uuid = uuid3
  → Player toca: url1 → url2 → url3 → loop
```

### Detalhes do SequentialVideoPlayer
- Usa `<video>` nativo com `onEnded` handler
- Preload do próximo segmento via `<link rel="preload">` ou segundo `<video>` hidden
- Indicador "Parte X de Y" no overlay
- O download oferece o segmento atual sendo exibido


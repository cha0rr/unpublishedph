## Objetivo

Três mudanças no canvas de **Workflows**:

1. Substituir o seletor "Conectar imagem do canvas" por **conexões visuais** — o usuário arrasta um fio de uma porta de saída do nó de imagem até a porta de entrada do nó de vídeo.
2. Corrigir o erro **"Não foi possível carregar a imagem conectada"** (causado por CORS ao tentar baixar a URL da GeminiGen direto no navegador).
3. Adicionar **Grok 3** ao seletor de modelos dos nós **Texto → Vídeo** e **Imagem → Vídeo**, replicando as mesmas regras do gerador principal (gating Pro, modos, durações, aspect ratios).

---

## 1. Conexões por fio (wire connections)

### Modelo de dados (no `WorkflowContext`)

```ts
ports:       { nodeId, side: "out" | "in", el: HTMLElement }[]
connections: { id, sourceNodeId, targetNodeId }[]   // 1 source → 1 target
connecting:  { sourceNodeId, mouse: {x,y} } | null  // estado do arraste em curso
```

API exposta: `registerPort`, `unregisterPort`, `startConnect`, `updateConnectingMouse`, `completeConnect`, `cancelConnect`, `getConnectedSource(targetId)`, `removeConnection`.

### Componentes novos

- **`NodePort.tsx`** — bolinha de 14px posicionada absolutamente nas laterais do `WorkflowCard`. 
  - Saída (`out`) à direita: `onPointerDown` chama `startConnect(nodeId)`.
  - Entrada (`in`) à esquerda: recebe `pointerup` para finalizar via hit-test no `ConnectionsLayer`. 
  - Estados visuais: livre (`border-primary bg-background`), conectada (`bg-primary`), hover/destino válido (`ring-2 ring-primary`).
  - Registra seu elemento DOM no contexto via `useEffect`/`ref`.

- **`ConnectionsLayer.tsx`** — `<svg className="absolute inset-0 pointer-events-none">` sobre o canvas que desenha:
  - Curvas de Bézier cúbicas para cada `connection` (control points horizontais com offset = 0.5·Δx).
  - Curva "ghost" enquanto `connecting` está ativo (saída → posição do mouse).
  - Cada curva tem `pointer-events: stroke`; clique nela mostra um botão "X" no ponto médio para remover.
  - Posições são calculadas a cada frame durante drag de cards via `getBoundingClientRect()` relativo ao `canvasRef`.

### Atualização do `WorkflowCard`

Adicionar slots opcionais `inputPort?: ReactNode` e `outputPort?: ReactNode` renderizados em wrappers absolutos `-left-2 top-1/2 -translate-y-1/2` e `-right-2 top-1/2 -translate-y-1/2`. Expor `onPositionChange` (via `useMotionValueEvent` no x/y do `motion.div`) para o context atualizar as portas durante o drag dos cards.

### Atualização nos nós

- **`TextToImageNode`** e **`AvatarNode`**: adicionam `<NodePort side="out" />` quando `resultUrl` existe. O badge "Saída disponível…" é removido (a porta acesa já comunica isso).
- **`ImageToVideoNode`**: 
  - Remove o `<Select>` "Conectar imagem do canvas".
  - Adiciona `<NodePort side="in" />` permanente.
  - `useEffect` observa `getConnectedSource(id)` → busca URL em `imageOutputs` → `urlToFile()` → `setRefImage(File)`.
  - Mantém upload manual; bloqueia upload quando há conexão ativa.
  - Mostra chip "Conectado" sobre o preview quando vier de wire.

### Drag global do fio

`WorkflowCanvas` registra `pointermove`/`pointerup` no `window` enquanto `connecting !== null`:
- `pointermove` → `updateConnectingMouse({x,y})`.
- `pointerup` → faz hit-test (via `document.elementFromPoint`) procurando um elemento com `data-port-target="<nodeId>"`; se encontrar, `completeConnect(targetId)`; senão, `cancelConnect()`.

---

## 2. Correção do erro de carregamento (CORS)

Causa: `urlToFile` faz `fetch(url).blob()` em URLs `*.geminigen.ai` que não retornam CORS para o origem do app.

**Solução**: criar edge function `image-reference-proxy` (espelho do `video-segment-proxy` mas para imagens):

- `supabase/functions/image-reference-proxy/index.ts`
- Aceita `POST { url }` autenticado.
- Valida sufixos permitidos: `.geminigen.ai`, `.r2.cloudflarestorage.com`.
- Faz `fetch(url)` server-side e retorna o blob com `Content-Type` correto + `Access-Control-Allow-Origin: *`.
- Registrar no `supabase/config.toml` se necessário (a maioria das funções deste projeto já usa `verify_jwt = false` + validação manual; seguiremos o padrão do `video-segment-proxy`).

`WorkflowContext.urlToFile(url)` passa a chamar:
```ts
const { data } = await supabase.functions.invoke('image-reference-proxy', { body: { url } });
// data é Blob → File
```

---

## 3. Grok 3 nos nós de vídeo

### Arquivo compartilhado

Criar `src/components/workflows/nodes/grok-options.ts` exportando as constantes copiadas de `VideoGenerator.tsx`:

```ts
export const GROK_MODE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "custom", label: "Custom" },
  { value: "extremely-crazy", label: "Extremely Crazy" },
  { value: "extremely-spicy-or-crazy", label: "Extremely Spicy or Crazy" },
];
export const GROK_ASPECT_OPTIONS = [
  { value: "16:9", label: "Landscape" },
  { value: "9:16", label: "Portrait" },
  { value: "1:1", label: "Square" },
  { value: "2:3", label: "Vertical" },
  { value: "3:2", label: "Horizontal" },
];
export const GROK_DURATION_OPTIONS = [
  { value: "6", label: "6s" },
  { value: "10", label: "10s" },
];
```

### Regras (replicadas do gerador principal)

- **Acesso**: apenas Pro/admin. Tentar selecionar sem ser Pro → `toast.error("O modelo Grok 3 está disponível apenas no plano Pro.")` e estado é revertido.
- **Resolução**: forçada para `720p`; o seletor de resolução é ocultado quando `model === "grok-3"`.
- **Aspect ratio**: usa `GROK_ASPECT_OPTIONS`; ao trocar para Grok com aspect inválido, normaliza para `9:16`.
- **Duração**: novo seletor com `GROK_DURATION_OPTIONS` (6s/10s), padrão 6s. Visível apenas para Grok.
- **Modo**: novo seletor `mode` (Normal/Custom/Extremely Crazy/Extremely Spicy or Crazy). Visível apenas para Grok.
- **Imagem de referência**: continua como `modeImage: "ingredient"` (já implementado).

### Aplicação

Tanto **`TextToVideoNode`** quanto **`ImageToVideoNode`**:

1. Importar `useAuth` e `grok-options.ts`.
2. Adicionar `model: "grok-3"` à lista `MODEL_OPTIONS` (com flag `pro: true`).
3. Adicionar `grokMode` e `grokDuration` no estado.
4. Renderização condicional (`isGrok`) dos seletores extras e ocultação do seletor de resolução.
5. Em `generate()`, para Grok:
   ```ts
   { model: "grok-3", aspectRatio, resolution: "720p", duration: grokDuration, mode: grokMode, ... }
   ```
6. Item do select para "Grok 3" mostra ícone `Lock` ao lado quando o usuário não é Pro.

---

## Arquivos

**Criar**
- `supabase/functions/image-reference-proxy/index.ts`
- `src/components/workflows/NodePort.tsx`
- `src/components/workflows/ConnectionsLayer.tsx`
- `src/components/workflows/nodes/grok-options.ts`

**Editar**
- `src/components/workflows/WorkflowContext.tsx` — ports/connections/connecting + `urlToFile` via proxy.
- `src/components/workflows/WorkflowCanvas.tsx` — renderiza `ConnectionsLayer`, captura `pointermove/up` globais durante drag de fio.
- `src/components/workflows/WorkflowCard.tsx` — slots `inputPort`/`outputPort` + callback de mudança de posição.
- `src/components/workflows/nodes/TextToImageNode.tsx` — porta de saída + remover badge de saída.
- `src/components/workflows/nodes/AvatarNode.tsx` — porta de saída + remover badge de saída.
- `src/components/workflows/nodes/ImageToVideoNode.tsx` — remover `Select` de conexão, porta de entrada, ler conexão do context, **+ Grok 3**.
- `src/components/workflows/nodes/TextToVideoNode.tsx` — **+ Grok 3** (modos, duração, aspect, gating Pro).
- `supabase/config.toml` — registrar `image-reference-proxy` se necessário.

## Detalhes técnicos

- Cor do fio: `hsl(var(--primary))` opacidade `0.7`, `stroke-width: 2`, `fill: none`.
- Coordenadas das portas e do mouse são calculadas relativas ao `canvasRef.getBoundingClientRect()`, considerando `scrollLeft/Top` (canvas usa `overflow-auto`).
- Durante `connecting`, o cursor do canvas vira `crosshair` e o `onClick` que abre o `NodeMenu` é suprimido.
- Conexão é desfeita automaticamente se o nó de origem for removido ou se sua imagem for limpa (já temos `unregisterImage` em cleanup).
- Substituir uma conexão existente no mesmo target ao criar nova (apenas 1 entrada por nó de vídeo).

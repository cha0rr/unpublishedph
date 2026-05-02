## Objetivo

Permitir aplicar zoom no canvas de Workflows via:
- Botões flutuantes no canto inferior direito (Zoom In, Zoom Out, Reset).
- Atalhos de teclado: `Ctrl +` / `Ctrl =` para aumentar, `Ctrl -` para diminuir, `Ctrl 0` para resetar.

## Comportamento

- Escala vai de **0.4x até 2x**, em passos de **0.1**.
- Default: **1x**.
- Zoom é puramente visual (CSS `transform: scale`); coordenadas dos nós continuam armazenadas em pixels não-escalados.
- Indicador percentual entre os botões (ex: `100%`).
- Atalhos previnem o zoom nativo do navegador (`e.preventDefault()`).

## Mudanças técnicas

### 1. `src/components/workflows/WorkflowCanvas.tsx`
- Adicionar estado `zoom` (number, default 1) em `CanvasInner`.
- Criar wrapper interno `<div>` com `transform: scale(zoom)` e `transformOrigin: "0 0"`, contendo `ConnectionsLayer` + nós + menu. O div externo (rolável, com grid de fundo) permanece como está.
- Listener global `keydown`: detectar `(ctrlKey || metaKey)` + (`+`, `=`, `-`, `0`) → ajusta zoom, `preventDefault`.
- Handler `wheel` no canvas: se `ctrlKey`, ajustar zoom e `preventDefault` (bonus, opcional mas comum em editores de nó).
- Ao calcular posição do menu de criação de nós no clique, dividir `(e.clientX - rect.left)` pelo zoom para o nó nascer onde o usuário clicou.
- Ao detectar drop em porta de entrada (`pointerup`), nada muda — `elementFromPoint` continua usando coordenadas de viewport.
- Renderizar novo componente `<ZoomControls zoom={zoom} setZoom={setZoom} />` posicionado `absolute bottom-4 right-4 z-20`.

### 2. `src/components/workflows/ConnectionsLayer.tsx`
- A camada SVG fica DENTRO do wrapper escalado, então as coordenadas continuam corretas sem mudanças (o SVG escala junto). Porém precisamos ajustar o cálculo do ghost (mouse): `connecting.mouse` está em coords de viewport, e o SVG agora vive em espaço escalado. Dividir o offset relativo ao canvas pelo zoom:
  ```ts
  to: {
    x: (connecting.mouse.x - canvasRect.left + scrollLeft) / zoom,
    y: (connecting.mouse.y - canvasRect.top + scrollTop) / zoom,
  }
  ```
- Aceitar `zoom` via prop ou via contexto.

### 3. `src/components/workflows/WorkflowContext.tsx`
- Adicionar `zoom` e `setZoom` no contexto para que `ConnectionsLayer` possa ler sem prop drilling. Alternativa simples: passar prop. Vou preferir prop para manter contexto enxuto.

### 4. Novo: `src/components/workflows/ZoomControls.tsx`
- Componente pequeno com três botões (`ZoomOut`, label `xx%`, `ZoomIn`) e um botão de reset (`Maximize2` ou texto "100%" clicável).
- Estilo: card flutuante com `border border-primary/30 bg-card/95 backdrop-blur` para combinar com o restante.

## Layout dos controles

```text
┌──────────────────────────────┐
│  Canvas                       │
│                               │
│                               │
│                               │
│              ┌──────────────┐ │
│              │ [-] 100% [+] │ │
│              └──────────────┘ │
└──────────────────────────────┘
```

## Edge cases
- Múltiplos pressionamentos rápidos: usar `setZoom(z => clamp(z ± 0.1))`.
- macOS: aceitar `metaKey` além de `ctrlKey`.
- Tecla `+` em alguns layouts vem como `=` com Shift; tratar `e.key === '+' || e.key === '=' `.
- `preventDefault` apenas quando a combinação for nossa, para não bloquear outros atalhos.

## Arquivos
- **Criar**: `src/components/workflows/ZoomControls.tsx`
- **Editar**: `src/components/workflows/WorkflowCanvas.tsx`, `src/components/workflows/ConnectionsLayer.tsx`
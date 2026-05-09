## Objetivo

Dois ajustes no canvas de workflows (`src/components/workflows/WorkflowCanvas.tsx`):

1. **Pan com botão do meio (scroll)**: permitir arrastar o canvas mantendo o botão do meio do mouse pressionado.
2. **Bug do menu ao arrastar nó**: ao arrastar um nó e soltar sobre outro nó, o menu "Adicionar nó" abre indevidamente.

---

## 1. Pan com botão do meio

Adicionar handlers de pointer no container `canvasRef`:

- `onPointerDown`: se `e.button === 1` (middle), `e.preventDefault()`, capturar pointer, gravar `{ startX, startY, scrollLeft, scrollTop }` em uma ref e ativar estado `isPanning`.
- `onPointerMove` (global enquanto pan ativo): atualizar `canvasRef.current.scrollLeft/Top` com base no delta.
- `onPointerUp` / `onPointerCancel`: encerrar pan, liberar pointer capture.
- Cursor muda para `grabbing` enquanto `isPanning`.
- Suprimir o `onClick` que segue o pan: se houve movimento durante o middle-drag, marcar `suppressNextClick` e ignorar no `handleCanvasClick`.
- Também tratar `onAuxClick` para `preventDefault` (evita o ícone de auto-scroll do navegador).

## 2. Corrigir abertura do menu ao soltar nó sobre outro

Causa: quando o usuário arrasta a partir do header de um `WorkflowCard` e solta sobre **outro** card, o `pointerdown` ocorre no header e o `pointerup` em outro elemento; o navegador dispara um `click` no ancestral comum — o canvas — que acaba caindo em `handleCanvasClick` e abre o menu.

Correção (apenas frontend):

- Registrar em `onPointerDown` do canvas o alvo original (`pointerDownTargetRef`).
- Em `handleCanvasClick`, abrir o menu **somente se** `pointerDownTargetRef.current` também for `canvasRef.current` ou `innerRef.current` (ou seja, o mousedown começou no fundo do canvas, não dentro de um card/porta).
- Limpar a ref após o click.

Isso preserva a UX atual (clicar no fundo abre o menu) e elimina o falso positivo após arrastar nós/portas.

---

## Detalhes técnicos

Arquivo único alterado: `src/components/workflows/WorkflowCanvas.tsx`.

Trechos-chave:

```tsx
const pointerDownTargetRef = useRef<EventTarget | null>(null);
const panRef = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
const [isPanning, setIsPanning] = useState(false);

const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  pointerDownTargetRef.current = e.target;
  if (e.button === 1 && canvasRef.current) {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    panRef.current = {
      x: e.clientX, y: e.clientY,
      sl: canvasRef.current.scrollLeft,
      st: canvasRef.current.scrollTop,
    };
    setIsPanning(true);
  }
};

const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!panRef.current || !canvasRef.current) return;
  canvasRef.current.scrollLeft = panRef.current.sl - (e.clientX - panRef.current.x);
  canvasRef.current.scrollTop  = panRef.current.st - (e.clientY - panRef.current.y);
};

const endPan = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!panRef.current) return;
  panRef.current = null;
  setIsPanning(false);
  canvasRef.current?.releasePointerCapture(e.pointerId);
};
```

E em `handleCanvasClick`, adicionar guard:

```tsx
const downTarget = pointerDownTargetRef.current;
pointerDownTargetRef.current = null;
if (downTarget !== canvasRef.current && downTarget !== innerRef.current) return;
// ...resto da lógica existente
```

Cursor: `isPanning ? "grabbing" : connecting ? "crosshair" : "default"`.

Sem mudanças em outros arquivos, sem mudanças de lógica de negócio.
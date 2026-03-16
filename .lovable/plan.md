

## Plano: Tornar frames opcionais no Frame Mode

### Mudanças

**`src/components/FrameVideoGenerator.tsx`**:
- Adicionar label "(Opcional)" nos campos Frame Inicial e Frame Final
- Remover a exigência de `firstFrame` e `lastFrame` na validação do `handleGenerate` (linha 57) — apenas `prompt` será obrigatório
- Remover `!firstFrame || !lastFrame` do `disabled` do botão Gerar (linha 157)
- No `handleGenerate`, montar o array `files` apenas com os frames que foram enviados (primeiro o inicial, depois o final, ou apenas um deles, ou nenhum)

### Lógica de envio de arquivos
- Se ambos os frames existirem: `files = [firstFrame, lastFrame]`
- Se apenas o primeiro: `files = [firstFrame]`
- Se apenas o último: `files = [lastFrame]`
- Se nenhum: `files = []` (gera vídeo apenas com prompt no modo frame)




## Fundo Animado Tecnológico

Criar um componente `TechBackground` com uma grade (grid) animada e partículas flutuantes usando CSS puro, posicionado como fundo fixo em toda a landing page.

### Componente: `src/components/landing/TechBackground.tsx`
- Grade de linhas finas (grid pattern) com opacidade baixa, usando CSS `background-image` com `linear-gradient`
- Partículas/pontos luminosos que se movem lentamente usando `@keyframes` CSS
- Linha de scan horizontal que desce lentamente pela tela (efeito "scanner")
- Tudo com `position: fixed`, `pointer-events: none`, `z-index: 0`

### Alterações:
1. **`src/index.css`** — Adicionar keyframes: `float-particle`, `scan-line`, `grid-pulse`
2. **`src/components/landing/TechBackground.tsx`** — Novo componente com:
   - Grid de fundo com linhas cyan muito sutis
   - 6-8 pontos luminosos flutuantes com delays variados
   - Linha de scan semi-transparente
3. **`src/pages/Index.tsx`** — Importar e renderizar `<TechBackground />` como primeiro filho
4. **`src/pages/GerarVideo.tsx`** — Também adicionar o fundo na página de geração


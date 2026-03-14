

## Plano: Frontend completo PH Studio — Landing Page Premium

### Visão Geral
Reconstruir toda a página principal como uma landing page premium de startup de IA, com identidade visual azul marinho/ciano/branco, animações com Framer Motion, e todas as 9 seções solicitadas. As páginas de geração (imagem/vídeo) serão rotas separadas.

### Dependência
- Instalar `framer-motion` no projeto

### Paleta de Cores (Tailwind customizado)
- `navy`: #03133F (fundo principal)
- `navy-light`: #0B1B5A
- `cyan`: #46C6F4 (destaque)
- `cyan-light`: #A9DDF7
- `ice`: #EAF7FF

### Estrutura de Arquivos

```text
src/
├── components/
│   ├── landing/
│   │   ├── Navbar.tsx          — Header fixo com blur
│   │   ├── HeroSection.tsx     — Hero + animação de geração
│   │   ├── HeroAnimation.tsx   — Animação do card de vídeo sendo gerado
│   │   ├── BenefitsSection.tsx  — 4 cards de benefícios
│   │   ├── ModesSection.tsx     — Imagem vs Vídeo lado a lado
│   │   ├── HowItWorks.tsx       — 3 passos
│   │   ├── ShowcaseSection.tsx  — Grid de exemplos
│   │   ├── PricingSection.tsx   — 3 planos
│   │   ├── FinalCTA.tsx         — CTA final
│   │   └── Footer.tsx           — Footer institucional
│   ├── VideoGenerator.tsx       — (mantido, rota /gerar-video)
│   └── ui/...
├── pages/
│   ├── Index.tsx               — Landing page (composição das seções)
│   ├── GerarVideo.tsx          — Página do gerador de vídeo
│   └── NotFound.tsx
```

### Alterações Principais

1. **`tailwind.config.ts`** — Adicionar cores customizadas (navy, cyan, ice) e keyframes para animações sutis (float, pulse-glow)

2. **`src/index.css`** — Atualizar variáveis CSS para o tema escuro navy. Adicionar classes utilitárias para glassmorphism

3. **`index.html`** — Atualizar título e meta tags para "PH Studio - Veo 3.1 Ilimitado"

4. **`src/pages/Index.tsx`** — Composição de todas as seções da landing page

5. **`src/App.tsx`** — Adicionar rota `/gerar-video` e `/gerar-imagem`

6. **10 componentes landing/** — Cada seção como componente isolado com Framer Motion para animações de entrada (fade-in on scroll, hover effects)

7. **`src/pages/GerarVideo.tsx`** — Wrapper para o VideoGenerator existente com navbar

### Detalhes por Seção

- **Navbar**: Fundo `navy/80` com `backdrop-blur-lg`, links com underline animado no hover, botões "Entrar" (outline) e "Começar Agora" (cyan sólido)
- **Hero**: Layout 2 colunas. Esquerda: título com gradiente cyan, subtítulo, 2 CTAs. Direita: `HeroAnimation` — card simulando geração de vídeo com barra de progresso animada, partículas flutuantes, frames aparecendo com fade, brilho cyan pulsante
- **Benefícios**: Grid 4 colunas, cards com borda sutil, ícone cyan, hover com elevação
- **Modos**: 2 cards grandes com preview mockup interno, gradiente de fundo sutil
- **Como Funciona**: 3 steps com números grandes em cyan, linha conectora
- **Showcase**: Grid responsivo com overlay gradient no hover
- **Pricing**: 3 cards, plano Pro destacado com borda cyan glow
- **CTA Final**: Fundo gradiente navy→navy-light, texto grande, botão cyan
- **Footer**: Logo, links em colunas, copyright PH Labs

### Animações (Framer Motion)
- Seções com `motion.div` + `whileInView` para fade-in/slide-up
- Cards com `whileHover` para scale sutil
- Hero animation: combinação de `animate` loops para partículas e progresso


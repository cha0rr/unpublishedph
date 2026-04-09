

## Plano: Preview SVG estilo Pixar/Disney (instantâneo, sem IA)

### Resumo
Redesenhar o SVG atual do `AvatarPreview.tsx` para ter estética de **animação 3D Pixar/Disney** — olhos grandes e expressivos, sombreamento suave com gradientes, proporções estilizadas, bochechas coradas, brilhos nos olhos e cabelo. Continua sendo SVG puro que muda **instantaneamente** ao clicar nas opções.

### O que muda visualmente
- **Rosto**: Formato mais oval/suave, queixo delicado, bochechas coradas com gradiente
- **Olhos**: Significativamente maiores, com íris detalhada (gradiente radial + brilho branco), cílios curvos e grossos
- **Nariz**: Pequeno e arredondado (estilo Pixar)
- **Boca**: Lábios com volume e gradiente, sorriso sutil
- **Pele**: Mais camadas de gradiente para efeito de profundidade 3D (sombra embaixo do queixo, luz no nariz/testa)
- **Cabelo**: Mais volume e mechas com gradientes sobrepostos para simular profundidade
- **Corpo**: Ombros suaves, pescoço estilizado

### Etapas

**1. Redesenhar o SVG base no `AvatarPreview.tsx`**
- Reescrever a função principal de renderização do rosto/corpo com geometria Pixar
- Adicionar mais `<defs>` com gradientes radiais para simular iluminação 3D
- Olhos com 4+ camadas: esclera, íris (gradiente), pupila, brilho
- Cílios como paths curvos

**2. Atualizar os estilos de cabelo**
- Cada tipo (Liso, Ondulado, Cacheado, etc.) continua com geometria própria
- Adicionar mais camadas de gradiente e mechas para aspecto volumétrico Pixar

**3. Remover dependências 3D não utilizadas**
- Deletar `AvatarPreview3D.tsx`
- Remover `three`, `@react-three/fiber`, `@react-three/drei` do `package.json`

### Arquivos
- **Reescrever**: `src/components/AvatarPreview.tsx` — SVG completo estilo Pixar
- **Deletar**: `src/components/AvatarPreview3D.tsx`
- **Editar**: `package.json` — remover dependências 3D


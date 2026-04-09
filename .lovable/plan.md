

## Plano: Avatar preview animado com bonequinho interativo

### Resumo
Criar um componente SVG de preview de avatar (bonequinho estilizado) ao lado direito do formulário que atualiza visualmente em tempo real conforme o usuário seleciona características (cor do cabelo, cor da pele, cor dos olhos, tipo de cabelo, altura, tipo de corpo). Cada mudança terá uma transição CSS suave.

### Etapas

**1. Criar componente `src/components/AvatarPreview.tsx`**
- SVG inline de um bonequinho feminino estilizado (cabeça, cabelo, olhos, corpo, pernas)
- Props: `selections: Record<string, string>` (as mesmas seleções do formulário)
- Mapeamento de cores:
  - `hairColor` → cor de preenchimento do cabelo (ex: Preto → #1a1a1a, Loiro → #f0d060, Ruivo → #c44020, etc.)
  - `skinColor` → cor da pele do boneco (ex: Pele clara → #fde8d0, Pele negra → #6b4226, etc.)
  - `eyeColor` → cor dos olhos (ex: Verde → #2d8a4e, Azul → #3b82f6, etc.)
  - `hairType` → forma/path do cabelo (liso = reto, cacheado = ondas, curto = menor, etc.)
  - `height` → escala vertical do boneco (Baixa = 0.85, Média = 1, Alta = 1.15)
  - `bodyType` → largura/proporção do corpo (Magra = estreito, Plus size = mais largo)
- Todas as propriedades visuais usam `transition: all 0.4s ease` para animar mudanças suavemente

**2. Ajustar layout da página `src/pages/AvatarMaker.tsx`**
- Mudar de coluna única (`max-w-3xl`) para layout de duas colunas em desktop:
  - Esquerda: formulário (`AvatarMakerForm`)
  - Direita: preview do avatar (`AvatarPreview`) fixo (sticky)
- Em mobile: preview aparece no topo, acima do formulário
- O `AvatarMakerForm` precisa expor `selections` para o pai, ou o estado sobe para a página

**3. Elevar estado de seleções para `AvatarMaker.tsx`**
- Mover `selections` e `setSelections` (com defaults) para a página pai
- Passar como props para `AvatarMakerForm` e `AvatarPreview`

### Detalhes técnicos

**SVG do bonequinho:** Composto por paths simples:
- Círculo para cabeça
- Paths curvos para diferentes tipos de cabelo (6-7 variantes)
- Elipses pequenas para olhos
- Retângulo/path arredondado para torso (largura varia com bodyType)
- Linhas/paths para braços e pernas
- Transform scale para altura

**Animação:** Usar `style={{ transition: 'all 0.4s ease' }}` nos elementos SVG — ao trocar fill/transform, o browser anima automaticamente. Adicionar um leve "pulse" (scale 1.02 → 1) ao mudar qualquer atributo via classe CSS temporária.

**Arquivos:**
- **Criar**: `src/components/AvatarPreview.tsx`
- **Editar**: `src/pages/AvatarMaker.tsx` (layout 2 colunas + estado elevado)
- **Editar**: `src/components/AvatarMakerForm.tsx` (receber selections/setSelections via props)


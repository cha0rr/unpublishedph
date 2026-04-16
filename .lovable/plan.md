

## Plano: Redesign do Avatar Maker com botoes quadrados e layout lado a lado

### Resumo
Redesenhar o formulario do Avatar Maker para usar **botoes quadrados com icone/emoji central** (similar a imagem de referencia) e colocar a **imagem gerada ao lado direito** em layout de duas colunas.

### Mudancas visuais

**Botoes de selecao (cada opcao)**
- Formato quadrado (~80x80px) com borda arredondada
- Icone ou emoji centralizado no topo, label embaixo
- Quando selecionado: borda primary, fundo primary/20
- Grid de botoes por categoria (auto-fill)

**Cada opcao precisa de um emoji/icone representativo**, ex:
- Cor do cabelo: circulos coloridos (⚫🟤🟡🔴⚪🩷🔵)
- Tipo de cabelo: emojis descritivos ou icones Lucide
- Cor da pele: emojis de tons de pele (👋🏻👋🏼👋🏽👋🏾👋🏿)
- Cor dos olhos: circulos coloridos (🟤🟢🔵🟡⚪⚫)
- Textura da pele, altura, corpo: icones Lucide relevantes

**Layout da pagina (AvatarMaker.tsx)**
- Duas colunas em desktop: esquerda = formulario, direita = resultado (sticky)
- Direita mostra placeholder escuro quando nao ha imagem, e a imagem gerada quando pronta
- Mobile: coluna unica, resultado aparece acima do formulario

### Etapas

**1. Atualizar CATEGORIES no AvatarMakerForm** para incluir emoji/icone por opcao (nao so por categoria)

**2. Redesenhar os botoes de selecao** como quadrados com icone central + label pequena

**3. Separar resultado em componente proprio** que recebe `resultUrl`, `isGenerating`, `progress` etc.

**4. Atualizar AvatarMaker.tsx** para layout de 2 colunas com resultado sticky a direita

### Arquivos
- **Reescrever**: `src/components/AvatarMakerForm.tsx` — botoes quadrados com emojis, extrair resultado
- **Editar**: `src/pages/AvatarMaker.tsx` — layout 2 colunas com painel de resultado a direita


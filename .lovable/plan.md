

## Plano: Wizard step-by-step para seleção de características

### Resumo
Transformar o formulário do Avatar Maker em um **wizard passo a passo** — cada categoria (Cor do Cabelo, Tipo de Cabelo, etc.) aparece sozinha na tela. Ao clicar em uma opção, avança automaticamente para o próximo passo. Botões de voltar/avançar para navegação manual.

### Fluxo
1. **Steps 0–8**: Uma categoria por vez (9 categorias do CATEGORIES)
2. **Step 9 (final)**: Campos de texto (Ambiente, Descrição extra, Foto de referência) + botão "Gerar Avatar"
3. Ao **selecionar uma opção**, auto-avança para o próximo step após ~300ms
4. **Barra de progresso** no topo mostrando step atual / total
5. Botões **Voltar** e **Avançar** (ou Pular) na parte inferior de cada step

### Layout
- Mantém o grid de 2 colunas (`lg:grid-cols-[1fr_320px]`)
- Coluna esquerda: apenas a categoria do step atual (título + grid de botões)
- Coluna direita: `AvatarResultPanel` (sticky, igual ao atual)
- Indicador de progresso acima do formulário (ex: `3 de 10`)

### Detalhes técnicos

**`src/components/AvatarMakerForm.tsx`**
- Novo state `step` (0 a `CATEGORIES.length`)
- Na função `select`, após atualizar a seleção, `setTimeout(() => setStep(s => s+1), 300)`
- Renderizar apenas `CATEGORIES[step]` quando `step < CATEGORIES.length`
- No último step (`step === CATEGORIES.length`): mostrar os campos de texto + upload + botão gerar
- Barra de progresso com `Progress` component
- Botões "Voltar" (desabilitado no step 0) e "Pular" em cada step
- Transição suave com `animate-in` do Tailwind

### Arquivos
- **Editar**: `src/components/AvatarMakerForm.tsx` — adicionar lógica de wizard




## Plano: Aspect ratio 9:16 + seletores visuais com ícones

### Alterações

**1. Corrigir aspect ratio para 9:16**
- Linha 89: trocar `aspect_ratio: "2:3"` por `aspect_ratio: "9:16"`

**2. Substituir dropdowns por botões com ícones**
Reescrever `AvatarMakerForm.tsx` para usar botões clicáveis em grade ao invés de `<Select>`. Cada opção terá:
- Um ícone Lucide representativo da categoria
- Label do valor
- Estado visual ativo (borda/fundo destacado) quando selecionado
- Abaixo do título da categoria, exibir um badge/chip com a seleção atual

**Mapeamento de ícones por categoria:**

| Categoria | Ícone Lucide |
|-----------|-------------|
| Cor do Cabelo | `Palette` |
| Tipo de Cabelo | `Waves` |
| Cor da Pele | `User` |
| Cor dos Olhos | `Eye` |
| Textura da Pele | `Fingerprint` |
| Altura | `Ruler` |
| Corpo | `PersonStanding` |

Cada opção será um botão compacto com texto. O botão selecionado terá `bg-primary/20 border-primary` e os demais `bg-muted/30 border-border`. Acima dos botões de cada categoria, o label + badge mostrando a seleção atual.

**Layout:** Grid de botões flex-wrap dentro de cada categoria, organizado em seções verticais com espaçamento consistente.

### Arquivo editado
- `src/components/AvatarMakerForm.tsx`

### Detalhes técnicos
- Sem nova dependência — apenas ícones do `lucide-react`
- Sem alteração de backend ou banco de dados


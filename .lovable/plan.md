

## Plano: Adicionar seleção de idade ao Avatar Maker

### Resumo
Adicionar uma nova categoria "Idade Aproximada" ao wizard do Avatar Maker, com faixas etárias realistas, e incluí-la no prompt de geração.

### Nova categoria

**Idade Aproximada** (`age`) — inserida como primeiro step do wizard (antes de Cor do Cabelo):
- 18–22 anos 🌸
- 23–27 anos 💫
- 28–32 anos ✨
- 33–37 anos 💎
- 38–45 anos 🌟
- 46–55 anos 👑

### Alterações em `src/components/AvatarMakerForm.tsx`

1. Adicionar a categoria `age` no início do array `CATEGORIES`
2. No `buildPrompt`, incluir `- Idade aparente: ${fields.age}` logo após a linha de introdução
3. Adicionar `age: "23–27 anos"` como valor default em `CATEGORY_DEFAULTS` no `AvatarMaker.tsx`

### Arquivos
- **Editar**: `src/components/AvatarMakerForm.tsx` — nova categoria + prompt
- **Editar**: `src/pages/AvatarMaker.tsx` — default para age




## Plano: Seção de violações de abas retrátil com contagem por usuário

### Resumo
Transformar a seção "Tentativas de Múltiplas Abas" em um componente retrátil (collapsible). Quando retraída, exibe apenas o título com a contagem de tentativas agrupada por usuário. Ao expandir, mostra os detalhes completos.

### Alterações em `src/pages/Admin.tsx`

1. Importar `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` de `@/components/ui/collapsible` e `ChevronDown` de `lucide-react`
2. Substituir o bloco de violações (linhas 397–414) por um `Collapsible` que:
   - **Quando fechado**: mostra o header com `AlertTriangle`, título, total de violações, e um resumo por email (ex: `usuario@email.com (5)`) em badges compactos
   - **Quando aberto**: mostra a lista completa atual com datas
3. Agrupar `violations` por email com contagem (`Object.entries(grouped)`) para exibir no resumo retraído
4. Ícone `ChevronDown` com rotação animada para indicar estado aberto/fechado

### Visual retraído
```
⚠ Tentativas de Múltiplas Abas (12)  ▼
  [user1@email.com (5)] [user2@email.com (7)]
```

### Arquivos
- **Editar**: `src/pages/Admin.tsx`


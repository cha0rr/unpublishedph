

## Plano: Melhorias no Painel de Gerações do Admin

### O que será feito

Adicionar funcionalidades de pesquisa, ranking de usuários e estatísticas detalhadas ao painel de gerações admin.

### Funcionalidades

1. **Barra de pesquisa por e-mail** — campo de busca que filtra as gerações por usuário
2. **Cards de ranking** — exibir o usuário que mais gerou, o que menos gerou e o modelo mais usado (separado por imagem/vídeo)
3. **Tabela de resumo por usuário** — após pesquisar ou filtrar, mostrar uma tabela agrupada por usuário com: total de gerações, total de créditos usados
4. **Filtro por modelo** — dropdown para filtrar por modelo específico

### Detalhes técnicos

**Arquivo alterado:** `src/pages/AdminGenerations.tsx`

- Adicionar estado `searchTerm` para filtro por e-mail
- Adicionar estado `selectedModel` para filtro por modelo
- Computar dados derivados a partir das gerações carregadas:
  - `userStats`: agrupamento por e-mail com contagem de gerações e soma de créditos
  - `topUser` / `bottomUser`: usuário com mais e menos gerações
  - `topImageModel` / `topVideoModel`: modelo mais usado (separando por tipo — modelos de imagem vs vídeo baseado no nome do modelo)
- Adicionar componente `Input` para pesquisa e `Select` para filtro de modelo
- Adicionar seção de cards com ranking (quem mais gerou, quem menos gerou, modelo mais usado imagem, modelo mais usado vídeo)
- Adicionar tabela resumo por usuário mostrando e-mail, total gerações e total créditos
- A tabela detalhada existente continua abaixo, filtrada pelo termo de pesquisa e modelo selecionado

**Nenhuma alteração de banco de dados necessária** — todos os dados já existem na tabela `image_generations`.


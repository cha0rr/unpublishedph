

## Plano: Análise Financeira no Painel Admin

### O que será feito

Criar uma nova página `/admin/financeiro` com análise financeira detalhada baseada nos dados de gerações existentes, usando a tabela de custos por modelo fornecida.

### Tabela de custos

| Modelo | Créditos/geração | Custo/geração (R$) |
|--------|-------------------|---------------------|
| veo-3.1 / veo-3.1-fast | 3 | R$ 0,075 |
| nano-banana-2 | 2 | R$ 0,05 |
| nano-banana-pro | 2 | R$ 0,05 |
| Valor do crédito: R$ 0,025 | | |

### Funcionalidades

1. **Cards de resumo financeiro** — custo total estimado (R$), total de créditos consumidos, custo médio por geração, total de gerações
2. **Filtros por período** — filtrar por data (hoje, 7 dias, 30 dias, personalizado) para análise temporal
3. **Custo por modelo** — tabela/cards mostrando quanto cada modelo consumiu em créditos e R$
4. **Custo por usuário** — ranking dos usuários que mais gastaram (em R$), com detalhamento por modelo
5. **Insights automáticos** — alertas como "modelo X representa Y% do custo total", tendência de gasto diário

### Detalhes técnicos

**Arquivos criados/alterados:**

1. **`src/pages/AdminFinanceiro.tsx`** (novo) — página principal com:
   - Mapa de custos por modelo (constante)
   - Função para calcular custo: `créditos × R$ 0,025`
   - Filtro de período com date picker
   - Cards: custo total, créditos totais, custo médio/geração, gerações no período
   - Tabela de custo por modelo (gerações, créditos, valor R$, % do total)
   - Tabela de custo por usuário (email, gerações, créditos, valor R$)
   - Seção de insights (modelo mais caro, usuário mais caro, custo médio diário)

2. **`src/App.tsx`** — adicionar rota `/admin/financeiro`

3. **`src/pages/Admin.tsx`** — adicionar link de navegação para a página financeira (se houver menu de navegação admin)

**Nenhuma alteração de banco de dados** — todos os cálculos são feitos no frontend a partir dos dados de `image_generations` (campos `model`, `used_credit`, `created_at`, `email`).


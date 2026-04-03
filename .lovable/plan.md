

## Plano: Botões predefinidos com imagens no Gerador de Roteiros

### O que será feito

Adicionar 4 botões visuais com imagens na tela inicial do chat (quando não há mensagens), cada um representando um tipo de roteiro. Ao clicar, o prompt é enviado automaticamente e o roteiro é gerado.

### Botões predefinidos

| Botão | Prompt enviado | Imagem |
|-------|---------------|--------|
| Frutas Falantes | "Gere um roteiro de Frutas Falantes" | Imagem gerada via URL pública (emoji/ilustração) |
| Fazendeira Hot | "Gere um roteiro de Fazendeira Hot" | Imagem temática |
| Cartomante | "Gere um roteiro de Cartomante" | Imagem temática |
| Notícias Virais | "Gere um roteiro de Notícias Virais" | Imagem temática |

### Alterações

**`src/pages/GerarRoteiro.tsx`**:
- Criar array de templates com `label`, `prompt` e `image` (URLs de imagens públicas — usarei imagens de placeholder estilizadas com emojis/ícones via componentes visuais, já que não temos imagens reais)
- Substituir a área vazia (quando `messages.length === 0`) por um grid 2x2 com cards clicáveis
- Cada card terá: imagem de fundo/topo, título do roteiro
- Ao clicar, definir o `input` com o prompt e chamar `sendMessage` automaticamente
- Usar função `sendPredefined(prompt)` que seta o input e dispara o envio

### Design dos cards
- Grid responsivo: 2 colunas em mobile, 4 em desktop
- Cards com imagem (aspect-ratio quadrada), título abaixo, hover com scale
- Imagens serão geradas como componentes com gradientes e emojis grandes (🍊🍋 para frutas, 🤠👩‍🌾 para fazendeira, 🔮🃏 para cartomante, 📰🔥 para notícias) já que não temos assets reais


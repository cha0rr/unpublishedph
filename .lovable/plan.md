
# Página de Workflows — Canvas com Cards Arrastáveis

Criar uma nova rota `/workflows` que apresenta um **canvas infinito** (área vazia "tipo Figma/n8n"). Ao clicar em qualquer ponto vazio do canvas, abre-se um menu flutuante com 4 opções de nó. Ao escolher, um **card arrastável** é criado naquela posição com os campos específicos daquele tipo. Cada card pode ser movido livremente e gera seu próprio resultado.

## O que o usuário verá

Canvas em tela cheia (fundo com grade pontilhada no estilo já usado no projeto, navy `#03133F` + cyan `#46C6F4`).

Clique em área vazia → popover/menu com:
- **Texto para Imagem**
- **Texto para Vídeo**
- **Imagem para Vídeo**
- **Criação de Avatar**

Cada opção cria um card naquela posição. Cards são arrastáveis pela "barra de título", podem ser fechados (X), e mostram o resultado da geração dentro deles.

## Tipos de card

```text
┌─────────────────────────────┐
│ ▤ Texto → Imagem        × │  ← arrasta aqui
├─────────────────────────────┤
│ [Textarea: prompt]          │
│ [Aspect ratio] [Modelo]     │
│ [ Gerar Imagem ]            │
│ ─────────────────────────── │
│ [preview da imagem gerada]  │
└─────────────────────────────┘
```

- **Texto → Imagem**: textarea de prompt + aspect ratio (1:1, 9:16, 16:9) + botão Gerar. Usa o hook existente `useImageGenerator` apontando para `geminigen-image`. Mostra a imagem dentro do card.
- **Texto → Vídeo**: textarea de prompt + orientação (9:16/16:9) + resolução + botão Gerar. Usa `useGenerator` (sem `refImages`).
- **Imagem → Vídeo**: upload de imagem de referência + textarea de prompt + orientação + botão Gerar. Usa `useGenerator` com `modeImage: "ingredient"` e `refImages`.
- **Criação de Avatar**: textarea de descrição + (opcional) reaproveita o wizard simplificado do Avatar Maker, ou apenas um campo de prompt com modelo `nano-banana-pro` em 9:16. Usa `useImageGenerator`.

Cada card mantém seu próprio estado de geração (idle/loading/success), barra de progresso e respeita o cooldown global de 90s já existente em `useCooldown`.

## Acesso

Mesma regra do resto do app: somente usuários autenticados e aprovados (`isApproved || isAdmin`). Avatar e Texto→Imagem/Imagem→Vídeo (Studio Imagens) continuam gated por **Pro**, conforme já está. Se um usuário Basic adicionar um card Pro, mostramos um aviso dentro do card e o botão Gerar fica desabilitado.

## Implementação técnica

Sem dependências novas — drag-and-drop feito com `framer-motion` (já instalado) usando `drag` + `dragConstraints={false}` e posicionamento absoluto.

**Novos arquivos:**
- `src/pages/Workflows.tsx` — página com canvas, gerencia array de nós `{ id, type, x, y }`, captura `onClick` no fundo para abrir o menu de criação na posição do mouse.
- `src/components/workflows/WorkflowCanvas.tsx` — fundo com grade, captura clique vazio (apenas se `e.target === e.currentTarget`).
- `src/components/workflows/NodeMenu.tsx` — popover com as 4 opções, posicionado nas coordenadas do clique.
- `src/components/workflows/WorkflowCard.tsx` — wrapper arrastável (motion.div com `drag`), header com título + botão X, slot para conteúdo.
- `src/components/workflows/nodes/TextToImageNode.tsx`
- `src/components/workflows/nodes/TextToVideoNode.tsx`
- `src/components/workflows/nodes/ImageToVideoNode.tsx`
- `src/components/workflows/nodes/AvatarNode.tsx`

Cada nó instancia seu próprio `useImageGenerator()` ou `useGenerator()` para isolar estado.

**Rota:** adicionar `<Route path="/workflows" element={<Workflows />} />` em `src/App.tsx`.

**Navbar:** adicionar botão "Workflows" em `src/components/landing/Navbar.tsx` (desktop + mobile), seguindo o mesmo padrão outline/filled das outras rotas, posicionado antes de "Histórico".

**Persistência (opcional, não nesta entrega):** o estado dos nós fica em memória apenas. Refresh limpa o canvas. Posso adicionar `localStorage` se desejar — me avise.

## Resumo do escopo

1. Criar página `/workflows` com canvas + grade.
2. Menu de criação por clique no vazio (4 tipos).
3. 4 componentes de card arrastáveis, cada um com seus campos e geração isolada.
4. Adicionar rota em `App.tsx` e link na `Navbar.tsx`.
5. Respeitar gating Pro existente nos cards que dependem dele.

Posso prosseguir?

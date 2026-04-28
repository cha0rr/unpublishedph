## Objetivo

1. Renomear a aba/feature **Storyboard** para **Vídeos 30s** na UI.
2. Substituir os controles atuais (toggle groups) por **dropdowns Select** em:
   - **Modelo** (no `VideoGenerator`)
   - **Orientação / Aspect ratio** (em `VideoGenerator` e `StoryboardGenerator`)
   - **Resolução** (em `VideoGenerator` e `StoryboardGenerator`)
3. Restringir a opção **"Gerar 2 versões"** ao plano **Pro** (atualmente está liberada para todos no VEO).

---

## Alterações por arquivo

### 1) `src/pages/StudioVideos.tsx`
- Trocar o label do `<TabsTrigger value="storyboard">` de **"Storyboard"** para **"Vídeos 30s"**.
- Trocar o toast `"Storyboard disponível apenas no plano Pro."` para `"Vídeos 30s disponível apenas no plano Pro."`.
- Manter o badge "Pro" e o ícone `Layers`.
- Não alterar o `value="storyboard"` da tab (apenas o label visível) para evitar quebrar lógica interna.

### 2) `src/components/StoryboardGenerator.tsx`
- Trocar título/labels visíveis: textos de botão `"Gerar Storyboard ({totalDuration}s)"` → `"Gerar Vídeo 30s ({totalDuration}s)"`. Botão "Novo" e download de "storyboard.mp4" continuam.
- Substituir o `ToggleGroup` de **Orientação** por um `<Select>` (shadcn) com as 3 opções (Landscape / Portrait / Square), mostrando o ícone correspondente ao lado do label dentro do `SelectItem`.
- Substituir o `ToggleGroup` de **Resolução** por um `<Select>` com as opções `480p` e `720p`.
- Manter a lógica/estado existentes (`aspectRatio`, `resolution`); apenas trocar o componente visual.

### 3) `src/components/VideoGenerator.tsx`
- **Modelo**: substituir o `ToggleGroup` de modelos por um `<Select>`:
  - Itens: `Veo 3 Fast`, `Veo 3.1 Fast`, `Grok 3` (com badge "PRO" inline).
  - Se o usuário não for Pro/Admin e selecionar `Grok 3`, manter o comportamento atual (bloquear via toast/disabled). Implementar via `disabled` no `SelectItem` + tooltip/badge "Pro" e mostrar `Lock` quando bloqueado.
  - Manter o efeito colateral existente: ao trocar para `grok-3` com `resolution === "1080p"`, resetar para `720p`.
- **Orientação (aspect ratio)**: substituir os `ToggleGroup` (tanto o do VEO quanto o do Grok — `GROK_ASPECT_OPTIONS`) por `<Select>`. Manter os mesmos valores e ícones nos `SelectItem`.
- **Resolução**: substituir o `ToggleGroup` de resolução por `<Select>` com as opções já existentes (`720p`, `1080p` para VEO; `480p`, `720p` para Grok), respeitando as regras atuais de quais aparecem por modelo.
- **Gerar 2 versões (gatear como Pro)**:
  - Computar `canUseVariants = isAdmin || profile?.plan === "pro"`.
  - Quando `!canUseVariants`:
    - Forçar `variants = 1` (impedir o switch de ligar; se já estiver 2, resetar).
    - Renderizar o switch como `disabled`, com badge **Pro** e ícone `Lock` ao lado do título "Gerar 2 versões".
    - Ao clicar no switch desabilitado, mostrar toast: `"Gerar 2 versões disponível apenas no plano Pro."`.
  - Manter o subtexto explicativo. Para usuários Pro/Admin, comportamento igual ao atual.
  - Defesa adicional em `handleGenerate`: se `variants === 2 && !canUseVariants`, sobrescrever para `1` antes de chamar `generate(...)`.

### 4) `src/components/landing/Navbar.tsx` (apenas se houver link nomeado "Storyboard")
- Verificar e renomear qualquer link de navbar/menu que diga "Storyboard" para "Vídeos 30s". Caso não exista, nenhuma mudança.

---

## Detalhes técnicos

- Usar o componente `Select` já existente em `src/components/ui/select.tsx` (Radix). Estrutura padrão:
  ```tsx
  <Select value={x} onValueChange={setX}>
    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="...">
        <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" /> Label</span>
      </SelectItem>
    </SelectContent>
  </Select>
  ```
- Manter classes/estilo coerentes com o tema (border `border-border/40`, `bg-background/40`, foco neon-cyan já vem do tema).
- `SelectItem` com `disabled` para entradas Pro bloqueadas; ainda assim exibir badge "PRO".
- Não alterar a edge function nem o hook `useStoryboardGenerator` — somente UI/UX.
- Não alterar o `value="storyboard"` da `Tabs` (apenas o label) para não quebrar o `onValueChange`.

## Validação

1. Aba aparece como **"Vídeos 30s"** com badge Pro.
2. Em Studio Videos / Gerar Vídeo:
   - "Modelo", "Orientação" e "Resolução" agora são dropdowns.
   - Usuário não-Pro vê `Grok 3` no dropdown como item desabilitado/Pro.
   - Switch "Gerar 2 versões" aparece bloqueado para não-Pro com badge Pro; clique mostra toast.
   - Usuário Pro/Admin consegue ativar normalmente.
3. Em Vídeos 30s: "Orientação" e "Resolução" também são dropdowns, restante intacto.
4. Geração continua funcionando exatamente como antes em todos os modelos.

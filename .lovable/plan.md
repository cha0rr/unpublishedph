

## Plano: Mover Frame Mode para dentro do Image Reference Type

### Resumo
Remover a aba "Frame Mode" do `StudioVideos.tsx` e incorporá-la como uma terceira opção no seletor "Image Reference Type" dentro do `VideoGenerator.tsx`. Usuários do plano básico verão cadeado + toast de bloqueio ao tentar selecionar.

### Alterações

**1. `src/pages/StudioVideos.tsx`**
- Remover o tab switcher (abas "Gerar Vídeo" / "Frame Mode")
- Remover import do `FrameVideoGenerator`, `Badge`, `Lock`, `Frame`
- Remover estado `activeTab` e `handleFrameClick`
- Renderizar apenas `<VideoGenerator />` diretamente

**2. `src/components/VideoGenerator.tsx`**
- Expandir `ModeImage` para `"none" | "ingredient" | "frame"`
- Adicionar `MODE_LIMITS.frame = 2` (first + last frame)
- Receber `useAuth()` para checar `canAccessFrame` (`profile?.plan === "pro" || isAdmin`)
- Adicionar opção "Frame Mode" no `ToggleGroup` de Image Reference Type com:
  - Badge "Pro" sempre visível
  - Ícone `Lock` quando `!canAccessFrame`
  - Ao clicar sem acesso: `toast.error("Disponível apenas no plano Pro")` e ignorar seleção
- Quando `modeImage === "frame"`: renderizar os dois uploads (Frame Inicial / Frame Final) no mesmo estilo do `FrameVideoGenerator` atual, em grid 2 colunas
- No `handleGenerate`, quando `modeImage === "frame"`, enviar `modeImage: "frame"` e `refImages: [firstFrame, lastFrame]`
- Importar `Lock` e `Badge` adicionais

**3. `src/components/FrameVideoGenerator.tsx`**
- Pode ser mantido como arquivo legado ou removido (a lógica será absorvida pelo `VideoGenerator`)

### Arquivos
- **Editar**: `src/pages/StudioVideos.tsx`
- **Editar**: `src/components/VideoGenerator.tsx`


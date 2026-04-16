

## Plano: Studio Videos — abas Gerar Vídeo e Frame Mode na mesma página

### Resumo
Unificar as duas páginas de vídeo (`/gerar-video` e `/gerar-video-frame`) em uma única página **Studio Videos** com duas abas lado a lado. A aba "Frame Mode" aparece bloqueada com cadeado + badge "Pro" para usuários do plano básico.

### Alterações

**1. Criar `src/pages/StudioVideos.tsx`** (nova página unificada)
- Layout igual ao atual `GerarVideo.tsx` (TechBackground, Navbar, Footer, auth guard)
- Título: "Studio **Videos**"
- Duas abas no topo usando botões lado a lado (não o componente Tabs — apenas dois botões estilizados):
  - **"Gerar Vídeo"** — ativo por padrão, renderiza `<VideoGenerator />`
  - **"Frame Mode"** — renderiza `<FrameVideoGenerator />`
- Para usuários básicos (`profile?.plan !== "pro"` e não admin), a aba Frame Mode mostra ícone `Lock` + badge "Pro" e ao clicar exibe toast "Disponível apenas no plano Pro"
- `max-w-2xl` expandido para `max-w-3xl` para acomodar melhor

**2. Atualizar `src/App.tsx`**
- Remover rotas `/gerar-video` e `/gerar-video-frame`
- Adicionar rota `/studio-videos` apontando para `StudioVideos`
- Manter redirect ou alias de `/gerar-video` → `/studio-videos` (opcional)

**3. Atualizar `src/components/landing/Navbar.tsx`**
- Trocar links de "Gerar Vídeo" para `/studio-videos`

**4. Atualizar `src/components/landing/ModesSection.tsx`**
- Trocar link do botão "Gerar Vídeo" para `/studio-videos`

**5. Remover** `src/pages/GerarVideo.tsx` e `src/pages/GerarVideoFrame.tsx` (código migrado)

### UI das abas
- Dois botões lado a lado num container com `bg-card/40 rounded-xl p-1`
- Aba ativa: `bg-primary/20 text-primary border-primary/30`
- Aba Frame Mode bloqueada: `opacity-60` com `Lock` icon e badge "Pro" em ciano

### Arquivos
- **Criar**: `src/pages/StudioVideos.tsx`
- **Editar**: `src/App.tsx` — trocar rotas
- **Editar**: `src/components/landing/Navbar.tsx` — atualizar link
- **Editar**: `src/components/landing/ModesSection.tsx` — atualizar link


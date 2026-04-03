

## Plano: Histórico de gerações + Timeline de extensão de vídeo

### Resumo

Duas funcionalidades:
1. **Página de Histórico** — cada usuário vê seus vídeos e imagens gerados anteriormente, podendo baixá-los novamente
2. **Timeline de extensão** — ao estender um vídeo, todos os segmentos ficam visíveis lado a lado em thumbnails clicáveis; ao clicar "Novo Vídeo" ou gerar um novo vídeo, a timeline é resetada

### 1. Página de Histórico do Usuário (`src/pages/MeuHistorico.tsx`)

- Nova página acessível via Navbar para usuários aprovados
- Consulta `image_generations` filtrando `user_id = auth.uid()` e `status = 'completed'`
- Separa em duas abas: **Vídeos** (modelos veo-*) e **Imagens** (modelos nano-banana-*)
- Grid de cards com thumbnail/preview, modelo, data, botão de download
- Para vídeos: exibe `<video>` com a URL salva em `image_url`
- Para imagens: exibe `<img>` com a URL salva em `image_url`

### 2. Timeline de Segmentos no VideoGenerator

**`src/components/VideoGenerator.tsx`**:
- Abaixo do player principal, quando `videoSegments.length > 1`, exibir uma faixa horizontal (timeline) com thumbnails de cada segmento
- Cada thumbnail é um mini `<video>` ou frame estático clicável
- Ao clicar em um segmento, o `SequentialVideoPlayer` navega para esse índice
- O botão "Novo Vídeo" já reseta `videoSegments` (existente)
- Ao gerar um novo vídeo pelo campo principal (`handleGenerate`), resetar `videoSegments` antes de iniciar

### 3. Rota e Navegação

**`src/App.tsx`**: adicionar rota `/meu-historico`

**`src/components/landing/Navbar.tsx`**: adicionar botão "Histórico" para usuários aprovados (ao lado dos outros botões)

### Alterações por arquivo

| Arquivo | Ação |
|---------|------|
| `src/pages/MeuHistorico.tsx` | Criar — página de histórico com abas Vídeos/Imagens |
| `src/App.tsx` | Adicionar rota `/meu-historico` |
| `src/components/landing/Navbar.tsx` | Adicionar botão "Histórico" |
| `src/components/VideoGenerator.tsx` | Adicionar timeline horizontal de segmentos; resetar segments no `handleGenerate` |

### Detalhes técnicos

- Consulta ao banco: `supabase.from('image_generations').select('*').eq('user_id', userId).eq('status', 'completed').order('created_at', { ascending: false })` — RLS já permite "Users can read own generations"
- Distinção vídeo/imagem: modelos que começam com `veo` são vídeos, outros são imagens
- Timeline: row horizontal com `overflow-x-auto`, thumbnails de ~80px com borda highlight no segmento atual, clique muda `currentIndex` via callback


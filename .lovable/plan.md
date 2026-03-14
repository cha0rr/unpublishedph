

## Gerador de Vídeos - Frame Mode

### Resumo
Criar uma nova página e edge function para geração de vídeo usando o modo "frame" da GeminiGen, onde o usuário envia um frame inicial e um frame final, e a IA gera o vídeo intermediário.

### Alterações

**1. Nova Edge Function: `supabase/functions/geminigen-video-frame/index.ts`**
- Recebe `FormData` com: `prompt`, `aspect_ratio`, `resolution`, `first_frame` (File), `last_frame` (File)
- Monta novo `FormData` para a API GeminiGen com `model=veo-3.1-fast`, `mode_image=frame`, e dois campos `files` na ordem correta
- Envia para `POST https://api.geminigen.ai/uapi/v1/video-gen/veo`
- Retorna a resposta da API (com uuid para polling)

**2. Registrar no `supabase/config.toml`**
- Adicionar `[functions.geminigen-video-frame]` com `verify_jwt = false`

**3. Novo componente: `src/components/FrameVideoGenerator.tsx`**
- Upload de frame inicial e frame final (com preview das imagens)
- Textarea para prompt
- Seleção de aspect ratio (16:9 / 9:16) e resolução (720p / 1080p)
- Botão gerar → envia FormData para a edge function via `supabase.functions.invoke`
- Polling usando a edge function `geminigen-history` existente
- Exibe progresso e vídeo final
- Estilizado com os componentes UI existentes (consistente com o design atual)

**4. Nova página: `src/pages/GerarVideoFrame.tsx`**
- Mesma estrutura da `GerarVideo.tsx` (auth guard, TechBackground, Navbar, Footer)
- Título: "Gerador de Vídeos - Frame Mode"
- Renderiza `<FrameVideoGenerator />`

**5. Rota no `src/App.tsx`**
- Adicionar rota `/gerar-video-frame`

**6. Link na Navbar**
- Adicionar botão "Frame Mode" ao lado do "Gerar Vídeo" para usuários aprovados

### Detalhe técnico: envio de FormData para Edge Function

Como `supabase.functions.invoke` não suporta envio de `FormData` nativamente de forma confiável com arquivos, o componente usará `fetch` direto para a URL da edge function, construindo a URL com `VITE_SUPABASE_URL` e passando o `apikey` header.


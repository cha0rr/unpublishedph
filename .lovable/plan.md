

## Plano: Salvar Personagem no Avatar Maker para Reutilização

### Resumo
Após a primeira geração no Avatar Maker, perguntar ao usuário se deseja **salvar o personagem** como base. Se sim, ativar um modo "Personagem Salvo" que substitui o wizard pelo um campo de prompt livre + upload opcional de objeto/cena, mantendo a referência visual (a imagem gerada) como base para preservar consistência facial nas próximas gerações.

### Como funciona

1. Usuário completa o wizard normalmente e gera o primeiro avatar.
2. No `AvatarResultPanel`, abaixo da imagem, surgem dois botões:
   - **"Salvar este personagem"** → marca o avatar atual como personagem-base.
   - **"Nova"** (já existe) → reset normal, descarta personagem.
3. Ao salvar:
   - Toast: "Personagem salva! Use-a nas próximas gerações."
   - A imagem fica fixada num card "Personagem ativa" (avatar miniatura + nome opcional + botão "Remover personagem").
   - O wizard de categorias é **substituído** por uma interface simplificada:
     - Card mostrando a personagem ativa.
     - Campo de **prompt livre** (Textarea, max 4000 chars) para descrever o que ela está fazendo, roupas, pose, ambiente, etc.
     - Upload opcional de **imagem-objeto da cena** (ex: um produto, fundo, acessório) com instrução de citá-lo no prompt como `[Imagem 2]`.
     - Botão "Gerar nova foto da personagem".
4. Internamente, o prompt enviado:
   - Inclui prefixo: *"Use [Imagem 1] como referência visual da personagem, mantendo total semelhança facial, corporal, cor de pele, cabelo e olhos."*
   - Se houver objeto: *"Use [Imagem 2] como referência do objeto/cenário descrito."*
   - Acrescenta o prompt livre do usuário.
   - Envia `file_base64` com a imagem da personagem (convertida via fetch + base64) e opcionalmente o objeto.
5. Persistência: a personagem salva (URL + base64 + metadados das seleções originais) fica em `localStorage` (chave `avatar-maker-saved-character`), sobrevivendo a refreshs até o usuário remover.

### Arquivos a editar

**1. `src/components/AvatarResultPanel.tsx`**
- Adicionar prop `onSaveCharacter` e `canSave` (true só quando há resultUrl e ainda não salvo).
- Botão "Salvar este personagem" abaixo de Baixar/Nova.

**2. `src/components/AvatarMakerForm.tsx`**
- Novo estado `savedCharacter: { imageUrl, base64, mimeType } | null` (sincronizado com localStorage).
- Quando `savedCharacter` está ativo, renderizar `<SavedCharacterMode />` em vez do wizard.
- Função `handleSaveCharacter`: faz fetch da `resultUrl`, converte para base64, salva no estado + localStorage, dispara toast.
- Função `handleRemoveCharacter`: limpa estado + localStorage, volta ao wizard.

**3. `src/components/SavedCharacterMode.tsx`** (novo)
- Card da personagem ativa (thumb + botão remover).
- Textarea de prompt livre.
- Upload de imagem-objeto opcional (mesma lógica de file_base64).
- Botão "Gerar nova foto".
- Constrói o prompt final com referências `[Imagem 1]` (personagem) e `[Imagem 2]` (objeto, se houver) e chama `generate` do `useImageGenerator` com `file_base64: [personagem, objeto?]`.

**4. `src/pages/AvatarMaker.tsx`** — sem mudanças (apenas hospeda o form).

### Considerações técnicas

- **Conversão URL→Base64**: usar `fetch(resultUrl).then(r => r.blob())` + `FileReader.readAsDataURL` no momento de salvar. Tratar CORS — a CDN do GeminiGen normalmente retorna com CORS aberto; se falhar, fazer fallback via Edge Function proxy (já existe `video-segment-proxy`, mas é para vídeo — verificar se precisa criar `image-proxy`). **Plano A**: tentar fetch direto primeiro; se falhar, mostrar aviso e gravar só a URL (a referência ainda funcionará via `file_urls`).
- **Envio**: o backend `geminigen-image` já aceita `file_base64` como array — sem mudanças necessárias na Edge Function.
- **Cooldown**: mesmo de 90s (`useCooldown` já existe).
- **Limite diário**: continua contando como geração normal.

### Sem mudanças no backend
Toda a lógica é client-side. A Edge Function `geminigen-image` já suporta múltiplas imagens de referência via `file_base64`.


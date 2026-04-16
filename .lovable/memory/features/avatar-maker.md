---
name: avatar-maker
description: Funcionalidade exclusiva para o plano Pro e administradores que permite criar influencers digitais personalizadas, com modo "Personagem Salva" para reutilização consistente.
type: feature
---

Funcionalidade Avatar Maker — exclusiva para Pro e administradores.

## Wizard inicial
Wizard em etapas (idade, gênero, cabelo, pele, olhos, textura, altura, corpo, ângulo de câmera, iluminação) + descrição extra opcional + foto de referência opcional. Usa modelo `nano-banana-pro` em aspect ratio 9:16, fundo de estúdio branco infinito por padrão.

## Modo Personagem Salva
Após gerar o primeiro avatar, o usuário pode clicar em "Salvar este personagem" no `AvatarResultPanel`. A imagem é convertida para base64 via fetch + FileReader e armazenada em `localStorage` na chave `avatar-maker-saved-character` (campos: `imageUrl`, `base64`, `mimeType`, `fileName`).

Quando há personagem salva, o `AvatarMakerForm` substitui o wizard pelo componente `SavedCharacterMode`, que oferece:
- Card com a personagem ativa + botão "Remover"
- Textarea de prompt livre (max 4000 chars) para descrever ações, roupas, pose, ambiente
- Upload opcional de imagem-objeto (referenciada como `[Imagem 2]`)
- Geração via `useImageGenerator` enviando `file_base64: [personagem, objeto?]`

O prompt é prefixado automaticamente com instruções de consistência visual: "Use [Imagem 1] como referência visual da personagem, mantendo total semelhança facial, corporal, cor de pele, cabelo e olhos."

Cooldown de 90s e limite diário compartilhados com as demais gerações.

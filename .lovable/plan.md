

## Plano: Avatar Maker — Gerador de Influencers com IA

### Resumo
Nova página exclusiva para plano Pro que permite criar avatares/influencers personalizados com controle detalhado de aparência física. Usa a API existente do Nano Banana 2 (edge function `geminigen-image`) — sem necessidade de nova edge function.

### Como funciona
O Avatar Maker é essencialmente um **construtor de prompt visual**: o usuário seleciona características físicas via formulário e o sistema monta um prompt detalhado automaticamente, enviando para a mesma API de imagens já existente. A foto de referência usa o mesmo fluxo de `file_base64` já implementado.

### Etapas

**1. Criar página `src/pages/AvatarMaker.tsx`**
- Rota: `/avatar-maker`
- Acesso restrito a Pro/Admin (mesmo padrão de `GerarImagem`)
- Layout com Navbar + TechBackground

**2. Criar componente `src/components/AvatarMakerForm.tsx`**
Formulário com os seguintes campos (selects/radio groups):

| Campo | Opções |
|-------|--------|
| Cor do cabelo | Preto, Castanho escuro, Castanho claro, Loiro, Ruivo, Platinado, Rosa, Azul, Branco |
| Tipo de cabelo | Liso, Ondulado, Cacheado, Crespo, Curto, Raspado, Trançado |
| Cor da pele | Pele clara, Pele branca, Pele morena clara, Pele morena, Pele negra, Pele asiática |
| Cor dos olhos | Castanho, Verde, Azul, Mel, Cinza, Preto |
| Textura da pele | Lisa, Sardas, Manchas solares, Sinais/pintas, Acne leve, Cicatrizes |
| Altura | Baixa, Média, Alta |
| Peso/Corpo | Magra, Atlética, Mediana, Curvilínea, Plus size |
| Ambiente | Campo de texto livre (ex: "praia ao pôr do sol", "estúdio fotográfico") |
| Descrição extra | Campo de texto para detalhes adicionais |
| Foto de referência | Upload de imagem (reutiliza o fluxo existente de base64) |

**3. Montagem automática do prompt**
O componente constrói um prompt detalhado a partir das seleções, por exemplo:
```
Gere uma foto ultra-realista de uma influencer digital feminina com as seguintes características:
- Cabelo: loiro, ondulado
- Pele: morena clara, com sardas, textura realista e detalhada
- Olhos: verdes
- Corpo: atlética, altura média
- Ambiente: praia ao pôr do sol
[detalhes extras do usuário]

A imagem deve ter qualidade fotográfica profissional, com pele realista mostrando poros, texturas naturais e iluminação adequada ao ambiente.
```

Se houver foto de referência, adiciona `[Imagem 1]` e envia via `file_base64` — a edge function já trata isso.

**4. Integrar com `useImageGenerator`**
- Reutiliza o hook existente, modelo fixo `nano-banana-2`
- Cooldown de 90s (mesmo do gerador de imagens)
- Exibe progresso, resultado e opções de download

**5. Adicionar rota e navegação**
- Rota `/avatar-maker` no `App.tsx`
- Link no Navbar para usuários Pro/Admin

### Detalhes técnicos
- Nenhuma nova edge function — usa `geminigen-image` existente
- Nenhuma alteração de banco de dados — registros salvos em `image_generations` como já funciona
- Modelo fixo: `nano-banana-2`
- O prompt é montado no frontend e enviado como texto para a API

### Arquivos criados/editados
- **Criar**: `src/pages/AvatarMaker.tsx`
- **Criar**: `src/components/AvatarMakerForm.tsx`
- **Editar**: `src/App.tsx` (nova rota)
- **Editar**: `src/components/landing/Navbar.tsx` (link na navegação)


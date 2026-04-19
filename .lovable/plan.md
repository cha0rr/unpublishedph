

## Objetivo
Quando o usuário gerar um vídeo com **veo-3-fast** ou **veo-3.1-fast**, o sistema deve produzir **2 versões** do vídeo em paralelo a partir do mesmo prompt e referências.

## Escopo
Aplica-se apenas ao gerador principal de vídeo (`VideoGenerator.tsx` + `useGenerator.ts`). Não afeta:
- Grok 3 (1 versão apenas)
- Storyboard, Frame-to-video, Extend (mantêm 1 versão)
- Avatar Maker (imagens)

## Abordagem

### 1. Backend (`supabase/functions/geminigen-video/index.ts`)
- Aceitar novo parâmetro opcional `variants` (1 ou 2; default 1).
- Quando `variants === 2` e modelo é `veo-3-fast`/`veo-3.1-fast`, disparar **2 chamadas em paralelo** (`Promise.all`) ao endpoint VEO usando o mesmo `formData` (recriado para cada chamada já que FormData é consumido).
- Inserir 2 linhas em `image_generations` (uma por UUID retornado).
- Retornar `{ success, uuids: [uuid1, uuid2], error }` quando variants=2; manter retrocompatibilidade com `uuid` único para variants=1.
- Limite diário: contar como 2 gerações (já incrementa naturalmente via 2 inserts).

### 2. Hook (`src/hooks/useGenerator.ts`)
- Estender `GenerateParams` com `variants?: 1 | 2`.
- Estender estado: adicionar `resultUrls: string[]` e `resultUuids: string[]` (manter `resultUrl`/`resultUuid` apontando para o primeiro, para retrocompatibilidade).
- Quando `variants === 2`: ler `data.uuids`, fazer `pollHistory` em paralelo para ambos via `Promise.all`. Barra de progresso única (compartilhada).
- Sucesso quando **ambos** terminam; se um falhar, ainda retornar o que deu certo + aviso.

### 3. UI (`src/components/VideoGenerator.tsx` e `VideoResultPanel`)
- Adicionar toggle "Gerar 2 versões" (Switch) — visível somente quando modelo selecionado é veo-3 ou veo-3.1.
- Aviso visual: "Consome 2 gerações do limite diário".
- No painel de resultado: quando há 2 vídeos, exibir lado a lado (grid 2 colunas em desktop, empilhado em mobile) com botões de download independentes. Cada vídeo mantém auto-loop conforme `mem://ui/video-playback-interaction`.
- Persistência localStorage: salvar array de URLs/UUIDs.

### 4. Memória
Atualizar `mem://features/video-generation` para registrar a opção de 2 variantes em VEO.

## Diagrama do fluxo

```text
User → [Switch: 2 versões ON] → useGenerator.generate({variants:2})
         │
         ▼
geminigen-video (edge)
         │
   ┌─────┴─────┐
   ▼           ▼
VEO call 1   VEO call 2     (Promise.all)
   │           │
   ▼           ▼
 uuid1       uuid2 → insert 2 rows → return {uuids:[uuid1,uuid2]}
         │
         ▼
useGenerator → pollHistory(uuid1) ∥ pollHistory(uuid2)
         │
         ▼
VideoResultPanel: [vídeo 1] [vídeo 2]
```

## Arquivos alterados
- `supabase/functions/geminigen-video/index.ts`
- `src/hooks/useGenerator.ts`
- `src/components/VideoGenerator.tsx` (toggle + render painel duplo)
- `mem://features/video-generation` (atualização)

## Pontos de atenção
- A API GeminiGen não tem parâmetro nativo de "variations"; por isso fazemos 2 requisições independentes (resultados serão ligeiramente diferentes por causa do seed aleatório do modelo).
- Cooldown de 90s permanece igual (1 cooldown por clique, mesmo gerando 2).
- Custo: dobra o consumo de créditos GeminiGen — usuário é avisado na UI.


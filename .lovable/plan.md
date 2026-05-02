## Alternar vídeos no player fake da Hero

Atualmente o `HeroAnimation.tsx` mostra apenas `/videos/showcase-1.mp4` em loop. Vamos fazê-lo alternar entre os 6 vídeos do showcase, sincronizado com o ciclo da barra de progresso "fake" (que dura 8s).

### Mudanças em `src/components/landing/HeroAnimation.tsx`

1. Adicionar uma lista local com os mesmos vídeos do `ShowcaseSection`:
   - `/videos/showcase-1.mp4` até `/videos/showcase-6.mp4`

2. Criar estado `currentVideoIndex` com `useState(0)`.

3. Sincronizar troca com o ciclo do "carregamento":
   - A barra de progresso já tem animação de 8s em loop infinito.
   - A cada 8 segundos (mesmo período), avançar `currentVideoIndex` para o próximo vídeo (com `setInterval` em `useEffect`).
   - No momento da troca, exibir brevemente (≈600ms) um overlay de "transição/processando" sobre o vídeo, simulando o carregamento concluir antes do próximo iniciar — reforça a ideia de "gerando novo vídeo".

4. Trocar a tag `<video>`:
   - `key={currentVideoIndex}` para forçar remount e reiniciar o playback.
   - `src={videos[currentVideoIndex]}` dinâmico.
   - Manter `autoPlay loop muted playsInline`.
   - Envolver em `AnimatePresence` (framer-motion) com fade-in/fade-out suave (≈300ms) entre trocas para a transição não ser brusca.

5. Atualizar o texto "Gerando vídeo com IA..." mantendo, mas opcionalmente mostrar o tipo do vídeo atual ("Viral", "UGC") abaixo, lendo do mesmo array — isso dá realismo ao "gerador". Manter simples: apenas alternar os vídeos sem mudar copy.

### Resultado esperado

A cada ~8s o player fake da hero troca de vídeo automaticamente, ciclando pelos 6 exemplos do showcase, com fade suave. A barra de progresso e os efeitos visuais permanecem como estão.
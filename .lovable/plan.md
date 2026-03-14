
## Plano: Inserir vídeo real na animação do Hero

### O que será feito
Copiar o vídeo enviado para `public/videos/hero-demo.mp4` e substituir o conteúdo do player animado (linhas 42-63 do `HeroAnimation.tsx`) por um `<video>` real rodando em loop, muted e autoplay, mantendo as partículas e o overlay animado por cima para preservar o efeito visual.

### Alterações

**1. Copiar arquivo**
- `user-uploads://video_language_ptbr_duration_seconds_12_style_70448049f1.mp4` → `public/videos/hero-demo.mp4`

**2. `src/components/landing/HeroAnimation.tsx`**
- Dentro do `div.aspect-video` (linhas 42-63), substituir o play button estático e o shimmer por:
  - `<video src="/videos/hero-demo.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />`
  - Manter o overlay gradient e partículas por cima para o efeito glass
  - Remover o botão play central (já não faz sentido com vídeo real rodando)

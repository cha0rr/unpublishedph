

## Plano: Adicionar Ângulo e Iluminação cinematográfica + modelo nano-banana-pro

### Resumo
Adicionar duas novas categorias de seleção (Ângulo de Câmera e Iluminação) com opções baseadas em cinema/fotorrealismo, e trocar o modelo de `nano-banana-2` para `nano-banana-pro`.

### Novas categorias no CATEGORIES

**Ângulo de Câmera** (`cameraAngle`)
- Close-up frontal 📸 — Retrato frontal rosto inteiro
- Plano médio 🎬 — Da cintura para cima
- Plano americano 🎥 — Do joelho para cima
- Low angle (contra-plongée) ⬆️ — Câmera de baixo, imponente
- High angle (plongée) ⬇️ — Câmera de cima, vulnerável
- 3/4 perfil 🎭 — Rosto levemente virado
- Over the shoulder 👤 — Por cima do ombro
- Dutch angle 🔄 — Câmera inclinada, dramática

**Iluminação** (`lighting`)
- Rembrandt 🎨 — Triângulo de luz clássico no rosto
- Butterfly (Paramount) 🦋 — Luz de cima, sombra sob nariz
- Split lighting 🌗 — Metade iluminada, metade na sombra
- Golden hour 🌅 — Luz dourada quente, pôr do sol
- Rim light (contraluz) 🌟 — Contorno luminoso nas bordas
- Luz natural difusa ☁️ — Suave, sem sombras duras
- Neon/RGB 💜 — Luzes coloridas estilo cyberpunk
- Luz dura (harsh) ☀️ — Sombras marcadas e contraste alto

### Alterações

**`src/components/AvatarMakerForm.tsx`**
- Adicionar as 2 categorias ao array CATEGORIES
- No `buildPrompt`, incluir ângulo e iluminação no prompt
- Trocar modelo de `nano-banana-2` para `nano-banana-pro` no `handleGenerate`

### Prompt atualizado
Incluirá linhas como:
- `- Ângulo de câmera: Close-up frontal`
- `- Iluminação: Rembrandt (triângulo de luz clássico)`
- Linha final reforçando: "iluminação cinematográfica profissional, qualidade de fotografia editorial"




## Plano: Preview 3D interativo com React Three Fiber

### Resumo
Substituir o preview SVG atual por um modelo 3D feminino estilizado (Pixar-like) renderizado no browser com React Three Fiber. As cores de cabelo, pele e olhos mudarão em tempo real ao selecionar opções no formulário.

### Limitacao importante
O preview do sandbox Lovable **nao tem GPU** -- o canvas 3D aparecera vazio no preview. O usuario precisara testar no browser real (URL publicada) para ver o modelo 3D.

### Etapas

**1. Instalar dependencias**
- `@react-three/fiber@^8.18`
- `@react-three/drei@^9.122.0`
- `three@^0.160`

**2. Obter modelo 3D**
- Usar um modelo GLB feminino estilizado gratuito (CC0/royalty-free) hospedado em CDN publico
- Opcoes: modelo do ReadyPlayerMe, Mixamo, ou um modelo estilizado do Sketchfab
- O modelo precisa ter meshes separados para cabelo, pele e olhos (para poder colorir independentemente)
- Alternativa: criar personagem com primitivas R3F (esferas, cilindros) estilizadas com materiais toon -- resultado menos realista mas funcional sem modelo externo

**3. Criar componente `AvatarPreview3D.tsx`**
- Canvas R3F com `OrbitControls` (drei) para rotacao
- Iluminacao: ambient + directional + rim light
- Carregar modelo com `useGLTF`
- Traversar meshes do modelo e aplicar cores dinamicamente:
  - `hairColor` → material do mesh "hair"
  - `skinColor` → material dos meshes "body"/"face"
  - `eyeColor` → material do mesh "eyes"
  - `bodyType` → scale X do torso
  - `height` → scale Y geral
- Transicoes suaves via `useFrame` + `lerp` nas cores

**4. Atualizar `AvatarPreview.tsx`**
- Substituir o SVG pelo componente `AvatarPreview3D`
- Manter a mesma interface de props `selections: Record<string, string>`
- Adicionar fallback para quando WebGL nao esta disponivel (manter SVG como fallback)

### Detalhes tecnicos

```text
AvatarMaker.tsx
  ├── AvatarMakerForm (esquerda)
  └── AvatarPreview (direita, sticky)
        └── AvatarPreview3D
              ├── Canvas (R3F)
              │   ├── Lights
              │   ├── CharacterModel (GLB)
              │   │   ├── Hair mesh → cor dinamica
              │   │   ├── Body mesh → cor pele
              │   │   └── Eyes mesh → cor olhos
              │   └── OrbitControls
              └── Fallback (SVG se WebGL indisponivel)
```

**Arquivos:**
- **Instalar**: three, @react-three/fiber, @react-three/drei
- **Criar**: `src/components/AvatarPreview3D.tsx`
- **Editar**: `src/components/AvatarPreview.tsx` (wrapper com fallback)


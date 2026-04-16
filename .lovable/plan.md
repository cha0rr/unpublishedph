

## Plano: Exibir tag "Pro" no Frame Mode sempre

### Problema
A badge "Pro" e o ícone de cadeado só aparecem quando `canAccessFrame` é `false` (usuário sem plano Pro). Como o usuário atual tem acesso, a tag não aparece.

### Solução
Manter a badge "Pro" sempre visível no botão "Frame Mode", independentemente do plano. O ícone de cadeado (`Lock`) continua condicional — só aparece para quem não tem acesso.

### Alteração em `src/pages/StudioVideos.tsx`
- Mover a `<Badge>Pro</Badge>` para fora do condicional `!canAccessFrame`, exibindo-a sempre
- Manter o `<Lock>` apenas quando `!canAccessFrame`


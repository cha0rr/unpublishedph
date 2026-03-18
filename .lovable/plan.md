

## Auditoria de Controle de Acesso por Plano

### Diagnóstico Atual

| Camada | Verificação | Status |
|---|---|---|
| **Backend — geminigen-video** | Verifica `status === 'approved'` OU `role === 'admin'` | OK — mas não diferencia plano |
| **Backend — geminigen-video-frame** | Idem | OK — mas não diferencia plano |
| **Backend — geminigen-image** | Idem (verifica apenas `approved`) | **VULNERÁVEL** — não verifica se plano é `pro` |
| **Frontend — GerarImagem** | Verifica `plan === 'pro'` no React | Apenas cosmético, contornável |
| **Frontend — Navbar** | Verifica `plan === 'business'` (obsoleto!) para Studio Imagens | Bug — deveria ser `pro` |
| **Frontend — GerarVideo/Frame** | Verifica `isApproved` | OK como UX, backend protege |

### Vulnerabilidades Encontradas

1. **`geminigen-image` (Edge Function)**: Qualquer usuário com status `approved` (incluindo plano `basico`) pode gerar imagens chamando a API diretamente. A restrição ao plano `pro` existe apenas no frontend, que é trivialmente contornável.

2. **Navbar ainda referencia `plan === 'business'`**: O botão "Studio Imagens" nunca aparece para ninguém porque verifica o plano antigo `business` em vez de `pro`.

### Plano de Correção

#### A. Adicionar verificação de plano `pro` no backend (`geminigen-image`)

Após o check de `isApproved`, adicionar:
```
if (!isAdmin && profile?.plan !== 'pro') → 403 "Recurso exclusivo do Plano Pro"
```

Isso garante que mesmo chamando a Edge Function diretamente via curl, um usuário do plano `basico` não consegue gerar imagens.

#### B. Corrigir referência de plano na Navbar

Trocar `plan === 'business'` por `plan === 'pro'` nas linhas 22, 90 e 151 da Navbar para que o botão "Studio Imagens" (gerador de imagens) apareça corretamente para usuários Pro.

#### C. Adicionar verificação de plano `pro` no backend (`BusinessStudioImages` → mesma Edge Function `geminigen-image`)

A página `BusinessStudioImages` usa o mesmo endpoint `geminigen-image`, então a correção em A já cobre este caso.

### Arquivos Afetados

| Arquivo | Alteração |
|---|---|
| `supabase/functions/geminigen-image/index.ts` | Bloquear acesso se `plan !== 'pro'` (e não admin) |
| `src/components/landing/Navbar.tsx` | Trocar `business` → `pro` |


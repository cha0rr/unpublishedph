## Objetivo

Alinhar a tela de cadastro (`/registro`) e o `RegistroDialog` aos 3 planos da landing (Starter / Growth / Scale) e aumentar a logo da página de cadastro.

## Mudanças

### 1. `src/pages/Registro.tsx`
- Substituir o mapa `plans` pelos 3 tiers da landing:
  - `starter` → "Starter — R$ 59/mês" (envia slug `basico` no backend)
  - `growth` → "Growth — R$ 97/mês" (envia slug `pro`)
  - `scale` → "Scale — R$ 197/mês" (envia slug `pro`)
- Trocar o `<Select>` para usar 3 opções com `value` lógico (`starter`, `growth`, `scale`) e, no submit, mapear para o slug aceito pelo backend (`basico` ou `pro`) antes de chamar `supabase.functions.invoke("register")`. Isso evita mexer na edge function `register` que só aceita `['basico','pro']`.
- Aceitar `?plano=starter|growth|scale` na URL; manter retrocompatibilidade aceitando `basico`/`pro` (mapeando para `starter`/`growth`).
- Aumentar a logo: `h-16` → `h-28 sm:h-32`, ajustar `mb-4` para `mb-6`.
- Atualizar a mensagem de WhatsApp para usar o nome novo do tier (ex.: "Growth — R$ 97/mês").

### 2. `src/components/landing/RegistroDialog.tsx`
- Mesma atualização do mapa `plans` e do `<Select>` (3 opções: Starter / Growth / Scale).
- Mesmo mapeamento `tier → slug backend` no submit.
- O `selectedPlan` recebido por prop continua sendo o slug do backend (`basico`/`pro`); converter para o tier visual ao abrir o dialog (`pro` → `growth` por padrão).

### 3. `PricingSection.tsx` (ajuste mínimo)
- Passar o tier visual (ex.: `"growth"`, `"scale"`) em vez do slug backend para o `RegistroDialog`, para que o dialog abra com o tier correto destacado. O dialog converte para slug backend antes de enviar.

## Backend / DB

Sem alterações. A edge function `register` continua aceitando apenas `basico` e `pro`. Growth e Scale são enviados como `pro`, exatamente como já é feito na landing (comentário existente em `PricingSection.tsx` confirma essa decisão).

## Fora de escopo

- Refatoração real de planos no Supabase (criar slugs `growth`/`scale` separados).
- Mudanças em gating de features das edge functions.
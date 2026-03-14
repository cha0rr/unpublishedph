

## Plano: Atualizar planos e features

### Alterações

1. **PricingSection.tsx** — Atualizar o plano Business:
   - Preço de R$ 99 → R$ 129
   - Adicionar "Gerador com Frame Mode" nos planos Pro e Business
   - Adicionar "Gerador de imagens com IA (em breve)" no Business
   - Manter "Gerador de roteiros com IA" no Business mas adicionar "(em breve)"

2. **Registro.tsx** — Atualizar o label do Business:
   - "Business — R$ 99/mês" → "Business — R$ 129/mês"

3. **Registro.tsx** — Atualizar o map de planos (linha ~23):
   - `business: "Business — R$ 129/mês"`

### Resumo das features por plano

- **Básico (R$ 59)**: Geração ilimitada, formato 16:9, sem marca d'água, uso comercial
- **Pro (R$ 79)**: Tudo do Básico + formatos 16:9/9:16, **Gerador com Frame Mode**, suporte 24h
- **Business (R$ 129)**: Tudo do Pro + **Gerador de roteiros com IA (em breve)**, **Gerador de imagens com IA (em breve)**, suporte exclusivo, consultoria semanal


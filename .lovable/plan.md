

## Mobile-First: Refatoracao Completa do Site

### Problemas Identificados

1. **HeroSection**: Features list (`gap-8`) transborda em telas pequenas; HeroAnimation ocupa espaco desnecessario no mobile
2. **VideoGenerator / FrameVideoGenerator**: Toolbar com toggles + botoes fica apertada em telas < 400px; controles empilham mal
3. **Navbar**: Ja corrigida na Fase 1 -- OK
4. **Footer**: Grid de links nao otimizado para mobile
5. **PricingSection**: Cards de planos em coluna unica ficam ok, mas botoes e precos precisam de melhor hierarquia visual
6. **GerarVideo / GerarVideoFrame**: Padding e titulo ok, mas `max-w-2xl` pode ser mais fluido
7. **Admin**: Cards com `grid-cols-2` quebram em telas muito pequenas
8. **Login / Registro**: Basicamente ok, pequenos ajustes de padding

### Alteracoes por Arquivo

**`src/components/landing/HeroSection.tsx`**
- Features list: `flex-wrap gap-4` em mobile, `gap-8` em `sm:`
- Titulo: `text-3xl` mobile, manter `sm:text-5xl lg:text-6xl`
- Paragrafo: `text-base` mobile, `sm:text-lg`
- Ocultar HeroAnimation em mobile (`hidden lg:flex`), mostrar so no desktop
- Centralizar texto no mobile

**`src/components/landing/BenefitsSection.tsx`**
- Padding: `py-16` mobile, `sm:py-24`
- Titulo: `text-2xl` mobile, `sm:text-3xl md:text-4xl`
- Cards grid: ja usa `grid gap-6 sm:grid-cols-2 lg:grid-cols-4` -- OK

**`src/components/landing/HowItWorks.tsx`**
- Padding: `py-16` mobile, `sm:py-24`
- Steps gap: `gap-6` mobile
- Titulo: `text-2xl` mobile

**`src/components/landing/ShowcaseSection.tsx`**
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (ja quase ok, forcar 1 col no mobile)
- Padding: `py-16 sm:py-24`

**`src/components/landing/PricingSection.tsx`**
- Grid: `grid-cols-1 md:grid-cols-3` (ja ok)
- Padding: `py-16 sm:py-24`
- Preco: `text-3xl` mobile, `sm:text-4xl`

**`src/components/landing/FinalCTA.tsx`**
- Padding: `py-20 sm:py-32`
- Titulo: `text-2xl sm:text-3xl md:text-5xl`

**`src/components/landing/Footer.tsx`**
- Grid: `grid-cols-2 sm:grid-cols-2 lg:grid-cols-5` para links lado a lado no mobile
- Padding: `py-10 sm:py-16`

**`src/components/VideoGenerator.tsx`**
- Toolbar: empilhar em mobile -- controles em `flex-col` no mobile, `sm:flex-row`
- Toggles e botao gerar em linhas separadas no mobile

**`src/components/FrameVideoGenerator.tsx`**
- Frame upload grid: `grid-cols-1 sm:grid-cols-2` para empilhar no mobile
- Toolbar: mesma logica do VideoGenerator -- empilhar controles

**`src/pages/GerarVideo.tsx` e `src/pages/GerarVideoFrame.tsx`**
- Container: `max-w-2xl` -> `w-full max-w-2xl`, padding `px-4` ja ok
- Titulo: `text-2xl sm:text-3xl`
- `pt-24 sm:pt-28`

**`src/pages/Admin.tsx`**
- Profile cards grid: `grid-cols-1 sm:grid-cols-2`
- Titulo: `text-xl sm:text-2xl`

**`src/components/landing/HeroAnimation.tsx`**
- Sem alteracao (sera oculta no mobile via HeroSection)

### Resumo: 12 arquivos alterados, foco em spacing, tipografia e stacking mobile-first


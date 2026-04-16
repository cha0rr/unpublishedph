

## Plano: Ocultar links da landing page quando logado

### Resumo
Quando o usuário estiver autenticado, esconder os botões "Início", "Como Funciona" e "Planos" da Navbar (desktop e mobile), pois são links da landing page e não fazem sentido para usuários logados.

### Alteração em `src/components/landing/Navbar.tsx`
- Condicionar a renderização dos `navLinks` à ausência de `user` — tanto no menu desktop quanto no mobile
- Se `user` existir, não renderizar o bloco de links de scroll

### Arquivos
- **Editar**: `src/components/landing/Navbar.tsx`


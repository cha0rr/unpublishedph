

## Problema Identificado

Há dois bugs causando o loop infinito de "Entrando...":

1. **`useAuth.ts`**: O callback `onAuthStateChange` usa `await` internamente, o que pode causar deadlock e bloquear a atualização do estado de autenticação. A recomendação oficial do Supabase é nunca usar `await` dentro desse callback.

2. **`Login.tsx`**: A navegação (`navigate()`) é chamada durante o render do componente (linhas 72-76), o que é uma prática problemática no React e pode causar re-renders infinitos ou simplesmente não funcionar. Além disso, o `setTimeout` de 1s para setar `loading=false` pode não disparar corretamente se o componente re-renderizar antes.

## Plano de Correção

### 1. Corrigir `src/hooks/useAuth.ts`
- Remover `await` do callback `onAuthStateChange`
- Usar `setTimeout(..., 0)` para disparar o `fetchProfile` fora do callback, evitando deadlock

### 2. Corrigir `src/pages/Login.tsx`
- Adicionar `useEffect` para lidar com redirecionamento quando o estado de auth mudar (em vez de chamar `navigate` durante render)
- Remover o `setTimeout` frágil do `handleSubmit` e usar o estado `loading` do `useAuth` para saber quando a auth terminou de carregar
- Setar `loading=false` imediatamente após `signIn` resolver, deixando o `useEffect` cuidar do redirect


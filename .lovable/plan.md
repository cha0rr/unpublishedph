

## Fase 1: Correções Criticas + Mobile na Navbar

### 1. Bug do polling infinito no Frame Mode

**Causa raiz identificada**: Quando a API retorna `status: 3` (erro), o `throw` na linha 97 do `FrameVideoGenerator.tsx` e' capturado pelo `catch` na linha 99 como se fosse um erro de rede. O `consecutiveErrors` e' resetado para 0 na linha 79 (antes do check de status), entao nunca atinge o limite de 5 para parar -- resultado: loop infinito.

Os logs de rede confirmam: todas as respostas retornam `status: 3` com `error_code: "PUBLIC_ERROR_AUDIO_FILTERED"` e o polling continua indefinidamente.

**Correção**: Separar erros de status da API (que devem parar imediatamente) de erros de rede (que permitem retry). Mover o `consecutiveErrors = 0` para DEPOIS dos checks de status, ou re-lançar erros de status fora do catch de retry.

### 2. Botoes mobile na Navbar

**Problema**: Os botoes "Gerar Video" e "Frame Mode" so aparecem no menu desktop (`hidden md:flex`). O menu mobile (linhas 114-131) so mostra "Sair" para usuarios logados.

**Correção**: Adicionar botoes "Gerar Video", "Frame Mode" e "Admin" dentro do menu mobile para usuarios autorizados.

### 3. Mesmo bug no `useGenerator.ts` (modo normal)

O `useGenerator.ts` usa `supabase.functions.invoke` para polling, que tambem nao trata status 3 de forma robusta -- se o invoke falhar silenciosamente, o loop continua. Aplicar a mesma correção de separar erros de API de erros de rede.

### Arquivos alterados

- `src/components/FrameVideoGenerator.tsx` -- corrigir polling: separar erros de status (parar imediatamente) de erros de rede (permitir retry)
- `src/hooks/useGenerator.ts` -- mesma correção de polling para o modo normal
- `src/components/landing/Navbar.tsx` -- adicionar botoes Gerar Video, Frame Mode e Admin no menu mobile


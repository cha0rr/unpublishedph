

## Plano: Aumentar resiliência do polling de imagens em redes instáveis

### Problema
O polling de status da imagem (`useImageGenerator.ts`) trata **todos** os erros como erros de rede e desiste após 5 falhas consecutivas (~25 segundos). Em redes instáveis ou com firewalls restritivos, isso causa o erro "Conexão perdida ao verificar status" antes da imagem ficar pronta.

Além disso, erros HTTP legítimos (401, 403, 500) são contados como "erros de rede", quando deveriam ser tratados individualmente.

### Etapas

**1. Diferenciar erros de rede vs erros HTTP no `useImageGenerator.ts`**
- Erros de autenticação (401/403): parar imediatamente com mensagem clara
- Erros de servidor (500): contar como erro temporário, mas com tolerância maior
- Erros de `fetch` puro (TypeError/network): contar como erro de rede
- Aumentar threshold de 5 para 10 consecutivos antes de desistir
- Adicionar timeout ao fetch (15s) para não travar em redes lentas

**2. Adicionar retry com backoff**
- Após erro de rede, esperar progressivamente mais (5s → 8s → 12s) antes de tentar novamente
- Manter intervalo normal de 5s quando não há erros

### Detalhes técnicos
- Usar `AbortController` com timeout de 15s no fetch para evitar travamento
- Separar o `catch` em: erro de rede puro vs erro HTTP
- Limiar de desistência: 10 erros de rede consecutivos (~90s de falha contínua)
- Nenhuma alteração de banco de dados ou edge function necessária


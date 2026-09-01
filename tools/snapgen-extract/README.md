# snapgen-extract

Pequena CLI local que extrai o **JWT da sessão logada do snapgen.ai** a partir do seu Chrome (com DevTools Protocol aberto) e imprime no terminal. Você copia o token e cola em `/admin/snapgen` no seu app.

> 🎯 Por que isso existe: para usar a API do snapgen.ai (geração de vídeos com Veo 3.1 Fast gratuito) sem precisar guardar email/senha em variáveis secretas no Supabase. A sessão que você já tem aberta no navegador é a mesma que o frontend do snapgen.ai usa para chamar a API — só precisamos do JWT.

## Como usar

### 1. Iniciar o Chrome em modo debug

Abra o **PowerShell** e rode:

```powershell
chrome.exe --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir=$env:USERPROFILE\.snapgen-bridge
```

> Se o seu Chrome principal já estiver aberto, **feche todas as instâncias antes** — o Chrome não aceita duas instâncias com o mesmo perfil. O `--user-data-dir` cria um perfil dedicado para esta sessão.

Navegue até https://snapgen.ai/app/video-gen/veo nesse Chrome e faça login (se ainda não estiver logado). Mantenha essa janela aberta.

### 2. Extrair o JWT

Na raiz do projeto (`unpublishedph/`):

```bash
bun run snapgen:extract
# ou
cd tools/snapgen-extract && bun run extract
```

Saída esperada:

```
source: localStorage
expires_at: 2026-09-01T18:30:00.000Z
length: 487

Copie a linha abaixo (eyJ...) e cole em /admin/snapgen no app:

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

A linha `eyJ...` é o que você precisa copiar. Selecione ela **inteira**, sem espaços antes/depois, sem aspas.

### 3. Colar no app

Acesse `http://localhost:5173/admin/snapgen`, cole no campo "Token de acesso", e clique em **Salvar**. Pronto — as próximas gerações de vídeo usarão esse token.

## Quando renovar?

O token expira (geralmente em 1–24h, dependendo da configuração do snapgen.ai). Quando isso acontecer, a geração vai falhar com erro "SnapGen: token não configurado" (ou "401 Unauthorized" da API). Basta:

1. Repetir o passo 2 (`bun run snapgen:extract`)
2. Repetir o passo 3 (colar o novo token em `/admin/snapgen`)

Não há nada rodando em background, nada para iniciar automaticamente. Você tem controle total.

## Variáveis de ambiente opcionais

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `CHROME_DEBUG_URL` | `http://127.0.0.1:9222` | URL do Chrome em modo debug |
| `SNAPGEN_URL` | `https://snapgen.ai/app/video-gen/veo` | Página alvo |

## Solução de problemas

| Saída | Causa | Solução |
| --- | --- | --- |
| `Não foi possível conectar ao Chrome em http://127.0.0.1:9222` | Chrome não foi iniciado com a flag | Feche o Chrome e rode o comando do passo 1 novamente |
| `Sessão do snapgen.ai não encontrada` | Você não está logado | Abra `https://snapgen.ai/app/video-gen/veo` no Chrome em modo debug e faça login |
| Token extraído, mas o app devolve `401 Unauthorized` | O JWT já expirou entre a extração e o uso | Repita o passo 2 — não demora nem 1 segundo |
| `⚠ EXPIRADO` aparece na saída | O token que está no Chrome já venceu | Faça login novamente no snapgen.ai e rode o passo 2 de novo |

## Estrutura

```
tools/snapgen-extract/
├── package.json         # dependência: chrome-remote-interface
├── README.md
└── src/
    ├── extract.ts       # entrypoint da CLI
    ├── extractToken.ts  # 4 estratégias: localStorage, sessionStorage, document.cookie, Network.getCookies
    └── decodeJwt.ts     # decoder JWT sem dependências
```

## Segurança

- O token JWT **nunca** é gravado em disco por esta ferramenta.
- O Chrome precisa estar rodando **na sua máquina** com `127.0.0.1:9222` — não é acessível de fora.
- A leitura do localStorage/cookie é feita via CDP no **seu próprio Chrome**, não pela internet.
- O token é exibido **apenas no seu terminal**. Você mesmo cola manualmente no `/admin/snapgen`.

## Por que não automatizar?

Poderíamos rodar um script que extrai o token periodicamente e atualiza no Supabase. Mas isso exige manter o Chrome aberto 24/7 e um serviço rodando em background. Para um projeto pessoal/semi-profissional, **o controle manual é mais seguro e mais simples**: você só extrai quando precisa, e o token fica no Supabase até expirar. Se quiser automatizar no futuro, é fácil adaptar este CLI para rodar num cron.

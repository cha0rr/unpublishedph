## Plano: Gerador de Roteiros e Prompts

### Funcionalidades

1. **Tabela `system_prompts`** — armazena o system prompt configurado pelo admin (chave única por tipo, ex: `script_generator`)
2. **Edge Function `deepseek-chat`** — recebe mensagens do usuário, adiciona o system prompt do banco, e chama a API DeepSeek (`deepseek-chat`). Valida que o usuário é Pro e aprovado.
3. **Página `/admin/roteiros`** — admin edita o system prompt em um textarea e salva. Link adicionado no painel admin.
4. **Página `/gerar-roteiro`** — interface de chat para usuários Pro aprovados. Campo de entrada, botão enviar, respostas com streaming renderizadas em markdown.
5. **Secret `DEEPSEEK_API_KEY`** — será solicitada via ferramenta de secrets.

### Alterações

| Arquivo | Ação |
|---------|------|
| Migration | Criar tabela `system_prompts` com RLS (admin read/write, users read) |
| `supabase/functions/deepseek-chat/index.ts` | Nova edge function |
| `src/pages/AdminRoteiros.tsx` | Nova página admin |
| `src/pages/GerarRoteiro.tsx` | Nova página do gerador |
| `src/App.tsx` | Adicionar rotas |
| `src/pages/Admin.tsx` | Adicionar link para `/admin/roteiros` |
| `supabase/config.toml` | Adicionar config da função |

### Custos por modelo
- DeepSeek Chat: API externa, custo gerenciado pelo usuário via sua chave API
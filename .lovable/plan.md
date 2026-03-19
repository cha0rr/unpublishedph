

## Integração Mercado Pago — Pagamento e Liberação Automática de Plano

### Fluxo Proposto

```text
Usuário preenche registro
        │
        ▼
  Edge Function "register"
  (cria conta com status "pending")
        │
        ▼
  Edge Function "mercadopago-create-preference"
  (cria preferência de pagamento no MP)
        │
        ▼
  Redireciona para Checkout Mercado Pago
  (sandbox_init_point em modo teste)
        │
        ▼
  Usuário paga no Mercado Pago
        │
        ├── Webhook MP → Edge Function "mercadopago-webhook"
        │   (valida pagamento, muda status para "approved")
        │
        └── Usuário volta para /pagamento-status?status=approved
            (página mostra resultado)
```

### Componentes

#### 1. Secret: `MERCADOPAGO_ACCESS_TOKEN`
- Você precisará do Access Token de teste do Mercado Pago (encontrado em: [Painel do Desenvolvedor MP](https://www.mercadopago.com.br/developers/panel/app) → Credenciais de Teste)
- Será solicitado via ferramenta de secrets

#### 2. Edge Function: `mercadopago-create-preference`
- Recebe `userId`, `plan`, `email`
- Cria uma preferência no Mercado Pago via API REST (`POST https://api.mercadopago.com/checkout/preferences`)
- Item: nome do plano, preço (49.90 ou 69.90)
- `external_reference`: `userId` (para identificar quem pagou no webhook)
- `back_urls`: success/failure/pending apontando para `/pagamento-status`
- Retorna `sandbox_init_point` (URL do checkout teste)

#### 3. Edge Function: `mercadopago-webhook`
- Recebe notificação do Mercado Pago (`payment` topic)
- Consulta a API do MP para obter detalhes do pagamento
- Se `status === 'approved'`: atualiza o profile do usuário para `status = 'approved'`
- Validação: verifica que o `external_reference` corresponde a um `user_id` existente

#### 4. Página: `/pagamento-status`
- Nova página que mostra o resultado do pagamento (sucesso, pendente ou falha)
- Lê o query param `status` da URL de retorno do MP
- Sucesso: "Pagamento confirmado! Faça login para começar"
- Pendente: "Pagamento em processamento, você será notificado"
- Falha: "Pagamento não aprovado, tente novamente"

#### 5. Atualização do fluxo de registro
- Após o `register` retornar sucesso, o frontend chama `mercadopago-create-preference`
- Redireciona o usuário para o checkout do MP (em vez de abrir WhatsApp)
- Remove o campo "Forma de pagamento" manual (MP cuidará disso)
- Mantém a mensagem WhatsApp como opcional/secundário

### Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `supabase/functions/mercadopago-create-preference/index.ts` | Novo — cria preferência MP |
| `supabase/functions/mercadopago-webhook/index.ts` | Novo — recebe webhook e aprova usuário |
| `supabase/config.toml` | Adicionar config das 2 novas functions |
| `src/pages/PagamentoStatus.tsx` | Nova página de resultado do pagamento |
| `src/App.tsx` | Adicionar rota `/pagamento-status` |
| `src/pages/Registro.tsx` | Atualizar fluxo: após registro → redirecionar para checkout MP |
| `src/components/landing/RegistroDialog.tsx` | Mesma atualização do fluxo |

### Detalhes Técnicos

**Preferência MP (payload):**
```json
{
  "items": [{ "title": "PH Studio - Plano Pro", "quantity": 1, "unit_price": 69.90, "currency_id": "BRL" }],
  "external_reference": "<user_id>",
  "back_urls": {
    "success": "https://phstudio-v1.lovable.app/pagamento-status?status=approved",
    "failure": "https://phstudio-v1.lovable.app/pagamento-status?status=failure",
    "pending": "https://phstudio-v1.lovable.app/pagamento-status?status=pending"
  },
  "auto_return": "approved",
  "payer": { "email": "<email>" }
}
```

**Webhook:** O MP envia `POST` com `{ type: "payment", data: { id: "123" } }`. A function consulta `GET https://api.mercadopago.com/v1/payments/123` para obter `status` e `external_reference`.

**Modo teste:** Usará `sandbox_init_point` (URL de sandbox) em vez de `init_point` (produção). Para trocar para produção futuramente, basta usar o Access Token de produção e usar `init_point`.




## Plano: Remover Mercado Pago e modelo Veo 3.1

### 1. RegistroDialog -- Remover integração Mercado Pago, manter envio WhatsApp

- Remover a chamada a `mercadopago-create-preference` do `handleSubmit`
- Após registro bem-sucedido via edge function `register`, construir mensagem WhatsApp e abrir `https://wa.me/{WHATSAPP_NUMBER}?text={message}`
- Exibir tela de sucesso informando que a conta está pendente de aprovação do administrador (não mais "redirecionando para pagamento")
- Remover campo `payment_method` do formulário (pagamento não é mais gerenciado pelo sistema)

### 2. PricingSection -- Remover menções a pagamento

- Sem mudanças estruturais, os planos continuam existindo para diferenciar funcionalidades

### 3. Remover rota `/pagamento-status`

- Remover import e `<Route>` de `PagamentoStatus` em `App.tsx`
- O arquivo `src/pages/PagamentoStatus.tsx` pode ser deletado

### 4. VideoGenerator -- Remover modelo Veo 3.1

- Remover `{ value: "veo-3.1", label: "Veo 3.1" }` do array `MODEL_OPTIONS`
- Manter apenas `veo-3-fast` e `veo-3.1-fast`

### 5. Edge function `register` -- Remover campo `payment_method` como obrigatório

- O campo já é opcional na validação, sem mudança necessária

### 6. Edge functions de Mercado Pago

- Não deletar os arquivos (podem ser úteis futuramente), mas remover referências no frontend

### Resumo das alterações por arquivo

| Arquivo | Ação |
|---|---|
| `src/components/landing/RegistroDialog.tsx` | Remover MP, adicionar WhatsApp redirect + tela sucesso pendente |
| `src/components/VideoGenerator.tsx` | Remover Veo 3.1 do MODEL_OPTIONS |
| `src/App.tsx` | Remover rota `/pagamento-status` |
| `src/pages/PagamentoStatus.tsx` | Deletar |


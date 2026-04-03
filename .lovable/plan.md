

## Plano: Remover Mercado Pago e redirecionar para WhatsApp

### O que será feito

Remover toda a integração com o Mercado Pago e, após o registro do usuário, redirecionar para o WhatsApp com os dados do formulário (mesmo padrão já usado no `RegistroDialog.tsx`).

### Alterações

1. **`src/pages/Registro.tsx`**:
   - Remover Steps 2 e 3 (chamada `mercadopago-create-preference` e redirect para checkout)
   - Adicionar função `buildWhatsAppMessage()` com resumo do cadastro (mesmo padrão do `RegistroDialog.tsx`)
   - Após registro bem-sucedido, abrir WhatsApp (`window.open`) e mostrar tela de sucesso
   - Restaurar campo de forma de pagamento (Pix/Cartão) no formulário para incluir na mensagem do WhatsApp
   - Atualizar tela de sucesso para refletir que a conta está pendente de aprovação (não mais "redirecionando para pagamento")

2. **Deletar Edge Functions do Mercado Pago**:
   - `supabase/functions/mercadopago-create-preference/` — deletar arquivo
   - `supabase/functions/mercadopago-webhook/` — deletar arquivo
   - Usar `supabase--delete_edge_functions` para remover do deploy

3. **`src/components/landing/RegistroDialog.tsx`** — sem alterações (já usa o fluxo correto com WhatsApp)


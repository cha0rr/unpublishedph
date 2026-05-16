## Objetivo
Fazer o Gerador de Roteiros voltar a mostrar uma resposta visível enquanto a IA trabalha, permitindo que o usuário perceba imediatamente que o assistente está preparando perguntas/roteiro e possa responder em seguida — sem trocar DeepSeek por Lovable AI.

## Plano
1. **Criar mensagem temporária do assistente imediatamente no frontend**
   - Assim que o usuário enviar o prompt, inserir uma bolha do assistente com texto de status, por exemplo: `Analisando seu pedido...`.
   - Trocar o indicador de três pontos por uma mensagem real e persistente durante o processamento.

2. **Atualizar a bolha quando o DeepSeek responder**
   - Como o backend agora retorna JSON completo para evitar `NetworkError`, substituir o conteúdo temporário pela resposta final recebida de `{ content }`.
   - Isso mantém a correção anterior contra falha de streaming, mas remove a sensação de “tela parada”.

3. **Permitir fluxo de perguntas e respostas naturalmente**
   - Se a resposta do DeepSeek pedir informações iniciais, ela aparecerá na conversa como mensagem do assistente.
   - O campo de texto continuará disponível após terminar a geração para o usuário responder às perguntas.

4. **Preservar compatibilidade com imagem/streaming**
   - Manter o parser de streaming existente para o fluxo multimodal com imagem.
   - Reaproveitar a mesma bolha temporária para receber deltas quando a resposta vier em streaming.

5. **Melhorar recuperação em caso de erro**
   - Se a chamada falhar antes de gerar conteúdo, substituir a mensagem temporária por um erro claro ou removê-la, evitando conversa confusa.
   - Continuar exibindo o toast com a mensagem real do backend.

## Arquivos a alterar
- `src/pages/GerarRoteiro.tsx`

## O que não será alterado
- O provedor DeepSeek continuará sendo usado para prompts sem imagem.
- A Edge Function `deepseek-chat` não precisa voltar para streaming direto, pois isso era a causa provável do `NetworkError` anterior.
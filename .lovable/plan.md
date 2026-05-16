Plano para corrigir o gerador de roteiros sem trocar o DeepSeek:

1. Reforçar a instrução enviada à Edge Function
- Manter o prompt do admin como base.
- Acrescentar uma regra server-side obrigatória depois do prompt do admin: quando faltarem informações essenciais, o assistente deve fazer somente as perguntas necessárias e encerrar a resposta, sem gerar roteiro, prompt genérico, exemplo, template ou fallback.
- Isso impede que um prompt salvo no banco mande gerar “modelo genérico enquanto aguarda respostas”.

2. Detectar respostas de coleta de informações no frontend
- Quando a resposta do assistente terminar com perguntas/lista de perguntas, o campo de texto volta a ficar disponível normalmente.
- O usuário poderá responder e a próxima chamada enviará todo o histórico para o DeepSeek continuar a partir das respostas.

3. Bloquear continuação automática indevida
- Garantir que o app faça apenas uma chamada por envio do usuário.
- Não haverá segunda chamada automática após o DeepSeek fazer perguntas.

4. Preservar streaming
- Manter `stream: true` no DeepSeek.
- Continuar atualizando a bolha do assistente em tempo real conforme chegam os deltas.

5. Validação
- Verificar que a Edge Function ainda usa DeepSeek para mensagens sem imagem.
- Verificar que a resposta streaming continua sendo `text/event-stream` e que a regra anti-fallback foi aplicada no prompt efetivo.
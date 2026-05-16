Vou corrigir o gerador para interromper a saída no momento em que o assistente fizer perguntas ao usuário, mantendo streaming.

Plano:

1. Ajustar a Edge Function `deepseek-chat`
- Substituir o repasse direto do `response.body` por um stream intermediário controlado.
- Ler os deltas vindos do DeepSeek/Gemini, acumular o texto e detectar quando a resposta entrou em modo de coleta de informações.
- Assim que detectar uma seção de perguntas numeradas suficiente, encerrar o stream imediatamente para o usuário, sem deixar passar trechos como “enquanto isso”, “ideia geral”, “pré-planejamento” ou roteiro provisório.

2. Reforçar o prompt server-side
- Tornar a regra mais explícita: se fizer perguntas, o último caractere útil da resposta deve ser a última pergunta.
- Proibir qualquer conteúdo depois das perguntas, incluindo separadores `---`, pré-planejamento, estrutura criativa, formato, plataforma, duração, ganchos ou CTA.

3. Aplicar a mesma proteção nos dois fluxos
- Fluxo com imagem: Lovable AI Gateway/Gemini.
- Fluxo sem imagem: DeepSeek.
- Ambos continuarão retornando `text/event-stream` para preservar streaming.

4. Manter o frontend simples
- Não criar chamada automática extra.
- O campo de texto volta a liberar quando o stream encerra, permitindo que o usuário responda às perguntas manualmente.

Resultado esperado:
- O usuário envia um pedido incompleto.
- A IA responde apenas com perguntas.
- O stream para ali.
- Nenhuma resposta, roteiro ou “ideia geral” aparece antes do usuário responder.


## Plano: Adicionar upload de imagem no Gerador de Roteiros

### Resumo
Permitir que o usuário anexe uma imagem de produto ao chat para que a IA analise visualmente e crie roteiros UGC baseados no produto. Quando uma imagem é enviada, o backend usa um modelo com capacidade de visão (Gemini via Lovable AI Gateway) para analisar a imagem junto com o texto.

### Etapas

**1. Atualizar `GerarRoteiro.tsx` — UI de upload**
- Adicionar estado para imagem anexada (File + preview URL)
- Adicionar botão de anexar imagem (ícone de câmera/imagem) ao lado do textarea
- Mostrar preview da imagem anexada com botão de remover
- Ao enviar, converter imagem para base64 e incluir no payload
- Mostrar thumbnail da imagem na bolha de mensagem do usuário
- Atualizar interface `Message` para suportar campo opcional `image` (base64 string)

**2. Atualizar Edge Function `deepseek-chat`**
- Receber campo opcional `image` (base64) na última mensagem
- Quando imagem presente: usar Lovable AI Gateway com modelo Gemini (que suporta visão) em vez do DeepSeek
- Formatar mensagem com content parts: `[{ type: "image_url", image_url: { url: "data:image/..." } }, { type: "text", text: "..." }]`
- Quando sem imagem: manter fluxo atual com DeepSeek
- Manter o mesmo system prompt e streaming SSE

### Detalhes técnicos
- A imagem é convertida para base64 no frontend (máximo ~5MB para não sobrecarregar)
- O modelo Gemini (`google/gemini-2.5-flash`) suporta análise de imagens nativamente via formato OpenAI-compatible
- O `LOVABLE_API_KEY` já está configurado como secret
- Não são necessárias alterações de banco de dados
- O streaming SSE continua funcionando igual — apenas o provider muda quando há imagem


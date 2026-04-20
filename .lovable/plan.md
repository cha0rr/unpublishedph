

## Diagnóstico

O storyboard "repete a mesma cena com falas aleatórias" porque a API GeminiGen está recebendo o array de cenas no formato errado e tratando tudo como **um único prompt concatenado**.

Evidência (response_payload do registro mais recente):
```
input_text: "Cena1... | Cena2... | Cena3... | Cena4... | Cena5..."
status_percentage: 18  (modelo gerou tratando como 1 prompt longo)
```

Apesar disso, o campo `story_board_config` da resposta lista cada cena com `scene_index` correto — ou seja, a API **suporta** cenas independentes, mas espera o payload em outro formato. Hoje enviamos:

```ts
outForm.append('scenes', JSON.stringify(sanitizedScenes)); // ❌ string única
```

A API precisa receber o array como `story_board_config` (nome do campo que aparece no próprio response) e/ou em formato indexado.

## O que vou corrigir

### `supabase/functions/geminigen-video-storyboard/index.ts`

1. **Renomear o campo** de `scenes` para `story_board_config` (alinhado ao retorno da API).
2. **Testar dois formatos** em ordem de prioridade até a API aceitar corretamente:
   - **Formato A (preferido)**: indexado por cena
     ```
     story_board_config[0][prompt]=...
     story_board_config[0][duration]=6
     story_board_config[0][mode]=custom
     story_board_config[1][prompt]=...
     ```
   - **Formato B (fallback)**: múltiplos appends do mesmo nome com JSON por cena
     ```
     story_board_config=<json cena 1>
     story_board_config=<json cena 2>
     ```
3. **Logar o `input_text` retornado** após enviar — se vier com `|` concatenado de novo, sabemos que ainda está errado e tentamos o outro formato.
4. Manter o restante (validações, RLS, daily_limit, persistência em `image_generations`) intacto.

### Validação após o deploy
- Gerar storyboard de 3 cenas curtas e claramente distintas (ex: "praia ensolarada" / "floresta escura" / "deserto vermelho").
- Conferir no `response_payload` da tabela `image_generations`:
  - `input_text` deve listar cada cena separada (ou estar vazio com `story_board_config` populado corretamente)
  - vídeo final deve mostrar as 3 cenas distintas concatenadas

## Arquivos a alterar
- `supabase/functions/geminigen-video-storyboard/index.ts` (apenas a montagem do `FormData`)

## Pontos de atenção
- Não muda nada na UI nem nos limites (já estão corretos a 30s).
- Não altera o hook frontend — o problema é 100% no payload enviado ao GeminiGen.
- Se a API ainda concatenar com `|` mesmo após a correção, a próxima tentativa será enviar como JSON puro no body (`Content-Type: application/json`) em vez de `multipart/form-data`.


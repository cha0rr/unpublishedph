

## Validação de Campos de Entrada — Auditoria XSS e Input

### Diagnóstico

**1. XSS (Cross-Site Scripting) — OK**
O React escapa automaticamente todo conteúdo renderizado via JSX (`{variable}`). Nenhum componente de geração usa `dangerouslySetInnerHTML` com dados do usuário. O único uso de `dangerouslySetInnerHTML` está no `chart.tsx` (componente de UI library, sem input de usuário). Os prompts, mensagens de erro e URLs são todos renderizados de forma segura pelo React.

**2. Sanitização no Backend — OK (já implementada)**
As 3 Edge Functions já truncam o prompt a 2000 caracteres via `String(prompt).substring(0, MAX_PROMPT_LENGTH).trim()`. O backend está protegido.

**3. Validação no Frontend — AUSENTE**
Nenhum dos 4 componentes de input (`ImageGenerator`, `VideoGenerator`, `FrameVideoGenerator`, `BusinessStudioImages`) aplica `maxLength` nos campos `<Textarea>`. Um usuário pode digitar prompts de tamanho ilimitado no frontend, consumindo memória do navegador e enviando payloads grandes desnecessariamente (o backend trunca, mas o frontend deveria prevenir).

### Plano de Correção

Adicionar `maxLength={2000}` a todos os `<Textarea>` de prompt nos 4 componentes, e exibir um contador de caracteres para feedback visual:

| Arquivo | Alteração |
|---|---|
| `src/components/ImageGenerator.tsx` | `maxLength={2000}` + contador |
| `src/components/VideoGenerator.tsx` | `maxLength={2000}` + contador |
| `src/components/FrameVideoGenerator.tsx` | `maxLength={2000}` + contador |
| `src/pages/BusinessStudioImages.tsx` | `maxLength={2000}` + contador |

Cada textarea de prompt receberá:
- Atributo `maxLength={2000}` no `<Textarea>`
- Contador de caracteres abaixo do campo: `{prompt.length}/2000`
- Cor do contador muda para vermelho quando próximo do limite (>1800)

Adicionalmente, no `BusinessStudioImages`, o campo "URLs de referência" receberá `maxLength={2000}` e o campo "Referência UUID" receberá `maxLength={100}`.


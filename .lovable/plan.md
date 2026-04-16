

## Diagnóstico

Pelos logs de rede, a geração no Avatar Maker está usando o modelo **`nano-banana-pro`** (que é mapeado pela API GeminiGen para `gemini-3-pro-image-preview`). A API retorna status persistentemente em `status: 0/1` com `status_percentage: 1` por mais de 4 minutos sem progresso real. O servidor não está processando — o modelo Pro está com fila/lentidão extrema, enquanto o `nano-banana-2` (usado no Studio Images normal) processa em ~30 segundos normalmente.

A barra de progresso do cliente é **simulada** (tempo decorrido) e capa em 95% aguardando o servidor — daí a sensação de "travado em 95% infinitamente".

## Plano de Correção

**Arquivo: `src/components/AvatarMakerForm.tsx`**

1. Trocar o modelo padrão de `nano-banana-pro` → `nano-banana-2` na chamada `generate()` da função `handleGenerate` (linha 267).

**Arquivo: `src/components/SavedCharacterMode.tsx`**

2. Trocar também o modelo da geração no modo "Personagem Salva" para `nano-banana-2`, mantendo consistência.

### Por que `nano-banana-2` resolve
- É o modelo padrão usado no Studio Images, comprovadamente funcional.
- Geração tipicamente em 20-40 segundos vs >5 minutos do Pro.
- Aceita as mesmas referências `file_base64` para preservar consistência facial.

### Sem mudanças no backend
A Edge Function `geminigen-image` já aceita ambos os modelos.


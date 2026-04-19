---
name: Admin Daily Limits
description: Limites diários configuráveis via /admin/limites por plano e tipo de geração
type: feature
---
A página `/admin/limites` permite que administradores gerenciem limites diários de gerações sem editar código. A tabela `public.daily_limits` armazena chaves no formato `{tipo}_{plano}` — ex: `video_basico`, `video_pro`, `image_basico`, `image_pro` — com `limit_value` (int) e `enabled` (bool). Quando `enabled=false`, o limite é tratado como ilimitado para aquele plano. Admins (`has_role`) sempre ignoram qualquer limite. As edge functions `geminigen-video` e `geminigen-image` consultam a tabela em tempo de execução para aplicar o 429. O hook `useDailyGenerationCount` lê o mesmo registro para exibir o contador correto na UI conforme o plano do usuário. RLS: SELECT liberado para `authenticated` (necessário para o contador), INSERT/UPDATE/DELETE restritos a admin.

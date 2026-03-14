

# GeminiGen — Image & Video Generation System

## Pre-requisite: API Key Secret
The `GEMINIGEN_API_KEY` secret must be added to the project before the edge functions can work. I will use the `add_secret` tool to request it.

## Backend: 3 Supabase Edge Functions

### 1. `geminigen-image` (POST)
- Receives `{ prompt, aspect_ratio }` from frontend
- Proxies to `https://api.geminigen.ai/uapi/v1/generate_image` with `model: "nano-banana-2"` and the chosen `aspect_ratio`
- Uses `GEMINIGEN_API_KEY` server-side only
- Returns the API response (UUID for polling)

### 2. `geminigen-video` (POST)
- Receives `{ prompt, aspect_ratio }` from frontend
- Proxies to `https://api.geminigen.ai/uapi/v1/video-gen/veo` with `model: "veo-3.1-fast"` and `aspect_ratio`
- Returns UUID for polling

### 3. `geminigen-history` (POST)
- Receives `{ uuid }` from frontend
- Proxies to `https://api.geminigen.ai/uapi/v1/history/{uuid}`
- Returns generation status and output URL

All functions include CORS headers and `verify_jwt = false` in config.toml.

## Frontend

### New Files
- `src/hooks/useGenerator.ts` — shared hook for generate + poll logic
  - States: `idle` → `generating` → `polling` → `success` | `error`
  - Polls history every 3s until status 2 (success) or 3 (failed)
- `src/components/ImageGenerator.tsx` — prompt textarea, aspect ratio toggle (16:9 / 9:16), generate button, displays `<img>` on success
- `src/components/VideoGenerator.tsx` — same flow, displays `<video>` on success
- `src/pages/Index.tsx` — updated to show both generators in a tabbed layout

### Aspect Ratio Selection
- ToggleGroup with two options: "16:9" and "9:16", default "16:9"
- Sent as `aspect_ratio` field to edge functions, forwarded to the API
- Result display container adapts to the selected ratio

### Supabase Client
- Will create `src/integrations/supabase/client.ts` and `types.ts` since they don't exist yet
- Functions invoked via `supabase.functions.invoke()`


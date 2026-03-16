

## Plan: Unified Video Generator with Reference Mode Selector

### Overview
Consolidate the video generation page to support three reference modes (none, ingredient, frame) in a single unified UI, updating both the frontend component and the backend edge function.

### Changes

#### 1. Update `supabase/functions/geminigen-video/index.ts`
Currently accepts JSON body with optional `reference_image` base64. Rewrite to accept **FormData** and handle three modes:

- **Parse FormData** instead of JSON
- Read `mode_image` field: `"none"`, `"ingredient"`, or `"frame"`
- Read `files` field(s) for uploaded images
- When `mode_image = "ingredient"`: append `mode_image=ingredient` and one file to outgoing FormData
- When `mode_image = "frame"`: append `mode_image=frame`, first file as frame inicial, optional second file as frame final
- When `mode_image = "none"`: no image fields
- Log `mode_image` in `request_payload`

This replaces the need for a separate `geminigen-video-frame` function for this use case.

#### 2. Rewrite `src/components/VideoGenerator.tsx`
New unified UI with:

- **Mode selector** (ToggleGroup): `Sem referência` | `Ingrediente` | `Frame` — maps to none/ingredient/frame
- **Image upload area** (conditional):
  - `ingredient`: single image upload with preview
  - `frame`: two upload slots — "Frame Inicial" (required) + "Frame Final" (optional)
  - `none`: no upload area
- **Prompt textarea**, **aspect ratio** toggle (16:9 / 9:16), **resolution** toggle (720p / 1080p)
- **Generate button** — sends FormData directly to the edge function via fetch (not supabase.functions.invoke, since FormData with files)
- **Polling** — reuse existing `pollHistory` logic from `useGenerator` hook
- **Progress bar** and **video result** display (same as current)

#### 3. Update `src/hooks/useGenerator.ts`
Modify `generate` to accept an object with `mode_image`, `files`, `resolution` instead of positional params. Build FormData in the hook and POST directly to the edge function URL. Keep polling logic unchanged.

#### 4. No route changes needed
The page at `/gerar-video` already renders `<VideoGenerator />`. The `/gerar-video-frame` route can remain for backward compatibility.

### Visual design
- Same dark card with backdrop-blur, cyan glow on focus
- Mode selector styled as pill toggle group
- Upload areas use dashed border cards with hover highlight
- Consistent with existing PH Studio premium aesthetic


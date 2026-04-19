# Memory: index.md
Updated: now

# Project Memory

## Core
- **Tech Stack**: Supabase (Auth, RLS, Edge Functions in Deno).
- **Design**: Navy Blue (#03133F) & Cyan (#46C6F4). Tech aesthetic (pulsating grids, neon text, particles).
- **Auth Flow**: Registration sets status 'pending'. Manual activation required via WhatsApp by admin.
- **Security**: Do NOT use `await` in `onAuthStateChange`. Use RPC `update_own_profile` for profile updates. Prevent multi-tab access.
- **UX Rules**: 90s cooldown on generation (stored in localStorage) + beep on success. Max 4000 chars per prompt.
- **Business Logic**: Pro plan (R$ 69,90 1st mo) gates Studio Images, DeepSeek, Grok 3, and Avatar Maker. Basic is R$ 49,90.
- **API Limits**: Daily generation limits configurable via /admin/limites (table `daily_limits`, keys `video_basico|video_pro|image_basico|image_pro`). Admins ignore limits. Webhook requires MD5 + RSA signature validation.

## Memories
- [Backend Architecture](mem://tech/backend-architecture) — Supabase Edge functions and webhooks setup
- [Branding](mem://style/branding) — Color palette, logo, and TikTok glitch effects
- [Pricing Plans](mem://business/pricing-plans) — Subscription tiers, pricing, and feature gating
- [Registration Flow](mem://auth/registration-flow) — Pending status and WhatsApp manual activation
- [Feedback Patterns](mem://ui/feedback-patterns) — Generation progress, cooldowns, and audio feedback
- [Admin Roles](mem://tech/admin-roles) — Role management via public.user_roles and SQL
- [Visual Effects](mem://style/visual-effects) — Pulsating grid, floating particles, and scan-lines
- [Auth Implementation](mem://tech/auth-implementation) — Non-blocking onAuthStateChange callbacks
- [Navigation Layout](mem://ui/navigation-layout) — Navbar active states and outline/filled button variants
- [Hero Video Demo](mem://style/hero-video-demo) — 9:16 vertical video showcase and glass effect player
- [Showcase Videos](mem://features/showcase-videos) — 3D interactive carousel using Framer Motion
- [Webhook Validation](mem://tech/security/webhook-validation) — Manual MD5 and RSA signature verification for GeminiGen
- [Client Polling](mem://tech/security/client-polling) — Using user session tokens for authorized polling
- [Admin User Management](mem://tech/admin-user-management) — Hard deletes and subscription expiration handling
- [Polling Logic](mem://tech/polling-logic) — Resilience, retries, and session refresh strategies
- [Access Control](mem://tech/security/access-control) — RLS, Edge Function restrictions, and prompt sanitization
- [Video Generation](mem://features/video-generation) — Veo and Grok 3 models, constraints, and modes
- [Tab Protection](mem://tech/security/tab-protection) — Blocking simultaneous multi-tab access via BroadcastChannel
- [Footer Layout](mem://ui/footer-layout) — Minimalist footer with only YouTube and WhatsApp links
- [Privilege Escalation](mem://tech/security/privilege-escalation) — Restricted updates via update_own_profile RPC
- [Rate Limiting](mem://tech/security/rate-limiting) — IP limits on registration and UI cooldowns
- [Input Validation](mem://ui/input-validation) — 4000 char limit on prompts and visual warnings
- [Video Extension](mem://features/video-extension) — UUID continuity, proxy bypass, and ffmpeg.wasm merging
- [Product Positioning](mem://business/product-positioning) — Target audience (TikTok creators) and specific niches
- [Financial Dashboard](mem://tech/admin-financial-dashboard) — Cost calculations and credit consumption rules
- [Image References](mem://tech/storage/image-references-implementation) — Base64 uploads and prompt citation normalization
- [Studio Images](mem://features/image-generation/studio-images-capabilities) — Multi-image references, models, and UI flow
- [GeminiGen API](mem://tech/api/geminigen-integration) — Endpoints, orientation mapping, and request formatting
- [Script & Prompt Generator](mem://features/script-prompt-generator) — DeepSeek Chat, image analysis, and local history
- [User History](mem://features/user-history) — Media organization and video extension entry points
- [Video Playback](mem://ui/video-playback-interaction) — Auto-loop vs hover-play behaviors by context
- [Video Generator State](mem://tech/video-generator-persistence) — LocalStorage persistence and cache clearing rules
- [Error Handling](mem://ui/error-handling) — Extracting API details and identifying policy violations
- [Avatar Maker](mem://features/avatar-maker) — Nano-banana-2 digital influencer creation and constraints
- [Pricing Display](mem://style/pricing-display) — Promotional price highlighting and strikethrough effects
- [Admin Daily Limits](mem://tech/admin-daily-limits) — Configurable per-plan daily generation limits via /admin/limites



## Security Audit Results

### Critical Vulnerabilities Found

**1. `geminigen-video` — NO authentication**
Anyone can call this edge function without being logged in. No JWT validation, no user/plan check. Any person with the Supabase URL can generate videos using your API credits.

**2. `geminigen-video-frame` — NO authentication**
Same issue. Completely open. No auth header check, no profile/plan verification.

**3. `geminigen-history` — NO authentication**
Anyone can poll the status of any generation UUID without being logged in. Exposes generation data.

**4. `useGenerator.ts` (video polling) — Uses anon key instead of user token**
Line 83: `Authorization: Bearer ${SUPABASE_KEY}` sends the public anon key as auth. This means the history endpoint can't identify who is calling. Should use the user's session token.

**5. `geminigen-webhook` — No signature validation**
Anyone can send fake webhook payloads. Lower priority since it only logs data currently.

### What's Already Secure
- `geminigen-image` — Has full JWT + plan validation
- `geminigen-image-history` — Has full JWT + plan validation
- `register` — Public by design (creates pending accounts)
- Frontend pages — All have proper auth guards with redirects
- RLS policies — Properly configured on all tables

---

### Plan

#### 1. Secure `geminigen-video` edge function
Add JWT validation via `getClaims()`, check user profile status is `approved` or user is admin. Same pattern as `geminigen-image`.

#### 2. Secure `geminigen-video-frame` edge function
Same auth pattern: validate JWT, check approved profile or admin role.

#### 3. Secure `geminigen-history` edge function
Add JWT validation. Verify user is authenticated and has an approved profile or admin role before proxying the API call.

#### 4. Fix `useGenerator.ts` to use user session token
Replace `Authorization: Bearer ${SUPABASE_KEY}` with the user's actual access token from `supabase.auth.getSession()`.

#### 5. Update `supabase/config.toml`
All functions already have `verify_jwt = false` (correct, since we validate in code).

### Files to modify
- `supabase/functions/geminigen-video/index.ts` — Add full auth
- `supabase/functions/geminigen-video-frame/index.ts` — Add full auth
- `supabase/functions/geminigen-history/index.ts` — Add full auth
- `src/hooks/useGenerator.ts` — Use session token instead of anon key


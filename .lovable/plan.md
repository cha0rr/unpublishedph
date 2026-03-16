

## Plan: Update `geminigen-webhook` with Public Key Signature Validation

### What changes

**`supabase/functions/geminigen-webhook/index.ts`** — Full rewrite:

1. **POST-only**: Reject non-POST/non-OPTIONS with 405.
2. **Read raw body** via `req.text()` and **read `x-signature`** header (base64-encoded).
3. **Import PEM public key** from `GEMINIGEN_PUBLIC_KEY_PEM` env var using Web Crypto API (`crypto.subtle.importKey` with RSASSA-PKCS1-v1_5 + SHA-256).
4. **Verify signature** with `crypto.subtle.verify` against the raw body bytes.
5. **Reject 401** if signature missing, key missing, or verification fails.
6. **Process payload** only after validation — parse JSON, log `event` and `uuid` fields.
7. **Return 200** on success.

### Secret needed

The function reads `GEMINIGEN_PUBLIC_KEY_PEM` from environment. This secret needs to be added to the project if not already present. I'll check and request it.

### No other files changed


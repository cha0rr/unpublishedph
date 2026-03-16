

## Plan: Fix Webhook Signature Verification to Match GeminiGen's Algorithm

The current implementation has two critical mismatches with GeminiGen's actual signing process:

### Problems

1. **Missing MD5 hash step**: GeminiGen signs the **MD5 hash** of the body, not the raw body. The reference code does `createHash('md5').update(data).digest('hex')` before verifying.
2. **Wrong signature encoding**: The signature is **hex-encoded**, not base64. The reference uses `Buffer.from(signature, 'hex')`, but our code uses `atob()` (base64).

### Changes to `supabase/functions/geminigen-webhook/index.ts`

1. **Add MD5 hashing**: Before verification, compute `MD5(rawBody)` as a hex string, then use that hex string as the data to verify against.
2. **Decode signature from hex** instead of base64.
3. **Update the secret** `GEMINIGEN_PUBLIC_KEY_PEM` with the uploaded public key content.

### Flow after fix

```text
rawBody → MD5 hex hash → verify(RSA-SHA256, publicKey, hexSignature, md5Hash)
```

No other files change.


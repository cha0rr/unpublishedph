#!/usr/bin/env bun
/**
 * snapgen-extract — CLI que extrai o JWT da sessão logada do snapgen.ai
 * a partir do Chrome em modo debug e imprime no terminal.
 *
 * Uso:
 *   1. Abra o Chrome com --remote-debugging-port=9222
 *   2. Logue em https://snapgen.ai/app/video-gen/veo
 *   3. Rode `bun run snapgen:extract` (ou `bun run src/extract.ts`)
 *   4. Copie a linha que começa com "eyJ..." e cole em /admin/snapgen
 */

import CDP from "chrome-remote-interface";
import { extractToken } from "./extractToken.ts";

const CHROME_DEBUG_URL = process.env.CHROME_DEBUG_URL || "http://127.0.0.1:9222";
const SNAPGEN_URL = process.env.SNAPGEN_URL || "https://snapgen.ai/app/video-gen/veo";

async function main() {
  let client: any;
  try {
    const targets = await CDP.List({ host: CHROME_DEBUG_URL });
    const existing = targets.find(
      (t: any) => t.type === "page" && typeof t.url === "string" && /snapgen\.ai/.test(t.url),
    );
    const target = existing ?? (await CDP.New({ host: CHROME_DEBUG_URL, url: SNAPGEN_URL }));
    client = await CDP({ target: typeof target === "string" ? target : target.id });
    await client.Network.enable();
    await client.Runtime.enable();
    await client.Page.enable();

    const onTarget = await client.Runtime.evaluate({
      expression: "location.href",
      returnByValue: true,
    });
    const href: string = onTarget?.result?.value || "";
    if (!/snapgen\.ai/.test(href)) {
      await client.Page.navigate({ url: SNAPGEN_URL });
      await new Promise((r) => setTimeout(r, 1500));
    }
  } catch (err: any) {
    process.stderr.write(
      `\n[ERRO] Não foi possível conectar ao Chrome em ${CHROME_DEBUG_URL}.\n` +
        `Verifique se ele foi iniciado com --remote-debugging-port=9222.\n` +
        `Detalhe: ${err?.message || err}\n\n` +
        `Como iniciar o Chrome (PowerShell):\n` +
        `  chrome.exe --remote-debugging-port=9222 --remote-allow-origins=* ` +
        `--user-data-dir=$env:USERPROFILE\\.snapgen-bridge\n\n`,
    );
    process.exit(2);
  }

  try {
    const start = Date.now();
    const TIMEOUT_MS = 8000;
    let extracted = null as Awaited<ReturnType<typeof extractToken>>;
    while (Date.now() - start < TIMEOUT_MS) {
      extracted = await extractToken(client, SNAPGEN_URL);
      if (extracted) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    if (!extracted) {
      process.stderr.write(
        `\n[ERRO] Sessão do snapgen.ai não encontrada no Chrome.\n` +
          `Abra https://snapgen.ai/app/video-gen/veo nesse Chrome e faça login.\n\n`,
      );
      process.exit(3);
    }

    // Metadados em stderr
    const expIso = extracted.expiresAt > 0
      ? new Date(extracted.expiresAt).toISOString()
      : "(desconhecido)";
    const expired = extracted.expiresAt > 0 && extracted.expiresAt < Date.now();
    process.stderr.write(
      `\nsource: ${extracted.source}\n` +
        `expires_at: ${expIso}${expired ? "  ⚠ EXPIRADO" : ""}\n` +
        `length: ${extracted.token.length}\n\n` +
        `Copie a linha abaixo (eyJ...) e cole em /admin/snapgen no app:\n\n`,
    );

    // Token puro no stdout (fácil de copiar)
    process.stdout.write(extracted.token + "\n");
    process.exit(expired ? 4 : 0);
  } finally {
    try {
      if (typeof (client as any).close === "function") await (client as any).close();
    } catch { /* ignore */ }
  }
}

main();

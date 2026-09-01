#!/usr/bin/env bun
/**
 * snapgen-extract — CLI que extrai o JWT da sessão logada do snapgen.ai
 * a partir do Chrome em modo debug e imprime no terminal.
 *
 * Uso:
 *   1. Abra o Chrome com --remote-debugging-port=9222 (use start-chrome.cmd/ps1)
 *   2. Logue em https://snapgen.ai/app/video-gen/veo
 *   3. Rode `bun run snapgen:extract`
 *   4. Copie a linha que começa com "eyJ..." e cole em /admin/snapgen
 */

import CDP from "chrome-remote-interface";
import { extractToken } from "./extractToken.ts";
import { diagnose } from "./diagnose.ts";

const CHROME_DEBUG_URL = process.env.CHROME_DEBUG_URL || "http://127.0.0.1:9222";
const SNAPGEN_URL = process.env.SNAPGEN_URL || "https://snapgen.ai/app/video-gen/veo";

function logErr(msg: string) {
  process.stderr.write(`\n[ERRO] ${msg}\n\n`);
}

function logInfo(msg: string) {
  process.stderr.write(`\n[info] ${msg}\n`);
}

async function main() {
  // 1) Diagnóstico de conexão HTTP/TCP
  const diag = await diagnose(CHROME_DEBUG_URL);
  if (diag.kind === "unreachable") {
    logErr(
      `Não foi possível conectar ao Chrome em ${CHROME_DEBUG_URL}.\n` +
        `  ${diag.hint}\n`,
    );
    process.exit(2);
  }
  if (diag.kind === "no-http") {
    logErr(
      `A porta 9222 está aberta, mas o HTTP do Chrome não respondeu.\n` +
        `  Detalhe: ${diag.httpError}\n` +
        `  → Outra coisa está usando a porta 9222. Rode: netstat -ano | findstr :9222\n` +
        `  → Ou o Chrome foi iniciado sem --remote-debugging-port.\n`,
    );
    process.exit(2);
  }
  if (diag.kind === "http-ok-no-websocket") {
    logErr(`${diag.hint}`);
    process.exit(2);
  }

  logInfo(
    `Chrome OK — ${diag.tabs} aba(s), ${diag.snapgenTabs} do snapgen.ai. Conectando via WebSocket...`,
  );

  // 2) Conecta via CDP (WebSocket) na primeira tab do snapgen.ai
  let client: any;
  let snapgenTargetId: string | null = null;
  try {
    // Parse "http://127.0.0.1:9222" → { local: true, host: "127.0.0.1", port: 9222 }
    const u = new URL(CHROME_DEBUG_URL);
    const cdpOpts = { local: true, host: u.hostname, port: u.port } as any;

    const targets = await CDP.List(cdpOpts);
    const snapgenTarget = targets.find(
      (t: any) =>
        t.type === "page" &&
        typeof t.url === "string" &&
        /snapgen\.ai/.test(t.url),
    );
    if (!snapgenTarget) {
      logErr(
        `Nenhuma tab do snapgen.ai encontrada (HTTP listou ${diag.snapgenTabs} mas CDP.List() não retornou). ` +
          `Tente abrir a aba de novo e rodar o script.`,
      );
      process.exit(2);
    }
    snapgenTargetId = snapgenTarget.id;
    client = await CDP({ ...cdpOpts, target: snapgenTargetId });
    await client.Network.enable().catch(() => {});
    await client.Runtime.enable();
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (/websocket|ws:|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH/i.test(msg)) {
      logErr(
        `HTTP do Chrome funciona, mas o WebSocket (CDP) falhou.\n` +
          `  Detalhe: ${msg}\n` +
          `  → Pode ser firewall, antivírus, ou VPN bloqueando conexões localhost.\n` +
          `  → Tente desativar temporariamente o antivírus e rodar de novo.\n` +
          `  → Ou tente usar a porta 9333 (mude CHROME_DEBUG_URL=http://127.0.0.1:9333 ` +
          `tanto no start-chrome.cmd quanto no extract).\n`,
      );
    } else {
      logErr(`Falha ao conectar no Chrome via CDP: ${msg}`);
    }
    process.exit(2);
  }

  try {
    // 3) Confirma que estamos no snapgen.ai
    let onSnapgen = false;
    try {
      const r = await client.Runtime.evaluate({
        expression: "location.href",
        returnByValue: true,
      });
      const href: string = r?.result?.value || "";
      onSnapgen = /snapgen\.ai/.test(href);
    } catch { /* ignore */ }

    if (!onSnapgen) {
      try {
        await client.Page.enable();
        await client.Page.navigate({ url: SNAPGEN_URL });
        await new Promise((r) => setTimeout(r, 2500));
      } catch { /* ignore */ }
    }

    // 4) Tenta extrair
    const start = Date.now();
    const TIMEOUT_MS = 10_000;
    let extracted: Awaited<ReturnType<typeof extractToken>> | null = null;
    while (Date.now() - start < TIMEOUT_MS) {
      try {
        extracted = await extractToken(client, SNAPGEN_URL);
      } catch { /* tenta de novo */ }
      if (extracted) break;
      await new Promise((r) => setTimeout(r, 600));
    }
    if (!extracted) {
      logErr(
        `Chrome está conectado, mas nenhum JWT foi encontrado em até ${TIMEOUT_MS / 1000}s.\n` +
          `  → Verifique que você está LOGADO no snapgen.ai (não só com a aba aberta).\n` +
          `  → A aba precisa estar em snapgen.ai (qualquer página, desde que logado).\n` +
          `  → Se a sessão estiver em outro domínio, abra o snapgen.ai e faça login de novo.\n`,
      );
      process.exit(3);
    }

    // 5) Sucesso — imprime
    const expIso = extracted.expiresAt > 0
      ? new Date(extracted.expiresAt).toISOString()
      : "(desconhecido)";
    const expired = extracted.expiresAt > 0 && extracted.expiresAt < Date.now();
    const guardLine = extracted.guardStableId
      ? `guard_stable_id: ${extracted.guardStableId}\n`
      : "";
    process.stderr.write(
      `\nsource: ${extracted.source}\n` +
        `expires_at: ${expIso}${expired ? "  ⚠ EXPIRADO" : ""}\n` +
        `length: ${extracted.token.length}\n` +
        (extracted.guardStableId ? `guard_stable_id: ${extracted.guardStableId}  (encontrado)\n` : `guard_stable_id: NÃO ENCONTRADO (a geração vai falhar com "Invalid guard")\n`) +
        `\n` +
        `Copie TUDO abaixo (eyJ... e a linha guard_stable_id:) e cole em /admin/snapgen no app:\n\n`,
    );
    process.stdout.write(extracted.token + "\n" + guardLine);
    process.exit(expired ? 4 : 0);
  } finally {
    try {
      if (client && typeof client.close === "function") await client.close();
    } catch { /* ignore */ }
  }
}

main().catch((err) => {
  logErr(`Erro inesperado: ${err?.message || err}`);
  process.exit(99);
});

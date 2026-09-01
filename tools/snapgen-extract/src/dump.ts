/**
 * Modo debug: dump de TUDO que conseguimos ler do Chrome sobre o snapgen.ai
 * - Todas as chaves do localStorage e sessionStorage
 * - Todos os cookies do domínio
 * - Content das páginas (pode ajudar a ver se login está OK)
 *
 * Use: bun run snapgen:dump
 */

import CDP from "chrome-remote-interface";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const CHROME_DEBUG_URL = process.env.CHROME_DEBUG_URL || "http://127.0.0.1:9222";
const SNAPGEN_HOST = "snapgen.ai";

async function main() {
  // 1) HTTP funciona?
  let list: any[] = [];
  try {
    const res = await fetch(`${CHROME_DEBUG_URL}/json/list`);
    list = await res.json();
  } catch (err: any) {
    process.stderr.write(`[ERRO] Chrome não está respondendo em ${CHROME_DEBUG_URL}.\n`);
    process.stderr.write(`  Detalhe: ${err?.message || err}\n`);
    process.exit(2);
  }
  const snapgenTabs = list.filter((t: any) => typeof t?.url === "string" && /snapgen\.ai/.test(t.url));
  process.stdout.write(`\n=== Abas abertas no Chrome ===\n`);
  process.stdout.write(`Total: ${list.length}, do snapgen.ai: ${snapgenTabs.length}\n`);
  for (const t of snapgenTabs) {
    process.stdout.write(`  - ${t.url}  (id=${t.id})\n`);
  }
  if (snapgenTabs.length === 0) {
    process.stdout.write(`\nNenhuma aba do snapgen.ai aberta. Abra https://snapgen.ai/app/video-gen/veo e faça login.\n`);
    process.exit(0);
  }

  // 2) Conecta na primeira aba
  const u = new URL(CHROME_DEBUG_URL);
  const cdpOpts = { local: true, host: u.hostname, port: u.port } as any;
  const target = snapgenTabs[0];
  let client: any;
  try {
    client = await CDP({ ...cdpOpts, target: target.id });
    await client.Runtime.enable();
    await client.Network.enable();
    await client.Page.enable();
  } catch (err: any) {
    process.stderr.write(`[ERRO] Falha ao conectar via CDP: ${err?.message || err}\n`);
    process.exit(2);
  }

  try {
    // 3) URL atual
    const urlRes = await client.Runtime.evaluate({ expression: "location.href", returnByValue: true });
    process.stdout.write(`\n=== Página atual ===\n${urlRes?.result?.value}\n`);

    // 4) Title
    const titleRes = await client.Runtime.evaluate({ expression: "document.title", returnByValue: true });
    process.stdout.write(`Title: ${titleRes?.result?.value}\n`);

    // 5) localStorage (completo, sem truncar — é onde geralmente está o authStore com o token)
    const ls = await client.Runtime.evaluate({
      expression: `(() => { const o = {}; for (let i=0; i<localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; })()`,
      returnByValue: true,
    });
    process.stdout.write(`\n=== localStorage (${Object.keys(ls?.result?.value || {}).length} chaves, COMPLETO) ===\n`);
    for (const [k, v] of Object.entries(ls?.result?.value || {})) {
      const vStr = String(v);
      // Procura JWT dentro do valor
      const jwtMatch = vStr.match(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/);
      const tag = jwtMatch ? `  ← JWT encontrado aqui! (eyJ...${jwtMatch[0].slice(-20)})` : "";
      process.stdout.write(`  ${k} = ${vStr}${tag}\n`);
    }

    // 6) sessionStorage
    const ss = await client.Runtime.evaluate({
      expression: `(() => { const o = {}; for (let i=0; i<sessionStorage.length; i++) { const k = sessionStorage.key(i); o[k] = sessionStorage.getItem(k); } return o; })()`,
      returnByValue: true,
    });
    process.stdout.write(`\n=== sessionStorage (${Object.keys(ss?.result?.value || {}).length} chaves, COMPLETO) ===\n`);
    for (const [k, v] of Object.entries(ss?.result?.value || {})) {
      const vStr = String(v);
      const jwtMatch = vStr.match(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/);
      const tag = jwtMatch ? `  ← JWT encontrado aqui!` : "";
      process.stdout.write(`  ${k} = ${vStr}${tag}\n`);
    }

    // 7) document.cookie
    const docCookie = await client.Runtime.evaluate({ expression: "document.cookie", returnByValue: true });
    process.stdout.write(`\n=== document.cookie (sem httpOnly) ===\n${docCookie?.result?.value || "(vazio)"}\n`);

    // 8) Cookies via CDP — pedir explicitamente para snapgen.ai E api.snapgen.ai
    let allCookies: any[] = [];
    for (const url of [
      "https://snapgen.ai/",
      "https://api.snapgen.ai/",
      "https://app.snapgen.ai/",
      "https://www.snapgen.ai/",
    ]) {
      try {
        const r = await client.Network.getCookies({ urls: [url] });
        if (Array.isArray(r?.cookies)) allCookies.push(...r.cookies);
      } catch { /* ignore */ }
    }
    // Dedup
    const seen = new Set<string>();
    const cookies = allCookies.filter((c: any) => {
      const k = `${c.name}@${c.domain}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const snapgenCookies = cookies.filter((c: any) => {
      const d = String(c.domain || "");
      return d.includes("snapgen.ai") || SNAPGEN_HOST.includes(d.replace(/^\./, ""));
    });
    process.stdout.write(`\n=== Cookies via CDP (${snapgenCookies.length} únicos do snapgen.ai, INCLUINDO httpOnly) ===\n`);
    for (const c of snapgenCookies) {
      const v = String(c.value);
      const jwtMatch = v.match(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/);
      const tag = jwtMatch ? `  ← JWT!` : "";
      process.stdout.write(`  ${c.name} (${c.domain}, ${c.httpOnly ? "httpOnly" : "js-accessible"}, ${c.secure ? "secure" : ""}, path=${c.path}) = ${v.length > 200 ? v.slice(0, 200) + "..." : v}${tag}\n`);
    }

    // 9) Detecta se está logado (heurística: procura "logout", "sign out", "minha conta" no HTML)
    const html = await client.Runtime.evaluate({
      expression: "document.body ? document.body.innerText.slice(0, 500) : ''",
      returnByValue: true,
    });
    const bodyText: string = html?.result?.value || "";
    const looksLogged = /logout|sign out|sair|minha conta|account|generations|credits/i.test(bodyText);
    process.stdout.write(`\n=== Indicador de login ===\n${looksLogged ? "✓ Parece estar logado (encontrou 'logout'/'account'/etc no body)" : "✗ NÃO parece estar logado"}\n`);
    if (bodyText) {
      process.stdout.write(`(primeiros 500 chars do body):\n  ${bodyText.replace(/\s+/g, " ").trim()}\n`);
    }

    process.stdout.write(`\n=== Dica ===\n`);
    process.stdout.write(`Procure acima por uma linha com "eyJ..." (formato de JWT).\n`);
    process.stdout.write(`Se não encontrar nenhum eyJ, o token está em outro lugar — me mande esta saída.\n`);
  } finally {
    try { if (client) await client.close(); } catch { /* ignore */ }
  }
}

main().catch((err) => {
  process.stderr.write(`[ERRO] ${err?.message || err}\n`);
  process.exit(99);
});

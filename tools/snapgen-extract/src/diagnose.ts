/**
 * Diagnóstico de conexão com o Chrome em modo debug.
 * Distingue entre:
 *   - Chrome não está rodando
 *   - Chrome está rodando mas sem --remote-debugging-port
 *   - Porta ocupada por outro processo
 *   - HTTP funciona mas WebSocket não
 */

export type DiagnoseResult =
  | { kind: "ok"; tabs: number; snapgenTabs: number }
  | { kind: "no-http"; httpError: string }
  | { kind: "http-ok-no-websocket"; hint: string }
  | { kind: "unreachable"; hint: string };

export async function diagnose(debugUrl: string): Promise<DiagnoseResult> {
  const u = new URL(debugUrl);

  // 1) Verifica se a porta está respondendo em TCP (mais barato que HTTP)
  let tcpOk = false;
  let tcpErr = "";
  try {
    await new Promise<void>((resolve, reject) => {
      const net = require("net") as typeof import("net");
      const sock = new net.Socket();
      const onErr = (e: Error) => { sock.destroy(); reject(e); };
      sock.setTimeout(3000);
      sock.once("timeout", () => onErr(new Error("TCP timeout (3s)")));
      sock.once("error", onErr);
      sock.connect(u.port, u.hostname === "localhost" ? "127.0.0.1" : u.hostname, () => {
        sock.end();
        resolve();
      });
    });
    tcpOk = true;
  } catch (err: any) {
    tcpErr = err?.message || String(err);
  }
  if (!tcpOk) {
    return {
      kind: "unreachable",
      hint:
        `Nada está escutando em ${debugUrl}.\n` +
        `  → O Chrome foi fechado, ou nunca foi iniciado com a flag --remote-debugging-port.\n` +
        `  → Para iniciar: rode tools/snapgen-extract/start-chrome.cmd (ou .ps1) e faça login no snapgen.ai.\n` +
        `  → Erro técnico: ${tcpErr}`,
    };
  }

  // 2) HTTP funciona?
  let httpData: { tabs: number; snapgenTabs: number } | null = null;
  let httpErr = "";
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${debugUrl}/json/list`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) {
      httpErr = `HTTP ${res.status}`;
    } else {
      const list = (await res.json()) as any[];
      httpData = {
        tabs: Array.isArray(list) ? list.length : 0,
        snapgenTabs: Array.isArray(list)
          ? list.filter((t: any) => typeof t?.url === "string" && /snapgen\.ai/.test(t.url)).length
          : 0,
      };
    }
  } catch (err: any) {
    httpErr = err?.message || String(err);
  }
  if (!httpData) {
    return {
      kind: "no-http",
      httpError: httpErr,
    };
  }
  if (httpData.tabs === 0) {
    return {
      kind: "http-ok-no-websocket",
      hint:
        `Chrome responde HTTP mas está sem abas. ` +
        `Abra https://snapgen.ai/app/video-gen/veo nele e tente de novo.`,
    };
  }
  if (httpData.snapgenTabs === 0) {
    return {
      kind: "http-ok-no-websocket",
      hint:
        `Chrome tem ${httpData.tabs} aba(s) aberta(s), mas nenhuma do snapgen.ai. ` +
        `Abra https://snapgen.ai/app/video-gen/veo nesse Chrome e faça login.`,
    };
  }
  return { kind: "ok", tabs: httpData.tabs, snapgenTabs: httpData.snapgenTabs };
}

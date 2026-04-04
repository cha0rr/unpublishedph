import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(onProgress?: (msg: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;

  onProgress?.("Carregando motor de vídeo...");
  const ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

async function downloadSegment(url: string): Promise<Uint8Array> {
  // Try direct fetch first
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buffer = await resp.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (directErr) {
    console.warn("Direct fetch failed, trying with no-cache:", directErr);
  }

  // Retry with cache bypass
  try {
    const separator = url.includes("?") ? "&" : "?";
    const cacheBustUrl = `${url}${separator}_t=${Date.now()}`;
    const resp = await fetch(cacheBustUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const buffer = await resp.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (retryErr) {
    throw new Error(
      `Não foi possível baixar o segmento de vídeo. Isso pode ser causado por restrições de CORS do servidor. URL: ${url.substring(0, 80)}...`
    );
  }
}

export async function mergeVideoSegments(
  segmentUrls: string[],
  onProgress?: (msg: string) => void
): Promise<Blob> {
  if (segmentUrls.length === 0) throw new Error("Nenhum segmento para unificar.");
  if (segmentUrls.length === 1) {
    const data = await downloadSegment(segmentUrls[0]);
    return new Blob([data.buffer as ArrayBuffer], { type: "video/mp4" });
  }

  // Download all segments FIRST (before loading ffmpeg) to fail fast on CORS
  const segmentData: Uint8Array[] = [];
  for (let i = 0; i < segmentUrls.length; i++) {
    onProgress?.(`Baixando parte ${i + 1}/${segmentUrls.length}...`);
    segmentData.push(await downloadSegment(segmentUrls[i]));
  }

  // Now load ffmpeg
  const ffmpeg = await getFFmpeg(onProgress);

  // Write downloaded data to virtual FS
  for (let i = 0; i < segmentData.length; i++) {
    await ffmpeg.writeFile(`seg${i}.mp4`, segmentData[i]);
  }

  // Build concat list
  const concatList = segmentUrls.map((_, i) => `file 'seg${i}.mp4'`).join("\n");
  await ffmpeg.writeFile("list.txt", concatList);

  onProgress?.("Unificando vídeos...");
  await ffmpeg.exec([
    "-f", "concat",
    "-safe", "0",
    "-i", "list.txt",
    "-c", "copy",
    "output.mp4",
  ]);

  const output = await ffmpeg.readFile("output.mp4") as Uint8Array;

  // Cleanup
  for (let i = 0; i < segmentData.length; i++) {
    await ffmpeg.deleteFile(`seg${i}.mp4`);
  }
  await ffmpeg.deleteFile("list.txt");
  await ffmpeg.deleteFile("output.mp4");

  return new Blob([output.buffer as ArrayBuffer], { type: "video/mp4" });
}

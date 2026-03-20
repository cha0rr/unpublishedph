import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";

let ffmpegInstance: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

/**
 * Fetches a video, using the edge function proxy if direct fetch fails (CORS).
 */
async function fetchVideoBytes(
  url: string,
  accessToken: string
): Promise<Uint8Array> {
  // Try direct fetch first
  try {
    const res = await fetch(url);
    if (res.ok) {
      return new Uint8Array(await res.arrayBuffer());
    }
  } catch {
    // CORS or network error — fall through to proxy
  }

  // Use proxy via edge function
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const proxyUrl = `${SUPABASE_URL}/functions/v1/geminigen-video-extend?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) throw new Error(`Proxy fetch failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function concatVideos(
  originalUrl: string,
  extensionUrl: string,
  accessToken: string,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  onProgress?.("Carregando ffmpeg...");
  const ffmpeg = await getFFmpeg();

  onProgress?.("Baixando vídeo original...");
  const originalData = await fetchVideoBytes(originalUrl, accessToken);

  onProgress?.("Baixando continuação...");
  const extensionData = await fetchVideoBytes(extensionUrl, accessToken);

  await ffmpeg.writeFile("original.mp4", originalData);
  await ffmpeg.writeFile("extension.mp4", extensionData);

  // Create concat list
  await ffmpeg.writeFile(
    "list.txt",
    new TextEncoder().encode("file 'original.mp4'\nfile 'extension.mp4'\n")
  );

  onProgress?.("Concatenando vídeos...");
  await ffmpeg.exec([
    "-f", "concat",
    "-safe", "0",
    "-i", "list.txt",
    "-c", "copy",
    "-movflags", "+faststart",
    "output.mp4",
  ]);

  const output = await ffmpeg.readFile("output.mp4");
  const blob = new Blob([output], { type: "video/mp4" });

  // Cleanup
  await ffmpeg.deleteFile("original.mp4");
  await ffmpeg.deleteFile("extension.mp4");
  await ffmpeg.deleteFile("list.txt");
  await ffmpeg.deleteFile("output.mp4");

  return blob;
}

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

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

export async function mergeVideoSegments(
  segmentUrls: string[],
  onProgress?: (msg: string) => void
): Promise<Blob> {
  if (segmentUrls.length === 0) throw new Error("Nenhum segmento para unificar.");
  if (segmentUrls.length === 1) {
    const resp = await fetch(segmentUrls[0]);
    if (!resp.ok) throw new Error("Falha ao baixar o vídeo.");
    return resp.blob();
  }

  const ffmpeg = await getFFmpeg(onProgress);

  // Download all segments
  for (let i = 0; i < segmentUrls.length; i++) {
    onProgress?.(`Baixando parte ${i + 1}/${segmentUrls.length}...`);
    const data = await fetchFile(segmentUrls[i]);
    await ffmpeg.writeFile(`seg${i}.mp4`, data);
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
  for (let i = 0; i < segmentUrls.length; i++) {
    await ffmpeg.deleteFile(`seg${i}.mp4`);
  }
  await ffmpeg.deleteFile("list.txt");
  await ffmpeg.deleteFile("output.mp4");

  return new Blob([output], { type: "video/mp4" });
}

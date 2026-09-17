import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
  canEncodeAudio,
  canEncodeVideo,
} from "mediabunny";
import { getClip } from "@/remotion/catalog";
import { hitsFor } from "@/remotion/shared/sfx-hits";
import { FPS, STAGE, type AnimParams } from "@/remotion/shared/theme";
import { drawFrame, preloadIcons, totalDuration } from "@/lib/draw-stage";

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = STAGE.width;
  canvas.height = STAGE.height;
  const ctx =
    canvas.getContext("2d", { alpha: false }) ?? canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");
  ctx.fillStyle = "#f3ecdc";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

async function pickCodec(): Promise<"avc" | "hevc"> {
  if (await canEncodeVideo("avc", { width: STAGE.width, height: STAGE.height })) {
    return "avc";
  }
  if (await canEncodeVideo("hevc", { width: STAGE.width, height: STAGE.height })) {
    return "hevc";
  }
  throw new Error("当前浏览器不能编码 H.264，请用 Chrome 导出");
}

async function mixSfx(clipId: string, staggerMs: number, durationSec: number): Promise<AudioBuffer | null> {
  const staggerFrames = Math.max(6, Math.round((staggerMs / 1000) * FPS));
  const hits = hitsFor(clipId, staggerFrames);
  if (!hits.length || typeof OfflineAudioContext === "undefined") return null;
  const sr = 44100;
  const ctx = new OfflineAudioContext(2, Math.max(sr, Math.ceil(durationSec * sr) + sr), sr);
  const cache = new Map<string, AudioBuffer>();
  const decodeCtx = new AudioContext();
  try {
    for (const hit of hits) {
      let buf = cache.get(hit.src);
      if (!buf) {
        const res = await fetch(`/${hit.src}`);
        if (!res.ok) continue;
        buf = await decodeCtx.decodeAudioData(await res.arrayBuffer());
        cache.set(hit.src, buf);
      }
      const node = ctx.createBufferSource();
      node.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.value = hit.volume ?? 0.42;
      node.connect(gain);
      gain.connect(ctx.destination);
      node.start(Math.max(0, hit.at / FPS));
    }
  } finally {
    await decodeCtx.close();
  }
  return ctx.startRendering();
}

async function exportWithMediabunny(params: AnimParams, clipId: string): Promise<Blob> {
  if (typeof VideoEncoder === "undefined") {
    throw new Error("当前浏览器不支持视频编码");
  }
  const codec = await pickCodec();
  const { canvas, ctx } = makeCanvas();

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target,
  });

  const source = new CanvasSource(canvas, {
    codec,
    quality: new Quality("high"),
    keyFrameInterval: 1,
    alpha: "discard",
  });
  output.addVideoTrack(source, { frameRate: FPS });

  const wantAudio = await canEncodeAudio("aac");
  const audio = wantAudio
    ? new AudioBufferSource({ codec: "aac", quality: new Quality("high") })
    : null;
  if (audio) output.addAudioTrack(audio);

  await output.start();
  await preloadIcons();

  const durationMs = totalDuration(params, clipId);
  const frameDuration = 1 / FPS;
  const totalFrames = Math.ceil((durationMs / 1000) * FPS);

  for (let i = 0; i < totalFrames; i++) {
    const elapsed = Math.min((i / FPS) * 1000, durationMs);
    drawFrame(ctx, elapsed, params, clipId);
    await source.add(i * frameDuration, frameDuration);
  }

  if (audio) {
    try {
      const mixed = await mixSfx(clipId, params.staggerMs, durationMs / 1000);
      if (mixed) await audio.add(mixed);
    } catch {
      /* keep silent video if mix fails */
    }
  }

  await output.finalize();
  if (!target.buffer) throw new Error("MP4 生成失败");
  return new Blob([target.buffer], { type: "video/mp4" });
}

async function recordWebm(params: AnimParams, clipId: string): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  await preloadIcons();

  const stream = canvas.captureStream(FPS);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const durationMs = totalDuration(params, clipId);
  const started = performance.now();

  return new Promise((resolve, reject) => {
    recorder.onerror = () => reject(new Error("录制失败"));
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    recorder.start(80);
    const tick = (now: number) => {
      const elapsed = Math.min(now - started, durationMs);
      drawFrame(ctx, elapsed, params, clipId);
      if (elapsed < durationMs) requestAnimationFrame(tick);
      else setTimeout(() => recorder.stop(), 180);
    };
    drawFrame(ctx, 0, params, clipId);
    requestAnimationFrame(tick);
  });
}

async function exportViaServer(params: AnimParams, clipId: string): Promise<Blob> {
  const webm = await recordWebm(params, clipId);
  const body = new FormData();
  body.append("video", webm, "tea.webm");
  const res = await fetch("/api/export-mp4", { method: "POST", body });
  if (!res.ok) throw new Error((await res.text()) || "服务器转码失败");
  return res.blob();
}

export async function exportMp4(params: AnimParams, clipId = "ep18-b1"): Promise<Blob> {
  await document.fonts.ready;
  await preloadIcons();
  getClip(clipId);

  try {
    return await exportWithMediabunny(params, clipId);
  } catch (browserErr) {
    try {
      return await exportViaServer(params, clipId);
    } catch {
      const msg = browserErr instanceof Error ? browserErr.message : "导出失败";
      throw new Error(msg);
    }
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

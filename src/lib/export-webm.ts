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
import { hitsFor } from "@/remotion/shared/sfx-hits";
import type { SfxHit } from "@/remotion/shared/sfx-lib";
import { audioBufferToWav, renderSfx } from "@/lib/sfx-mix";
import { STATIC_MODE } from "@/lib/static-mode";
import { FPS, STAGE, type AnimParams } from "@/remotion/shared/theme";
import {
  drawFrame,
  preloadIcons,
  resolveClip,
  totalDuration,
  type ClipRef,
} from "@/lib/draw-stage";

// 16 Mbps ultra-high bitrate for crisp typography and paper texture
const ULTRA_BITRATE = 16_000_000;

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = STAGE.width;
  canvas.height = STAGE.height;
  const ctx =
    canvas.getContext("2d", { alpha: false, desynchronized: true }) ?? canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
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

/** 本次导出的音效轨怎么处理：mix = 混进视频（默认）；none = 视频不带音效（分轨导出时用） */
export type AudioMode = "mix" | "none";
export type ExportOptions = { audio?: AudioMode };

function clipFrames(params: AnimParams, clipRef: ClipRef) {
  return Math.ceil((totalDuration(params, clipRef) / 1000) * FPS);
}

function clipHits(clipRef: ClipRef, staggerMs: number): SfxHit[] {
  const staggerFrames = Math.max(6, Math.round((staggerMs / 1000) * FPS));
  const clip = resolveClip(clipRef);
  return clip.sfx ? clip.sfx(staggerFrames) : hitsFor(clip.id, staggerFrames);
}

async function mixSfx(clipRef: ClipRef, params: AnimParams): Promise<AudioBuffer | null> {
  const hits = clipHits(clipRef, params.staggerMs);
  if (!hits.length || typeof OfflineAudioContext === "undefined") return null;
  return (await renderSfx(hits, clipFrames(params, clipRef), FPS)).buffer;
}

/**
 * 只导出音效轨：48 kHz / 16-bit 立体声 WAV，长度严格 = 片段帧数 / 29.97 秒（与导出视频逐帧对齐）。
 * 片段没有音效时也会给一段等长静音，方便剪映里统一对轨。
 */
export async function exportSfxWav(params: AnimParams, clipId: ClipRef = "ep18-b1"): Promise<Blob> {
  const r = await renderSfx(clipHits(clipId, params.staggerMs), clipFrames(params, clipId), FPS);
  return audioBufferToWav(r.buffer);
}

export type ExportProgress = {
  phase: "init" | "rendering" | "encoding" | "done";
  currentFrame: number;
  totalFrames: number;
  percent: number;
  message: string;
};

async function exportWithMediabunny(
  params: AnimParams,
  clipId: ClipRef,
  onProgress?: (p: ExportProgress) => void,
  abortSignal?: AbortSignal,
  opts: ExportOptions = {},
): Promise<Blob> {
  if (typeof VideoEncoder === "undefined") {
    throw new Error("当前浏览器不支持硬件视频编码");
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
    quality: new Quality({ bitrate: ULTRA_BITRATE, bitrateMode: "variable" }),
    keyFrameInterval: 1,
    alpha: "discard",
  });
  output.addVideoTrack(source, { frameRate: FPS });

  const wantAudio = (opts.audio ?? "mix") === "mix" && (await canEncodeAudio("aac"));
  const audio = wantAudio
    ? new AudioBufferSource({ codec: "aac", quality: new Quality("very-high") })
    : null;
  if (audio) output.addAudioTrack(audio);

  await output.start();
  await preloadIcons();

  const durationMs = totalDuration(params, clipId);
  const frameDuration = 1 / FPS;
  const totalFrames = Math.ceil((durationMs / 1000) * FPS);

  onProgress?.({
    phase: "init",
    currentFrame: 0,
    totalFrames,
    percent: 0,
    message: "准备画布与离屏视频编码器...",
  });

  for (let i = 0; i < totalFrames; i++) {
    if (abortSignal?.aborted) {
      throw new Error("用户取消导出");
    }
    const elapsed = Math.min((i / FPS) * 1000, durationMs);
    drawFrame(ctx, elapsed, params, clipId);
    await source.add(i * frameDuration, frameDuration);

    if (i % 3 === 0 || i === totalFrames - 1) {
      const percent = Math.min(92, Math.round(((i + 1) / totalFrames) * 92));
      onProgress?.({
        phase: "rendering",
        currentFrame: i + 1,
        totalFrames,
        percent,
        message: `逐帧离屏渲染第 ${i + 1} / ${totalFrames} 帧...`,
      });
    }
  }

  if (audio) {
    onProgress?.({
      phase: "encoding",
      currentFrame: totalFrames,
      totalFrames,
      percent: 94,
      message: "正在合成与混音茶道音效轨道...",
    });
    try {
      const mixed = await mixSfx(clipId, params);
      if (mixed) await audio.add(mixed);
    } catch {
      /* keep silent video if mix fails */
    }
  }

  onProgress?.({
    phase: "encoding",
    currentFrame: totalFrames,
    totalFrames,
    percent: 98,
    message: "正在完成 MP4 封装与 FastStart 元数据写入...",
  });

  await output.finalize();
  if (!target.buffer) throw new Error("MP4 生成失败");

  onProgress?.({
    phase: "done",
    currentFrame: totalFrames,
    totalFrames,
    percent: 100,
    message: "视频生成完成，正在启动下载！",
  });

  return new Blob([target.buffer], { type: "video/mp4" });
}

async function recordWebm(
  params: AnimParams,
  clipId: ClipRef,
  onProgress?: (p: ExportProgress) => void,
  abortSignal?: AbortSignal,
): Promise<Blob> {
  const { canvas, ctx } = makeCanvas();
  await preloadIcons();

  const stream = canvas.captureStream(FPS);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: ULTRA_BITRATE });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const durationMs = totalDuration(params, clipId);
  const totalFrames = Math.ceil((durationMs / 1000) * FPS);
  const started = performance.now();

  return new Promise((resolve, reject) => {
    recorder.onerror = () => reject(new Error("录制失败"));
    recorder.onstop = () => {
      onProgress?.({
        phase: "done",
        currentFrame: totalFrames,
        totalFrames,
        percent: 100,
        message: "WebM 导出完毕！",
      });
      resolve(new Blob(chunks, { type: "video/webm" }));
    };
    recorder.start(80);
    const tick = (now: number) => {
      if (abortSignal?.aborted) {
        recorder.stop();
        reject(new Error("用户取消导出"));
        return;
      }
      const elapsed = Math.min(now - started, durationMs);
      drawFrame(ctx, elapsed, params, clipId);
      const currentFrame = Math.min(totalFrames, Math.round((elapsed / durationMs) * totalFrames));
      const percent = Math.min(95, Math.round((elapsed / durationMs) * 95));
      onProgress?.({
        phase: "rendering",
        currentFrame,
        totalFrames,
        percent,
        message: `实时录制第 ${currentFrame} / ${totalFrames} 帧...`,
      });
      if (elapsed < durationMs) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => recorder.stop(), 180);
      }
    };
    drawFrame(ctx, 0, params, clipId);
    requestAnimationFrame(tick);
  });
}

async function exportViaServer(
  params: AnimParams,
  clipId: ClipRef,
  onProgress?: (p: ExportProgress) => void,
  abortSignal?: AbortSignal,
): Promise<Blob> {
  const webm = await recordWebm(params, clipId, onProgress, abortSignal);
  onProgress?.({
    phase: "encoding",
    currentFrame: 100,
    totalFrames: 100,
    percent: 96,
    message: "正在请求服务器转码为 MP4 (H.264)...",
  });
  const body = new FormData();
  body.append("video", webm, "tea.webm");
  const res = await fetch("/api/export-mp4", { method: "POST", body, signal: abortSignal });
  if (!res.ok) throw new Error((await res.text()) || "服务器转码失败");
  return res.blob();
}

export async function exportMp4(
  params: AnimParams,
  clipId: ClipRef = "ep18-b1",
  onProgress?: (p: ExportProgress) => void,
  abortSignal?: AbortSignal,
  opts: ExportOptions = {},
): Promise<Blob> {
  await document.fonts.ready;
  await preloadIcons();
  await resolveClip(clipId).prepare?.(params);

  try {
    return await exportWithMediabunny(params, clipId, onProgress, abortSignal, opts);
  } catch (browserErr) {
    if (abortSignal?.aborted || STATIC_MODE) throw browserErr;
    try {
      return await exportViaServer(params, clipId, onProgress, abortSignal);
    } catch {
      const msg = browserErr instanceof Error ? browserErr.message : "导出失败";
      throw new Error(msg);
    }
  }
}

export async function exportWebm(
  params: AnimParams,
  clipId: ClipRef = "ep18-b1",
  onProgress?: (p: ExportProgress) => void,
  abortSignal?: AbortSignal,
): Promise<Blob> {
  await document.fonts.ready;
  await preloadIcons();
  await resolveClip(clipId).prepare?.(params);
  return recordWebm(params, clipId, onProgress, abortSignal);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 面板的音效选项：mix = 音效混进视频（原有）；stems = 分轨：无音效视频 + 等长音效 WAV（48 kHz） */
export type SoundMode = "mix" | "stems";
export type ExportedFile = { blob: Blob; filename: string };

/**
 * 按面板选择导出一个分镜。每出一个文件就回调 onFile（由调用方下载）：
 * 分轨模式先出「_音效.wav」（几百毫秒），再渲染「_无音效」视频；合成模式只出一个视频。
 */
export async function exportBeatFiles(
  params: AnimParams,
  clipId: ClipRef,
  exportName: string,
  format: "mp4" | "webm",
  sound: SoundMode,
  onFile: (file: ExportedFile) => void,
  onProgress?: (p: ExportProgress) => void,
  abortSignal?: AbortSignal,
): Promise<void> {
  const base = exportName.replace(/\.(mp4|webm)$/i, "");
  if (sound === "stems") {
    onProgress?.({
      phase: "encoding",
      currentFrame: 0,
      totalFrames: 0,
      percent: 1,
      message: "正在渲染音效分轨 WAV（48 kHz）...",
    });
    onFile({ blob: await exportSfxWav(params, clipId), filename: `${base}_音效.wav` });
  }
  if (abortSignal?.aborted) throw new Error("用户取消导出");
  const audio: AudioMode = sound === "stems" ? "none" : "mix";
  const video =
    format === "mp4"
      ? await exportMp4(params, clipId, onProgress, abortSignal, { audio })
      : await exportWebm(params, clipId, onProgress, abortSignal);
  onFile({ blob: video, filename: `${base}${sound === "stems" ? "_无音效" : ""}.${format}` });
}

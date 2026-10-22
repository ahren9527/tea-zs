/**
 * 导出用音效混音（浏览器 OfflineAudioContext）：
 * - 与预览 SfxTrack 用同一个 resolveHit()（音量 × SFX_MASTER、确定性微随机、循环底噪 + 淡入淡出）
 * - 长度严格 = 片段帧数 / 29.97 × 48000 采样，所以分轨 WAV 与无音效视频逐帧对齐
 */
import {
  envelopeAt,
  resolveHit,
  SFX_SAMPLE_RATE,
  samplesForFrames,
  type SfxHit,
} from "@/remotion/shared/sfx-lib";

export type SfxRender = { buffer: AudioBuffer; frames: number; hits: number };

async function decodeAll(srcs: string[]): Promise<Map<string, AudioBuffer>> {
  const out = new Map<string, AudioBuffer>();
  // 用一个很短的 OfflineAudioContext 解码：不占用声卡、Safari / 后台标签页也能用
  const decoder = new OfflineAudioContext(2, 1, SFX_SAMPLE_RATE);
  await Promise.all(
    [...new Set(srcs)].map(async (src) => {
      const res = await fetch(`/${src}`);
      if (!res.ok) return;
      try {
        out.set(src, await decoder.decodeAudioData(await res.arrayBuffer()));
      } catch {
        /* 跳过坏文件 */
      }
    }),
  );
  return out;
}

/** 把 hits 渲染成与片段等长的 48 kHz 立体声 AudioBuffer；没有 hit 时返回整段静音 */
export async function renderSfx(
  hits: SfxHit[],
  totalFrames: number,
  fps: number,
): Promise<SfxRender> {
  if (typeof OfflineAudioContext === "undefined") throw new Error("当前浏览器不支持离线混音");
  const sr = SFX_SAMPLE_RATE;
  const length = Math.max(1, samplesForFrames(totalFrames, fps, sr));
  const ctx = new OfflineAudioContext(2, length, sr);
  const resolved = hits.map((h) => resolveHit(h, totalFrames)).filter((r) => r.from < totalFrames);
  const buffers = await decodeAll(resolved.map((r) => r.src));
  let placed = 0;
  for (const r of resolved) {
    const buf = buffers.get(r.src);
    if (!buf) continue;
    const node = ctx.createBufferSource();
    node.buffer = buf;
    node.playbackRate.value = r.rate;
    node.loop = r.loop;
    const gain = ctx.createGain();
    const t0 = r.from / fps;
    if (r.fadeIn || r.fadeOut) {
      // 按帧采样包络（与预览 volume 回调同一个函数），线性插值连接
      const end =
        r.until ?? Math.min(totalFrames, r.from + Math.ceil((buf.duration / r.rate) * fps));
      gain.gain.setValueAtTime(r.gain * envelopeAt(r, r.from), t0);
      for (let f = r.from + 1; f <= end; f++)
        gain.gain.linearRampToValueAtTime(r.gain * envelopeAt(r, f), f / fps);
    } else {
      gain.gain.value = r.gain;
    }
    node.connect(gain);
    gain.connect(ctx.destination);
    node.start(t0);
    if (r.until != null) node.stop(r.until / fps);
    placed++;
  }
  return { buffer: await ctx.startRendering(), frames: totalFrames, hits: placed };
}

/** AudioBuffer → 16-bit PCM WAV（RIFF） */
export function audioBufferToWav(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels;
  const n = buf.length;
  const sr = buf.sampleRate;
  const dataBytes = n * ch * 2;
  const ab = new ArrayBuffer(44 + dataBytes);
  const v = new DataView(ab);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + dataBytes, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * ch * 2, true);
  v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, dataBytes, true);
  const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}

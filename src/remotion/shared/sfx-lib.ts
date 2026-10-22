/**
 * 音效库（纯函数，无 React）：预览 SfxTrack 与导出混音共用同一套解析，
 * 所以「预览听到的」=「导出混进去的」。
 *
 * 原则：高级、克制、少而准 —— 只给主动作配音；≤ 1 下 / 0.5 秒；品牌声只给口诀落印 / 金句；底噪永远很低。
 * 新物件音效都已归一到峰值 -12 dBFS（room-tone 为 -40 LUFS）；foley() 默认 volume 1，乘总线 0.8 后峰值约 -14 dBFS。
 * 来源与许可证：public/tea/sfx/LICENSES.md；重建：python3 scripts/sfx/build-foley.py
 */

export type SfxVary = number | { pitch?: number; volume?: number };

export type SfxHit = {
  /** public 下的相对路径，如 "tea/sfx/cake-thud.wav" */
  src: string;
  /** 起始帧（29.97 fps） */
  at: number;
  /** 0–1（可略大于 1），默认 0.42（老音效的惯例值）；新物件库用 foley() 时默认 1 */
  volume?: number;
  /**
   * 可选微随机（按 src + at 确定性，预览与导出一致）：
   * 数字 = 音高与音量都在 ±该比例内浮动（如 0.04 → ±4%）；或分别给 { pitch, volume }。
   */
  vary?: SfxVary;
  /** 固定变速（1 = 原速；导出时音高随之改变，预览里浏览器会保持音高只改时长） */
  rate?: number;
  /** 循环播放（环境底）。到 until 帧（默认片段末尾）为止 */
  loop?: boolean;
  /** 淡入 / 淡出帧数（环境底常用；普通打点一般不需要） */
  fadeIn?: number;
  fadeOut?: number;
  /** 结束帧（不含）；loop 时默认片段末尾 */
  until?: number;
};

/** 全局音效总线增益（所有音效都乘它）。克制：比原值低约 2 dB。 */
export const SFX_MASTER = 0.8;
/** 未写 volume 时的默认值（沿用旧片段的惯例） */
export const DEFAULT_HIT_VOLUME = 0.42;

const DIR = "tea/sfx";

/** 物件 → 固定的一组录音（1–3 个变体）。一物一声，不要混用。 */
export const FOLEY = {
  /** 茶饼放到木桌：闷、沉、软 */
  cakeThud: ["cake-thud", "cake-thud-2"],
  /** 棉纸：揭开 / 翻动（短） */
  paperRustle: ["paper-rustle", "paper-rustle-2"],
  /** 棉纸：撕开（短） */
  paperTear: ["paper-tear"],
  /** 铝箔袋：揉动 */
  foilCrinkle: ["foil-crinkle", "foil-crinkle-2"],
  /** 铝箔袋 / 自封袋：压封口 */
  foilSeal: ["foil-seal"],
  /** 茶针扎进紧压的饼 */
  needlePierce: ["needle-pierce", "needle-pierce-2"],
  /** 茶针沿饼面撬、刮 */
  needleScrape: ["needle-scrape"],
  /** 饼块撬开 / 掰裂 */
  cakeCrack: ["cake-crack", "cake-crack-2"],
  /** 碎叶散落（轻） */
  leafScatter: ["leaf-scatter"],
  /** 陶 / 紫砂罐盖合上：轻碰 + 闷 */
  jarLid: ["jar-lid", "jar-lid-2"],
  /** 木质印章压下 */
  sealWood: ["seal-wood"],
  /** 布展开 */
  clothUnroll: ["cloth-unroll"],
  /** 卷轴展开 */
  scrollUnroll: ["scroll-unroll"],
  /** 镇纸压到木面上 */
  paperweight: ["paperweight"],
  /** 镜头运动的极轻气流（尽量少用） */
  whoosh: ["whoosh-soft", "whoosh-soft-2"],
} as const;

export type FoleyName = keyof typeof FOLEY;

/** 品牌声：只给口诀落印 / 金句。zheng = 筝的一声挑弦；bowl = 小钵 / 磬一击。 */
export const BRAND = {
  zheng: "zheng-pluck",
  bowl: "bowl-strike",
} as const;

export const ROOM_TONE = `${DIR}/room-tone.wav`;

/** 确定性 0–1 哈希（字符串 + 数字） */
export function sfxHash(src: string, at: number, salt = 0) {
  let h = 0x811c9dc5 ^ salt;
  const key = `${src}@${Math.round(at * 100)}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

type FoleyOpts = Omit<SfxHit, "src" | "at"> & {
  /** 固定用第几个变体；省略时按 at 确定性挑 */
  variant?: number;
};

/** 物件音效：foley("cakeThud", 42) → { src: "tea/sfx/cake-thud(-2).wav", at: 42, volume: 1, vary: 0.03 }（混音后峰值 ≈ -14 dBFS） */
export function foley(name: FoleyName, at: number, opts: FoleyOpts = {}): SfxHit {
  const list = FOLEY[name];
  const { variant, ...rest } = opts;
  const idx =
    variant != null ? variant % list.length : Math.floor(sfxHash(name, at, 7) * list.length);
  return { src: `${DIR}/${list[idx]}.wav`, at, volume: 1, vary: 0.03, ...rest };
}

/** 品牌声（口诀落印 / 金句）。一拍最多一次。 */
export function brandHit(
  at: number,
  opts: Omit<SfxHit, "src" | "at"> & { kind?: keyof typeof BRAND } = {},
): SfxHit {
  const { kind = "zheng", ...rest } = opts;
  return { src: `${DIR}/${BRAND[kind]}.wav`, at, volume: 0.7, ...rest };
}

/** 茶室底噪（循环、淡入淡出）。放进 sfxHits 数组即可，或写在 defineClip({ ambience }) 里。 */
/** 底噪默认音量：抵消 SFX_MASTER，混音后仍是 -40 LUFS */
export const ROOM_BED_VOLUME = 1 / SFX_MASTER;

export type AmbienceBed = Partial<Omit<SfxHit, "loop">>;

export function roomBed(opts: AmbienceBed = {}): SfxHit {
  return {
    src: ROOM_TONE,
    at: 0,
    volume: ROOM_BED_VOLUME,
    fadeIn: 20,
    fadeOut: 24,
    ...opts,
    loop: true,
  };
}

export type ResolvedHit = {
  src: string;
  /** 起始帧（整数，≥0） */
  from: number;
  /** 结束帧（不含）；undefined = 自然播完 */
  until?: number;
  /** 最终增益（已乘 SFX_MASTER） */
  gain: number;
  rate: number;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
};

/** 把一条 hit 解析成最终的播放参数。clipFrames = 片段总帧数（环境底需要）。 */
export function resolveHit(hit: SfxHit, clipFrames: number): ResolvedHit {
  const v = hit.vary;
  const pv = typeof v === "number" ? v : (v?.pitch ?? 0);
  const vv = typeof v === "number" ? v : (v?.volume ?? 0);
  const rp = sfxHash(hit.src, hit.at, 1) * 2 - 1;
  const rv = sfxHash(hit.src, hit.at, 2) * 2 - 1;
  const from = Math.max(0, Math.round(hit.at));
  const until = hit.loop ? Math.min(clipFrames, hit.until ?? clipFrames) : hit.until;
  return {
    src: hit.src,
    from,
    until,
    gain: Math.max(
      0,
      (hit.volume ?? DEFAULT_HIT_VOLUME) * (1 + rv * Math.min(0.2, vv)) * SFX_MASTER,
    ),
    rate: Math.max(0.5, Math.min(2, (hit.rate ?? 1) * (1 + rp * Math.min(0.1, pv)))),
    loop: !!hit.loop,
    fadeIn: Math.max(0, hit.fadeIn ?? 0),
    fadeOut: Math.max(0, hit.fadeOut ?? 0),
  };
}

/** 帧 f 处的包络（0–1），只看淡入淡出；预览 volume 回调与导出的增益曲线用同一个函数 */
export function envelopeAt(r: ResolvedHit, frame: number): number {
  const local = frame - r.from;
  let g = 1;
  if (r.fadeIn > 0) g = Math.min(g, Math.max(0, local / r.fadeIn));
  if (r.fadeOut > 0 && r.until != null) g = Math.min(g, Math.max(0, (r.until - frame) / r.fadeOut));
  return g;
}

/** 导出 / 分轨 WAV 的采样率与长度：长度严格等于「帧数 / 29.97」 */
export const SFX_SAMPLE_RATE = 48000;
export function samplesForFrames(frames: number, fps: number, sampleRate = SFX_SAMPLE_RATE) {
  return Math.round((frames / fps) * sampleRate);
}

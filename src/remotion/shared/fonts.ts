/**
 * 画布文字字体。代码里写的是两个「角色」：KAI（楷体位置）和 SONG（宋体位置），
 * 面板可以按期把这两个位置换成别的字体（resolveFont）；印章、包装上的字、单独指定的字体不受影响。
 * canvas 不会自动触发 unicode-range 分片下载，所以预览和导出前都要先 ensureFonts(本拍所有文字)。
 */
export const KAI_FONT = '"ZS WenKai", "LXGW WenKai", "Noto Serif SC", "Songti SC", serif';
export const SONG_FONT = '"Noto Serif SC", "Songti SC", "Source Han Serif SC", serif';
/** 旧名，kit 里仍在用 */
export const TPL_FONT = KAI_FONT;

export type FontId = "kai" | "song" | "hei" | "brush";

export const FONT_OPTIONS: Record<FontId, { label: string; stack: string; load: string[] }> = {
  kai: { label: "霞鹜文楷", stack: KAI_FONT, load: ['400 64px "ZS WenKai"', '700 64px "ZS WenKai"'] },
  song: {
    label: "思源宋体",
    stack: SONG_FONT,
    load: ['700 64px "Noto Serif SC"', '800 64px "Noto Serif SC"', '900 64px "Noto Serif SC"'],
  },
  hei: {
    label: "思源黑体",
    stack: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    load: ['700 64px "Noto Sans SC"', '900 64px "Noto Sans SC"'],
  },
  // GB2312 一级字子集，生僻字会回落到霞鹜文楷
  brush: { label: "马善政毛笔", stack: '"Ma Shan Zheng", "ZS WenKai", "LXGW WenKai", serif', load: ['400 64px "Ma Shan Zheng"'] },
};

/** body = 代码里写 KAI 的字；title = 代码里写 SONG 的字（章节标题、大字多用它） */
export type FontChoice = { body: FontId; title: FontId };
export const DEFAULT_FONTS: FontChoice = { body: "kai", title: "song" };

let active: FontChoice = DEFAULT_FONTS;

/** 每帧开始时（beginFrame）和导出 / 预览加载字体前调用；draw 是同步的，所以模块级状态是确定的 */
export function setActiveFonts(choice?: Partial<FontChoice>) {
  active = { ...DEFAULT_FONTS, ...choice };
}

export function activeFonts(): FontChoice {
  return active;
}

/** 把 KAI / SONG 换成面板选的字体；其他字体原样返回 */
export function resolveFont(stack: string): string {
  if (stack === KAI_FONT) return FONT_OPTIONS[active.body].stack;
  if (stack === SONG_FONT) return FONT_OPTIONS[active.title].stack;
  return stack;
}

const loaded = new Set<string>();

/**
 * 按需加载这些文字用到的字体分片（默认楷 / 宋，加上当前选中的字体）；网络不通时最多等 4 秒，之后用本地字体兜底。
 */
export async function ensureFonts(text: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = new Set([
    ...FONT_OPTIONS.kai.load,
    ...FONT_OPTIONS.song.load,
    ...FONT_OPTIONS[active.body].load,
    ...FONT_OPTIONS[active.title].load,
  ]);
  const jobs: Promise<unknown>[] = [];
  for (const spec of specs) {
    const chars = Array.from(text).filter((c) => !loaded.has(`${spec}|${c}`));
    if (!chars.length) continue;
    jobs.push(
      document.fonts
        .load(spec, chars.join(""))
        .catch(() => [])
        .then(() => chars.forEach((c) => loaded.add(`${spec}|${c}`))),
    );
  }
  if (!jobs.length) return;
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 4000))]);
}

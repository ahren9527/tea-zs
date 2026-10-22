/**
 * 第 20 期：按「马老师真实口播」对齐的计时。
 *
 * vo-times.json 由口播录音（全片 123.2 秒，29.97 fps）做 ASR 后对齐到每拍文案得来：
 *   { b1: { script, chars（去标点的文案）, times（每个字在整条口播里开始说的绝对秒数） }, … }
 * 精度约 0.1–0.2 秒（85–93% 的字直接匹配，其余插值）。
 *
 * 每拍片段的起点 = 第一个字的时刻 − leadSec（让物件能在第一个字前落定）；
 * voAt("词", nth) = 该词第一个字相对片段起点的帧。
 * 想整体挪口播：改该拍 data.ts 里的 OFFSET_SEC（正数 = 字往后挪，片段在成片里的位置不变）。
 * 找不到的词（例如改了 SCRIPT）退回旧的「按语速推算」：从第一个字起，每秒 fallbackCps 个字。
 */
import { FPS, framesOf } from "@/remotion/shared/theme";
import VO_TIMES from "./vo-times.json";

const PUNCT = /[，。：？！、；“”「」\s]/g;

export type VoBeatKey = keyof typeof VO_TIMES;

export interface VoTimeline {
  /** 某个词（第 nth 次出现）第一个字开始说的帧（相对片段起点） */
  voAt: (phrase: string, nth?: number) => number;
  /** 片段起点在整条口播 / 成片里的绝对秒数 */
  startSec: number;
  /** 最后一个字开始说的时刻（相对片段起点，秒） */
  lastCharSec: number;
  /** 本拍实际平均语速（字/秒），给逐字显现用 */
  cps: number;
  /** 片段总帧数 = 最后一个字 − 片段起点 + endHoldSec */
  lengthOf: (endHoldSec: number) => number;
  /** 「约20.6秒 · 成片 14.1–33.2s · 起点 00:00:14:03」——写进节拍 note，方便在 Final Cut 里放到对应时间码 */
  filmNote: (endHoldSec: number) => string;
}

/** 29.97 fps 非丢帧时间码 HH:MM:SS:FF（按帧数计） */
export function timecodeNDF(seconds: number) {
  const total = Math.round(seconds * FPS);
  const ff = total % 30;
  const s = Math.floor(total / 30);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
}

/** 29.97 fps 丢帧时间码 HH:MM:SS;FF（Final Cut / 剪映 29.97 工程默认显示这种，约等于真实钟表时间） */
export function timecodeDF(seconds: number) {
  let n = Math.round(seconds * FPS);
  const perMin = 30 * 60 - 2;
  const per10 = perMin * 10 + 2;
  const d = Math.floor(n / per10);
  const m = n % per10;
  n += 18 * d + (m > 2 ? 2 * Math.floor((m - 2) / perMin) : 0);
  const p = (x: number) => String(x).padStart(2, "0");
  const ff = n % 30;
  const s = Math.floor(n / 30);
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)};${p(ff)}`;
}

export function makeVoAtFromTimes(
  key: VoBeatKey,
  opts: { script?: string; leadSec?: number; offsetSec?: number; fallbackCps?: number } = {},
): VoTimeline {
  const { leadSec = 0.5, offsetSec = 0, fallbackCps = 3.8 } = opts;
  const rec = VO_TIMES[key];
  const spokenRec = rec.chars;
  const times = rec.times;
  const first = times[0];
  const startSec = first - leadSec;
  const lastCharSec = times[times.length - 1] - startSec + offsetSec;
  const spokenScript = (opts.script ?? rec.script).replace(PUNCT, "");

  const find = (text: string, phrase: string, nth: number) => {
    let idx = -1;
    for (let i = 0; i <= nth; i++) {
      idx = text.indexOf(phrase, idx + 1);
      if (idx < 0) return -1;
    }
    return idx;
  };

  const voAt = (phrase: string, nth = 0): number => {
    const i = find(spokenRec, phrase, nth);
    if (i >= 0) return framesOf(times[i] - startSec + offsetSec);
    // 退路：按语速从第一个字推算
    const j = find(spokenScript, phrase, nth);
    if (j < 0) throw new Error(`口播里找不到「${phrase}」`);
    return framesOf(leadSec + offsetSec + j / fallbackCps);
  };

  const lengthOf = (endHoldSec: number) => framesOf(lastCharSec + endHoldSec);
  const filmNote = (endHoldSec: number) => {
    const len = lengthOf(endHoldSec) / FPS;
    const end = startSec + len;
    return `约${len.toFixed(1)}秒 · 成片 ${startSec.toFixed(1)}–${end.toFixed(1)}s · 起点 ${timecodeDF(startSec)}（29.97）`;
  };
  const cps = (spokenRec.length - 1) / Math.max(0.1, times[times.length - 1] - first);
  return { voAt, startSec, lastCharSec, cps, lengthOf, filmNote };
}

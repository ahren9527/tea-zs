/**
 * 第 23 期：口播对齐计时工具（对齐实录 public/tea/vo/ep23.mp3）。
 */
import { FPS, framesOf } from "@/remotion/shared/theme";
import VO_TIMES from "./vo-times.json";

const PUNCT = /[，。：？！、；“”「」—\s]/g;

export type VoBeatKey = keyof typeof VO_TIMES;

export interface VoTimeline {
  /** 某个词（第 nth 次出现）第一个字开始说的帧（相对片段起点） */
  voAt: (phrase: string, nth?: number) => number;
  /**
   * 返回某个词对应的逐字开口帧数组（相对片段起点）。
   * 若画面展示字数 displayLen 与口播字数不同（如「8.5%」「≤7%」「安全线？」），
   * 按真实开口起止区间平滑插值分配，确保每个字都踩在马老师语速上。
   */
  charFrames: (phrase: string, displayLen?: number, nth?: number) => number[];
  /** 片段起点在整条口播 / 成片里的绝对秒数 */
  startSec: number;
  /** 最后一个字开始说的时刻（相对片段起点，秒） */
  lastCharSec: number;
  /** 本拍实际平均语速（字/秒），给逐字显现用 */
  cps: number;
  /** 片段总帧数 = 最后一个字 − 片段起点 + endHoldSec */
  lengthOf: (endHoldSec: number) => number;
  /** 「约16.2秒 · 成片 17.7–33.9s · 起点 00:00:17;21（29.97）」——写进节拍 note */
  filmNote: (endHoldSec: number) => string;
}

/** 29.97 fps 非丢帧时间码 HH:MM:SS:FF */
export function timecodeNDF(seconds: number) {
  const total = Math.round(seconds * FPS);
  const ff = total % 30;
  const s = Math.floor(total / 30);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}:${p(ff)}`;
}

/** 29.97 fps 丢帧时间码 HH:MM:SS;FF（Final Cut / 剪映 29.97 工程默认显示） */
export function timecodeDF(seconds: number) {
  let n = Math.max(0, Math.round(seconds * FPS));
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
  const { leadSec = 0.45, offsetSec = 0, fallbackCps = 3.8 } = opts;
  const rec = VO_TIMES[key];
  const spokenRec = rec.chars;
  const times = rec.times;
  const first = times[0];
  const startSec = Math.max(0, first - leadSec);
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
    const j = find(spokenScript, phrase, nth);
    if (j < 0) throw new Error(`口播里找不到「${phrase}」`);
    return framesOf(leadSec + offsetSec + j / fallbackCps);
  };

  const charFrames = (phrase: string, displayLen?: number, nth = 0): number[] => {
    const pLen = Math.max(1, Array.from(phrase).length);
    const outLen = Math.max(1, displayLen ?? pLen);
    const i = find(spokenRec, phrase, nth);
    if (i >= 0) {
      const raw: number[] = [];
      for (let k = 0; k < pLen; k++) {
        const ti = times[Math.min(times.length - 1, i + k)];
        raw.push(framesOf(ti - startSec + offsetSec));
      }
      if (outLen === pLen) return raw;
      if (outLen === 1) return [raw[0]];
      const fStart = raw[0];
      const fEnd =
        pLen > 1
          ? raw[raw.length - 1]
          : framesOf(
              (times[Math.min(times.length - 1, i + 1)] ?? times[i] + 0.24) - startSec + offsetSec,
            );
      const span = Math.max(outLen * 2, fEnd - fStart);
      return Array.from({ length: outLen }, (_, k) =>
        Math.round(fStart + (span * k) / Math.max(1, outLen - 1)),
      );
    }
    const base = voAt(phrase, nth);
    const step = Math.max(3, Math.round(FPS / Math.max(2.2, fallbackCps)));
    return Array.from({ length: outLen }, (_, k) => base + k * step);
  };

  const lengthOf = (endHoldSec: number) => framesOf(lastCharSec + endHoldSec);
  const filmNote = (endHoldSec: number) => {
    const len = lengthOf(endHoldSec) / FPS;
    const end = startSec + len;
    return `约${len.toFixed(1)}秒 · 成片 ${startSec.toFixed(1)}–${end.toFixed(1)}s · 起点 ${timecodeDF(startSec)}（29.97）`;
  };
  const cps = (spokenRec.length - 1) / Math.max(0.1, times[times.length - 1] - first);
  return { voAt, charFrames, startSec, lastCharSec, cps, lengthOf, filmNote };
}

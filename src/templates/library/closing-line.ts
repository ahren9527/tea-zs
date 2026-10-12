import { defineTemplate } from "../types";
import { s } from "../kit/content";
import { clamp, easeOutCubic, prog } from "../kit/motion";
import { W, H, alpha, brush, fitSize, inkReveal, seal, FONT } from "../kit/paint";

/** 把一句金句按 ，。、· | 空格 拆成 1-3 段 */
export function splitLine(line: string): string[] {
  const parts = line
    .split(/[，,。、·｜|/\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (parts.length <= 3) return parts.length ? parts : [line];
  return [parts.slice(0, Math.ceil(parts.length / 2)).join(""), parts.slice(Math.ceil(parts.length / 2)).join("")];
}

/** 收尾金句（第 18 期 B9「先存对，再谈老」） */
export const closingLine = defineTemplate({
  id: "closing-line",
  name: "收尾金句",
  category: "收尾",
  desc: "金句按逗号拆成 1-3 段逐段墨迹显现（横排或竖排），落款印章与品牌小字收住。",
  aliases: ["收尾", "金句", "结尾", "定格"],
  fields: [
    { key: "line", type: "textarea", label: "金句（用逗号分段）", maxLen: 20, placeholder: "先存对，再谈老" },
    {
      key: "layout",
      type: "select",
      label: "排版",
      options: [
        { value: "horizontal", label: "横排" },
        { value: "vertical", label: "竖排（右起）" },
      ],
    },
    { key: "sub", type: "text", label: "下方小字", optional: true, maxLen: 18, placeholder: "白茶存得对，时间才帮你" },
    { key: "sealText", type: "stamp", label: "落款印", optional: true, maxLen: 4, placeholder: "正上" },
    { key: "brand", type: "text", label: "落款小字", optional: true, maxLen: 10, placeholder: "正上茶舍" },
  ],
  defaults: {
    line: "先存对，再谈老",
    layout: "horizontal",
    sub: "",
    sealText: "正上",
    brand: "正上茶舍",
  },
  plan(c, tl) {
    tl.wait(0.25);
    const segs = splitLine(s(c, "line"));
    const at = segs.map((g, i) => {
      const a = tl.mark(`金句${i + 1}: ${g}`, i === 0 ? "飞入" : "续句", i === segs.length - 1 ? "punchline" : "intro", i === 0 ? "tea/sfx/paper.wav" : "tea/sfx/celadon-chime.wav");
      tl.wait(0.5 + Array.from(g).length * 0.14);
      return a;
    });
    tl.wait(0.3);
    const sealAt = s(c, "sealText") ? tl.mark("落款印", "落款", "stamp", "tea/sfx/stamp.wav") : -1;
    tl.wait(1.4);
    return { segs, at, sealAt, d: tl.dur(0.9) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const segs: string[] = P.segs;
    const vertical = s(c, "layout") === "vertical";
    let lastX = W / 2;
    let lastY = H / 2;
    let subY = H / 2 + 380;
    if (!vertical) {
      const n = segs.length;
      const maxLen = Math.max(...segs.map((g) => Array.from(g).length));
      const base = maxLen <= 4 ? 150 : maxLen <= 6 ? 128 : 104;
      const lh = base * 1.55 * env.fs;
      const y0 = H / 2 - 60 - ((n - 1) * lh) / 2;
      segs.forEach((g, i) => {
        const y = y0 + i * lh;
        // 第一段从上方飞入并放大定格
        const fly = i === 0 ? easeOutCubic(prog(t, P.at[0], 0.6)) : 1;
        ctx.save();
        ctx.translate(0, (1 - fly) * -80);
        const res = inkReveal(env, g, W / 2 + (i % 2 ? 40 : -40) * (n > 1 ? 1 : 0), y, { size: base, weight: 700, color: pal.ink, maxW: 900, minSize: 56 }, prog(t, P.at[i], P.d), 0.1);
        ctx.restore();
        if (res) {
          lastX = W / 2 + (i % 2 ? 40 : -40) * (n > 1 ? 1 : 0) + res.width / 2;
          lastY = y;
        }
      });
      const endT = P.at[segs.length - 1] + 0.6;
      brush(ctx, W / 2 - 220, y0 + (n - 1) * lh + base * env.fs * 0.95, W / 2 + 220, 14, alpha(pal.seal, 0.8), prog(t, endT, 0.7), 12);
    } else {
      // 竖排：每段一列，右起
      const n = segs.length;
      const maxLen = Math.max(...segs.map((g) => Array.from(g).length));
      const size = Math.min(150, 1100 / Math.max(4, maxLen)) * env.fs;
      const colGap = size * 1.5;
      const x0 = W / 2 + ((n - 1) * colGap) / 2;
      segs.forEach((g, i) => {
        const chars = Array.from(g);
        const x = x0 - i * colGap;
        const top = H / 2 - 60 - ((chars.length - 1) * size * 1.12) / 2 + i * size * 0.6;
        const p = prog(t, P.at[i], P.d);
        chars.forEach((ch, k) => {
          const e = easeOutCubic(clamp((p - k * 0.1) / 0.5));
          if (e <= 0) return;
          ctx.save();
          ctx.globalAlpha = e;
          ctx.font = `700 ${Math.round(size)}px ${FONT}`;
          ctx.fillStyle = pal.ink;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.translate(x, top + k * size * 1.12 + (1 - e) * 20);
          ctx.scale(1.1 - 0.1 * e, 1.1 - 0.1 * e);
          ctx.fillText(ch, 0, 0);
          ctx.restore();
        });
        lastX = x;
        lastY = top + (chars.length - 1) * size * 1.12;
        subY = Math.max(subY, lastY + size * 1.3);
      });
      subY = Math.max(subY, lastY + 300);
    }
    const sub = s(c, "sub");
    if (sub) {
      ctx.save();
      ctx.globalAlpha = easeOutCubic(prog(t, P.at[segs.length - 1] + 0.7, 0.6));
      const size = fitSize(ctx, sub, { size: 44, weight: 500 }, 820, env.fs, 26);
      ctx.font = `500 ${size}px ${FONT}`;
      ctx.fillStyle = pal.muted;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(sub, W / 2, Math.min(H - 300, subY));
      ctx.restore();
    }
    if (P.sealAt >= 0) {
      const sx = vertical ? lastX - 30 : Math.min(W - 150, lastX + 70);
      const sy = vertical ? lastY + 170 : lastY + 70;
      seal(ctx, s(c, "sealText"), { x: sx, y: sy, size: 110, p: prog(t, P.sealAt, 0.42), filled: true, color: pal.seal, paper: pal.paper, rot: -4 });
    }
    const brand = s(c, "brand");
    if (brand) {
      ctx.save();
      ctx.globalAlpha = easeOutCubic(prog(t, (P.sealAt >= 0 ? P.sealAt : P.at[segs.length - 1]) + 0.3, 0.6)) * 0.85;
      ctx.font = `500 ${Math.round(38 * env.fs)}px ${FONT}`;
      ctx.fillStyle = pal.muted;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "14px";
      ctx.fillText(brand, W / 2 + 7, H - 220);
      ctx.restore();
    }
  },
});

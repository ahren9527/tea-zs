import { defineTemplate } from "../types";
import { s, n } from "../kit/content";
import { clamp, easeInOutCubic, easeOutCubic, inOut, lerp, prog } from "../kit/motion";
import { W, alpha, brush, cross, drawLines, fitSize, inkReveal, layoutText, seal, text, FONT, FONT_SONG } from "../kit/paint";

/** 开门大字 · 误区印章（第 18 期 B1「越放越香→毁茶」/ 第 19 期 B1「频繁开大袋 ✖ + 数据骤降」） */
export const hookStamp = defineTemplate({
  id: "hook-stamp",
  name: "开门大字 · 误区印章",
  category: "开场",
  desc: "一句常见误区大字入场，朱印砸落否定，可选数据骤降，最后扎心一句收住。",
  aliases: ["开门大字", "误区", "破题", "开场", "hook"],
  fields: [
    { key: "eyebrow", type: "text", label: "眉题（小字）", optional: true, maxLen: 14, placeholder: "很多人以为" },
    { key: "myth", type: "textarea", label: "误区大字", maxLen: 10, placeholder: "越放越香" },
    { key: "stamp", type: "stamp", label: "印章字（1-4 字）", maxLen: 4, placeholder: "毁茶" },
    {
      key: "stampStyle",
      type: "select",
      label: "否定方式",
      options: [
        { value: "seal", label: "方印砸落" },
        { value: "cross", label: "朱红大叉 + 小印" },
      ],
    },
    { key: "statLabel", type: "text", label: "数据标签（留空不显示）", optional: true, placeholder: "头香留存" },
    { key: "statFrom", type: "number", label: "数据起点", min: 0, max: 9999, step: 1 },
    { key: "statTo", type: "number", label: "数据终点", min: 0, max: 9999, step: 1 },
    { key: "statUnit", type: "text", label: "数据单位", optional: true, maxLen: 3, placeholder: "%" },
    { key: "punch", type: "textarea", label: "扎心一句（结尾）", optional: true, maxLen: 16, placeholder: "你以为在陈化" },
  ],
  defaults: {
    eyebrow: "很多人以为",
    myth: "越放越香",
    stamp: "毁茶",
    stampStyle: "seal",
    statLabel: "",
    statFrom: 100,
    statTo: 23,
    statUnit: "%",
    punch: "你以为在陈化",
  },
  plan(c, tl) {
    tl.wait(0.25);
    const myth = tl.mark(`误区: ${s(c, "myth")}`, "入场", "intro", "tea/sfx/paper.wav");
    tl.wait(1.6);
    const stamp = tl.mark(`印章: ${s(c, "stamp")}`, "盖印", "stamp", "tea/sfx/wood-stamp.wav");
    tl.wait(1.1);
    let stat = -1;
    if (s(c, "statLabel")) {
      stat = tl.mark(`数据: ${n(c, "statFrom")}→${n(c, "statTo")}${s(c, "statUnit")}`, "数据", "action", "tea/sfx/abacus-slide.wav");
      tl.wait(1.9);
    }
    let punch = -1;
    if (s(c, "punch")) {
      punch = tl.mark(`金句: ${s(c, "punch")}`, "金句", "punchline", "tea/sfx/celadon-chime.wav");
      tl.wait(1.2);
    } else tl.wait(0.4);
    return { myth, stamp, stat, punch, d: tl.dur(1), dStat: tl.dur(1.4) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const myth = s(c, "myth");
    const hasStat = P.stat >= 0;
    const cy = hasStat ? 820 : 900;
    // 结尾时整组上移缩小，把舞台让给金句
    const lift = P.punch >= 0 ? easeInOutCubic(prog(t, P.punch - 0.15, 0.7)) : 0;
    ctx.save();
    ctx.translate(W / 2, cy);
    ctx.scale(1 - 0.34 * lift, 1 - 0.34 * lift);
    ctx.translate(-W / 2, -cy - lift * (hasStat ? 520 : 700));

    // 眉题
    const eb = s(c, "eyebrow");
    if (eb) {
      ctx.save();
      ctx.globalAlpha = inOut(t, P.myth - 0.1, 0.5);
      text(env, eb, W / 2, cy - 200, { size: 46, weight: 500, color: pal.muted, maxW: 800, maxLines: 1, spacing: 8 });
      ctx.restore();
    }

    // 误区大字（盖印后变淡并被划掉）
    const stamped = easeOutCubic(prog(t, P.stamp + 0.08, 0.4));
    const lay = layoutText(ctx, myth, { size: 156, weight: 700 }, 880, env.fs, { maxLines: 2, minSize: 64 });
    ctx.save();
    ctx.globalAlpha = 1 - 0.55 * stamped;
    if (lay.lines.length === 1) {
      inkReveal(env, lay.lines[0], W / 2, cy, { size: lay.size / env.fs, weight: 700, color: pal.ink, maxW: 900 }, prog(t, P.myth, P.d), 0.09);
    } else {
      ctx.globalAlpha *= easeOutCubic(prog(t, P.myth, P.d * 0.7));
      drawLines(ctx, lay.lines, W / 2, cy, lay.size, { weight: 700, color: pal.ink });
    }
    ctx.restore();
    ctx.save();
    ctx.font = `700 ${lay.size}px ${FONT}`;
    const textW = Math.min(900, Math.max(...lay.lines.map((l) => ctx.measureText(l).width)));
    ctx.restore();
    const style = s(c, "stampStyle");
    if (style === "cross") {
      cross(ctx, W / 2, cy, Math.min(720, textW * 0.9 + 160), alpha(pal.seal, 0.92), prog(t, P.stamp, 0.32));
      seal(ctx, s(c, "stamp"), {
        x: W / 2 + Math.min(380, textW / 2 + 60),
        y: cy + lay.size * 0.9,
        size: Array.from(s(c, "stamp")).length > 2 ? 190 : 150,
        p: prog(t, P.stamp + 0.22, 0.42),
        filled: true,
        color: pal.seal,
        paper: pal.paper,
        rot: 8,
      });
    } else {
      brush(ctx, W / 2 - textW / 2 - 20, cy + 6, W / 2 + textW / 2 + 20, 18, alpha(pal.seal, 0.75), stamped, 5);
      seal(ctx, s(c, "stamp"), {
        x: W / 2 + Math.min(330, textW / 2 + 10),
        y: cy + (lay.lines.length > 1 ? lay.size : lay.size * 0.8),
        size: Array.from(s(c, "stamp")).length > 2 ? 250 : 230,
        p: prog(t, P.stamp, 0.42),
        color: pal.seal,
        paper: pal.paper,
        rot: -8,
      });
    }

    // 数据骤降
    if (hasStat) {
      const a = inOut(t, P.stat, 0.4);
      if (a > 0) {
        const from = n(c, "statFrom");
        const to = n(c, "statTo");
        const k = easeOutCubic(prog(t, P.stat + 0.25, P.dStat));
        const v = Math.round(lerp(from, to, k));
        const unit = s(c, "statUnit");
        const y0 = cy + 430;
        ctx.save();
        ctx.globalAlpha = a;
        text(env, s(c, "statLabel"), W / 2, y0 - 110, { size: 44, weight: 500, color: pal.muted, maxW: 760, maxLines: 1 });
        const numColor = k > 0.05 ? pal.seal : pal.ink;
        const size = fitSize(ctx, `${from}${unit}`, { size: 170, weight: 800, family: FONT_SONG }, 700, env.fs, 80);
        ctx.font = `800 ${size}px ${FONT_SONG}`;
        ctx.fillStyle = numColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${v}${unit}`, W / 2, y0 + 30);
        // 进度条
        const bw = 640;
        const ratio = from > 0 ? clamp(lerp(1, to / from, k)) : 0;
        ctx.fillStyle = alpha(pal.ink, 0.1);
        ctx.beginPath();
        ctx.roundRect(W / 2 - bw / 2, y0 + 150, bw, 18, 9);
        ctx.fill();
        ctx.fillStyle = numColor;
        ctx.beginPath();
        ctx.roundRect(W / 2 - bw / 2, y0 + 150, Math.max(18, bw * ratio), 18, 9);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();

    // 扎心金句
    if (P.punch >= 0) {
      const pp = prog(t, P.punch + 0.2, P.d);
      const py = hasStat ? 1280 : 1180;
      const res = inkReveal(env, s(c, "punch"), W / 2, py, { size: 104, weight: 700, color: pal.ink, maxW: 900, minSize: 52 }, pp, 0.07);
      if (res) brush(ctx, W / 2 - res.width / 2, py + res.size * 0.72, W / 2 + res.width / 2, 12, alpha(pal.seal, 0.8), prog(t, P.punch + 0.6, 0.6), 9);
    }
  },
});

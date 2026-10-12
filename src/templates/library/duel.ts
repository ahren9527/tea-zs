import { defineTemplate } from "../types";
import { items, s } from "../kit/content";
import { drawIcon } from "../kit/icons";
import { breath, easeOutBack, easeOutCubic, prog } from "../kit/motion";
import { W, alpha, card, check, cross, header, plaque, seal, text } from "../kit/paint";

/** 正反对决 / 材质对比（第 19 期 B4-2「瓷·铁 锁香 ✔ vs 砂·玻 见光死 ✖」） */
export const duel = defineTemplate({
  id: "duel",
  name: "正反对决",
  category: "对比",
  desc: "左右两栏正反对照：图标、名称、2-3 条理由，最后双标牌落定，错误一侧褪色。",
  aliases: ["对决", "对比", "正反", "材质对比", "vs"],
  fields: [
    { key: "eyebrow", type: "text", label: "眉题", optional: true, maxLen: 14, placeholder: "装茶的罐子怎么选" },
    { key: "title", type: "text", label: "标题", maxLen: 12, placeholder: "材质对决" },
    { key: "vs", type: "stamp", label: "中间印字", maxLen: 2, placeholder: "对" },
    { key: "leftName", type: "text", label: "左·名称（推荐）", maxLen: 8, placeholder: "瓷 · 铁" },
    { key: "leftIcon", type: "icon", label: "左·图标" },
    {
      key: "leftPoints",
      type: "list",
      label: "左·理由",
      itemLabel: "条",
      min: 1,
      max: 3,
      itemFields: [{ key: "text", type: "text", label: "理由", maxLen: 8 }],
    },
    { key: "leftVerdict", type: "text", label: "左·标牌", maxLen: 8, placeholder: "锁香" },
    { key: "rightName", type: "text", label: "右·名称（不推荐）", maxLen: 8, placeholder: "砂 · 玻" },
    { key: "rightIcon", type: "icon", label: "右·图标" },
    {
      key: "rightPoints",
      type: "list",
      label: "右·理由",
      itemLabel: "条",
      min: 1,
      max: 3,
      itemFields: [{ key: "text", type: "text", label: "理由", maxLen: 8 }],
    },
    { key: "rightVerdict", type: "text", label: "右·标牌", maxLen: 8, placeholder: "见光死" },
  ],
  defaults: {
    eyebrow: "装茶的罐子怎么选",
    title: "材质对决",
    vs: "对",
    leftName: "瓷 · 铁",
    leftIcon: "tin",
    leftPoints: [{ text: "不透光" }, { text: "密封好" }],
    leftVerdict: "锁香",
    rightName: "砂 · 玻",
    rightIcon: "jar",
    rightPoints: [{ text: "透光" }, { text: "透气跑香" }],
    rightVerdict: "见光死",
  },
  plan(c, tl) {
    tl.wait(0.2);
    const head = tl.mark(`标题: ${s(c, "title")}`, "对决", "intro", "tea/sfx/paper.wav");
    tl.wait(0.8);
    const left = tl.mark(`左: ${s(c, "leftName")}`, "推荐", "action", "tea/sfx/pop1.wav");
    tl.wait(0.7);
    const right = tl.mark(`右: ${s(c, "rightName")}`, "不推荐", "action", "tea/sfx/pop2.wav");
    tl.wait(0.6);
    const vs = tl.mark("对决印", "印", "stamp", "tea/sfx/wood-stamp.wav");
    tl.wait(0.6);
    const lp = items(c, "leftPoints", "text");
    const rp = items(c, "rightPoints", "text");
    const rows = Math.max(lp.length, rp.length);
    const pts: number[] = [];
    for (let i = 0; i < rows; i++) {
      pts.push(tl.t);
      tl.wait(0.85);
    }
    tl.mark("理由对照", "理由", "action", "tea/sfx/scale-b.wav");
    tl.wait(0.4);
    const verdict = tl.mark(`标牌: ${s(c, "leftVerdict")} / ${s(c, "rightVerdict")}`, "标牌", "stamp", "tea/sfx/stamp.wav");
    tl.wait(1.0);
    const focus = tl.mark("定格", "定格", "punchline");
    tl.wait(1.0);
    return { head, left, right, vs, pts, verdict, focus, d: tl.dur(0.55) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const top = header(env, { eyebrow: s(c, "eyebrow"), title: s(c, "title"), p: prog(t, P.head, 0.7) });
    const rows = Math.max(items(c, "leftPoints", "text").length, items(c, "rightPoints", "text").length, 1);
    const ch = 600 + rows * 130;
    const block = ch + 190;
    const y0 = Math.max(top + 30, top + (1800 - top - block) / 2);
    const cw = 430;
    const gapX = 40;
    const focus = easeOutCubic(prog(t, P.focus, 0.8));
    const sides = [
      { key: "left", x: W / 2 - gapX / 2 - cw, at: P.left, good: true },
      { key: "right", x: W / 2 + gapX / 2, at: P.right, good: false },
    ] as const;
    for (const side of sides) {
      const p = prog(t, side.at, P.d);
      if (p <= 0) continue;
      const e = easeOutCubic(p);
      const color = side.good ? pal.good : pal.seal;
      ctx.save();
      ctx.globalAlpha = e * (side.good ? 1 : 1 - 0.38 * focus);
      ctx.translate((1 - e) * (side.good ? -80 : 80), breath(t - side.at, 2, 3.4 + (side.good ? 0 : 0.6)));
      card(env, side.x, y0, cw, ch, {
        accent: null,
        border: alpha(color, 0.35 + (side.good ? 0.45 * focus : 0)),
        fill: side.good && focus > 0 ? undefined : undefined,
      });
      if (side.good && focus > 0) {
        ctx.save();
        ctx.globalAlpha *= focus * 0.6;
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(side.x - 8, y0 - 8, cw + 16, ch + 16, 32);
        ctx.stroke();
        ctx.restore();
      }
      const cx = side.x + cw / 2;
      // 图标底盘
      ctx.beginPath();
      ctx.arc(cx, y0 + 220, 150, 0, Math.PI * 2);
      ctx.fillStyle = alpha(color, 0.07);
      ctx.fill();
      drawIcon(ctx, s(c, `${side.key}Icon`), cx, y0 + 220, 220, side.good ? pal.ink : alpha(pal.ink, 0.85), easeOutBack(prog(t, side.at + 0.1, 0.5)));
      text(env, s(c, `${side.key}Name`), cx, y0 + 450, { size: 72, weight: 800, color: pal.ink, maxW: cw - 60, maxLines: 1 });
      ctx.fillStyle = alpha(color, 0.5);
      ctx.fillRect(cx - 40, y0 + 515, 80, 4);
      // 理由
      const list = items(c, `${side.key}Points`, "text");
      list.forEach((it, i) => {
        const pp = prog(t, P.pts[i] ?? P.pts[P.pts.length - 1], 0.45);
        if (pp <= 0) return;
        const yy = y0 + 620 + i * 130;
        ctx.save();
        ctx.globalAlpha *= easeOutCubic(pp);
        if (side.good) check(ctx, side.x + 72, yy, 60, color, pp);
        else cross(ctx, side.x + 72, yy, 60, color, pp);
        text(env, it.text, side.x + 122, yy, { size: 56, weight: 600, color: pal.ink, maxW: cw - 140, maxLines: 1, align: "left" });
        ctx.restore();
      });
      ctx.restore();
    }
    // 中间对决印
    seal(ctx, s(c, "vs") || "对", {
      x: W / 2,
      y: y0 + 220,
      size: 110,
      p: prog(t, P.vs, 0.4),
      filled: true,
      color: pal.seal,
      paper: pal.paper,
      rot: 0,
    });
    // 标牌
    const vy = y0 + ch + 110;
    plaque(env, s(c, "leftVerdict"), W / 2 - gapX / 2 - cw / 2, vy, prog(t, P.verdict, 0.5), { color: pal.good, maxW: cw + 20, size: 60, mark: "ok" });
    plaque(env, s(c, "rightVerdict"), W / 2 + gapX / 2 + cw / 2, vy, prog(t, P.verdict + 0.25, 0.5), { color: pal.seal, maxW: cw + 20, size: 60, mark: "bad" });
  },
});

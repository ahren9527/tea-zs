import { defineTemplate } from "../types";
import { items, s } from "../kit/content";
import { drawIcon } from "../kit/icons";
import { easeInOutCubic, easeOutCubic, lerp, prog } from "../kit/motion";
import { W, H, alpha, badge, blockText, card, seal, text, SEAL_FONT } from "../kit/paint";

/** 主题大字 · 要点（第 18 期 B3「干」/ B5「净」：大字开门 → 缩到页眉 → 要点逐条 → 禁忌盖印） */
export const lawPoints = defineTemplate({
  id: "law-points",
  name: "主题大字 · 要点",
  category: "要点",
  desc: "一个朱红大字开门，随后缩成页眉，1-4 条要点（对/错/提示）逐条出现，可选禁忌盖印收尾。",
  aliases: ["主题大字", "大字要点", "单字", "法则详解"],
  fields: [
    { key: "char", type: "stamp", label: "主题大字（1-2 字）", maxLen: 2, placeholder: "干" },
    { key: "kicker", type: "text", label: "大字下方一句", optional: true, maxLen: 12, placeholder: "必须够干" },
    {
      key: "points",
      type: "list",
      label: "要点",
      itemLabel: "条",
      min: 1,
      max: 4,
      itemFields: [
        { key: "text", type: "text", label: "要点", maxLen: 14 },
        { key: "sub", type: "text", label: "补充（可空）", optional: true, maxLen: 18 },
        { key: "icon", type: "icon", label: "图标" },
        {
          key: "kind",
          type: "select",
          label: "性质",
          options: [
            { value: "info", label: "提示" },
            { value: "ok", label: "✔ 推荐" },
            { value: "bad", label: "✖ 误区" },
          ],
        },
      ],
    },
    { key: "taboo", type: "text", label: "禁忌（留空不显示）", optional: true, maxLen: 10, placeholder: "别塞冰箱" },
    { key: "tabooStamp", type: "stamp", label: "禁忌印字", optional: true, maxLen: 2, placeholder: "禁" },
  ],
  defaults: {
    char: "干",
    kicker: "必须够干",
    points: [
      { text: "吸潮 ≠ 变醇", sub: "受潮的茶不会越放越好", icon: "damp", kind: "bad" },
      { text: "发酸、发霉", sub: "闻到酸味就已经晚了", icon: "warn", kind: "bad" },
      { text: "梅雨季开除湿机", sub: "室内湿度压到 60% 以下", icon: "hygro", kind: "ok" },
    ],
    taboo: "别塞冰箱",
    tabooStamp: "禁",
  },
  plan(c, tl) {
    tl.wait(0.2);
    const char = tl.mark(`大字: ${s(c, "char")}`, "开门", "intro", "tea/sfx/wood.wav");
    tl.wait(s(c, "kicker") ? 1.9 : 1.3);
    const shrink = tl.t;
    tl.wait(0.6);
    const pts = items(c, "points", "text");
    const at = pts.map((p, i) => {
      const a = tl.mark(`要点${i + 1}: ${p.text}`, p.kind === "bad" ? "误区" : p.kind === "ok" ? "推荐" : "要点", "action", `tea/sfx/pop${(i % 3) + 1}.wav`);
      tl.wait(pts.length > 2 ? 1.7 : 2.2);
      return a;
    });
    let taboo = -1;
    if (s(c, "taboo")) {
      taboo = tl.mark(`禁忌: ${s(c, "taboo")}`, "禁忌", "stamp", "tea/sfx/stamp.wav");
      tl.wait(1.6);
    }
    return { char, shrink, at, taboo, dShrink: tl.dur(0.7, 0.35), d: tl.dur(0.55) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const ch = s(c, "char");
    const kicker = s(c, "kicker");
    const k = easeInOutCubic(prog(t, P.shrink, P.dShrink));
    // 大字：中心 360px → 页眉 150px
    const cIn = easeOutCubic(prog(t, P.char, 0.6));
    const size = lerp(380, 150, k) * env.fs * (Array.from(ch).length > 1 ? 0.72 : 1);
    const cy = lerp(H / 2 - 80, 250, k);
    ctx.save();
    ctx.globalAlpha = cIn;
    ctx.font = `900 ${Math.round(size * (1.08 - 0.08 * cIn))}px ${SEAL_FONT}`;
    ctx.fillStyle = pal.seal;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, W / 2, cy);
    ctx.restore();
    if (kicker) {
      ctx.save();
      ctx.globalAlpha = easeOutCubic(prog(t, P.char + 0.7, 0.5));
      const ky = lerp(H / 2 + 200, 380, k);
      text(env, kicker, W / 2, ky, { size: lerp(84, 44, k), weight: lerp(700, 500, k), color: k > 0.5 ? pal.muted : pal.ink, maxW: 860, maxLines: 1, spacing: 4 });
      ctx.restore();
    }

    // 要点
    const pts = items(c, "points", "text");
    const top = kicker ? 470 : 420;
    const bottom = P.taboo >= 0 ? 1430 : 1720;
    const gap = 34;
    const h = Math.min(280, (bottom - top - gap * (pts.length - 1)) / Math.max(1, pts.length));
    const block = pts.length * h + (pts.length - 1) * gap;
    let y = top + (bottom - top - block) / 2;
    pts.forEach((pt, i) => {
      const p = prog(t, P.at[i], P.d);
      if (p > 0) {
        const e = easeOutCubic(p);
        const color = pt.kind === "bad" ? pal.seal : pt.kind === "ok" ? pal.good : pal.ink;
        ctx.save();
        ctx.globalAlpha = e;
        ctx.translate(0, (1 - e) * 40);
        card(env, 90, y, W - 180, h, { accent: color });
        const hasIcon = pt.icon && pt.icon !== "none";
        let tx = 140;
        if (hasIcon) {
          ctx.beginPath();
          ctx.arc(190, y + h / 2, Math.min(78, h * 0.32), 0, Math.PI * 2);
          ctx.fillStyle = alpha(color, 0.08);
          ctx.fill();
          drawIcon(ctx, pt.icon, 190, y + h / 2, Math.min(110, h * 0.42), color, e);
          tx = 290;
        }
        const badgeW = pt.kind === "ok" || pt.kind === "bad" ? 120 : 30;
        const maxW = W - 90 - badgeW - tx;
        blockText(env, { main: pt.text, sub: pt.sub?.trim(), x: tx, cy: y + h / 2, maxW, maxH: h - 36, size: 70, subSize: 38 });
        if (pt.kind === "ok" || pt.kind === "bad") badge(env, W - 160, y + h / 2, Math.min(96, h * 0.45), pt.kind, prog(t, P.at[i] + 0.35, 0.45));
        ctx.restore();
      }
      y += h + gap;
    });

    // 禁忌
    if (P.taboo >= 0) {
      const p = prog(t, P.taboo, P.d);
      if (p > 0) {
        const e = easeOutCubic(p);
        const y0 = 1500;
        ctx.save();
        ctx.globalAlpha = e;
        ctx.beginPath();
        ctx.roundRect(170, y0, W - 340, 200, 30);
        ctx.fillStyle = alpha(pal.seal, 0.07);
        ctx.fill();
        ctx.setLineDash([16, 10]);
        ctx.strokeStyle = pal.seal;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
        text(env, s(c, "taboo"), W / 2 - 60, y0 + 100, { size: 72, weight: 700, color: pal.seal, maxW: 520, maxLines: 1 });
        ctx.restore();
        seal(ctx, s(c, "tabooStamp") || "禁", {
          x: W - 260,
          y: y0 + 100,
          size: 150,
          p: prog(t, P.taboo + 0.3, 0.42),
          filled: true,
          color: pal.seal,
          paper: pal.paper,
          rot: 10,
        });
      }
    }
  },
});

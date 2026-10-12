import { defineTemplate } from "../types";
import { items, s } from "../kit/content";
import { drawIcon } from "../kit/icons";
import { breath, easeOutBack, easeOutCubic, prog } from "../kit/motion";
import { W, alpha, blockText, card, footLine, header, seal } from "../kit/paint";

/** 法则卡片（第 18 期 B2「干 / 封 / 净」三张卡） */
export const ruleCards = defineTemplate({
  id: "rule-cards",
  name: "法则卡片",
  category: "要点",
  desc: "2-5 张法则卡依次滑入，每张左侧落一枚字印，可配图标与一句说明。",
  aliases: ["三法则", "法则", "卡片", "要点卡"],
  fields: [
    { key: "eyebrow", type: "text", label: "眉题", optional: true, maxLen: 14, placeholder: "白茶存不好，就看三点" },
    { key: "title", type: "text", label: "标题", optional: true, maxLen: 12, placeholder: "存茶三法则" },
    {
      key: "cards",
      type: "list",
      label: "法则卡",
      itemLabel: "卡",
      min: 2,
      max: 5,
      itemFields: [
        { key: "mark", type: "stamp", label: "印字", maxLen: 2, placeholder: "干" },
        { key: "text", type: "text", label: "主文案", maxLen: 10, placeholder: "干不干" },
        { key: "sub", type: "text", label: "说明（可空）", optional: true, maxLen: 16 },
        { key: "icon", type: "icon", label: "图标" },
      ],
    },
    { key: "foot", type: "text", label: "底部一句", optional: true, maxLen: 16 },
  ],
  defaults: {
    eyebrow: "白茶存不好，就看三点",
    title: "存茶三法则",
    cards: [
      { mark: "干", text: "干不干", sub: "含水量是第一道关", icon: "damp" },
      { mark: "封", text: "封没封严", sub: "隔绝空气和光", icon: "lock" },
      { mark: "净", text: "有没有怪味", sub: "茶叶极易吸味", icon: "smell" },
    ],
    foot: "",
  },
  plan(c, tl) {
    tl.wait(0.2);
    const head = s(c, "title") || s(c, "eyebrow") ? tl.mark("标题", "标题", "intro", "tea/sfx/paper.wav") : -1;
    if (head >= 0) tl.wait(0.9);
    const list = items(c, "cards", "text");
    const at = list.map((it, i) => {
      const a = tl.mark(`法则${"一二三四五"[i]}: ${it.text}`, "法则", "action", `tea/sfx/pop${(i % 3) + 1}.wav`);
      tl.wait(list.length > 3 ? 1.5 : 2.1);
      return a;
    });
    const foot = s(c, "foot") ? tl.mark(`收束: ${s(c, "foot")}`, "收束", "punchline", "tea/sfx/scale-a.wav") : -1;
    tl.wait(foot >= 0 ? 1 : 0.2);
    return { head, at, foot, d: tl.dur(0.55) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const list = items(c, "cards", "text");
    const hasHead = P.head >= 0;
    const top = hasHead ? header(env, { eyebrow: s(c, "eyebrow"), title: s(c, "title") || "", p: prog(t, P.head, 0.7) }) + 30 : 320;
    const bottom = s(c, "foot") ? 1600 : 1720;
    const n = list.length;
    const gap = n > 3 ? 30 : 44;
    const h = Math.min(n <= 3 ? 340 : 300, (bottom - top - gap * (n - 1)) / n);
    const blockH = n * h + (n - 1) * gap;
    let y = top + (bottom - top - blockH) / 2;
    const x = 100;
    const w = W - 200;
    list.forEach((it, i) => {
      const at = P.at[i];
      const p = prog(t, at, P.d);
      if (p <= 0) {
        y += h + gap;
        return;
      }
      const e = easeOutCubic(p);
      const bob = breath(t - at, 2.4, 3.6 + i * 0.4);
      ctx.save();
      ctx.globalAlpha = e;
      ctx.translate((1 - e) * 140, bob);
      card(env, x, y, w, h, { fill: i % 2 === 0 ? undefined : alpha(pal.paperDeep, pal.dark ? 0.9 : 0.75) });
      const sealSize = Math.max(86, Math.min(170, h * 0.52));
      const sx = x + 48 + sealSize / 2;
      seal(ctx, it.mark || String(i + 1), {
        x: sx,
        y: y + h / 2,
        size: sealSize,
        p: prog(t, at + 0.18, 0.4),
        color: pal.seal,
        paper: pal.paper,
        rot: -6 + i * 3,
        seed: i + 2,
      });
      const hasIcon = it.icon && it.icon !== "none";
      const tx = sx + sealSize / 2 + 44;
      const maxW = x + w - tx - (hasIcon ? 150 : 40);
      blockText(env, { main: it.text, sub: it.sub?.trim(), x: tx, cy: y + h / 2, maxW, maxH: h - 36, size: 78, subSize: 40 });
      if (hasIcon) {
        const ip = easeOutBack(prog(t, at + 0.3, 0.5));
        drawIcon(ctx, it.icon, x + w - 90, y + h / 2, Math.min(124, h * 0.42), alpha(pal.seal, 0.75), ip);
      }
      ctx.restore();
      y += h + gap;
    });
    if (P.foot >= 0) footLine(env, s(c, "foot"), 1680, prog(t, P.foot, 0.6));
  },
});


import { defineTemplate } from "../types";
import { items, s } from "../kit/content";
import { breath, easeOutBack, easeOutCubic, prog } from "../kit/motion";
import { W, alpha, blockText, card, header, plaque, SEAL_FONT } from "../kit/paint";

/** 互动投票（第 18 期 B7「怎么喝 → A/B → 评论区聊聊」） */
export const poll = defineTemplate({
  id: "poll",
  name: "互动投票",
  category: "互动",
  desc: "提出一个问题，2-4 个选项卡依次出现并轮流点亮，最后落一块「评论区聊聊」标牌。",
  aliases: ["互动", "投票", "提问", "评论区"],
  fields: [
    { key: "eyebrow", type: "text", label: "眉题", optional: true, maxLen: 12, placeholder: "问问大家" },
    { key: "question", type: "textarea", label: "问题", maxLen: 16, placeholder: "你平时怎么喝？" },
    {
      key: "options",
      type: "list",
      label: "选项",
      itemLabel: "项",
      min: 2,
      max: 4,
      itemFields: [
        { key: "text", type: "text", label: "选项", maxLen: 10 },
        { key: "sub", type: "text", label: "补充（可空）", optional: true, maxLen: 16 },
      ],
    },
    { key: "cta", type: "text", label: "行动号召", maxLen: 10, placeholder: "评论区聊聊" },
  ],
  defaults: {
    eyebrow: "问问大家",
    question: "整饼白茶，你怎么喝？",
    options: [
      { text: "现喝现撬", sub: "喝多少撬多少" },
      { text: "提前分装", sub: "撬好放小罐里醒" },
    ],
    cta: "评论区聊聊",
  },
  plan(c, tl) {
    tl.wait(0.3);
    const q = tl.mark(`提问: ${s(c, "question")}`, "发问", "intro", "tea/sfx/ding.wav");
    tl.wait(1.6);
    const opts = items(c, "options", "text");
    const at = opts.map((o, i) => {
      const a = tl.mark(`选项${"ABCD"[i]}: ${o.text}`, `选项${"ABCD"[i]}`, "action", `tea/sfx/pop${(i % 3) + 1}.wav`);
      tl.wait(opts.length > 2 ? 1.3 : 1.9);
      return a;
    });
    const pulse = tl.t;
    tl.wait(1.2);
    const cta = tl.mark(`号召: ${s(c, "cta")}`, "互动", "punchline", "tea/sfx/scale-a.wav");
    tl.wait(1.4);
    return { q, at, pulse, cta, d: tl.dur(0.55) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const top = header(env, { eyebrow: s(c, "eyebrow"), title: s(c, "question"), p: prog(t, P.q, 0.8), size: 84 });
    const opts = items(c, "options", "text");
    const n = opts.length;
    const bottom = 1520;
    const gap = 40;
    const h = Math.min(n <= 2 ? 340 : 280, (bottom - top - gap * (n - 1)) / n);
    const block = n * h + gap * (n - 1);
    let y = top + (bottom - top - block) / 2;
    // 选项轮流点亮
    const pulseIdx = t >= P.pulse ? Math.floor((t - P.pulse) / 0.45) % n : -1;
    opts.forEach((o, i) => {
      const p = prog(t, P.at[i], P.d);
      if (p > 0) {
        const e = easeOutCubic(p);
        const lit = pulseIdx === i && t < P.cta + 0.6;
        ctx.save();
        ctx.globalAlpha = e;
        ctx.translate((1 - e) * (i % 2 ? 120 : -120), breath(t - P.at[i], 2, 3.5 + i * 0.3));
        card(env, 90, y, W - 180, h, { border: lit ? pal.seal : undefined, accent: lit ? pal.seal : alpha(pal.seal, 0.5) });
        // 字母印
        const box = Math.min(150, h * 0.5);
        const bx = 150;
        const by = y + h / 2 - box / 2;
        ctx.save();
        const pop = easeOutBack(prog(t, P.at[i] + 0.15, 0.4), 2);
        ctx.translate(bx + box / 2, by + box / 2);
        ctx.scale(pop, pop);
        ctx.beginPath();
        ctx.roundRect(-box / 2, -box / 2, box, box, 16);
        ctx.fillStyle = lit ? pal.seal : alpha(pal.seal, 0.08);
        ctx.fill();
        ctx.strokeStyle = pal.seal;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.fillStyle = lit ? pal.paper : pal.seal;
        ctx.font = `900 ${Math.round(box * 0.56)}px ${SEAL_FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ABCD"[i], 0, 3);
        ctx.restore();
        const tx = bx + box + 46;
        const maxW = W - 130 - tx;
        blockText(env, { main: o.text, sub: o.sub?.trim(), x: tx, cy: y + h / 2, maxW, maxH: h - 36, size: 76, subSize: 40 });
        ctx.restore();
      }
      y += h + gap;
    });
    plaque(env, s(c, "cta"), W / 2, 1650, prog(t, P.cta, 0.6), { filled: true, size: 64 });
  },
});

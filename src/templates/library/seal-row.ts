import { defineTemplate } from "../types";
import { items, s } from "../kit/content";
import { easeOutCubic, prog } from "../kit/motion";
import { W, H, alpha, brush, footLine, inkReveal, seal, text } from "../kit/paint";

/** 印章总结（第 18 期 B6「够干、封死、没味」三印） */
export const sealRow = defineTemplate({
  id: "seal-row",
  name: "印章总结",
  category: "收尾",
  desc: "一句引言后，2-4 枚方印依次砸落成一排，每枚可配一句小注，底部一句收束。",
  aliases: ["总结", "印章", "三印", "六个字", "口诀"],
  fields: [
    { key: "intro", type: "text", label: "引言", maxLen: 12, placeholder: "记住这六个字" },
    {
      key: "stamps",
      type: "list",
      label: "印章",
      itemLabel: "枚",
      min: 2,
      max: 4,
      itemFields: [
        { key: "text", type: "stamp", label: "印字（2-4 字）", maxLen: 4 },
        { key: "note", type: "text", label: "小注（可空）", optional: true, maxLen: 8 },
      ],
    },
    {
      key: "style",
      type: "select",
      label: "印风",
      options: [
        { value: "mixed", label: "朱白相间" },
        { value: "white", label: "白文（红底）" },
        { value: "red", label: "朱文（红框）" },
      ],
    },
    { key: "foot", type: "text", label: "底部一句", optional: true, maxLen: 16 },
  ],
  defaults: {
    intro: "记住这六个字",
    stamps: [
      { text: "够干", note: "含水量低" },
      { text: "封死", note: "隔绝空气" },
      { text: "没味", note: "远离异味" },
    ],
    style: "mixed",
    foot: "做到这三点，白茶才能越存越好",
  },
  plan(c, tl) {
    tl.wait(0.3);
    const intro = tl.mark(`引言: ${s(c, "intro")}`, "引言", "intro", "tea/sfx/paper.wav");
    tl.wait(1.3);
    const list = items(c, "stamps", "text");
    const at = list.map((it, i) => {
      const a = tl.mark(`印${i + 1}: ${it.text}`, `印${i + 1}`, "stamp", "tea/sfx/stamp.wav");
      tl.wait(1.4);
      return a;
    });
    const foot = s(c, "foot") ? tl.mark(`收束: ${s(c, "foot")}`, "收束", "punchline", "tea/sfx/scale-a.wav") : -1;
    tl.wait(foot >= 0 ? 1.3 : 0.5);
    return { intro, at, foot, d: tl.dur(0.42, 0.25) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const intro = s(c, "intro");
    const res = inkReveal(env, intro, W / 2, 640, { size: 92, weight: 700, color: pal.ink, maxW: 880, minSize: 48 }, prog(t, P.intro, 0.9), 0.07);
    if (res) brush(ctx, W / 2 - res.width / 2 - 10, 640 + res.size * 0.75, W / 2 + res.width / 2 + 10, 12, alpha(pal.seal, 0.75), prog(t, P.intro + 0.5, 0.6), 2);
    const list = items(c, "stamps", "text");
    const n = list.length;
    const gap = n > 3 ? 36 : 56;
    const size = Math.min(270, (900 - gap * (n - 1)) / n);
    const rowW = n * size + (n - 1) * gap;
    const style = s(c, "style");
    list.forEach((it, i) => {
      const x = W / 2 - rowW / 2 + size / 2 + i * (size + gap);
      const y = H / 2 + 20;
      const filled = style === "white" ? true : style === "red" ? false : i % 2 === 0;
      seal(ctx, it.text, { x, y, size, p: prog(t, P.at[i], P.d), filled, color: pal.seal, paper: pal.paper, rot: [-7, 4, -3, 6][i % 4], seed: i * 5 + 1 });
      if (it.note?.trim()) {
        ctx.save();
        ctx.globalAlpha = easeOutCubic(prog(t, P.at[i] + 0.35, 0.5));
        text(env, it.note, x, y + size / 2 + 80, { size: 40, weight: 500, color: pal.muted, maxW: size + gap - 10, maxLines: 1 });
        ctx.restore();
      }
    });
    if (P.foot >= 0) footLine(env, s(c, "foot"), 1440, prog(t, P.foot, 0.6), pal.ink);
  },
});

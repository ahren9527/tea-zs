import { defineTemplate } from "../types";
import { s } from "../kit/content";
import { drawIcon } from "../kit/icons";
import { breath, easeOutBack, easeOutCubic, prog, rand } from "../kit/motion";
import { W, H, alpha, fitSize, footLine, mix, seal, text, FONT_SONG } from "../kit/paint";

const MOODS = [
  { value: "night", label: "暗仓 · 夜" },
  { value: "day", label: "案头 · 晨" },
  { value: "plain", label: "素纸" },
];

/** 上下分屏 · 器物对读（第 18 期 B10「大罐存 · 小罐醒」/ 第 19 期 B6-1「昼夜双境 · 仓台对读」） */
export const splitPair = defineTemplate({
  id: "split-pair",
  name: "上下分屏 · 器物对读",
  category: "对比",
  desc: "上下两境各放一件器物与一句说明（夜仓 / 晨案），中线砸下横幅主标与印章，底部一句收束。",
  aliases: ["上下分屏", "对读", "分屏", "双境", "大罐小罐"],
  fields: [
    { key: "title", type: "text", label: "中线主标", maxLen: 14, placeholder: "大罐存 · 小罐醒" },
    { key: "stamp", type: "stamp", label: "主标印字", optional: true, maxLen: 2, placeholder: "准则" },
    { key: "topLabel", type: "text", label: "上·主句", maxLen: 10, placeholder: "大罐长期封存" },
    { key: "topSub", type: "text", label: "上·说明", optional: true, maxLen: 14, placeholder: "避光密封 · 静置陈化" },
    { key: "topIcon", type: "icon", label: "上·器物" },
    { key: "topMood", type: "select", label: "上·氛围", options: MOODS },
    { key: "bottomLabel", type: "text", label: "下·主句", maxLen: 10, placeholder: "小罐日常慢醒" },
    { key: "bottomSub", type: "text", label: "下·说明", optional: true, maxLen: 14, placeholder: "按周取用 · 唤醒茶香" },
    { key: "bottomIcon", type: "icon", label: "下·器物" },
    { key: "bottomMood", type: "select", label: "下·氛围", options: MOODS },
    { key: "foot", type: "text", label: "底部收束", optional: true, maxLen: 14, placeholder: "分工明确 · 滋味常新" },
  ],
  defaults: {
    title: "大罐存 · 小罐醒",
    stamp: "准则",
    topLabel: "大罐长期封存",
    topSub: "避光密封 · 静置陈化",
    topIcon: "urn",
    topMood: "night",
    bottomLabel: "小罐日常慢醒",
    bottomSub: "按周取用 · 唤醒茶香",
    bottomIcon: "jar",
    bottomMood: "day",
    foot: "分工明确 · 滋味常新",
  },
  plan(c, tl) {
    tl.wait(0.15);
    const top = tl.mark(`上: ${s(c, "topLabel")}`, "上境", "intro", "tea/sfx/ethereal-breeze.wav");
    tl.wait(1.5);
    const bottom = tl.mark(`下: ${s(c, "bottomLabel")}`, "下境", "action", "tea/sfx/celadon-chime.wav");
    tl.wait(1.5);
    const banner = tl.mark(`主标: ${s(c, "title")}`, "主标", "stamp", "tea/sfx/wood-stamp.wav");
    tl.wait(1.3);
    const foot = s(c, "foot") ? tl.mark(`收束: ${s(c, "foot")}`, "收束", "punchline", "tea/sfx/scale-a.wav") : -1;
    tl.wait(foot >= 0 ? 1.2 : 0.4);
    return { top, bottom, banner, foot, d: tl.dur(0.8) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const panels = [
      { key: "top", y: 90, h: 800, at: P.top },
      { key: "bottom", y: 1030, h: 690, at: P.bottom },
    ] as const;
    for (const pn of panels) {
      const p = prog(t, pn.at, P.d);
      if (p <= 0) continue;
      const e = easeOutCubic(p);
      const mood = s(c, `${pn.key}Mood`);
      const night = mood === "night";
      const day = mood === "day";
      const bg = night ? mix(pal.dark ? "#0e0d0c" : "#2a241d", pal.paper, pal.dark ? 0.1 : 0.06) : day ? mix(pal.paper, "#fff4d8", pal.dark ? 0.1 : 0.55) : pal.paperDeep;
      const fg = night ? "#efe6d6" : pal.ink;
      const sub = night ? "rgba(239, 230, 214, 0.66)" : pal.muted;
      ctx.save();
      // 由上往下展开
      ctx.beginPath();
      ctx.roundRect(60, pn.y, W - 120, pn.h * e, 28);
      ctx.clip();
      ctx.fillStyle = bg;
      ctx.fillRect(60, pn.y, W - 120, pn.h);
      if (night) {
        // 星点与月
        for (let i = 0; i < 40; i++) {
          ctx.globalAlpha = 0.25 + 0.35 * Math.sin(t * 1.6 + i);
          ctx.fillStyle = "#f3e9d2";
          ctx.fillRect(80 + rand(i) * (W - 160), pn.y + 20 + rand(i * 3) * pn.h * 0.5, 2.4, 2.4);
        }
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#e8dcc0";
        ctx.beginPath();
        ctx.arc(W - 200, pn.y + 130, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(W - 182, pn.y + 116, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (day) {
        const g = ctx.createRadialGradient(W - 160, pn.y + 60, 10, W - 160, pn.y + 60, 520);
        g.addColorStop(0, "rgba(244, 196, 104, 0.45)");
        g.addColorStop(1, "rgba(244, 196, 104, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(60, pn.y, W - 120, pn.h);
      }
      // 案面
      ctx.fillStyle = night ? "rgba(0,0,0,0.25)" : alpha(pal.ink, 0.06);
      ctx.fillRect(60, pn.y + pn.h * 0.66, W - 120, 6);
      const iconY = pn.y + pn.h * 0.4 + breath(t - pn.at, 4, 4);
      const isTop = pn.key === "top";
      drawIcon(ctx, s(c, `${pn.key}Icon`), W / 2, iconY, isTop ? 290 : 240, night ? "#efe6d6" : pal.ink, easeOutBack(prog(t, pn.at + 0.2, 0.7)));
      ctx.globalAlpha = easeOutCubic(prog(t, pn.at + 0.45, 0.6));
      text(env, s(c, `${pn.key}Label`), W / 2, pn.y + pn.h * 0.77, { size: 70, weight: 700, color: fg, maxW: 820, maxLines: 1 });
      text(env, s(c, `${pn.key}Sub`), W / 2, pn.y + pn.h * 0.77 + 82, { size: 38, weight: 500, color: sub, maxW: 820, maxLines: 1, spacing: 3 });
      ctx.restore();
    }
    // 中线横幅
    const bp = prog(t, P.banner, 0.5);
    if (bp > 0) {
      const e = easeOutBack(bp, 1.5);
      const title = s(c, "title");
      const size = fitSize(ctx, title, { size: 76, weight: 800, family: FONT_SONG }, 720, env.fs, 40);
      const by = 960;
      ctx.save();
      ctx.translate(W / 2, by + (1 - easeOutCubic(bp)) * -120);
      ctx.scale(0.8 + 0.2 * e, 0.8 + 0.2 * e);
      ctx.globalAlpha = Math.min(1, bp * 3);
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = pal.seal;
      ctx.beginPath();
      ctx.roundRect(-460, -78, 920, 156, 10);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = alpha(pal.paper, 0.55);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-448, -66, 896, 132, 6);
      ctx.stroke();
      ctx.fillStyle = pal.paper;
      ctx.font = `800 ${size}px ${FONT_SONG}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(title, s(c, "stamp") ? -40 : 0, 4);
      ctx.restore();
      if (s(c, "stamp")) {
        seal(ctx, s(c, "stamp"), { x: W / 2 + 390, y: by - 70, size: 120, p: prog(t, P.banner + 0.3, 0.42), color: pal.seal, paper: pal.paper, rot: 8 });
      }
    }
    if (P.foot >= 0) footLine(env, s(c, "foot"), H - 150, prog(t, P.foot, 0.6));
  },
});

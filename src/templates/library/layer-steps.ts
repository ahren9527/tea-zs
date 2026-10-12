import { defineTemplate } from "../types";
import { cnNum, items, s } from "../kit/content";
import { drawIcon } from "../kit/icons";
import { easeOutBack, easeOutCubic, inOut, prog } from "../kit/motion";
import { W, H, alpha, blockText, card, cross, footLine, header, mix, seal, text, SEAL_FONT } from "../kit/paint";

/** 分层步骤（第 18 期 B4「紫砂不能用 → 铝箔/塑料/纸箱三层」、B8「离墙一尺→离地半尺→架起来放」） */
export const layerSteps = defineTemplate({
  id: "layer-steps",
  name: "分层步骤",
  category: "方法",
  desc: "可选先否定一个错误做法，再把 2-5 个步骤/层次逐层叠出，底部一句点题。",
  aliases: ["分层", "步骤", "三层法", "层层"],
  fields: [
    { key: "eyebrow", type: "text", label: "眉题", optional: true, maxLen: 14, placeholder: "正确的封法" },
    { key: "title", type: "text", label: "标题", maxLen: 12, placeholder: "三层密封法" },
    { key: "taboo", type: "text", label: "先否定的做法（可空）", optional: true, maxLen: 10, placeholder: "紫砂罐" },
    { key: "tabooStamp", type: "stamp", label: "否定印字", optional: true, maxLen: 3, placeholder: "不能用" },
    {
      key: "layout",
      type: "select",
      label: "排布",
      options: [
        { value: "stack", label: "层层叠放（由内到外）" },
        { value: "stair", label: "阶梯递进" },
      ],
    },
    {
      key: "steps",
      type: "list",
      label: "步骤",
      itemLabel: "步",
      min: 2,
      max: 5,
      itemFields: [
        { key: "text", type: "text", label: "步骤", maxLen: 10 },
        { key: "sub", type: "text", label: "说明（可空）", optional: true, maxLen: 16 },
        { key: "icon", type: "icon", label: "图标" },
      ],
    },
    { key: "foot", type: "text", label: "底部一句", optional: true, maxLen: 14, placeholder: "挡潮 · 避光 · 隔味" },
  ],
  defaults: {
    eyebrow: "封，必须封严",
    title: "三层密封法",
    taboo: "紫砂罐存白茶",
    tabooStamp: "不能用",
    layout: "stack",
    steps: [
      { text: "铝箔袋", sub: "第一层 · 挡光隔氧", icon: "foil" },
      { text: "塑料袋", sub: "第二层 · 防潮", icon: "bag" },
      { text: "原装纸箱", sub: "第三层 · 避光隔味", icon: "box" },
    ],
    foot: "挡潮 · 避光 · 隔味",
  },
  plan(c, tl) {
    tl.wait(0.2);
    const head = tl.mark(`标题: ${s(c, "title")}`, "标题", "intro", "tea/sfx/paper.wav");
    tl.wait(0.9);
    let taboo = -1;
    let tabooOut = -1;
    if (s(c, "taboo")) {
      taboo = tl.mark(`否定: ${s(c, "taboo")}`, "警示", "stamp", "tea/sfx/stamp.wav");
      tl.wait(2.2);
      tabooOut = tl.t;
      tl.wait(0.4);
    }
    const steps = items(c, "steps", "text");
    const at = steps.map((st, i) => {
      const a = tl.mark(`第${cnNum(i)}步: ${st.text}`, `步骤${i + 1}`, "action", i === steps.length - 1 ? "tea/sfx/wood-lock.wav" : `tea/sfx/pop${(i % 3) + 1}.wav`);
      tl.wait(steps.length > 3 ? 1.4 : 1.8);
      return a;
    });
    const foot = s(c, "foot") ? tl.mark(`点题: ${s(c, "foot")}`, "点题", "punchline", "tea/sfx/airtight-seal.wav") : -1;
    tl.wait(foot >= 0 ? 1.1 : 0.3);
    return { head, taboo, tabooOut, at, foot, d: tl.dur(0.55) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const top = header(env, { eyebrow: s(c, "eyebrow"), title: s(c, "title"), p: prog(t, P.head, 0.7) });

    // 否定的做法：居中大卡 + 印章，随后退场
    if (P.taboo >= 0) {
      const a = inOut(t, P.taboo, 0.45, P.tabooOut, 0.4);
      if (a > 0) {
        ctx.save();
        ctx.globalAlpha = a;
        const y0 = H / 2 - 170;
        card(env, 170, y0, W - 340, 300, { accent: null, fill: alpha(pal.seal, 0.06), border: alpha(pal.seal, 0.5) });
        text(env, s(c, "taboo"), W / 2, y0 + 150, { size: 80, weight: 700, color: pal.seal, maxW: 640, maxLines: 2 });
        cross(ctx, W / 2, y0 + 150, 420, alpha(pal.seal, 0.35), prog(t, P.taboo + 0.25, 0.3));
        seal(ctx, s(c, "tabooStamp") || "不能用", {
          x: W - 250,
          y: y0 + 300,
          size: 190,
          p: prog(t, P.taboo + 0.35, 0.42),
          color: pal.seal,
          paper: pal.paper,
          rot: -10,
        });
        ctx.restore();
      }
    }

    const steps = items(c, "steps", "text");
    const n = steps.length;
    const bottom = s(c, "foot") ? 1600 : 1740;
    const gap = n > 3 ? 26 : 40;
    const h = Math.min(n <= 3 ? 290 : 250, (bottom - top - gap * (n - 1)) / n);
    const block = n * h + (n - 1) * gap;
    const y0 = top + (bottom - top - block) / 2;
    const stair = s(c, "layout") === "stair";
    // 连接脊线
    const firstP = n ? prog(t, P.at[0], 0.4) : 0;
    if (firstP > 0) {
      const lastIdx = steps.findIndex((_, i) => t < P.at[i]);
      const shown = lastIdx === -1 ? n : lastIdx;
      ctx.save();
      ctx.strokeStyle = alpha(pal.seal, 0.35);
      ctx.lineWidth = 3;
      ctx.setLineDash([2, 10]);
      ctx.lineCap = "round";
      ctx.beginPath();
      const sx = stair ? 0 : 175;
      if (!stair) {
        ctx.moveTo(sx, y0 + h / 2);
        ctx.lineTo(sx, y0 + (shown - 1) * (h + gap) + h / 2);
      }
      ctx.stroke();
      ctx.restore();
    }
    steps.forEach((st, i) => {
      const p = prog(t, P.at[i], P.d);
      if (p <= 0) return;
      const e = easeOutCubic(p);
      const indent = stair ? (n - 1 - i) * 0 + i * 46 : 0;
      const x = (stair ? 70 : 90) + indent;
      const w = W - 180 - (stair ? (n - 1) * 46 - 20 : 0);
      const y = y0 + i * (h + gap);
      // 叠放：越外层底色越深
      const depth = n > 1 ? i / (n - 1) : 0;
      ctx.save();
      ctx.globalAlpha = e;
      ctx.translate(0, (1 - easeOutBack(p, 1.4)) * -50);
      card(env, x, y, w, h, {
        fill: mix(pal.dark ? pal.paperDeep : "#ffffff", pal.paperDeep, pal.dark ? depth * 0.5 : 0.25 + depth * 0.6),
        accent: null,
      });
      // 序号圆印
      const r = Math.min(58, h * 0.24);
      const nx = x + 85;
      ctx.beginPath();
      ctx.arc(nx, y + h / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = pal.seal;
      ctx.fill();
      ctx.fillStyle = pal.paper;
      ctx.font = `900 ${Math.round(r * 1.05)}px ${SEAL_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cnNum(i), nx, y + h / 2 + 2);
      const hasIcon = st.icon && st.icon !== "none";
      const tx = nx + r + 40;
      const maxW = x + w - tx - (hasIcon ? 150 : 40);
      blockText(env, { main: st.text, sub: st.sub?.trim(), x: tx, cy: y + h / 2, maxW, maxH: h - 36, size: 74, subSize: 38 });
      if (hasIcon) drawIcon(ctx, st.icon, x + w - 95, y + h / 2, Math.min(124, h * 0.45), alpha(pal.seal, 0.8), easeOutBack(prog(t, P.at[i] + 0.2, 0.5)));
      ctx.restore();
    });
    if (P.foot >= 0) footLine(env, s(c, "foot"), 1690, prog(t, P.foot, 0.6));
  },
});

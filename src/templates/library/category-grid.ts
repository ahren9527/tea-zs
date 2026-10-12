import { defineTemplate } from "../types";
import { items, s } from "../kit/content";
import { drawIcon } from "../kit/icons";
import { easeOutBack, easeOutCubic, prog } from "../kit/motion";
import { W, alpha, card, drawLines, footLine, header, layoutText, text, FONT } from "../kit/paint";

/** 分类卡网格（茶类 / 产品 / 场景 等 2-9 项并列介绍） */
export const categoryGrid = defineTemplate({
  id: "category-grid",
  name: "分类卡网格",
  category: "要点",
  desc: "2-9 张分类卡按网格依次弹出（自动 2 列 / 3 列），每张含图标、名称与一句说明。",
  aliases: ["分类", "网格", "卡片网格", "品类", "产品"],
  fields: [
    { key: "eyebrow", type: "text", label: "眉题", optional: true, maxLen: 14, placeholder: "正上茶舍的三款白茶" },
    { key: "title", type: "text", label: "标题", maxLen: 12, placeholder: "三款茶怎么选" },
    {
      key: "items",
      type: "list",
      label: "分类卡",
      itemLabel: "张",
      min: 2,
      max: 9,
      itemFields: [
        { key: "name", type: "text", label: "名称", maxLen: 6 },
        { key: "tag", type: "text", label: "小标签（可空）", optional: true, maxLen: 6 },
        { key: "note", type: "text", label: "说明", optional: true, maxLen: 16 },
        { key: "icon", type: "icon", label: "图标" },
      ],
    },
    { key: "foot", type: "text", label: "底部一句", optional: true, maxLen: 16 },
  ],
  defaults: {
    eyebrow: "正上茶舍的三款白茶",
    title: "三款茶怎么选",
    items: [
      { name: "素雪", tag: "白牡丹", note: "清甜鲜爽，适合入门", icon: "bud" },
      { name: "蜜韵", tag: "寿眉", note: "枣香蜜韵，耐泡耐煮", icon: "leaf" },
      { name: "月影", tag: "贡眉", note: "花香柔和，日常口粮", icon: "cup" },
    ],
    foot: "",
  },
  plan(c, tl) {
    tl.wait(0.2);
    const head = tl.mark(`标题: ${s(c, "title")}`, "标题", "intro", "tea/sfx/paper.wav");
    tl.wait(0.9);
    const list = items(c, "items", "name");
    const step = list.length > 6 ? 0.55 : list.length > 3 ? 0.8 : 1.3;
    const at = list.map((it, i) => {
      const a = tl.mark(`${i + 1}. ${it.name}`, "分类", "action", `tea/sfx/pop${(i % 3) + 1}.wav`);
      tl.wait(step);
      return a;
    });
    tl.wait(0.8);
    const foot = s(c, "foot") ? tl.mark(`收束: ${s(c, "foot")}`, "收束", "punchline", "tea/sfx/scale-a.wav") : -1;
    tl.wait(foot >= 0 ? 1.1 : 0.4);
    return { head, at, foot, d: tl.dur(0.5) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    const top = header(env, { eyebrow: s(c, "eyebrow"), title: s(c, "title"), p: prog(t, P.head, 0.7) });
    const list = items(c, "items", "name");
    const n = list.length;
    const cols = n <= 2 ? 2 : n === 3 ? 1 : n === 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const bottom = s(c, "foot") ? 1600 : 1740;
    const gap = 32;
    const gw = 920;
    const w = (gw - gap * (cols - 1)) / cols;
    const maxH = cols === 1 ? 340 : 520;
    const h = Math.min(maxH, (bottom - top - gap * (rows - 1)) / rows);
    const blockH = rows * h + (rows - 1) * gap;
    const y0 = top + (bottom - top - blockH) / 2;
    list.forEach((it, i) => {
      const p = prog(t, P.at[i], P.d);
      if (p <= 0) return;
      const row = Math.floor(i / cols);
      const col = i % cols;
      const inRow = row === rows - 1 ? n - row * cols : cols;
      const rowW = inRow * w + (inRow - 1) * gap;
      const x = (W - rowW) / 2 + col * (w + gap);
      const y = y0 + row * (h + gap);
      const e = easeOutBack(p, 1.5);
      ctx.save();
      ctx.globalAlpha = easeOutCubic(p);
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(0.88 + 0.12 * e, 0.88 + 0.12 * e);
      ctx.translate(-(x + w / 2), -(y + h / 2));
      card(env, x, y, w, h, { accent: null });
      const hasIcon = it.icon && it.icon !== "none";
      if (cols === 1) {
        // 横向卡：图标在左
        let tx = x + 60;
        if (hasIcon) {
          ctx.beginPath();
          ctx.arc(x + 130, y + h / 2, Math.min(80, h * 0.3), 0, Math.PI * 2);
          ctx.fillStyle = alpha(pal.seal, 0.07);
          ctx.fill();
          drawIcon(ctx, it.icon, x + 130, y + h / 2, Math.min(110, h * 0.4), pal.seal, 1);
          tx = x + 250;
        }
        const maxW = x + w - tx - 40;
        const tag = it.tag?.trim();
        ctx.save();
        const nameLay = layoutText(ctx, it.name, { size: 80, weight: 800 }, maxW - (tag ? 200 : 0), env.fs, { maxLines: 1, minSize: 34 });
        const note = it.note?.trim();
        const nameY = note ? y + h / 2 - 38 : y + h / 2;
        drawLines(ctx, nameLay.lines, tx, nameY, nameLay.size, { weight: 800, color: pal.ink, align: "left" });
        if (tag) {
          ctx.font = `800 ${nameLay.size}px ${FONT}`;
          const nw = ctx.measureText(nameLay.lines[0]).width;
          tagPill(env, tag, tx + nw + 24, nameY);
        }
        if (note) text(env, note, tx, y + h / 2 + 52, { size: 42, weight: 500, color: pal.muted, maxW, maxLines: 1, align: "left" });
        ctx.restore();
      } else {
        const iconS = Math.min(140, w * 0.34, h * 0.32);
        const tag = it.tag?.trim();
        const note = it.note?.trim();
        let cy = y + h * (note ? 0.3 : 0.36);
        if (hasIcon) {
          ctx.beginPath();
          ctx.arc(x + w / 2, cy, iconS * 0.72, 0, Math.PI * 2);
          ctx.fillStyle = alpha(pal.seal, 0.07);
          ctx.fill();
          drawIcon(ctx, it.icon, x + w / 2, cy, iconS, pal.seal, 1);
          cy += iconS * 0.72 + 30;
        } else cy = y + h * 0.3;
        const nameSize = cols === 3 ? 58 : 70;
        text(env, it.name, x + w / 2, cy + nameSize * 0.5, { size: nameSize, weight: 800, color: pal.ink, maxW: w - 40, maxLines: 1 });
        cy += nameSize * env.fs + 20;
        if (tag) {
          tagPill(env, tag, x + w / 2, cy + 6, "center");
          cy += 64;
        }
        if (note && cy < y + h - 40) {
          const lay = layoutText(ctx, note, { size: cols === 3 ? 30 : 36, weight: 500 }, w - 50, env.fs, { maxLines: 2, minSize: 22, oneLineMin: 999 });
          drawLines(ctx, lay.lines, x + w / 2, Math.min(cy + lay.size * 0.9, y + h - 30 - (lay.lines.length - 1) * lay.size * 0.64), lay.size, { weight: 500, color: pal.muted, lh: 1.3 });
        }
      }
      ctx.restore();
    });
    if (P.foot >= 0) footLine(env, s(c, "foot"), 1690, prog(t, P.foot, 0.6));
  },
});

function tagPill(env: Parameters<typeof card>[0], label: string, x: number, cy: number, align: "left" | "center" = "left") {
  const { ctx, pal } = env;
  const size = Math.round(30 * env.fs);
  ctx.save();
  ctx.font = `600 ${size}px ${FONT}`;
  const tw = ctx.measureText(label).width;
  const w = tw + 36;
  const h = size + 18;
  const x0 = align === "center" ? x - w / 2 : x;
  ctx.beginPath();
  ctx.roundRect(x0, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = alpha(pal.seal, 0.1);
  ctx.fill();
  ctx.strokeStyle = alpha(pal.seal, 0.6);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = pal.seal;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x0 + w / 2, cy + 1);
  ctx.restore();
}

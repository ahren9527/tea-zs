import { defineTemplate } from "../types";
import { n, s, b } from "../kit/content";
import { drawIcon } from "../kit/icons";
import { clamp, easeOutBack, easeOutCubic, lerp, prog, rand } from "../kit/motion";
import { W, alpha, badge, brush, fitSize, mix, plaque, seal, FONT_SONG } from "../kit/paint";

const HAZARDS = [
  { value: "smoke", label: "油烟 / 异味侵入" },
  { value: "damp", label: "潮气 / 水汽" },
  { value: "light", label: "强光直射" },
  { value: "heat", label: "高温" },
  { value: "air", label: "开口跑香" },
];

/** 雷区警示（第 19 期 B5-1「极易吸味·避开厨房油烟」、B5-2「梅雨大开·湿度飙升」） */
export const dangerZone = defineTemplate({
  id: "danger-zone",
  name: "雷区警示",
  category: "警示",
  desc: "雷区编号印 + 标题，中央圆境里危害（油烟/潮气/强光/高温/跑香）侵入器物，可选仪表数值，底部标牌落定。",
  aliases: ["雷区", "警示", "危害", "禁区"],
  fields: [
    { key: "badge", type: "stamp", label: "雷区印（2-4 字）", maxLen: 4, placeholder: "雷区一" },
    { key: "title", type: "text", label: "标题", maxLen: 10, placeholder: "极易吸味" },
    { key: "hazard", type: "select", label: "危害类型", options: HAZARDS },
    { key: "subject", type: "icon", label: "受害器物" },
    { key: "source", type: "icon", label: "危害来源图标（可空）", optional: true },
    { key: "meter", type: "toggle", label: "显示仪表数值" },
    { key: "meterLabel", type: "text", label: "仪表名称", optional: true, maxLen: 6, placeholder: "湿度" },
    { key: "meterValue", type: "number", label: "仪表数值", min: 0, max: 100, step: 1, unit: "%" },
    { key: "sign", type: "text", label: "底部标牌", maxLen: 12, placeholder: "避开厨房油烟" },
    {
      key: "signMark",
      type: "select",
      label: "标牌记号",
      options: [
        { value: "bad", label: "✖" },
        { value: "ok", label: "✔" },
        { value: "", label: "无" },
      ],
    },
  ],
  defaults: {
    badge: "雷区一",
    title: "极易吸味",
    hazard: "smoke",
    subject: "jar",
    source: "smell",
    meter: false,
    meterLabel: "湿度",
    meterValue: 85,
    sign: "避开厨房油烟",
    signMark: "bad",
  },
  plan(c, tl) {
    tl.wait(0.1);
    const head = tl.mark(`标题: ${s(c, "title")}`, "起幅", "intro", "tea/sfx/paper.wav");
    tl.wait(0.4);
    const badgeAt = tl.mark(`印: ${s(c, "badge")}`, "印章", "stamp", "tea/sfx/stamp.wav");
    tl.wait(0.5);
    const hazard = tl.mark("危害侵入", "侵入", "action", s(c, "hazard") === "damp" ? "tea/sfx/water-drop.wav" : "tea/sfx/ethereal-breeze.wav");
    tl.wait(1.1);
    const spoil = tl.mark("器物受损", "受损", "action", "tea/sfx/tea-rustle-hiss.wav");
    let meter = -1;
    if (b(c, "meter")) {
      tl.wait(0.2);
      meter = tl.mark(`${s(c, "meterLabel")} ${n(c, "meterValue")}%`, "数值", "action", "tea/sfx/slider-settle.wav");
      tl.wait(0.9);
    } else tl.wait(0.8);
    const sign = tl.mark(`标牌: ${s(c, "sign")}`, "标牌", "stamp", "tea/sfx/wood-stamp.wav");
    tl.wait(1.3);
    return { head, badgeAt, hazard, spoil, meter, sign, d: tl.dur(0.6), dHaz: tl.dur(1.6) };
  },
  draw(env, c, P) {
    const { ctx, pal, t } = env;
    // 标题行：印 + 标题，整体居中
    const title = s(c, "title");
    const titleP = easeOutCubic(prog(t, P.head, 0.6));
    const size = fitSize(ctx, title, { size: 92, weight: 800, family: FONT_SONG }, 620, env.fs, 48);
    ctx.save();
    ctx.font = `800 ${size}px ${FONT_SONG}`;
    const tw = ctx.measureText(title).width;
    const sealSize = Array.from(s(c, "badge")).length > 2 ? 160 : 130;
    const total = sealSize + 36 + tw;
    const sx = W / 2 - total / 2;
    ctx.globalAlpha = titleP;
    ctx.fillStyle = pal.ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(title, sx + sealSize + 36, 250 + (1 - titleP) * -16);
    ctx.restore();
    seal(ctx, s(c, "badge"), { x: sx + sealSize / 2, y: 250, size: sealSize, p: prog(t, P.badgeAt, 0.42), filled: true, color: pal.seal, paper: pal.paper, rot: -6 });
    brush(ctx, W / 2 - 200, 360, W / 2 + 200, 12, alpha(pal.seal, 0.7), easeOutCubic(prog(t, P.head + 0.3, 0.6)), 4);

    // 中央圆境
    const cx = W / 2;
    const hasMeter = P.meter >= 0;
    const cy = hasMeter ? 880 : 940;
    const R = 350;
    const sceneP = easeOutCubic(prog(t, P.head + 0.15, 0.7));
    const spoil = easeOutCubic(prog(t, P.spoil, P.dHaz));
    ctx.save();
    ctx.globalAlpha = sceneP;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(cx, cy - 80, 40, cx, cy, R);
    g.addColorStop(0, mix(pal.paper, "#ffffff", pal.dark ? 0.04 : 0.4));
    g.addColorStop(1, pal.paperDeep);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = alpha(pal.ink, 0.18);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R + 16, 0, Math.PI * 2);
    ctx.strokeStyle = alpha(pal.seal, 0.25 + 0.35 * spoil);
    ctx.setLineDash([3, 12]);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    // 圆内裁剪：危害动画
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
    ctx.clip();
    const hz = s(c, "hazard");
    const ht = t - P.hazard;
    if (ht > 0) drawHazard(ctx, hz, ht, cx, cy, R, pal.ink, pal.seal, pal.paper);
    ctx.restore();
    // 受害器物：逐渐被「侵染」
    const subjColor = mix(pal.dark ? "#ece4d8" : "#2b251e", pal.dark ? "#cb443b" : "#8a5a3c", spoil * 0.75);
    drawIcon(ctx, s(c, "subject"), cx, cy + 40, 300, subjColor, easeOutBack(prog(t, P.head + 0.2, 0.6)));
    const src = s(c, "source");
    if (src && src !== "none") {
      drawIcon(ctx, src, cx - R * 0.62, cy - R * 0.6, 110, alpha(pal.seal, 0.85), easeOutBack(prog(t, P.hazard, 0.5)));
    }
    if (spoil > 0) badge(env, cx + 150, cy - 130, 110, "bad", prog(t, P.spoil + 0.4, 0.45));
    ctx.restore();

    // 仪表
    if (P.meter >= 0) {
      const p = prog(t, P.meter, 0.9);
      if (p > 0) {
        const v = n(c, "meterValue");
        const k = easeOutCubic(p);
        const cur = Math.round(v * k);
        const y0 = 1340;
        const bw = 640;
        const x0 = W / 2 - bw / 2;
        const hot = cur >= 60;
        ctx.save();
        ctx.globalAlpha = clamp(p * 3);
        ctx.fillStyle = pal.muted;
        ctx.font = `600 ${Math.round(40 * env.fs)}px ${FONT_SONG}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(s(c, "meterLabel"), x0, y0 - 40);
        ctx.textAlign = "right";
        ctx.fillStyle = hot ? pal.seal : pal.ink;
        ctx.font = `800 ${Math.round(76 * env.fs)}px ${FONT_SONG}`;
        ctx.fillText(`${cur}%`, x0 + bw, y0 - 50);
        ctx.fillStyle = alpha(pal.ink, 0.1);
        ctx.beginPath();
        ctx.roundRect(x0, y0, bw, 22, 11);
        ctx.fill();
        const grad = ctx.createLinearGradient(x0, 0, x0 + bw, 0);
        grad.addColorStop(0, pal.good);
        grad.addColorStop(0.55, mix(pal.good, pal.seal, 0.5));
        grad.addColorStop(1, pal.seal);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x0, y0, Math.max(22, (bw * cur) / 100), 22, 11);
        ctx.fill();
        // 刻度 60% 警戒线
        ctx.fillStyle = alpha(pal.ink, 0.5);
        ctx.fillRect(x0 + bw * 0.6, y0 - 10, 2, 42);
        ctx.restore();
      }
    }
    const mark = s(c, "signMark");
    plaque(env, s(c, "sign"), W / 2, hasMeter ? 1580 : 1520, prog(t, P.sign, 0.55), {
      color: mark === "ok" ? pal.good : pal.seal,
      mark: mark === "ok" || mark === "bad" ? mark : "",
      size: 66,
    });
  },
});

function drawHazard(ctx: CanvasRenderingContext2D, kind: string, ht: number, cx: number, cy: number, R: number, ink: string, seal: string, paper: string) {
  ctx.save();
  if (kind === "smoke") {
    // 油烟：一团团柔和烟雾从左上方卷入，飘向器物
    for (let i = 0; i < 14; i++) {
      const life = (ht * 0.32 + i / 14) % 1;
      const a = Math.sin(life * Math.PI) * clamp(ht / 0.6);
      if (a <= 0.01) continue;
      const x = lerp(cx - R * 1.05, cx + R * 0.15, life) + Math.sin(life * 6 + i) * 30;
      const y = lerp(cy - R * 0.75 + rand(i) * 120, cy + 10, life) + Math.cos(life * 4 + i) * 20;
      const r = 50 + life * 70 + rand(i * 3) * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, alpha(ink, 0.22 * a));
      g.addColorStop(1, alpha(ink, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = alpha(ink, 0.35);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
      const life = (ht * 0.4 + i / 4) % 1;
      ctx.globalAlpha = Math.sin(life * Math.PI) * clamp(ht / 0.6);
      ctx.beginPath();
      for (let k = 0; k <= 18; k++) {
        const u = k / 18;
        const x = lerp(cx - R * 0.95, cx - 40, u * 0.6 + life * 0.4);
        const y = cy - R * 0.45 + i * 46 + Math.sin(u * 7 + ht * 2.2 + i) * 16 - u * 30;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (kind === "air") {
    // 跑香：一缕缕朱色香气从器物口向上逸散
    const count = 7;
    ctx.lineCap = "round";
    for (let i = 0; i < count; i++) {
      const life = (ht * 0.45 + i / count) % 1;
      const a = Math.sin(life * Math.PI) * clamp(ht / 0.6);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a * 0.6;
      ctx.strokeStyle = alpha(seal, 0.8);
      ctx.lineWidth = 6 + rand(i) * 4;
      ctx.beginPath();
      for (let k = 0; k <= 16; k++) {
        const u = k / 16;
        const x = cx + (i - count / 2) * 20 + Math.sin(u * 5 + ht * 2.4 + i) * 26;
        const y = cy - 90 - (life * 0.9 + u * 0.35) * R;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (kind === "damp") {
    ctx.fillStyle = alpha(ink, 0.12);
    ctx.beginPath();
    ctx.ellipse(cx, cy - R * 0.72, R * 0.8, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 26; i++) {
      const speed = 0.7 + rand(i) * 0.6;
      const life = (ht * speed + rand(i * 7)) % 1;
      const x = cx - R * 0.8 + rand(i * 3) * R * 1.6;
      const y = cy - R * 0.62 + life * R * 1.3;
      ctx.globalAlpha = clamp(ht / 0.5) * (1 - life) * 0.8;
      ctx.fillStyle = alpha("#4f7aa3", 0.85);
      ctx.beginPath();
      ctx.moveTo(x, y - 18);
      ctx.quadraticCurveTo(x + 9, y, x, y + 8);
      ctx.quadraticCurveTo(x - 9, y, x, y - 18);
      ctx.fill();
    }
  } else if (kind === "light") {
    const a = clamp(ht / 0.5);
    for (let i = 0; i < 6; i++) {
      const sway = Math.sin(ht * 1.5 + i) * 0.03;
      const ang = -2.35 + i * 0.09 + sway;
      ctx.globalAlpha = a * (0.16 + 0.08 * Math.sin(ht * 3 + i));
      ctx.fillStyle = "#e9b949";
      ctx.beginPath();
      const ox = cx + R * 0.9;
      const oy = cy - R * 0.9;
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(ang - 0.05) * R * 2.2, oy - Math.sin(ang - 0.05) * R * 2.2);
      ctx.lineTo(ox + Math.cos(ang + 0.05) * R * 2.2, oy - Math.sin(ang + 0.05) * R * 2.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = a * 0.9;
    ctx.fillStyle = "#e9b949";
    ctx.beginPath();
    ctx.arc(cx + R * 0.72, cy - R * 0.72, 48, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "heat") {
    for (let i = 0; i < 7; i++) {
      const x = cx - R * 0.6 + (i / 6) * R * 1.2;
      const hgt = 70 + Math.sin(ht * 6 + i * 1.3) * 22 + rand(i) * 30;
      ctx.globalAlpha = clamp(ht / 0.5) * 0.7;
      ctx.fillStyle = i % 2 ? "#d9822b" : seal;
      ctx.beginPath();
      const by = cy + R * 0.82;
      ctx.moveTo(x - 30, by);
      ctx.quadraticCurveTo(x - 18, by - hgt * 0.6, x, by - hgt);
      ctx.quadraticCurveTo(x + 18, by - hgt * 0.6, x + 30, by);
      ctx.fill();
    }
    // 热浪
    ctx.strokeStyle = alpha(seal, 0.4);
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = clamp(ht / 0.8) * 0.8;
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        const x = cx - R * 0.7 + (k / 20) * R * 1.4;
        const y = cy + R * 0.45 - i * 50 + Math.sin(k * 0.8 + ht * 4 + i) * 8;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  void paper;
  ctx.restore();
}

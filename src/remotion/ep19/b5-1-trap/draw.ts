import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT_SONG, type AnimParams } from "@/remotion/shared/theme";
import {
  CLOUD_PUFFS,
  getCloudPuffState,
  STAMP_DEFAULT,
  TITLE_DEFAULT,
} from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);

  const fontScale = params.fontScale ?? 1;
  const titleText = params.customTexts?.title || TITLE_DEFAULT;
  const stampText = params.customTexts?.stamp || STAMP_DEFAULT;

  const t = elapsed / 1000; // time in seconds

  function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }

  function easeBackOut(prog: number, s = 1.7) {
    const p = clamp(prog, 0, 1) - 1;
    return p * p * ((s + 1) * p + s) + 1;
  }

  function easePower2Out(prog: number) {
    const p = clamp(prog, 0, 1);
    return 1 - (1 - p) * (1 - p);
  }

  // ----------------------------------------------------
  // 四角古典 L 型细线框
  // ----------------------------------------------------
  ctx.save();
  ctx.strokeStyle = "rgba(110, 83, 63, 0.4)";
  ctx.lineWidth = 1.5;
  const pad = 60;
  const len = 36;
  ctx.beginPath();
  // Top-left
  ctx.moveTo(pad + len, pad);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad, pad + len);
  // Top-right
  ctx.moveTo(1080 - pad - len, pad);
  ctx.lineTo(1080 - pad, pad);
  ctx.lineTo(1080 - pad, pad + len);
  // Bottom-left
  ctx.moveTo(pad + len, 1920 - pad);
  ctx.lineTo(pad, 1920 - pad);
  ctx.lineTo(pad, 1920 - pad - len);
  // Bottom-right
  ctx.moveTo(1080 - pad - len, 1920 - pad);
  ctx.lineTo(1080 - pad, 1920 - pad);
  ctx.lineTo(1080 - pad, 1920 - pad - len);
  ctx.stroke();
  ctx.restore();

  // ----------------------------------------------------
  // 顶部主标区（Flex 居中横向排版，间距 gap: 24px）
  // 0.0s - 0.6s: 标题淡入上浮
  // 0.4s: 印章落印（严格 56x56px，scale: 2.0 -> 1，ease: back.out(2)）
  // ----------------------------------------------------
  const titleProg = easePower2Out(clamp(t / 0.6, 0, 1));
  const titleY = 200 + (1 - titleProg) * -20;
  const titleAlpha = titleProg;

  ctx.save();
  ctx.globalAlpha = titleAlpha;
  ctx.font = `700 ${Math.round(54 * fontScale)}px ${FONT_SONG}`;
  ctx.fillStyle = "#4A3425";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const textWidth = ctx.measureText(titleText).width;
  const stampSize = 56 * fontScale;
  const gap = 24;
  const totalW = textWidth + gap + stampSize;
  const startX = (1080 - totalW) / 2;

  ctx.fillText(titleText, startX, titleY + stampSize / 2);

  // 印章 0.4s 落印
  if (t >= 0.4) {
    const stampProg = clamp((t - 0.4) / 0.35, 0, 1);
    const stampScale = 2.0 - (2.0 - 1.0) * easeBackOut(stampProg, 2.0);
    const stampAlpha = clamp(stampProg * 1.5, 0, 1);
    const stampRotate = (1 - easeBackOut(stampProg, 2.0)) * -12;

    const stampCenterX = startX + textWidth + gap + stampSize / 2;
    const stampCenterY = titleY + stampSize / 2;

    ctx.save();
    ctx.translate(stampCenterX, stampCenterY);
    ctx.scale(stampScale, stampScale);
    ctx.rotate((stampRotate * Math.PI) / 180);
    ctx.globalAlpha = stampAlpha;

    // Stamp Border & Background
    ctx.fillStyle = "rgba(195, 62, 50, 0.08)";
    ctx.strokeStyle = "#C33E32";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-stampSize / 2, -stampSize / 2, stampSize, stampSize, 8);
    ctx.fill();
    ctx.stroke();

    // Stamp [✖] text
    ctx.fillStyle = "#C33E32";
    ctx.font = `900 ${Math.round(36 * fontScale)}px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✖", 0, -1);
    ctx.restore();
  }
  ctx.restore();

  // ----------------------------------------------------
  // 主舞台区域：top: 480px, left: 80px, width: 920px, height: 800px
  // ----------------------------------------------------
  const stageX = 80;
  const stageY = 480;
  const tableY = stageY + 710; // 1190px on canvas

  // 1. 统一实木桌面 (高度 26px，通栏横贯)
  ctx.save();
  const tableGrad = ctx.createLinearGradient(stageX, tableY, stageX, tableY + 26);
  tableGrad.addColorStop(0, "#8A6D56");
  tableGrad.addColorStop(1, "#634C3A");
  ctx.fillStyle = tableGrad;
  ctx.beginPath();
  ctx.roundRect(stageX, tableY, 920, 26, 6);
  ctx.fill();

  // Soft Tabletop Shadow
  ctx.fillStyle = "rgba(74, 52, 37, 0.18)";
  ctx.beginPath();
  ctx.ellipse(stageX + 460, tableY + 34, 440, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 地下灶台底座（中心 stageX + 205，无火苗）
  const stoveX = stageX + 205;
  const stoveY = stageY + 710;

  ctx.save();
  ctx.fillStyle = "#282421";
  ctx.strokeStyle = "#1A1816";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(stoveX, stoveY, 68, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 左右三脚支架
  ctx.strokeStyle = "#332E2A";
  ctx.lineWidth = 5.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(stoveX - 55, stoveY - 2);
  ctx.lineTo(stoveX - 45, stoveY - 24);
  ctx.moveTo(stoveX + 55, stoveY - 2);
  ctx.lineTo(stoveX + 45, stoveY - 24);
  ctx.moveTo(stoveX, stoveY);
  ctx.lineTo(stoveX, stoveY - 20);
  ctx.stroke();
  ctx.restore();

  // 3. 左侧铁锅（产生源，尺寸 220x92px，深黑铸铁质感）
  const wokX = stageX + 95;
  const wokY = stageY + 565;

  ctx.save();
  ctx.translate(wokX, wokY);

  // 锅底外壳
  ctx.fillStyle = "#2C2827";
  ctx.strokeStyle = "#1C1A19";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(5, 66);
  ctx.bezierCurveTo(35, 142, 185, 142, 215, 66);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 木柄
  ctx.save();
  ctx.translate(-50, 60);
  ctx.rotate((-15 * Math.PI) / 180);
  ctx.fillStyle = "#6B4D36";
  ctx.beginPath();
  ctx.roundRect(0, 0, 60, 12, 6);
  ctx.fill();
  ctx.restore();

  // 热油反光面
  ctx.fillStyle = "#4E3D31";
  ctx.beginPath();
  ctx.ellipse(110, 74, 78, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(240, 160, 60, 0.32)";
  ctx.beginPath();
  ctx.ellipse(114, 72, 48, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. 纯团状油烟系统（0.65s 始，绝无任何硬线条！纯蓬松团雾）
  if (t >= 0.65) {
    ctx.save();
    ctx.globalCompositeOperation = "multiply";

    // 4.1 锅口基础热团雾
    const p1Prog = clamp((t - 0.65) / 0.8, 0, 1);
    if (p1Prog > 0) {
      const p1Scale = 0.3 + 0.95 * easePower2Out(p1Prog);
      const p1Alpha = (1 - p1Prog * 0.5) * 0.55;
      const grad = ctx.createRadialGradient(stageX + 205, stageY + 610 - p1Prog * 20, 0, stageX + 205, stageY + 610 - p1Prog * 20, 42 * p1Scale);
      grad.addColorStop(0, "rgba(78, 60, 47, 0.55)");
      grad.addColorStop(0.45, "rgba(123, 102, 85, 0.28)");
      grad.addColorStop(1, "rgba(168, 149, 133, 0)");

      ctx.save();
      ctx.globalAlpha = p1Alpha;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(stageX + 205, stageY + 610 - p1Prog * 20, 42 * p1Scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4.2 24 组团状翻滚烟雾云球
    CLOUD_PUFFS.forEach((p) => {
      const s = getCloudPuffState(p, t);
      if (!s || s.opacity <= 0.01) return;
      const px = stageX + s.x;
      const py = stageY + s.y;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, s.r);
      grad.addColorStop(0, "rgba(78, 60, 47, 0.55)");
      grad.addColorStop(0.42, "rgba(123, 102, 85, 0.28)");
      grad.addColorStop(1, "rgba(168, 149, 133, 0)");

      ctx.save();
      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4.3 茶罐口上方受纳烟团 (1.35s 始)
    if (t >= 1.35) {
      const inProg = clamp((t - 1.35) / 0.8, 0, 1);
      const inScale = 0.2 + 1.0 * easePower2Out(inProg);
      const inAlpha = (1 - inProg * 0.6) * 0.50;
      const inGrad = ctx.createRadialGradient(stageX + 680, stageY + 440 + inProg * 15, 0, stageX + 680, stageY + 440 + inProg * 15, 52 * inScale);
      inGrad.addColorStop(0, "rgba(78, 60, 47, 0.55)");
      inGrad.addColorStop(0.5, "rgba(123, 102, 85, 0.28)");
      inGrad.addColorStop(1, "rgba(168, 149, 133, 0)");

      ctx.save();
      ctx.globalAlpha = inAlpha;
      ctx.fillStyle = inGrad;
      ctx.beginPath();
      ctx.arc(stageX + 680, stageY + 440 + inProg * 15, 52 * inScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // 5. 右侧小瓷罐 (尺寸 240x315px，放大 1.5 倍)
  const jarX = stageX + 558;
  const jarY = stageY + 395;

  ctx.save();
  ctx.translate(jarX, jarY);

  // 卸下的瓷罐盖（斜搁在旁）
  ctx.save();
  ctx.translate(-45, 275);
  ctx.rotate((-18 * Math.PI) / 180);
  ctx.fillStyle = "#264836";
  ctx.strokeStyle = "#1B3527";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#6B4D36";
  ctx.fillRect(-12, -18, 24, 14);
  ctx.fillStyle = "#8A6445";
  ctx.beginPath();
  ctx.ellipse(0, -18, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 罐体外壁 (240x315px)
  ctx.fillStyle = "#264836";
  ctx.strokeStyle = "#1B3527";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(22, 75);
  ctx.bezierCurveTo(22, 42, 52, 27, 128, 27);
  ctx.bezierCurveTo(202, 27, 232, 42, 232, 75);
  ctx.lineTo(240, 255);
  ctx.bezierCurveTo(240, 297, 210, 315, 128, 315);
  ctx.bezierCurveTo(45, 315, 15, 297, 15, 255);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 釉面反光弧
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(35, 85);
  ctx.bezierCurveTo(35, 55, 58, 40, 128, 40);
  ctx.stroke();

  // 微透视视窗
  ctx.fillStyle = "#F4EFE6";
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(38, 82);
  ctx.bezierCurveTo(38, 54, 63, 42, 128, 42);
  ctx.bezierCurveTo(192, 42, 218, 54, 218, 82);
  ctx.lineTo(222, 248);
  ctx.bezierCurveTo(222, 282, 195, 300, 128, 300);
  ctx.bezierCurveTo(60, 300, 33, 282, 33, 248);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // 正宗福鼎白牡丹“两叶一芽”形态（1.4s - 2.9s 从鲜绿渐变为焦黄氧化色 #8C7355）
  const disProg = easePower2Out(clamp((t - 1.4) / 1.5, 0, 1));
  const budColor = lerpColor("#6D7B4E", "#8C7355", disProg);
  const leftColor = lerpColor("#5B6A3E", "#7A6248", disProg);
  const rightColor = lerpColor("#637443", "#826A4F", disProg);
  const sideColor1 = lerpColor("#4E5D32", "#6B553D", disProg);
  const sideColor2 = lerpColor("#536436", "#705A42", disProg);

  // 芽尖
  ctx.fillStyle = budColor;
  ctx.beginPath();
  ctx.moveTo(128, 210);
  ctx.quadraticCurveTo(132, 142, 128, 112);
  ctx.quadraticCurveTo(124, 142, 128, 210);
  ctx.closePath();
  ctx.fill();

  // 茸毛微光
  ctx.strokeStyle = lerpColor("#edf5ea", "#b5a391", disProg);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(127, 118);
  ctx.quadraticCurveTo(130, 155, 128, 200);
  ctx.stroke();

  // 左展开叶
  ctx.fillStyle = leftColor;
  ctx.beginPath();
  ctx.moveTo(128, 202);
  ctx.quadraticCurveTo(90, 172, 75, 135);
  ctx.quadraticCurveTo(108, 147, 128, 202);
  ctx.closePath();
  ctx.fill();

  // 右舒展叶
  ctx.fillStyle = rightColor;
  ctx.beginPath();
  ctx.moveTo(128, 202);
  ctx.quadraticCurveTo(165, 168, 180, 132);
  ctx.quadraticCurveTo(150, 147, 128, 202);
  ctx.closePath();
  ctx.fill();

  // 侧底叶
  ctx.fillStyle = sideColor1;
  ctx.beginPath();
  ctx.moveTo(90, 218);
  ctx.quadraticCurveTo(60, 202, 48, 180);
  ctx.quadraticCurveTo(82, 183, 98, 213);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = sideColor2;
  ctx.beginPath();
  ctx.moveTo(158, 218);
  ctx.quadraticCurveTo(188, 202, 208, 183);
  ctx.quadraticCurveTo(172, 188, 152, 213);
  ctx.closePath();
  ctx.fill();

  // 视窗淡油烟微熏蒙翳（透明度控制在 0.24，绝不抹杀茶叶）
  if (t >= 1.4) {
    const hazeProg = easePower2Out(clamp((t - 1.4) / 1.5, 0, 1));
    ctx.save();
    ctx.globalAlpha = hazeProg * 0.24;
    ctx.fillStyle = "#5A4739";
    ctx.beginPath();
    ctx.moveTo(38, 82);
    ctx.bezierCurveTo(38, 54, 63, 42, 128, 42);
    ctx.bezierCurveTo(192, 42, 218, 54, 218, 82);
    ctx.lineTo(222, 248);
    ctx.bezierCurveTo(222, 282, 195, 300, 128, 300);
    ctx.bezierCurveTo(60, 300, 33, 282, 33, 248);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 罐颈口与深邃阴影
  ctx.strokeStyle = "#1B3527";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.ellipse(128, 45, 90, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 6. 罐底居中垂直引线（2.4s 生长，高度 110px）
  const leaderX = stageX + 686;
  const leaderStartY = tableY; // 1190px
  if (t >= 2.4) {
    const leaderProg = easePower2Out(clamp((t - 2.4) / 0.4, 0, 1));
    ctx.save();
    ctx.strokeStyle = "#C33E32";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(leaderX, leaderStartY);
    ctx.lineTo(leaderX, leaderStartY + 110 * leaderProg);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 7. 正下方居中弹出警示标牌「避开厨房油烟 ✖」（2.5s 弹性弹出）
  if (t >= 2.5) {
    const cardProg = clamp((t - 2.5) / 0.5, 0, 1);
    const cardScale = 0.9 + 0.1 * easeBackOut(cardProg, 1.6);
    const cardYOffset = (1 - easeBackOut(cardProg, 1.6)) * 20;
    const cardAlpha = clamp(cardProg * 2.0, 0, 1);

    ctx.save();
    ctx.font = `700 ${Math.round(34 * fontScale)}px ${FONT_SONG}`;
    const cardTextWidth = ctx.measureText(stampText).width;
    const cardW = Math.max(340, cardTextWidth + 72);
    const cardH = 68;

    const cardCenterX = leaderX;
    const cardCenterY = leaderStartY + 110 + cardH / 2 + 10 + cardYOffset;

    ctx.translate(cardCenterX, cardCenterY);
    ctx.scale(cardScale, cardScale);
    ctx.globalAlpha = cardAlpha;

    // Card Box
    ctx.fillStyle = "#FAF7F0";
    ctx.strokeStyle = "#C33E32";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = "#C33E32";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stampText, 0, 1);
    ctx.restore();
  }
}

function lerpColor(hex1: string, hex2: string, t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));
  const parse = (hex: string) => {
    const raw = hex.replace("#", "");
    return [
      parseInt(raw.substring(0, 2), 16),
      parseInt(raw.substring(2, 4), 16),
      parseInt(raw.substring(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(hex1);
  const [r2, g2, b2] = parse(hex2);
  const r = Math.round(r1 + (r2 - r1) * clampedT);
  const g = Math.round(g1 + (g2 - g1) * clampedT);
  const b = Math.round(b1 + (b2 - b1) * clampedT);
  return `rgb(${r}, ${g}, ${b})`;
}

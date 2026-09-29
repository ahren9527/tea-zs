import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT_SONG, type AnimParams } from "@/remotion/shared/theme";
import {
  FAR_RAIN_STREAKS,
  MID_RAIN_STREAKS,
  NEAR_RAIN_STREAKS,
  MOISTURE_DROPS,
  getDropletState,
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

  // 风向微幅自然摆动
  const windAngle = -4.5 + Math.sin(t * 2.1) * 1.5;
  const windRad = (windAngle * Math.PI) / 180;
  const windX = Math.sin(t * 1.8) * 14;

  // ----------------------------------------------------
  // 1. 全景背景层：远景微细雨丝 (60 根) + 中景细雨丝 (42 根)
  // ----------------------------------------------------
  // 远景微雨丝
  ctx.save();
  ctx.translate(540, 960);
  ctx.rotate(windRad * 0.9);
  ctx.translate(-540, -960);

  FAR_RAIN_STREAKS.forEach((streak) => {
    const cycleT = streak.speed;
    const offsetT = (t + streak.delay) % cycleT;
    const prog = offsetT / cycleT;
    const yTop = -100 + prog * (2100 + streak.length);
    const yBot = yTop + streak.length;

    ctx.save();
    ctx.globalAlpha = streak.opacity;
    ctx.strokeStyle = "#90A4AE";
    ctx.lineWidth = streak.strokeWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(streak.x + windX * 0.35, yTop);
    ctx.lineTo(streak.x + windX * 0.35, yBot);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();

  // 中景细雨丝
  ctx.save();
  ctx.translate(540, 960);
  ctx.rotate(windRad);
  ctx.translate(-540, -960);

  MID_RAIN_STREAKS.forEach((streak) => {
    const cycleT = streak.speed;
    const offsetT = (t + streak.delay) % cycleT;
    const prog = offsetT / cycleT;
    const yTop = -150 + prog * (2200 + streak.length);
    const yBot = yTop + streak.length;

    ctx.save();
    ctx.globalAlpha = streak.opacity;
    ctx.strokeStyle = "#607D8B";
    ctx.lineWidth = streak.strokeWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(streak.x + windX * 0.7, yTop);
    ctx.lineTo(streak.x + windX * 0.7, yBot);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();

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
  // ----------------------------------------------------
  const titleProg = easePower2Out(clamp(t / 0.6, 0, 1));
  const titleY = 220 + (1 - titleProg) * -20;
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
  // 主舞台区域：top: 660px 黄金中心，left: 110px, width: 860px, height: 820px
  // ----------------------------------------------------
  const stageX = 110;
  const stageY = 660;
  const tableY = stageY + 820 - 60 - 18; // 1402px on canvas

  // 1. 单层实木案台
  ctx.save();
  const tableGrad = ctx.createLinearGradient(stageX, tableY, stageX, tableY + 18);
  tableGrad.addColorStop(0, "#8A6D56");
  tableGrad.addColorStop(1, "#634C3A");
  ctx.fillStyle = tableGrad;
  ctx.beginPath();
  ctx.roundRect(stageX, tableY, 860, 18, 5);
  ctx.fill();

  ctx.fillStyle = "rgba(74, 52, 37, 0.2)";
  ctx.beginPath();
  ctx.ellipse(stageX + 430, tableY + 24, 410, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. 上方中式湿度计与警戒指示 (中心绝对对齐 stageX + 430, stageY + 110)
  const hygroX = stageX + 430;
  const hygroY = stageY + 110;

  ctx.save();
  // 挂链
  ctx.strokeStyle = "#8A735E";
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(hygroX, hygroY - 110);
  ctx.lineTo(hygroX, hygroY - 72);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#5C4D3E";
  ctx.beginPath();
  ctx.arc(hygroX, hygroY - 72, 7, 0, Math.PI * 2);
  ctx.fill();

  // 表盘外圈 (直径 140px，外圈 r: 70px)
  const bronzeGrad = ctx.createRadialGradient(hygroX, hygroY, 0, hygroX, hygroY, 70);
  bronzeGrad.addColorStop(0, "#DFD8C8");
  bronzeGrad.addColorStop(0.7, "#B3A792");
  bronzeGrad.addColorStop(1, "#786B58");
  ctx.fillStyle = bronzeGrad;
  ctx.strokeStyle = "#4A382A";
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(hygroX, hygroY, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 表盘内底
  ctx.fillStyle = "#F7F4EB";
  ctx.strokeStyle = "#8C7965";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(hygroX, hygroY, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 70%~100% 红色危险警戒区弧
  ctx.strokeStyle = "#C33E32";
  ctx.lineWidth = 6.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(hygroX, hygroY, 54, -Math.PI * 0.25, 0);
  ctx.stroke();

  // 常态刻度弧
  ctx.strokeStyle = "#8A9A7B";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(hygroX, hygroY, 54, -Math.PI * 0.9, -Math.PI * 0.28);
  ctx.stroke();

  // 刻度线
  ctx.strokeStyle = "#7A6856";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(hygroX - 38, hygroY);
  ctx.lineTo(hygroX - 48, hygroY);
  ctx.moveTo(hygroX, hygroY - 38);
  ctx.lineTo(hygroX, hygroY - 48);
  ctx.stroke();

  ctx.strokeStyle = "#C33E32";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(hygroX + 38, hygroY);
  ctx.lineTo(hygroX + 48, hygroY);
  ctx.stroke();

  // 刻度大字
  ctx.font = `bold 15px ${FONT_SONG}`;
  ctx.fillStyle = "#7A6856";
  ctx.textAlign = "center";
  ctx.fillText("环境湿度", hygroX, hygroY - 20);
  ctx.font = `bold 13px ${FONT_SONG}`;
  ctx.fillText("50%", hygroX - 28, hygroY + 16);
  ctx.fillStyle = "#C33E32";
  ctx.font = `900 14px ${FONT_SONG}`;
  ctx.fillText("85%", hygroX + 30, hygroY - 14);

  // 指针：绝对严格以 (hygroX, hygroY) 为旋转中心
  let needleAngle = -22;
  if (t >= 0.8) {
    const pProg = clamp((t - 0.8) / 0.55, 0, 1);
    needleAngle = -22 + (62 - -22) * easeBackOut(pProg, 1.8);
  }

  ctx.save();
  ctx.translate(hygroX, hygroY);
  ctx.rotate((needleAngle * Math.PI) / 180);

  // 针尖微弱立体投影
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(0, -48);
  ctx.stroke();

  // 赤红醒目粗壮指针主体
  ctx.strokeStyle = "#C33E32";
  ctx.lineWidth = 4.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(0, -48);
  ctx.stroke();

  ctx.fillStyle = "#C33E32";
  ctx.beginPath();
  ctx.moveTo(0, -56);
  ctx.lineTo(-7, -42);
  ctx.lineTo(7, -42);
  ctx.closePath();
  ctx.fill();

  // 双层立体中心固定铜轴
  ctx.fillStyle = "#4A3425";
  ctx.strokeStyle = "#7A6856";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FAF5EE";
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 右侧悬浮警示红标：85% RH 梅雨高湿
  if (t >= 0.85) {
    const badgeProg = clamp((t - 0.85) / 0.45, 0, 1);
    const badgeScale = easeBackOut(badgeProg, 1.5);
    const badgeAlpha = clamp(badgeProg * 1.5, 0, 1);
    const bx = hygroX + 86;
    const by = hygroY - 26;

    ctx.save();
    ctx.globalAlpha = badgeAlpha;
    ctx.translate(bx, by);
    ctx.scale(badgeScale, badgeScale);

    ctx.fillStyle = "#FAF5EE";
    ctx.strokeStyle = "#C33E32";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(0, 0, 168, 52, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = `900 22px ${FONT_SONG}`;
    ctx.fillStyle = "#C33E32";
    ctx.textAlign = "left";
    ctx.fillText("85% RH", 16, 32);

    ctx.font = `700 14px ${FONT_SONG}`;
    ctx.fillStyle = "#75523E";
    ctx.fillText("梅雨高湿", 108, 33);
    ctx.restore();
  }
  ctx.restore();

  // 3. 物理水汽羽化瀑布倾泻流 (1.0s - 2.8s)
  if (t >= 1.0) {
    const mistProg = clamp((t - 1.0) / 0.8, 0, 1);
    let mistAlpha = 0.88 * easePower2Out(mistProg);
    if (t > 2.2) {
      mistAlpha = 0.88 - ((t - 2.2) / 1.2) * 0.46;
    }

    ctx.save();
    ctx.globalAlpha = mistAlpha;
    const streamGrad = ctx.createLinearGradient(0, stageY + 185, 0, stageY + 450);
    streamGrad.addColorStop(0, "rgba(176, 190, 197, 0.1)");
    streamGrad.addColorStop(0.4, "rgba(144, 164, 174, 0.48)");
    streamGrad.addColorStop(0.85, "rgba(120, 144, 156, 0.70)");
    streamGrad.addColorStop(1, "rgba(96, 125, 139, 0.2)");
    ctx.fillStyle = streamGrad;
    ctx.beginPath();
    ctx.moveTo(stageX + 390, stageY + 185);
    ctx.bezierCurveTo(stageX + 400, stageY + 250, stageX + 370, stageY + 340, stageX + 355, stageY + 450);
    ctx.lineTo(stageX + 505, stageY + 450);
    ctx.bezierCurveTo(stageX + 490, stageY + 340, stageX + 460, stageY + 250, stageX + 470, stageY + 185);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 4. 36 颗精巧小水滴垂直下落直灌入袋口
  MOISTURE_DROPS.forEach((d) => {
    const sp = getDropletState(d, t);
    if (!sp || sp.opacity <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = sp.opacity;

    // 水滴渐变主体
    const dropGrad = ctx.createRadialGradient(
      stageX + sp.x - sp.r * 0.2,
      stageY + sp.y - sp.r * 0.3,
      0,
      stageX + sp.x,
      stageY + sp.y,
      sp.r * 1.4
    );
    dropGrad.addColorStop(0, "#FFFFFF");
    dropGrad.addColorStop(0.3, "#E1F5FE");
    dropGrad.addColorStop(0.7, "#039BE5");
    dropGrad.addColorStop(1, "#01579B");

    ctx.fillStyle = dropGrad;
    ctx.strokeStyle = "#01579B";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(stageX + sp.x, stageY + sp.y, sp.r * 0.8, sp.r * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 晶莹反光点
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(stageX + sp.x - sp.r * 0.25, stageY + sp.y - sp.r * 0.45, sp.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 5. 核心主体：大铝箔自封袋 (放置于 stageX + 320, stageY + 430)
  const bagX = stageX + 320;
  const bagY = stageY + 430;

  ctx.save();
  ctx.translate(bagX, bagY);

  // 阴影
  ctx.fillStyle = "rgba(40, 28, 18, 0.28)";
  ctx.beginPath();
  ctx.ellipse(110, 316, 110, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // 自立袋主体轮廓
  const foilGrad = ctx.createLinearGradient(0, 0, 220, 290);
  foilGrad.addColorStop(0, "#ede5d8");
  foilGrad.addColorStop(0.22, "#cfc2af");
  foilGrad.addColorStop(0.45, "#faf3e8");
  foilGrad.addColorStop(0.68, "#bfad97");
  foilGrad.addColorStop(0.88, "#ddd2c2");
  foilGrad.addColorStop(1, "#9a8772");

  ctx.fillStyle = foilGrad;
  ctx.strokeStyle = "#54402F";
  ctx.lineWidth = 2.4;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(22, 55);
  ctx.lineTo(198, 55);
  ctx.lineTo(214, 290);
  ctx.bezierCurveTo(214, 304, 200, 314, 182, 318);
  ctx.lineTo(38, 318);
  ctx.bezierCurveTo(20, 314, 6, 304, 6, 290);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 风琴折痕高光
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.moveTo(28, 55);
  ctx.lineTo(48, 318);
  ctx.stroke();

  ctx.strokeStyle = "#423223";
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(192, 55);
  ctx.lineTo(172, 318);
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  // 宣纸贴签
  ctx.save();
  ctx.translate(68, 105);
  ctx.fillStyle = "#F7F3E9";
  ctx.strokeStyle = "#8A705B";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(0, 0, 84, 136, 4);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#8A705B";
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4, 2]);
  ctx.beginPath();
  ctx.roundRect(3, 3, 78, 130, 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#C33E32";
  ctx.fillRect(34, 9, 16, 16);
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 10px ${FONT_SONG}`;
  ctx.textAlign = "center";
  ctx.fillText("正上", 42, 21);

  ctx.font = `900 16px ${FONT_SONG}`;
  ctx.fillStyle = "#2E2318";
  ctx.fillText("福鼎", 42, 50);
  ctx.fillText("白茶", 42, 70);

  ctx.font = `10px ${FONT_SONG}`;
  ctx.fillStyle = "#8A705B";
  ctx.fillText("◆", 42, 88);

  ctx.font = `700 10px ${FONT_SONG}`;
  ctx.fillStyle = "#5E4C3C";
  ctx.fillText("原装大袋", 42, 106);

  ctx.font = `600 9px ${FONT_SONG}`;
  ctx.fillStyle = "#8A705B";
  ctx.fillText("防潮锁香", 42, 122);
  ctx.restore();

  // 袋口平齐“大敞大开”口唇部与银箔内仓
  ctx.fillStyle = "#2A221A";
  ctx.strokeStyle = "#54402F";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(22, 24);
  ctx.bezierCurveTo(60, 4, 160, 4, 198, 24);
  ctx.lineTo(198, 52);
  ctx.bezierCurveTo(160, 32, 60, 32, 22, 52);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 大敞袋口内仓银箔
  const mouthGrad = ctx.createLinearGradient(0, 14, 0, 62);
  mouthGrad.addColorStop(0, "#2A221A");
  mouthGrad.addColorStop(0.4, "#4A3F34");
  mouthGrad.addColorStop(0.7, "#A8B4BC");
  mouthGrad.addColorStop(1, "#DCE5EA");
  ctx.fillStyle = mouthGrad;
  ctx.strokeStyle = "#3D2A1C";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(110, 38, 88, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 袋内白茶叶物理形变
  const dampProg = easePower2Out(clamp((t - 1.4) / 1.8, 0, 1));
  const leafScaleY = 1.0 - 0.12 * dampProg;
  const leafColor = lerpColor("#6D7B4E", "#3E4D38", dampProg);
  const leafSubColor = lerpColor("#5B6A3E", "#34422F", dampProg);

  ctx.save();
  ctx.translate(110, 52);
  ctx.scale(1.0, leafScaleY);
  ctx.translate(-110, -52);

  ctx.fillStyle = leafColor;
  ctx.beginPath();
  ctx.moveTo(110, 52);
  ctx.quadraticCurveTo(112, 28, 110, 18);
  ctx.quadraticCurveTo(106, 28, 110, 52);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = leafSubColor;
  ctx.beginPath();
  ctx.moveTo(110, 48);
  ctx.quadraticCurveTo(90, 32, 76, 18);
  ctx.quadraticCurveTo(96, 26, 110, 48);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(110, 48);
  ctx.quadraticCurveTo(130, 32, 144, 18);
  ctx.quadraticCurveTo(124, 26, 110, 48);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 袋口大敞下翻前唇
  ctx.fillStyle = foilGrad;
  ctx.strokeStyle = "#54402F";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(20, 42);
  ctx.bezierCurveTo(60, 62, 160, 62, 200, 42);
  ctx.lineTo(198, 58);
  ctx.bezierCurveTo(160, 76, 60, 76, 22, 58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 铝箔袋表面冷凝水雾蒙版
  if (t >= 1.45) {
    const mistProg = easePower2Out(clamp((t - 1.45) / 1.5, 0, 1));
    ctx.save();
    ctx.globalAlpha = mistProg * 0.45;
    ctx.fillStyle = "rgba(176, 190, 197, 0.85)";
    ctx.beginPath();
    ctx.moveTo(22, 55);
    ctx.lineTo(198, 55);
    ctx.lineTo(214, 290);
    ctx.bezierCurveTo(214, 304, 200, 314, 182, 318);
    ctx.lineTo(38, 318);
    ctx.bezierCurveTo(20, 314, 6, 304, 6, 290);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 6. 铝箔袋底垂直红色细虚线向下生长
  const leaderX = stageX + 430;
  const leaderStartY = tableY; // 1402px
  if (t >= 2.4) {
    const leaderProg = easePower2Out(clamp((t - 2.4) / 0.4, 0, 1));
    ctx.save();
    ctx.strokeStyle = "#C33E32";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(leaderX, leaderStartY);
    ctx.lineTo(leaderX, leaderStartY + 90 * leaderProg);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // 7. 正下方居中弹出警示标牌「梅雨忌大开补茶 ✖」
  if (t >= 2.4) {
    const cardProg = clamp((t - 2.4) / 0.5, 0, 1);
    const cardScale = 0.9 + 0.1 * easeBackOut(cardProg, 1.6);
    const cardYOffset = (1 - easeBackOut(cardProg, 1.6)) * 20;
    const cardAlpha = clamp(cardProg * 2.0, 0, 1);

    ctx.save();
    ctx.font = `700 ${Math.round(34 * fontScale)}px ${FONT_SONG}`;
    const cardTextWidth = ctx.measureText(stampText).width;
    const cardW = Math.max(360, cardTextWidth + 72);
    const cardH = 68;

    const cardCenterX = leaderX;
    const cardCenterY = leaderStartY + 90 + cardH / 2 + 10 + cardYOffset;

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

  // ----------------------------------------------------
  // 8. 前景层：24 根特写雨滴与雨丝 (小巧精致、自然雅致)
  // ----------------------------------------------------
  ctx.save();
  ctx.translate(540, 960);
  ctx.rotate(windRad * 1.15);
  ctx.translate(-540, -960);

  NEAR_RAIN_STREAKS.forEach((streak) => {
    const cycleT = streak.speed;
    const offsetT = (t + streak.delay) % cycleT;
    const prog = offsetT / cycleT;
    const yTop = -250 + prog * (2450 + streak.length);
    const yBot = yTop + streak.length;

    ctx.save();
    ctx.globalAlpha = streak.opacity;

    // 粗雨丝主体
    const fgGrad = ctx.createLinearGradient(0, yTop, 0, yBot);
    fgGrad.addColorStop(0, "rgba(120, 144, 156, 0.2)");
    fgGrad.addColorStop(0.6, "rgba(55, 71, 79, 0.80)");
    fgGrad.addColorStop(1, "rgba(38, 50, 56, 0.95)");

    ctx.strokeStyle = fgGrad;
    ctx.lineWidth = streak.strokeWidth;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(streak.x + windX * 1.1, yTop);
    ctx.lineTo(streak.x + windX * 1.1, yBot);
    ctx.stroke();

    // 雨丝末端自然精致小水珠头
    const dropR = streak.dropRadius ?? 2.4;
    ctx.fillStyle = "#0288D1";
    ctx.strokeStyle = "#01579B";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(streak.x + windX * 1.1, yBot, dropR, dropR * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(
      streak.x + windX * 1.1 - dropR * 0.25,
      yBot - dropR * 0.35,
      dropR * 0.35,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  });
  ctx.restore();
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

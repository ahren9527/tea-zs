import { fillPaper } from "@/remotion/shared/draw-paper";
import {
  FONT_SONG,
  PAPER_THEMES,
  easeOutCubic,
  type AnimParams,
} from "@/remotion/shared/theme";
import {
  BAG_OPEN_AT,
  CROSS_MARK,
  DROP_END_AT,
  DROP_START_AT,
  LEAF_RISE_AT,
  STAMP_AT,
  TITLE_TEXT,
  WATER_DROP_AT,
} from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);

  const _theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const title = params.customTexts?.title || TITLE_TEXT;
  const crossMark = params.customTexts?.crossMark || CROSS_MARK;
  const fontScale = params.fontScale ?? 1;

  const fps = 29.97;
  const frame = (elapsed / 1000) * fps;

  // 1. Content overall smooth entrance
  const t = Math.min(1, frame / 30);
  const c1 = 1.35;
  const c3 = c1 + 1;
  const springP = t >= 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);

  const contentY = -70 + 70 * Math.min(1.02, springP);
  const contentOpacity = Math.min(1, frame / 16);
  const breath = frame > 40 ? Math.sin((frame - 40) * 0.05) * 3.5 : 0;
  const currentY = contentY + breath;

  ctx.save();
  ctx.globalAlpha = contentOpacity;

  const centerX = 540;

  // 1. 顶部核心定性：62px 宋体「频繁开大袋」 + 76px 朱砂红「✖」印章
  const titleY = 420 + currentY;
  ctx.font = `800 ${Math.round(62 * fontScale)}px ${FONT_SONG}`;
  const titleWidth = ctx.measureText(title).width;
  const stampWidth = 76;
  const gap = 24;
  const groupWidth = titleWidth + gap + stampWidth;
  const startX = centerX - groupWidth / 2;

  // Text shadow for title
  ctx.save();
  ctx.shadowColor = "rgba(61, 42, 28, 0.18)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#3D2A1C";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(title, startX, titleY);
  ctx.restore();

  // 朱砂红金石印章「✖」
  if (frame >= STAMP_AT) {
    const stampP = easeOutCubic(Math.min(1, (frame - STAMP_AT) / 12));
    const stampScale = 1.8 - 0.8 * stampP;
    const stampAlpha = Math.min(1, (frame - STAMP_AT) / 4);

    const stampCenterX = startX + titleWidth + gap + stampWidth / 2;
    const stampCenterY = titleY;

    ctx.save();
    ctx.translate(stampCenterX, stampCenterY);
    ctx.rotate(((-4 * (1 - stampP) - 4) * Math.PI) / 180);
    ctx.scale(stampScale, stampScale);
    ctx.globalAlpha = contentOpacity * stampAlpha;

    ctx.shadowColor = "rgba(195, 62, 50, 0.35)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;

    ctx.fillStyle = "rgba(247, 243, 235, 0.95)";
    ctx.strokeStyle = "#C33E32";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-38, -38, 76, 76, 12);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Inset line
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-33, -33, 66, 66, 8);
    ctx.stroke();

    ctx.fillStyle = "#C33E32";
    ctx.font = `900 ${Math.round(62 * fontScale)}px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(crossMark, 0, 0);
    ctx.restore();
  }

  // 2. 重绘白茶大铝箔立袋（参考真实福鼎白茶自立拉骨大铝箔袋写实造型）
  const pouchW = 270;
  const pouchH = 330;
  const pouchX = centerX - pouchW / 2;
  const pouchY = 610 + currentY;
  const zipProgress = Math.min(1, Math.max(0, (frame - BAG_OPEN_AT) / 32));

  // Bag spring shake on opening
  const shakeFrame = frame - BAG_OPEN_AT;
  const bagShake =
    shakeFrame >= 0 && shakeFrame < 22
      ? Math.sin(shakeFrame * 0.8) * Math.exp(-shakeFrame * 0.14) * 3.0
      : 0;

  // Ground Contact Shadow
  ctx.save();
  const contactGrad = ctx.createRadialGradient(
    centerX,
    pouchY + pouchH + 2,
    0,
    centerX,
    pouchY + pouchH + 2,
    130
  );
  contactGrad.addColorStop(0, "rgba(40, 28, 18, 0.42)");
  contactGrad.addColorStop(0.52, "rgba(40, 28, 18, 0.16)");
  contactGrad.addColorStop(0.75, "transparent");
  ctx.fillStyle = contactGrad;
  ctx.beginPath();
  ctx.ellipse(centerX, pouchY + pouchH + 2, 120, 21, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw Realistic White Tea Pouch
  ctx.save();
  ctx.shadowColor = "rgba(45, 30, 18, 0.28)";
  ctx.shadowBlur = 38;
  ctx.shadowOffsetY = 26;
  drawRealWhiteTeaPouch(ctx, pouchX, pouchY, pouchW, pouchH, zipProgress, bagShake, fontScale);
  ctx.restore();

  // a) 香气流失：单个茶叶绿芽图标（🍃）向上垂直升腾消散
  if (frame >= LEAF_RISE_AT) {
    const leafFrame = frame - LEAF_RISE_AT;
    const leafLife = Math.min(1, Math.max(0, leafFrame / 46));
    const leafY = -leafLife * 230;
    const leafX = Math.sin(leafLife * Math.PI * 1.5) * 22;
    const leafAlpha =
      leafLife < 0.2
        ? leafLife / 0.2
        : leafLife < 0.75
        ? 1
        : 1 - (leafLife - 0.75) / 0.25;
    const leafScale = 0.5 + leafLife * 0.85;
    const leafRot = ((-10 + leafLife * 30) * Math.PI) / 180;

    ctx.save();
    ctx.translate(centerX - 25 + leafX, pouchY + 50 + leafY);
    ctx.rotate(leafRot);
    ctx.scale(leafScale, leafScale);
    ctx.globalAlpha = contentOpacity * Math.max(0, leafAlpha);

    ctx.shadowColor = "rgba(90, 115, 60, 0.45)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 14;

    ctx.fillStyle = "#6D7B4E";
    ctx.strokeStyle = "#3E4C26";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-15, 17);
    ctx.bezierCurveTo(-17, 1, -4, -17, 17, -19);
    ctx.bezierCurveTo(17, 1, 1, 19, -15, 17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Leaf vein
    ctx.strokeStyle = "#92B06F";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-12, 14);
    ctx.quadraticCurveTo(1, -1, 15, -16);
    ctx.stroke();

    ctx.restore();
  }

  // b) 潮气入侵：袋口外侧单颗水滴图标（💧），伴随向下箭头钻入袋内
  if (frame >= WATER_DROP_AT) {
    const dropFrame = frame - WATER_DROP_AT;
    const dropLife = Math.min(1, Math.max(0, dropFrame / 32));
    const dropY = -150 + Math.pow(dropLife, 1.8) * 165;
    const dropAlpha =
      dropLife < 0.2
        ? dropLife / 0.2
        : dropLife < 0.85
        ? 1
        : (1 - dropLife) / 0.15;
    const dropScale =
      dropLife < 0.3
        ? 0.4 + (dropLife / 0.3) * 0.68
        : dropLife < 0.9
        ? 1.08 - ((dropLife - 0.3) / 0.6) * 0.18
        : 0.9 - ((dropLife - 0.9) / 0.1) * 0.7;

    ctx.save();
    ctx.translate(centerX + 55, pouchY + 60 + dropY);
    ctx.scale(dropScale, dropScale);
    ctx.globalAlpha = contentOpacity * Math.max(0, dropAlpha);

    ctx.shadowColor = "rgba(50, 100, 140, 0.4)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 12;

    // Water Drop
    ctx.fillStyle = "#548EAC";
    ctx.strokeStyle = "#2F5B73";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.bezierCurveTo(0, -22, 17, -4, 17, 6.5);
    ctx.bezierCurveTo(17, 16.5, 9.2, 23, 0, 23);
    ctx.bezierCurveTo(-9.2, 23, -17, 16.5, -17, 6.5);
    ctx.bezierCurveTo(-17, -4, 0, -22, 0, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.beginPath();
    ctx.ellipse(-5.5, 2, 4.5, 9.5, (-20 * Math.PI) / 180, 0, Math.PI * 2);
    ctx.fill();

    // Down Arrow ↓
    ctx.fillStyle = "#2F5B73";
    ctx.font = `900 ${Math.round(28 * fontScale)}px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("↓", 0, 28);

    ctx.restore();
  }

  // 3. 极简呼吸感仪表：悬浮微胶囊床
  const gaugeW = 780;
  const gaugeH = 68;
  const gaugeX = centerX - gaugeW / 2;
  const gaugeY = 1150 + currentY;

  const dropRaw = Math.min(1, Math.max(0, (frame - DROP_START_AT) / (DROP_END_AT - DROP_START_AT)));
  const dropEased = 1 - Math.pow(1 - dropRaw, 3);
  const metricVal = Math.round(100 - (100 - 23) * dropEased);

  const r = Math.round(109 + (138 - 109) * dropEased);
  const g = Math.round(123 + (125 - 123) * dropEased);
  const b = Math.round(78 + (112 - 78) * dropEased);
  const barColor = `rgb(${r}, ${g}, ${b})`;

  // Capsule bed
  ctx.save();
  ctx.shadowColor = "rgba(60, 42, 28, 0.12)";
  ctx.shadowBlur = 45;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "rgba(247, 243, 235, 0.65)";
  ctx.strokeStyle = "rgba(110, 83, 63, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(gaugeX, gaugeY, gaugeW, gaugeH, 34);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // a) 左侧绿叶微标 🍃
  const leafIconX = gaugeX + 44;
  const leafIconY = gaugeY + gaugeH / 2;
  ctx.save();
  ctx.translate(leafIconX, leafIconY);
  ctx.shadowColor = "rgba(70, 90, 45, 0.25)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#6D7B4E";
  ctx.strokeStyle = "#3E4C26";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-11, 11);
  ctx.bezierCurveTo(-12, 1, -2, -11, 12, -13);
  ctx.bezierCurveTo(12, 1, 1, 13, -11, 11);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#92B06F";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-10, 10);
  ctx.quadraticCurveTo(0, -1, 10, -11);
  ctx.stroke();
  ctx.restore();

  // b) 右侧超大字号「23% ↓」
  const arrowBob = frame >= DROP_START_AT ? Math.sin(frame * 0.22) * 3 : 0;
  ctx.font = `900 ${Math.round(54 * fontScale)}px ${FONT_SONG}`;
  const wNum = ctx.measureText(`${metricVal}`).width;
  ctx.font = `800 ${Math.round(32 * fontScale)}px ${FONT_SONG}`;
  const wPct = ctx.measureText("%").width;
  ctx.font = `900 ${Math.round(38 * fontScale)}px ${FONT_SONG}`;
  const wArr = ctx.measureText("↓").width;
  const totalValW = wNum + wPct + 4 + wArr;

  const rightValStartX = gaugeX + gaugeW - 36 - totalValW;

  ctx.save();
  ctx.shadowColor = "rgba(195, 62, 50, 0.25)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = "#C33E32";
  ctx.font = `900 ${Math.round(54 * fontScale)}px ${FONT_SONG}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${metricVal}`, rightValStartX, gaugeY + gaugeH / 2);

  ctx.font = `800 ${Math.round(32 * fontScale)}px ${FONT_SONG}`;
  ctx.fillText("%", rightValStartX + wNum + 2, gaugeY + gaugeH / 2);

  ctx.font = `900 ${Math.round(38 * fontScale)}px ${FONT_SONG}`;
  ctx.fillText("↓", rightValStartX + wNum + 2 + wPct + 4, gaugeY + gaugeH / 2 + arrowBob);
  ctx.restore();

  // c) 中间细长立体进度条
  const barTrackX = leafIconX + 36;
  const barTrackW = rightValStartX - barTrackX - 32;
  const barH = 14;
  const barTrackY = gaugeY + (gaugeH - barH) / 2;

  ctx.fillStyle = "rgba(90, 68, 48, 0.14)";
  ctx.beginPath();
  ctx.roundRect(barTrackX, barTrackY, barTrackW, barH, 7);
  ctx.fill();

  const activeW = Math.max(14, (barTrackW * metricVal) / 100);
  const barGrad = ctx.createLinearGradient(barTrackX, barTrackY, barTrackX + activeW, barTrackY);
  barGrad.addColorStop(0, barColor);
  barGrad.addColorStop(1, metricVal > 60 ? "#8CA869" : "#8A7D70");

  ctx.save();
  ctx.shadowColor = `${barColor}`;
  ctx.shadowBlur = 14;
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(barTrackX, barTrackY, activeW, barH, 7);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawRealWhiteTeaPouch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  zipProgress: number,
  bagShake: number,
  fontScale: number
) {
  ctx.save();
  const scale = w / 270;
  ctx.translate(x + w / 2, y + h);
  ctx.rotate(((-2.0 + bagShake) * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(-135, -330);

  // 1. Brushed Aluminum Foil Gradient
  const foilGrad = ctx.createLinearGradient(16, 24, 254, 314);
  foilGrad.addColorStop(0, "#ede5d8");
  foilGrad.addColorStop(0.22, "#cfc2af");
  foilGrad.addColorStop(0.45, "#faf3e8");
  foilGrad.addColorStop(0.68, "#bfad97");
  foilGrad.addColorStop(0.88, "#ddd2c2");
  foilGrad.addColorStop(1, "#9a8772");

  // Bag Body
  ctx.fillStyle = foilGrad;
  ctx.strokeStyle = "#54402F";
  ctx.lineWidth = 2.4;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(32, 68);
  ctx.lineTo(238, 68);
  ctx.lineTo(254, 286);
  ctx.bezierCurveTo(254, 298, 244, 310, 226, 314);
  ctx.lineTo(44, 314);
  ctx.bezierCurveTo(26, 310, 16, 298, 16, 286);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Side Gusset Shades (风琴位折叠立体阴影)
  const leftGusset = ctx.createLinearGradient(16, 68, 48, 68);
  leftGusset.addColorStop(0, "rgba(50, 36, 24, 0.28)");
  leftGusset.addColorStop(1, "rgba(50, 36, 24, 0)");
  ctx.fillStyle = leftGusset;
  ctx.beginPath();
  ctx.moveTo(16, 68);
  ctx.lineTo(36, 68);
  ctx.lineTo(48, 314);
  ctx.lineTo(44, 314);
  ctx.bezierCurveTo(26, 310, 16, 298, 16, 286);
  ctx.closePath();
  ctx.fill();

  const rightGusset = ctx.createLinearGradient(254, 68, 222, 68);
  rightGusset.addColorStop(0, "rgba(50, 36, 24, 0.28)");
  rightGusset.addColorStop(1, "rgba(50, 36, 24, 0)");
  ctx.fillStyle = rightGusset;
  ctx.beginPath();
  ctx.moveTo(254, 68);
  ctx.lineTo(234, 68);
  ctx.lineTo(222, 314);
  ctx.lineTo(226, 314);
  ctx.bezierCurveTo(244, 310, 254, 298, 254, 286);
  ctx.closePath();
  ctx.fill();

  // Organic foil creases (折痕反射与压角)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(38, 68);
  ctx.lineTo(58, 314);
  ctx.stroke();

  ctx.strokeStyle = "rgba(66, 50, 35, 0.35)";
  ctx.beginPath();
  ctx.moveTo(232, 68);
  ctx.lineTo(212, 314);
  ctx.stroke();

  // Bottom Gusset Seam
  ctx.strokeStyle = "rgba(74, 55, 38, 0.45)";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(44, 292);
  ctx.quadraticCurveTo(135, 316, 226, 292);
  ctx.stroke();

  // 2. 宣纸茶贴签（福鼎白茶 · 专用茶贴）
  ctx.save();
  ctx.translate(85, 114);
  ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = "#F7F3E9";
  ctx.strokeStyle = "#8A705B";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(0, 0, 100, 150, 4);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Inset dashed border
  ctx.strokeStyle = "#8A705B";
  ctx.lineWidth = 0.8;
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(4, 4, 92, 142);
  ctx.setLineDash([]);

  // Vermilion seal
  ctx.fillStyle = "#C33E32";
  ctx.beginPath();
  ctx.roundRect(42, 10, 16, 16, 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.round(10 * fontScale)}px ${FONT_SONG}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("正上", 50, 18);

  // Vertical text
  ctx.fillStyle = "#2E2318";
  ctx.font = `900 ${Math.round(18 * fontScale)}px ${FONT_SONG}`;
  ctx.fillText("福鼎", 50, 52);
  ctx.fillText("白茶", 50, 74);

  ctx.fillStyle = "#8A705B";
  ctx.font = `700 ${Math.round(10 * fontScale)}px ${FONT_SONG}`;
  ctx.fillText("◆", 50, 94);

  ctx.fillStyle = "#5E4C3C";
  ctx.font = `700 ${Math.round(11 * fontScale)}px ${FONT_SONG}`;
  ctx.fillText("避光锁香", 50, 112);

  ctx.fillStyle = "#8A705B";
  ctx.font = `600 ${Math.round(10 * fontScale)}px ${FONT_SONG}`;
  ctx.fillText("大袋封存", 50, 130);
  ctx.restore();

  // 3. 顶部热压封口带与易撕口 (Heat Seal Strip & Tear Notches)
  ctx.fillStyle = foilGrad;
  ctx.strokeStyle = "#54402F";
  ctx.lineWidth = 2.0;
  ctx.fillRect(32, 24, 206, 28);
  ctx.strokeRect(32, 24, 206, 28);

  // Crimp lines (齿纹)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  for (let cy = 28; cy <= 48; cy += 4) {
    ctx.beginPath();
    ctx.moveTo(34, cy);
    ctx.lineTo(236, cy);
    ctx.stroke();
  }

  // Tear Notches
  ctx.fillStyle = "#3D2A1C";
  ctx.beginPath();
  ctx.moveTo(32, 38);
  ctx.lineTo(40, 43);
  ctx.lineTo(32, 48);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(238, 38);
  ctx.lineTo(230, 43);
  ctx.lineTo(238, 48);
  ctx.closePath();
  ctx.fill();

  // 4. 自封拉骨开合 (Zipper & Lips)
  if (zipProgress > 0) {
    const innerFoil = ctx.createLinearGradient(0, 40, 0, 75);
    innerFoil.addColorStop(0, "#2a221a");
    innerFoil.addColorStop(0.4, "#5a4e42");
    innerFoil.addColorStop(0.7, "#cfd7dc");
    innerFoil.addColorStop(1, "#e8eff2");

    ctx.fillStyle = innerFoil;
    ctx.beginPath();
    ctx.moveTo(34, 52);
    ctx.quadraticCurveTo(135, 52 - zipProgress * 22, 236, 52);
    ctx.quadraticCurveTo(135, 52 + zipProgress * 26, 34, 52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Track base
  ctx.fillStyle = "#423427";
  ctx.fillRect(32, 52, 206, 16);

  ctx.strokeStyle = "#e8decb";
  ctx.lineWidth = 2.0;
  ctx.setLineDash([5, 3]);
  ctx.beginPath();
  ctx.moveTo(38, 60);
  ctx.lineTo(232, 60);
  ctx.stroke();
  ctx.setLineDash([]);

  // Front lip pulled down
  ctx.fillStyle = "#524131";
  ctx.strokeStyle = "#3a2d21";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(32, 52);
  ctx.quadraticCurveTo(135, 52 + zipProgress * 26, 238, 52);
  ctx.lineTo(238, 68);
  ctx.quadraticCurveTo(135, 68 + zipProgress * 16, 32, 68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Zipper Puller
  const sliderX = 38 + zipProgress * 180;
  ctx.save();
  ctx.translate(sliderX, 50);
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "#d8b26e";
  ctx.strokeStyle = "#473827";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(0, 2, 18, 18, 3);
  ctx.fill();
  ctx.stroke();

  // Tab
  ctx.fillStyle = "#b89352";
  ctx.beginPath();
  ctx.moveTo(4, 18);
  ctx.lineTo(14, 18);
  ctx.lineTo(16, 34);
  ctx.lineTo(2, 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#473827";
  ctx.beginPath();
  ctx.arc(9, 27, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

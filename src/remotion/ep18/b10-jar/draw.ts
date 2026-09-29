import { fillPaper } from "@/remotion/shared/draw-paper";
import { easeOutCubic, PAPER_THEMES, type AnimParams } from "@/remotion/shared/theme";
import { BIG_AT, FLOW_AT, FOOT_AT, SMALL_AT, TITLE_AT } from "./data";

// Unified classical Songti font family for pristine typographic harmony
const FONT_SONG = '"Noto Serif SC", "Songti SC", "Source Han Serif SC", STSong, serif';

function drawTeaSprout(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  rotation: number,
  inkColor: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  // Tea stem
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.quadraticCurveTo(3, 24, 6, 28);
  ctx.stroke();

  // Tender Bud (一芽 / 雀舌嫩芽)
  ctx.fillStyle = "#5a804a";
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-1, 14);
  ctx.bezierCurveTo(-8, 10, -15, 2, -14, -12);
  ctx.bezierCurveTo(-10, -7, -4, 3, -1, 14);
  ctx.fill();
  ctx.stroke();

  // Bud vein
  ctx.strokeStyle = "#334d28";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-1, 12);
  ctx.quadraticCurveTo(-8, 3, -13, -10);
  ctx.stroke();

  // Main Tea Leaf (主展嫩叶)
  ctx.fillStyle = "#446838";
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.bezierCurveTo(-12, 4, -12, -12, 2, -26);
  ctx.bezierCurveTo(14, -12, 12, 4, 0, 16);
  ctx.fill();
  ctx.stroke();

  // Main leaf central vein (主叶脉)
  ctx.strokeStyle = "#283e20";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 16);
  ctx.quadraticCurveTo(2, 0, 2, -24);
  ctx.stroke();

  // Side veins (侧叶脉)
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(1, 6);
  ctx.quadraticCurveTo(-4, 1, -7, 0);
  ctx.moveTo(1, 0);
  ctx.quadraticCurveTo(5, -4, 8, -5);
  ctx.moveTo(2, -8);
  ctx.quadraticCurveTo(-2, -13, -5, -15);
  ctx.stroke();

  ctx.restore();
}

function drawSingleTeaLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  rotation: number,
  inkColor: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);

  // Stem
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.quadraticCurveTo(2, 20, 4, 23);
  ctx.stroke();

  // Leaf Body
  ctx.fillStyle = "#4d723e";
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.bezierCurveTo(-10, 3, -10, -10, 1, -22);
  ctx.bezierCurveTo(10, -10, 9, 3, 0, 14);
  ctx.fill();
  ctx.stroke();

  // Vein
  ctx.strokeStyle = "#283e20";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.quadraticCurveTo(1, 0, 1, -20);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1, 4);
  ctx.quadraticCurveTo(-3, 0, -5, -1);
  ctx.moveTo(1, -3);
  ctx.quadraticCurveTo(4, -7, 6, -8);
  ctx.stroke();

  ctx.restore();
}

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);
  const theme = PAPER_THEMES[params.paperTheme ?? "classic"] ?? PAPER_THEMES.classic;
  const fontScale = params.fontScale ?? 1;

  const titleText = params.customTexts?.title || "大罐存 · 小罐醒";
  const bigLabel = params.customTexts?.bigLabel || "大罐长期封存";
  const smallLabel = params.customTexts?.smallLabel || "小罐日常慢醒";
  const footText = params.customTexts?.foot || "分工明确 · 滋味常新";

  const frame = (elapsed / 1000) * 29.97;

  // 1. Top Title Box (Classical Bookplate Title Plaque)
  if (frame >= TITLE_AT) {
    const p = easeOutCubic(Math.min(1, (frame - TITLE_AT) / 10));
    ctx.save();
    ctx.globalAlpha = p;

    // Outer card
    ctx.fillStyle = theme.paperDeep;
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(180, 160, 720, 106, 16);
    ctx.fill();
    ctx.stroke();

    // Inner fine border
    ctx.lineWidth = 1;
    ctx.globalAlpha = p * 0.18;
    ctx.strokeRect(186, 166, 708, 94);
    ctx.globalAlpha = p;

    ctx.fillStyle = theme.ink;
    ctx.font = `800 ${Math.round(64 * fontScale)}px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(titleText, 540, 214);
    ctx.restore();
  }

  // Calculate layout transition: starts centered at 540, slides to 310 when small jar arrives
  const shiftProgress = frame < SMALL_AT ? 0 : easeOutCubic(Math.min(1, (frame - SMALL_AT) / 16));
  const bigJarX = 540 + (310 - 540) * shiftProgress;
  const bigJarScale = 1.02 - 0.1 * shiftProgress;

  // 2. Big Jar (Hand-drawn Terracotta Storage Caddy)
  if (frame >= BIG_AT) {
    const p = easeOutCubic(Math.min(1, (frame - BIG_AT) / 12));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(bigJarX, 910);
    ctx.scale(p * bigJarScale, p * bigJarScale);

    // Multi-tier Ground Soft Shadow
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = p * 0.08;
    ctx.beginPath();
    ctx.ellipse(0, 270, 190, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = p * 0.16;
    ctx.beginPath();
    ctx.ellipse(0, 270, 135, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = p;

    // Jar Clay Gradient Fill
    const jarGrad = ctx.createLinearGradient(-180, 0, 180, 0);
    jarGrad.addColorStop(0, "#7a3618");
    jarGrad.addColorStop(0.28, "#b4633b");
    jarGrad.addColorStop(0.68, "#9a4f29");
    jarGrad.addColorStop(1, "#63260e");

    // Jar Body Outline
    ctx.fillStyle = jarGrad;
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-88, -190);
    ctx.bezierCurveTo(-135, -145, -188, -35, -188, 75);
    ctx.bezierCurveTo(-188, 175, -135, 250, 0, 250);
    ctx.bezierCurveTo(135, 250, 188, 175, 188, 75);
    ctx.bezierCurveTo(188, -35, 135, -145, 88, -190);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hand-drawn Left Shoulder Highlight Curve
    ctx.strokeStyle = "#f0b695";
    ctx.lineWidth = 9;
    ctx.globalAlpha = p * 0.5;
    ctx.beginPath();
    ctx.moveTo(-138, -50);
    ctx.bezierCurveTo(-156, 15, -150, 85, -118, 170);
    ctx.stroke();

    ctx.strokeStyle = "#fff2e8";
    ctx.lineWidth = 3.5;
    ctx.globalAlpha = p * 0.35;
    ctx.beginPath();
    ctx.moveTo(-126, -30);
    ctx.bezierCurveTo(-140, 25, -136, 78, -110, 145);
    ctx.stroke();
    ctx.globalAlpha = p;

    // Neck / Collar
    ctx.fillStyle = "#692d13";
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-92, -190);
    ctx.lineTo(-90, -210);
    ctx.quadraticCurveTo(0, -216, 90, -210);
    ctx.lineTo(92, -190);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lid Rim
    const lidGrad = ctx.createLinearGradient(-100, 0, 100, 0);
    lidGrad.addColorStop(0, "#692d13");
    lidGrad.addColorStop(0.35, "#9c4e25");
    lidGrad.addColorStop(1, "#541f0a");

    ctx.fillStyle = lidGrad;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(-106, -228, 212, 22, 7);
    ctx.fill();
    ctx.stroke();

    // Lid Dome
    ctx.beginPath();
    ctx.moveTo(-98, -224);
    ctx.quadraticCurveTo(0, -264, 98, -224);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lid Knob
    ctx.fillStyle = "#4a1c09";
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(0, -278, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Knob Highlight
    ctx.strokeStyle = "#eab897";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, -278, 10, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    // Traditional Cinnabar Seal '存'
    ctx.fillStyle = theme.seal;
    ctx.strokeStyle = "#faf6ee";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-64, -32, 128, 128, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#faf6ee";
    ctx.font = `900 72px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("存", 0, 32);

    // Scholar's tea label '主仓 · 封存'
    ctx.fillStyle = "#fbf9f4";
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-92, 114, 184, 40, 6);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 0.8;
    ctx.globalAlpha = p * 0.3;
    ctx.strokeRect(-87, 119, 174, 30);
    ctx.globalAlpha = p;

    ctx.fillStyle = theme.ink;
    ctx.font = `700 23px ${FONT_SONG}`;
    ctx.fillText("主仓 · 封存", 0, 134);

    ctx.restore();

    // Big Jar Bottom Card (Song-style woodblock scholar plaque)
    const bigCardX = (540 - 270) + (60 - 270) * shiftProgress;
    const bigCardW = 540 + (460 - 540) * shiftProgress;
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = theme.paperDeep;
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(bigCardX, 1240, bigCardW, 108, 16);
    ctx.fill();
    ctx.stroke();

    // Inner fine border
    ctx.lineWidth = 1;
    ctx.globalAlpha = p * 0.16;
    ctx.strokeRect(bigCardX + 5, 1245, bigCardW - 10, 98);
    ctx.globalAlpha = p;

    // Mini cinnabar seal '藏'
    ctx.fillStyle = theme.seal;
    ctx.beginPath();
    ctx.roundRect(bigCardX + 24, 1278, 32, 32, 6);
    ctx.fill();
    ctx.fillStyle = "#faf6ee";
    ctx.font = `900 18px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("藏", bigCardX + 40, 1294);

    ctx.fillStyle = theme.ink;
    ctx.font = `700 ${Math.round((shiftProgress > 0.5 ? 40 : 46) * fontScale)}px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bigLabel, bigCardX + bigCardW / 2 + 14, 1294);
    ctx.restore();
  }

  // 3. Small Jar (Hand-drawn Petite Wake-up Caddy)
  if (frame >= SMALL_AT && shiftProgress > 0.02) {
    const p = easeOutCubic(Math.min(1, (frame - SMALL_AT) / 12));
    ctx.save();
    ctx.globalAlpha = p * shiftProgress;
    ctx.translate(770, 945);
    ctx.scale(p * 0.94, p * 0.94);

    // Ground Shadow
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = p * 0.08;
    ctx.beginPath();
    ctx.ellipse(0, 240, 135, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = p * 0.14;
    ctx.beginPath();
    ctx.ellipse(0, 240, 95, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = p * shiftProgress;

    // Small Jar Body
    const smallGrad = ctx.createLinearGradient(-120, 0, 120, 0);
    smallGrad.addColorStop(0, "#554235");
    smallGrad.addColorStop(0.3, "#7e6554");
    smallGrad.addColorStop(0.7, "#6b5343");
    smallGrad.addColorStop(1, "#443226");

    ctx.fillStyle = smallGrad;
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-64, -155);
    ctx.bezierCurveTo(-105, -120, -132, -30, -132, 50);
    ctx.bezierCurveTo(-132, 150, -88, 220, 0, 220);
    ctx.bezierCurveTo(88, 220, 132, 150, 132, 50);
    ctx.bezierCurveTo(132, -30, 105, -120, 64, -155);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Highlight
    ctx.strokeStyle = "#cfb7a5";
    ctx.lineWidth = 6.5;
    ctx.globalAlpha = p * 0.45;
    ctx.beginPath();
    ctx.moveTo(-94, -40);
    ctx.bezierCurveTo(-108, 15, -100, 70, -76, 145);
    ctx.stroke();
    ctx.globalAlpha = p * shiftProgress;

    // Neck & Rim
    ctx.fillStyle = "#6b5343";
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-76, -186, 152, 18, 6);
    ctx.fill();
    ctx.stroke();

    // Dome & Knob
    ctx.fillStyle = "#5e4839";
    ctx.beginPath();
    ctx.moveTo(-70, -182);
    ctx.quadraticCurveTo(0, -214, 70, -182);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#36261c";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, -224, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Seal '醒'
    ctx.fillStyle = theme.seal;
    ctx.strokeStyle = "#faf6ee";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-50, -25, 100, 100, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#faf6ee";
    ctx.font = `900 56px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("醒", 0, 26);

    // Scholar's Tea Label '随取 · 唤醒'
    ctx.fillStyle = "#fbf9f4";
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-76, 99, 152, 34, 5);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 0.7;
    ctx.globalAlpha = p * 0.3;
    ctx.strokeRect(-71, 104, 142, 24);
    ctx.globalAlpha = p;

    ctx.fillStyle = theme.ink;
    ctx.font = `700 21px ${FONT_SONG}`;
    ctx.fillText("随取 · 唤醒", 0, 116);

    ctx.restore();

    // Small Jar Bottom Card (Song-style woodblock scholar plaque)
    ctx.save();
    ctx.globalAlpha = p * shiftProgress;
    ctx.fillStyle = theme.paperDeep;
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(560, 1240, 460, 108, 16);
    ctx.fill();
    ctx.stroke();

    // Inner fine border
    ctx.lineWidth = 1;
    ctx.globalAlpha = p * shiftProgress * 0.16;
    ctx.strokeRect(565, 1245, 450, 98);
    ctx.globalAlpha = p * shiftProgress;

    // Mini seal '醒'
    ctx.fillStyle = theme.seal;
    ctx.beginPath();
    ctx.roundRect(584, 1278, 32, 32, 6);
    ctx.fill();
    ctx.fillStyle = "#faf6ee";
    ctx.font = `900 18px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("醒", 600, 1294);

    ctx.fillStyle = theme.ink;
    ctx.font = `700 ${Math.round(40 * fontScale)}px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(smallLabel, 790 + 14, 1294);
    ctx.restore();
  }

  // 4. Flow Transition & Tea Leaves (when both are visible)
  if (frame >= FLOW_AT && shiftProgress > 0.1) {
    const p = easeOutCubic(Math.min(1, (frame - FLOW_AT) / 10));
    ctx.save();
    ctx.globalAlpha = p * shiftProgress;

    const flowDashOffset = -frame * 2.2;
    const leafFlutter1 = Math.sin(frame * 0.16) * 0.18;
    const leafFlutter2 = Math.cos(frame * 0.14) * 0.14;
    const leafFlutter3 = Math.sin((frame + 12) * 0.18) * 0.2;
    const leafFloatY1 = Math.sin(frame * 0.12) * 4;
    const leafFloatY2 = Math.cos(frame * 0.15) * 5;
    const leafFloatY3 = Math.sin((frame + 20) * 0.13) * 4;

    // Subtle tea aroma wisp
    ctx.strokeStyle = "#5a704e";
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = p * shiftProgress * 0.4;
    ctx.setLineDash([5, 7]);
    ctx.lineDashOffset = flowDashOffset * 0.8;
    ctx.beginPath();
    ctx.moveTo(470, 790);
    ctx.bezierCurveTo(510, 740, 560, 740, 650, 795);
    ctx.stroke();

    // Arched dashed curve with dynamic flowing offset
    ctx.globalAlpha = p * shiftProgress;
    ctx.strokeStyle = theme.seal;
    ctx.lineWidth = 5;
    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = flowDashOffset;
    ctx.beginPath();
    ctx.moveTo(450, 820);
    ctx.bezierCurveTo(530, 730, 610, 740, 670, 820);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // Middle Label '按周匀取' - Classical bracket slip
    ctx.fillStyle = theme.paper;
    ctx.strokeStyle = theme.seal;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(496, 688, 128, 36, 6);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 0.8;
    ctx.globalAlpha = p * shiftProgress * 0.35;
    ctx.strokeRect(500, 692, 120, 28);
    ctx.globalAlpha = p * shiftProgress;

    ctx.fillStyle = theme.seal;
    ctx.font = `700 21px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("按周匀取", 560, 706);

    // Realistic Hand-drawn Tea Leaves along the flow with living flutter
    drawSingleTeaLeaf(ctx, 482, 788 + leafFloatY1, 0.76, -0.8 + leafFlutter1, theme.ink);
    drawTeaSprout(ctx, 526, 754 + leafFloatY2, 1.02, -0.42 + leafFlutter2, theme.ink);
    drawSingleTeaLeaf(ctx, 610, 766 + leafFloatY3, 0.9, 0.35 + leafFlutter3, theme.ink);

    ctx.restore();
  }

  // 5. Punchline Footer (Auspicious Classical Mounting Scroll)
  if (frame >= FOOT_AT) {
    const p = easeOutCubic(Math.min(1, (frame - FOOT_AT) / 10));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.fillStyle = theme.paper;
    ctx.strokeStyle = theme.seal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(140, 1520, 800, 106, 16);
    ctx.fill();
    ctx.stroke();

    // Double vermilion frame
    ctx.lineWidth = 1;
    ctx.strokeRect(146, 1526, 788, 94);

    ctx.fillStyle = theme.seal;
    ctx.font = `700 20px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◆", 200, 1573);
    ctx.fillText("◆", 880, 1573);

    ctx.font = `800 ${Math.round(56 * fontScale)}px ${FONT_SONG}`;
    ctx.fillText(footText, 540, 1573);
    ctx.restore();
  }
}

import { fillPaper } from "@/remotion/shared/draw-paper";
import { FONT_SONG, type AnimParams } from "@/remotion/shared/theme";
import {
  AROMA_LEAK_START,
  AROMA_SEAL_START,
  LEADER_LINE_START,
  LEAF_WITHER_FULL,
  LEAF_WITHER_START,
  LEFT_DEFLECT_PARTICLES,
  LEFT_STAMP_DEFAULT,
  LIGHT_IMPACT_AT,
  LIGHT_START_AT,
  RIGHT_AROMA_LEAK_PARTICLES,
  RIGHT_STAMP_DEFAULT,
  STAMP_POP_AT,
} from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);

  const fontScale = params.fontScale ?? 1;
  const leftStampText = params.customTexts?.leftStamp || LEFT_STAMP_DEFAULT;
  const rightStampText = params.customTexts?.rightStamp || RIGHT_STAMP_DEFAULT;

  const fps = 29.97;
  const frame = (elapsed / 1000) * fps;

  function getSpring(f: number, dur = 20) {
    if (f <= 0) return 0;
    const t = Math.min(1, f / dur);
    const c1 = 1.35;
    const c3 = c1 + 1;
    return t >= 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // Corner L-brackets
  ctx.save();
  ctx.strokeStyle = "#2b261c";
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.14;
  ctx.strokeRect(44, 56, 992, 1808);
  ctx.lineWidth = 0.6;
  ctx.globalAlpha = 0.08;
  ctx.strokeRect(52, 64, 976, 1792);

  ctx.lineWidth = 2.4;
  ctx.globalAlpha = 0.32;
  ctx.beginPath();
  // Top-left
  ctx.moveTo(38, 80); ctx.lineTo(38, 50); ctx.lineTo(68, 50);
  // Top-right
  ctx.moveTo(1042, 80); ctx.lineTo(1042, 50); ctx.lineTo(1012, 50);
  // Bottom-left
  ctx.moveTo(38, 1840); ctx.lineTo(38, 1870); ctx.lineTo(68, 1870);
  // Bottom-right
  ctx.moveTo(1042, 1840); ctx.lineTo(1042, 1870); ctx.lineTo(1012, 1870);
  ctx.stroke();
  ctx.restore();

  // Positions
  const leftJar = { cx: 330, cy: 890, rx: 90, ry: 125 };
  const rightJar = { cx: 750, cy: 890, rx: 90, ry: 125 };

  const leftImpact = { x: 242, y: 852 };
  const rightImpact = { x: 662, y: 852 };

  const leftBeamStart = { x: 90, y: 620 };
  const rightBeamStart = { x: 510, y: 620 };

  // Stamp badge positions: staggered vertically (左高右低) to guarantee zero overlap for any text length
  const leftStampPos = { x: 330, y: 1220 };
  const rightStampPos = { x: 750, y: 1375 };

  // ----------------------------------------------------
  // Stage 1 Physics: Bounce, Sunbeams, Withering
  // ----------------------------------------------------
  const impactDelta = frame - LIGHT_IMPACT_AT;
  let leftJarScaleX = 1.0;
  let leftJarScaleY = 1.0;
  let leftJarRecoilX = 0.0;

  if (impactDelta >= 0) {
    const decay = Math.exp(-impactDelta * 0.14);
    const pop = Math.exp(-Math.pow(impactDelta - 2.0, 2) / 7.5) * 0.07;
    const osc = Math.sin(impactDelta * 0.44) * 0.04 * decay;
    leftJarScaleX = 1.0 + pop + osc;
    leftJarScaleY = 1.0 + pop * 0.8 - osc * 0.55;
    leftJarRecoilX = Math.sin(impactDelta * 0.46) * 3.8 * decay;
  }

  const lightProg = getSpring(frame - LIGHT_START_AT, 18);
  const impactProg = getSpring(impactDelta, 16);

  // Wither progress for Right Jar
  let witherProg = 0;
  if (frame > LEAF_WITHER_START) {
    witherProg = Math.min(1, Math.max(0, (frame - LEAF_WITHER_START) / (LEAF_WITHER_FULL - LEAF_WITHER_START)));
  }

  // Leaf color interpolation (#6D7B4E to #8A7258)
  const rLeaf = Math.round(109 + (138 - 109) * witherProg);
  const gLeaf = Math.round(123 + (114 - 123) * witherProg);
  const bLeaf = Math.round(78 + (88 - 78) * witherProg);
  const leafColor = `rgb(${rLeaf}, ${gLeaf}, ${bLeaf})`;

  const rVein = Math.round(70 + (92 - 70) * witherProg);
  const gVein = Math.round(85 + (72 - 85) * witherProg);
  const bVein = Math.round(47 + (50 - 47) * witherProg);
  const veinColor = `rgb(${rVein}, ${gVein}, ${bVein})`;

  const rFur = Math.round(237 + (207 - 237) * witherProg);
  const gFur = Math.round(245 + (191 - 245) * witherProg);
  const bFur = Math.round(234 + (171 - 234) * witherProg);
  const furColor = `rgb(${rFur}, ${gFur}, ${bFur})`;

  // Left jar protective aroma dome breathing
  const sealDelta = frame - AROMA_SEAL_START;
  const sealBreath = sealDelta > 0 ? Math.sin(sealDelta * 0.08) : 0;
  const sealDomeScale = 1.0 + sealBreath * 0.045;
  const sealDomeOpacity = sealDelta < 0 ? 0 : Math.min(0.72, (sealDelta / 15) * 0.72) * (1 + sealBreath * 0.1);

  // ----------------------------------------------------
  // 1. Ground Shadows under both jars
  // ----------------------------------------------------
  ctx.save();
  const leftShadowGrad = ctx.createRadialGradient(
    leftJar.cx + leftJarRecoilX * 0.7,
    leftJar.cy + leftJar.ry + 8,
    10,
    leftJar.cx + leftJarRecoilX * 0.7,
    leftJar.cy + leftJar.ry + 8,
    leftJar.rx * 1.05 * leftJarScaleX
  );
  leftShadowGrad.addColorStop(0, "rgba(43, 38, 28, 0.32)");
  leftShadowGrad.addColorStop(0.7, "rgba(43, 38, 28, 0.08)");
  leftShadowGrad.addColorStop(1, "rgba(43, 38, 28, 0)");
  ctx.fillStyle = leftShadowGrad;
  ctx.beginPath();
  ctx.ellipse(
    leftJar.cx + leftJarRecoilX * 0.7,
    leftJar.cy + leftJar.ry + 8,
    leftJar.rx * 1.05 * leftJarScaleX,
    18 * leftJarScaleY,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  const rightShadowGrad = ctx.createRadialGradient(
    rightJar.cx,
    rightJar.cy + rightJar.ry + 8,
    10,
    rightJar.cx,
    rightJar.cy + rightJar.ry + 8,
    rightJar.rx * 1.05
  );
  rightShadowGrad.addColorStop(0, "rgba(43, 38, 28, 0.28)");
  rightShadowGrad.addColorStop(0.7, "rgba(43, 38, 28, 0.08)");
  rightShadowGrad.addColorStop(1, "rgba(43, 38, 28, 0)");
  ctx.fillStyle = rightShadowGrad;
  ctx.beginPath();
  ctx.ellipse(rightJar.cx, rightJar.cy + rightJar.ry + 8, rightJar.rx * 1.05, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ----------------------------------------------------
  // 2. LEFT JAR (内釉瓷罐 / 铁罐: 深绿坚实外壁)
  // ----------------------------------------------------
  ctx.save();
  ctx.translate(leftJar.cx + leftJarRecoilX, leftJar.cy);
  ctx.scale(leftJarScaleX, leftJarScaleY);
  ctx.translate(-leftJar.cx, -leftJar.cy);

  // A. Outer Deep Green Solid Glaze Body
  const greenGlaze = ctx.createLinearGradient(leftJar.cx - 96, 0, leftJar.cx + 96, 0);
  greenGlaze.addColorStop(0, "#193725");
  greenGlaze.addColorStop(0.25, "#2c5c40");
  greenGlaze.addColorStop(0.55, "#224832");
  greenGlaze.addColorStop(0.85, "#183624");
  greenGlaze.addColorStop(1, "#0f2418");

  ctx.fillStyle = greenGlaze;
  ctx.strokeStyle = "#0b1b11";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(leftJar.cx - 72, leftJar.cy - 110);
  ctx.lineTo(leftJar.cx + 72, leftJar.cy - 110);
  ctx.bezierCurveTo(leftJar.cx + 94, leftJar.cy - 70, leftJar.cx + 96, leftJar.cy + 50, leftJar.cx + 78, leftJar.cy + 115);
  ctx.lineTo(leftJar.cx - 78, leftJar.cy + 115);
  ctx.bezierCurveTo(leftJar.cx - 96, leftJar.cy + 50, leftJar.cx - 94, leftJar.cy - 70, leftJar.cx - 72, leftJar.cy - 110);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // B. Dense Porcelain Biscuit Layer
  const biscuitGrad = ctx.createLinearGradient(leftJar.cx - 82, 0, leftJar.cx + 82, 0);
  biscuitGrad.addColorStop(0, "#eee8dc");
  biscuitGrad.addColorStop(0.5, "#ded5c5");
  biscuitGrad.addColorStop(1, "#cfc4b0");
  ctx.fillStyle = biscuitGrad;
  ctx.strokeStyle = "#3a4f40";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(leftJar.cx - 62, leftJar.cy - 104);
  ctx.lineTo(leftJar.cx + 62, leftJar.cy - 104);
  ctx.bezierCurveTo(leftJar.cx + 80, leftJar.cy - 65, leftJar.cx + 82, leftJar.cy + 45, leftJar.cx + 66, leftJar.cy + 104);
  ctx.lineTo(leftJar.cx - 66, leftJar.cy + 104);
  ctx.bezierCurveTo(leftJar.cx - 82, leftJar.cy + 45, leftJar.cx - 80, leftJar.cy - 65, leftJar.cx - 62, leftJar.cy - 104);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // C. Inner Cool Dark Sanctuary
  const cavityGrad = ctx.createRadialGradient(leftJar.cx, leftJar.cy + 20, 10, leftJar.cx, leftJar.cy + 20, 80);
  cavityGrad.addColorStop(0, "#1a251f");
  cavityGrad.addColorStop(0.7, "#101713");
  cavityGrad.addColorStop(1, "#080c0a");
  ctx.fillStyle = cavityGrad;
  ctx.beginPath();
  ctx.moveTo(leftJar.cx - 52, leftJar.cy - 96);
  ctx.lineTo(leftJar.cx + 52, leftJar.cy - 96);
  ctx.bezierCurveTo(leftJar.cx + 68, leftJar.cy - 60, leftJar.cx + 70, leftJar.cy + 40, leftJar.cx + 56, leftJar.cy + 94);
  ctx.lineTo(leftJar.cx - 56, leftJar.cy + 94);
  ctx.bezierCurveTo(leftJar.cx - 70, leftJar.cy + 40, leftJar.cx - 68, leftJar.cy - 60, leftJar.cx - 52, leftJar.cy - 96);
  ctx.closePath();
  ctx.fill();

  // D. Specular Glaze Highlight Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(leftJar.cx - 78, leftJar.cy - 60);
  ctx.bezierCurveTo(leftJar.cx - 86, leftJar.cy - 10, leftJar.cx - 84, leftJar.cy + 40, leftJar.cx - 70, leftJar.cy + 85);
  ctx.stroke();

  // Helper: Draw Tea Leaves
  function drawLeaves(cx: number, cy: number, bColor: string, vColor: string, fColor: string) {
    ctx.save();
    // 1. Silver Needles
    [
      { x: cx - 28, y: cy + 36, rot: -38, s: 1.05 },
      { x: cx + 26, y: cy + 38, rot: 42, s: 1.0 },
      { x: cx - 2, y: cy + 22, rot: -8, s: 1.15 },
    ].forEach((needle) => {
      ctx.save();
      ctx.translate(needle.x, needle.y);
      ctx.rotate((needle.rot * Math.PI) / 180);
      ctx.scale(needle.s, needle.s);

      ctx.fillStyle = bColor;
      ctx.strokeStyle = "#283a21";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.bezierCurveTo(3.2, -12, 2.8, 5, 0, 15);
      ctx.bezierCurveTo(-2.8, 5, -3.2, -12, 0, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pekoe downy fur
      ctx.strokeStyle = fColor;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-0.4, -19);
      ctx.quadraticCurveTo(0.4, -4, 0.4, 11);
      ctx.stroke();

      ctx.restore();
    });

    // 2. Peony Leaves
    [
      { x: cx - 18, y: cy + 52, rot: -22, s: 0.95 },
      { x: cx + 15, y: cy + 56, rot: 28, s: 0.9 },
      { x: cx - 4, y: cy + 68, rot: 6, s: 1.05 },
    ].forEach((peony) => {
      ctx.save();
      ctx.translate(peony.x, peony.y);
      ctx.rotate((peony.rot * Math.PI) / 180);
      ctx.scale(peony.s, peony.s);

      ctx.fillStyle = bColor;
      ctx.strokeStyle = "#27391f";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-20, 5);
      ctx.bezierCurveTo(-25, -3, -20, -16, -9, -20);
      ctx.bezierCurveTo(2, -24, 16, -15, 20, -3);
      ctx.bezierCurveTo(15, 9, 2, 14, -13, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = vColor;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-18, 5);
      ctx.quadraticCurveTo(0, -5, 18, -3);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  // Draw fresh leaves in Left Jar
  drawLeaves(leftJar.cx, leftJar.cy, "#4d6741", "#334629", "#edf5ea");

  // E. Protective Aroma Energy Dome in Left Jar
  if (sealDomeOpacity > 0.01) {
    ctx.save();
    const domeGrad = ctx.createRadialGradient(
      leftJar.cx,
      leftJar.cy + 45,
      5,
      leftJar.cx,
      leftJar.cy + 45,
      52 * sealDomeScale
    );
    domeGrad.addColorStop(0, "rgba(142, 212, 162, 0.65)");
    domeGrad.addColorStop(0.6, "rgba(102, 185, 126, 0.32)");
    domeGrad.addColorStop(0.9, "rgba(80, 160, 105, 0.12)");
    domeGrad.addColorStop(1, "rgba(60, 140, 85, 0)");
    ctx.fillStyle = domeGrad;
    ctx.globalAlpha = sealDomeOpacity;
    ctx.beginPath();
    ctx.ellipse(leftJar.cx, leftJar.cy + 45, 52 * sealDomeScale, 50 * sealDomeScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // F. Tight Silicone Gasket Ring
  ctx.fillStyle = "#d8e8dc";
  ctx.strokeStyle = "#4e6f57";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(leftJar.cx - 52, leftJar.cy - 103, 104, 9, 4.5);
  ctx.fill();
  ctx.stroke();

  // G. Solid Heavy Canister Lid
  const lidGrad = ctx.createLinearGradient(leftJar.cx - 76, 0, leftJar.cx + 76, 0);
  lidGrad.addColorStop(0, "#4a3726");
  lidGrad.addColorStop(0.35, "#694e36");
  lidGrad.addColorStop(0.75, "#553f2c");
  lidGrad.addColorStop(1, "#3d2c1e");
  ctx.fillStyle = lidGrad;
  ctx.strokeStyle = "#1c140d";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.roundRect(leftJar.cx - 76, leftJar.cy - 126, 152, 24, 6);
  ctx.fill();
  ctx.stroke();

  // Brass knob
  ctx.fillStyle = "#a6844b";
  ctx.strokeStyle = "#5c4521";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(leftJar.cx, leftJar.cy - 132, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ----------------------------------------------------
  // 3. RIGHT JAR (紫砂 / 透明玻璃复合罐)
  // ----------------------------------------------------
  ctx.save();
  // A. Internal Tea Chamber Background
  ctx.fillStyle = "rgba(58, 48, 42, 0.45)";
  ctx.beginPath();
  ctx.moveTo(rightJar.cx - 70, rightJar.cy - 110);
  ctx.lineTo(rightJar.cx + 70, rightJar.cy - 110);
  ctx.bezierCurveTo(rightJar.cx + 92, rightJar.cy - 70, rightJar.cx + 94, rightJar.cy + 50, rightJar.cx + 76, rightJar.cy + 115);
  ctx.lineTo(rightJar.cx - 76, rightJar.cy + 115);
  ctx.bezierCurveTo(rightJar.cx - 94, rightJar.cy + 50, rightJar.cx - 92, rightJar.cy - 70, rightJar.cx - 70, rightJar.cy - 110);
  ctx.closePath();
  ctx.fill();

  // B. Sunbeam Penetration & Scorching Glare inside Right Jar
  if (impactProg > 0.05) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, impactProg * 1.2);
    const scorchGrad = ctx.createRadialGradient(
      rightImpact.x + 50,
      rightImpact.y + 30,
      10,
      rightImpact.x + 50,
      rightImpact.y + 30,
      85
    );
    scorchGrad.addColorStop(0, "rgba(255, 248, 190, 0.85)");
    scorchGrad.addColorStop(0.45, "rgba(255, 200, 80, 0.5)");
    scorchGrad.addColorStop(0.85, "rgba(220, 140, 40, 0.22)");
    scorchGrad.addColorStop(1, "rgba(180, 100, 20, 0)");

    ctx.fillStyle = scorchGrad;
    ctx.beginPath();
    ctx.moveTo(rightImpact.x, rightImpact.y - 18);
    ctx.lineTo(rightImpact.x + 130, rightImpact.y + 40);
    ctx.lineTo(rightImpact.x + 105, rightImpact.y + 80);
    ctx.lineTo(rightImpact.x, rightImpact.y + 22);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 235, 120, 0.65)";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(rightImpact.x, rightImpact.y);
    ctx.lineTo(rightImpact.x + 115, rightImpact.y + 56);
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(rightImpact.x, rightImpact.y);
    ctx.lineTo(rightImpact.x + 115, rightImpact.y + 56);
    ctx.stroke();
    ctx.restore();
  }

  // C. Withered Leaves in Right Jar
  drawLeaves(rightJar.cx, rightJar.cy, leafColor, veinColor, furColor);

  // D. Translucent Frosted Glass Outer Wall
  const glassGrad = ctx.createLinearGradient(rightJar.cx - 94, 0, rightJar.cx + 94, 0);
  glassGrad.addColorStop(0, "rgba(215, 205, 190, 0.45)");
  glassGrad.addColorStop(0.25, "rgba(245, 240, 230, 0.22)");
  glassGrad.addColorStop(0.55, "rgba(215, 205, 190, 0.15)");
  glassGrad.addColorStop(0.85, "rgba(235, 225, 210, 0.35)");
  glassGrad.addColorStop(1, "rgba(200, 190, 175, 0.55)");

  ctx.fillStyle = glassGrad;
  ctx.strokeStyle = "rgba(180, 160, 140, 0.65)";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(rightJar.cx - 70, rightJar.cy - 110);
  ctx.lineTo(rightJar.cx + 70, rightJar.cy - 110);
  ctx.bezierCurveTo(rightJar.cx + 92, rightJar.cy - 70, rightJar.cx + 94, rightJar.cy + 50, rightJar.cx + 76, rightJar.cy + 115);
  ctx.lineTo(rightJar.cx - 76, rightJar.cy + 115);
  ctx.bezierCurveTo(rightJar.cx - 94, rightJar.cy + 50, rightJar.cx - 92, rightJar.cy - 70, rightJar.cx - 70, rightJar.cy - 110);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glass specular reflection
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(rightJar.cx - 76, rightJar.cy - 50);
  ctx.bezierCurveTo(rightJar.cx - 82, rightJar.cy, rightJar.cx - 80, rightJar.cy + 50, rightJar.cx - 68, rightJar.cy + 95);
  ctx.stroke();

  // E. Purple Clay Collar & Base with Micro-Pores
  const clayGrad = ctx.createLinearGradient(rightJar.cx - 74, 0, rightJar.cx + 74, 0);
  clayGrad.addColorStop(0, "#623b2e");
  clayGrad.addColorStop(0.4, "#845242");
  clayGrad.addColorStop(0.75, "#704335");
  clayGrad.addColorStop(1, "#522f24");

  ctx.fillStyle = clayGrad;
  ctx.strokeStyle = "#47261c";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(rightJar.cx - 72, rightJar.cy - 114);
  ctx.lineTo(rightJar.cx + 72, rightJar.cy - 114);
  ctx.lineTo(rightJar.cx + 70, rightJar.cy - 100);
  ctx.lineTo(rightJar.cx - 70, rightJar.cy - 100);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stippled micro-pores in purple clay
  ctx.fillStyle = "#3d2017";
  for (let idx = 0; idx < 18; idx++) {
    const px = rightJar.cx - 60 + idx * 7;
    const py = rightJar.cy - 107 + (idx % 3) * 3;
    ctx.beginPath();
    ctx.arc(px, py, 1.0, 0, Math.PI * 2);
    ctx.fill();
  }

  // F. Purple Clay Unglazed Lid
  ctx.fillStyle = clayGrad;
  ctx.strokeStyle = "#47261c";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.roundRect(rightJar.cx - 74, rightJar.cy - 126, 148, 20, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#522f24";
  ctx.strokeStyle = "#3a1d15";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(rightJar.cx, rightJar.cy - 131, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // G. Continuous Aroma Leakage ("跑香"烟雾与微粒)
  if (frame >= AROMA_LEAK_START) {
    // Wafting smoke curves
    [
      { x: rightJar.cx - 62, y: rightJar.cy - 108, dir: -1, phase: 0 },
      { x: rightJar.cx + 60, y: rightJar.cy - 108, dir: 1, phase: 2 },
      { x: rightJar.cx - 30, y: rightJar.cy - 124, dir: -1, phase: 4 },
      { x: rightJar.cx + 32, y: rightJar.cy - 124, dir: 1, phase: 1 },
    ].forEach((wisp) => {
      const wDelta = frame - AROMA_LEAK_START + wisp.phase * 5;
      const wCycle = (wDelta % 45) / 45;
      const waftY = -wCycle * 110;
      const waftX = wisp.dir * Math.sin(wCycle * Math.PI * 2) * 24;
      const wAlpha = (1 - wCycle) * 0.75 * Math.min(1, (frame - AROMA_LEAK_START) / 12);

      ctx.save();
      ctx.strokeStyle = "rgba(142, 198, 152, 0.7)";
      ctx.lineWidth = 2.4 * (1 - wCycle * 0.6);
      ctx.lineCap = "round";
      ctx.globalAlpha = wAlpha;
      ctx.beginPath();
      ctx.moveTo(wisp.x, wisp.y);
      ctx.quadraticCurveTo(wisp.x + waftX * 0.5, wisp.y + waftY * 0.5, wisp.x + waftX, wisp.y + waftY);
      ctx.stroke();
      ctx.restore();
    });

    // Escaping drifting aroma particles
    RIGHT_AROMA_LEAK_PARTICLES.forEach((pt) => {
      const leakDelta = frame - AROMA_LEAK_START + pt.phase * 6;
      if (leakDelta < 0) return;
      const pProg = (leakDelta % 40) / 40;
      const curX =
        rightJar.cx +
        pt.originX +
        pt.driftX * pProg +
        Math.sin(leakDelta * pt.wobbleSpeed) * pt.wobbleAmp;
      const curY = rightJar.cy + pt.originY + pt.riseY * pProg;
      const pAlpha =
        Math.min(1, pProg / 0.15) * Math.max(0, 1 - Math.pow(pProg, 1.8)) * 0.75;
      const curR = pt.size * (0.8 + pProg * 0.6);

      ctx.save();
      ctx.globalAlpha = pAlpha;
      ctx.fillStyle = "rgba(160, 215, 175, 0.3)";
      ctx.beginPath();
      ctx.arc(curX, curY, curR * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(125, 190, 142, 0.7)";
      ctx.beginPath();
      ctx.arc(curX, curY, curR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(curX, curY, curR * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
  ctx.restore();

  // ----------------------------------------------------
  // 4. DUAL SUNBEAMS (0.5s - 2.5s)
  // ----------------------------------------------------
  if (lightProg > 0.01) {
    function drawBeam(startX: number, startY: number, targetX: number, targetY: number) {
      const curX = startX + (targetX - startX) * Math.min(1, lightProg);
      const curY = startY + (targetY - startY) * Math.min(1, lightProg);

      ctx.save();
      // Outer ambient gold glow
      ctx.strokeStyle = "rgba(255, 225, 100, 0.35)";
      ctx.lineWidth = 26;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      // Searing core
      ctx.strokeStyle = "rgba(255, 215, 80, 0.85)";
      ctx.lineWidth = 8.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      // Center white line
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      ctx.restore();
    }

    drawBeam(leftBeamStart.x, leftBeamStart.y, leftImpact.x, leftImpact.y);
    drawBeam(rightBeamStart.x, rightBeamStart.y, rightImpact.x, rightImpact.y);
  }

  // ----------------------------------------------------
  // 5. LEFT JAR DEFLECTION & SCATTER (B4-1 极效折射系统)
  // ----------------------------------------------------
  if (impactProg > 0.02) {
    ctx.save();
    const defEndX = leftImpact.x + (-170) * impactProg;
    const defEndY = leftImpact.y + (-130) * impactProg;

    // Deflected ray
    ctx.strokeStyle = "rgba(255, 225, 100, 0.42)";
    ctx.lineWidth = 24;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(leftImpact.x, leftImpact.y);
    ctx.lineTo(defEndX, defEndY);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 220, 100, 0.88)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(leftImpact.x, leftImpact.y);
    ctx.lineTo(defEndX, defEndY);
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.88;
    ctx.beginPath();
    ctx.moveTo(leftImpact.x, leftImpact.y);
    ctx.lineTo(defEndX, defEndY);
    ctx.stroke();

    // Shockwaves
    if (impactDelta >= 0 && impactDelta < 22) {
      const sProg = impactDelta / 22;
      ctx.strokeStyle = "rgba(255, 245, 180, 0.88)";
      ctx.lineWidth = Math.max(0.5, (1 - sProg) * 2.8);
      ctx.globalAlpha = 1 - sProg;
      ctx.beginPath();
      ctx.ellipse(leftImpact.x, leftImpact.y, sProg * 50, sProg * 44, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Glaze Hotspot
    ctx.fillStyle = "rgba(255, 255, 220, 0.96)";
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(leftImpact.x, leftImpact.y, 16 * (1 - impactProg * 0.2), 0, Math.PI * 2);
    ctx.fill();

    // Diamond Star Flare
    ctx.save();
    ctx.translate(leftImpact.x, leftImpact.y);
    ctx.rotate((frame * 3.5 * Math.PI) / 180);
    const flareScale = 1.25 - 0.5 * impactProg;
    ctx.scale(flareScale, flareScale);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.quadraticCurveTo(0, 0, 24, 0);
    ctx.quadraticCurveTo(0, 0, 0, 24);
    ctx.quadraticCurveTo(0, 0, -24, 0);
    ctx.quadraticCurveTo(0, 0, 0, -24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Ballistic Particles
    LEFT_DEFLECT_PARTICLES.forEach((pt) => {
      const pFrame = frame - LIGHT_IMPACT_AT - pt.delay;
      if (pFrame < 0 || pFrame > pt.life) return;

      const prog = pFrame / pt.life;
      const easeProg = 1 - Math.pow(1 - prog, 2.3);
      const arc = Math.sin(prog * Math.PI);
      const wobbleX = Math.sin(prog * pt.wobbleFreq) * pt.wobbleAmp;
      const wobbleY = Math.cos(prog * pt.wobbleFreq) * (pt.wobbleAmp * 0.65);

      const curX = leftImpact.x + pt.vx * easeProg + pt.curveX * arc + wobbleX;
      const curY = leftImpact.y + pt.vy * easeProg + pt.curveY * arc + wobbleY;

      const tailProg = Math.max(0, prog - 0.16);
      const tailEase = 1 - Math.pow(1 - tailProg, 2.3);
      const tailArc = Math.sin(tailProg * Math.PI);
      const tailX = leftImpact.x + pt.vx * tailEase + pt.curveX * tailArc;
      const tailY = leftImpact.y + pt.vy * tailEase + pt.curveY * tailArc;

      const alpha =
        Math.min(1, prog / 0.14) * Math.max(0, 1 - Math.pow(prog, 2.6)) * 0.85;
      const curR = pt.size * (0.8 + (1 - prog) * 0.3);

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      // Trail
      if (pt.hasTrail) {
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = Math.max(1, curR * 0.75);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(curX, curY);
        ctx.stroke();
      }

      ctx.fillStyle = pt.glowColor;
      ctx.beginPath();
      ctx.arc(curX, curY, curR * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(curX, curY, curR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(curX, curY, curR * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  // ----------------------------------------------------
  // 6. STAGE 2: LEADER DASHED LINES (红细虚线引线动效)
  // ----------------------------------------------------
  const leaderProg = getSpring(frame - LEADER_LINE_START, 18);
  const stampProg = getSpring(frame - STAMP_POP_AT, 14);

  if (leaderProg > 0.02) {
    function drawLeader(jarX: number, jarY: number, stampY: number) {
      const startX = jarX;
      const startY = jarY + 125 - 8;
      const targetY = stampY - 32 * fontScale;
      const curY = startY + (targetY - startY) * leaderProg;

      ctx.save();
      ctx.strokeStyle = "#a33226";
      ctx.lineWidth = 2.4;
      ctx.globalAlpha = Math.min(1, leaderProg * 1.5);
      ctx.setLineDash([5, 3.5]);

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, curY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = "#a33226";
      ctx.beginPath();
      ctx.arc(startX, startY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(startX, startY, 8.0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    drawLeader(leftJar.cx, leftJar.cy, leftStampPos.y);
    drawLeader(rightJar.cx, rightJar.cy, rightStampPos.y);
  }

  // ----------------------------------------------------
  // 7. DUAL STAMP BADGES (阶段二：米白底红框标牌，无裂纹，高低错落零重叠)
  // ----------------------------------------------------
  function drawBadge(
    x: number,
    y: number,
    text: string,
    prog: number
  ) {
    if (prog <= 0.01) return;
    const baseScale = 1.36 - 0.36 * prog;
    const effScale = baseScale * fontScale;
    const alpha = Math.min(1, prog * 1.8);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(effScale, effScale);
    ctx.globalAlpha = alpha;

    // Measure text to dynamically fit padding comfortably
    ctx.font = `700 38px ${FONT_SONG}`;
    const textWidth = ctx.measureText(text).width;
    const badgeW = Math.max(260, textWidth + 56);
    const halfW = badgeW / 2;

    // 2. 澄心堂纸与印泥的正片叠底融合 (Multiply blending with Xuan paper)
    ctx.globalCompositeOperation = "multiply";

    // Badge Background (米白暖宣底，与澄心堂纸底纹正片叠底)
    ctx.fillStyle = "#fdfbf6";
    ctx.strokeStyle = "#a33226";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-halfW, -36, badgeW, 72, 8);
    ctx.fill();
    ctx.stroke();

    // Paper micro-grain dots & fiber specks (纸张微杂色与纸纤维颗粒)
    ctx.fillStyle = "rgba(140, 40, 25, 0.12)";
    for (let gi = 0; gi < 28; gi++) {
      const gx = -halfW + 10 + ((gi * 47 + 19) % (badgeW - 20));
      const gy = -30 + ((gi * 23 + 11) % 60);
      const gr = gi % 3 === 0 ? 1.2 : 0.75;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(70, 50, 30, 0.08)";
    for (let gi = 0; gi < 20; gi++) {
      const gx = -halfW + 14 + ((gi * 53 + 31) % (badgeW - 28));
      const gy = -28 + ((gi * 17 + 13) % 56);
      ctx.beginPath();
      ctx.arc(gx, gy, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner Dashed Line
    ctx.strokeStyle = "rgba(163, 50, 38, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -32, badgeW - 8, 64, 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // 1. 题跋文字“墨化出场” (Ink-Bleed Text Transition: 4.5px blur down to 0)
    const textBlur = Math.max(0, 4.5 * (1 - Math.min(1, Math.max(0, (prog - 0.1) / 0.75))));
    const hasFilter = typeof ctx.filter === "string";
    if (textBlur > 0.1 && hasFilter) {
      ctx.filter = `blur(${textBlur.toFixed(1)}px)`;
    }

    // Text
    ctx.fillStyle = "#a33226";
    ctx.font = `700 38px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 2);

    if (hasFilter) {
      ctx.filter = "none";
    }

    ctx.restore();
  }

  // Left Stamp: 「瓷·铁 锁香 ✔」
  drawBadge(leftStampPos.x, leftStampPos.y, leftStampText, stampProg);

  // Right Stamp: 「砂·玻 见光死 ✖」
  drawBadge(rightStampPos.x, rightStampPos.y, rightStampText, stampProg);
}

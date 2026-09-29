import { fillPaper } from "@/remotion/shared/draw-paper";
import {
  FONT_SONG,
  type AnimParams,
} from "@/remotion/shared/theme";
import {
  AROMA_BURST_AT,
  LID_START_AT,
  LIGHT_IMPACT_AT,
  LIGHT_START_AT,
  REFRACT_PARTICLES,
  SILICONE_TOUCH_AT,
  STAMP_LIGHT_AT,
  STAMP_LIGHT_TEXT,
  STAMP_SEAL_AT,
  STAMP_SEAL_TEXT,
} from "./data";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  fillPaper(ctx, params.paperTheme);

  const fontScale = params.fontScale ?? 1;
  const lightStampText = params.customTexts?.lightStamp || STAMP_LIGHT_TEXT;
  const sealStampText = params.customTexts?.sealStamp || STAMP_SEAL_TEXT;

  const fps = 29.97;
  const frame = (elapsed / 1000) * fps;

  const cx = 540;
  const cy = 806;

  function getSpring(f: number, dur = 20) {
    if (f <= 0) return 0;
    const t = Math.min(1, f / dur);
    const c1 = 1.35;
    const c3 = c1 + 1;
    return t >= 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // ----------------------------------------------------
  // Part 1: Punchy Elastic Jar Bounce on Light Beam Impact (撞击放大与回弹)
  // ----------------------------------------------------
  const impactDelta = frame - LIGHT_IMPACT_AT;
  let jarScaleX = 1.0;
  let jarScaleY = 1.0;
  let jarRecoilX = 0.0;

  if (impactDelta >= 0) {
    const decay = Math.exp(-impactDelta * 0.13);
    // Punchy pop impulse peaking at delta ≈ 2.2 frames (~1.085 scale)
    const pop = Math.exp(-Math.pow(impactDelta - 2.2, 2) / 8.0) * 0.078;
    // Harmonic oscillation for elastic rebound and tactile settling
    const osc = Math.sin(impactDelta * 0.42) * 0.048 * decay;

    jarScaleX = 1.0 + pop + osc;
    jarScaleY = 1.0 + pop * 0.82 - osc * 0.6;
    jarRecoilX = Math.sin(impactDelta * 0.46) * 4.6 * decay;
  }

  // 3 Primary impact centers along the left glaze boundary
  const hitOrigins = [
    { x: 414, y: 735 }, // Upper jar shoulder
    { x: 405, y: 778 }, // Jar belly apex
    { x: 410, y: 822 }, // Lower jar belly
  ];

  // ----------------------------------------------------
  // 1. Contact shadow under the jar (scales and shifts with bounce)
  // ----------------------------------------------------
  ctx.save();
  const shadowGrad = ctx.createRadialGradient(
    cx + jarRecoilX * 0.7,
    cy + 178,
    20,
    cx + jarRecoilX * 0.7,
    cy + 178,
    160 * jarScaleX
  );
  shadowGrad.addColorStop(0, "rgba(43, 38, 28, 0.28)");
  shadowGrad.addColorStop(0.7, "rgba(43, 38, 28, 0.08)");
  shadowGrad.addColorStop(1, "rgba(43, 38, 28, 0)");
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(cx + jarRecoilX * 0.7, cy + 178, 160 * jarScaleX, 22 * jarScaleY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ----------------------------------------------------
  // 2. Ceramic Jar Longitudinal Cross-Section (纵剖面)
  // Scaled with Punchy Elastic Bounce Physics around (cx, cy)
  // ----------------------------------------------------
  ctx.save();
  ctx.translate(cx + jarRecoilX, cy);
  ctx.scale(jarScaleX, jarScaleY);
  ctx.translate(-cx, -cy);

  // A. Inner cool dark tea sanctuary
  ctx.save();
  const coolCavityGrad = ctx.createRadialGradient(cx, cy + 40, 20, cx, cy + 40, 160);
  coolCavityGrad.addColorStop(0, "#222b26");
  coolCavityGrad.addColorStop(0.65, "#151b18");
  coolCavityGrad.addColorStop(1, "#0c100e");
  ctx.fillStyle = coolCavityGrad;

  // Define cavity path
  ctx.beginPath();
  ctx.moveTo(472, 660);
  ctx.lineTo(472, 696);
  ctx.bezierCurveTo(472, 730, 422, 755, 422, 820);
  ctx.bezierCurveTo(422, 890, 440, 954, 540, 954);
  ctx.bezierCurveTo(640, 954, 658, 890, 658, 820);
  ctx.bezierCurveTo(658, 755, 608, 730, 608, 696);
  ctx.lineTo(608, 660);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#1a1f1d";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ----------------------------------------------------
  // A2. REAL WHITE TEA (真实白茶 · 严禁填满 · 精准 8分满)
  // Fills from Y: 954 up to Y: 765. Empty headroom above!
  // ----------------------------------------------------
  ctx.save();
  // Clip inside the tea chamber
  ctx.beginPath();
  ctx.moveTo(472, 660);
  ctx.lineTo(472, 696);
  ctx.bezierCurveTo(472, 730, 422, 755, 422, 820);
  ctx.bezierCurveTo(422, 890, 440, 954, 540, 954);
  ctx.bezierCurveTo(640, 954, 658, 890, 658, 820);
  ctx.bezierCurveTo(658, 755, 608, 730, 608, 696);
  ctx.lineTo(608, 660);
  ctx.closePath();
  ctx.clip();

  // Base tea bed mass gradient (fills up to Y: 765)
  const teaBedGrad = ctx.createLinearGradient(0, 765, 0, 954);
  teaBedGrad.addColorStop(0, "#32442c");
  teaBedGrad.addColorStop(0.35, "#24331f");
  teaBedGrad.addColorStop(0.75, "#1b2518");
  teaBedGrad.addColorStop(1, "#121a10");
  ctx.fillStyle = teaBedGrad;
  ctx.beginPath();
  ctx.rect(400, 765, 280, 200);
  ctx.fill();

  // Internal stratum shading
  ctx.fillStyle = "rgba(16, 24, 14, 0.45)";
  ctx.beginPath();
  ctx.rect(410, 825, 260, 140);
  ctx.fill();
  ctx.fillStyle = "rgba(10, 16, 8, 0.55)";
  ctx.beginPath();
  ctx.rect(415, 880, 250, 80);
  ctx.fill();

  // Realistic tea helper functions
  const drawRealNeedle = (nx: number, ny: number, angle: number, sc: number) => {
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.scale(sc, sc);

    // Needle body
    ctx.fillStyle = "#4d6741";
    ctx.strokeStyle = "#283a21";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.bezierCurveTo(3.5, -13, 3, 5, 0, 16);
    ctx.bezierCurveTo(-3, 5, -3.5, -13, 0, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Silvery pekoe downy fur along spine (白毫)
    ctx.strokeStyle = "#edf5ea";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-0.5, -21);
    ctx.quadraticCurveTo(0.5, -4, 0.5, 12);
    ctx.stroke();

    ctx.restore();
  };

  const drawRealPeonyLeaf = (
    lx: number,
    ly: number,
    angle: number,
    sc: number,
    col: string,
    curlCol: string,
    dryTip = false
  ) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.scale(sc, sc);

    // Natural undulating withered leaf
    ctx.fillStyle = col;
    ctx.strokeStyle = "#27391f";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-22, 6);
    ctx.bezierCurveTo(-28, -3, -22, -18, -10, -22);
    ctx.bezierCurveTo(2, -26, 18, -16, 22, -3);
    ctx.bezierCurveTo(16, 10, 2, 15, -14, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Leaf vein
    ctx.strokeStyle = "#334629";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-20, 6);
    ctx.quadraticCurveTo(0, -6, 20, -4);
    ctx.stroke();

    // Downy silvery curl
    ctx.fillStyle = curlCol;
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.bezierCurveTo(-4, -13, 8, -6, 18, -1);
    ctx.bezierCurveTo(12, 4, 2, 2, -8, -6);
    ctx.closePath();
    ctx.fill();

    if (dryTip) {
      ctx.fillStyle = "#6b5336";
      ctx.beginPath();
      ctx.moveTo(18, -6);
      ctx.bezierCurveTo(22, -3, 21, 2, 17, 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  const drawTwig = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.strokeStyle = "#685437";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  // Dry tea stems
  drawTwig(455, 910, 485, 895);
  drawTwig(530, 860, 565, 845);
  drawTwig(600, 890, 625, 870);
  drawTwig(480, 815, 510, 800);
  drawTwig(570, 810, 605, 795);

  // Withered peony leaves in the 80% bed
  drawRealPeonyLeaf(485, 920, -20, 0.95, "#3d5137", "#a6bc9f");
  drawRealPeonyLeaf(555, 925, 25, 1.05, "#455c3d", "#b2c6aa", true);
  drawRealPeonyLeaf(615, 905, -32, 0.9, "#384a32", "#9fb398");
  drawRealPeonyLeaf(445, 895, 38, 0.88, "#40553a", "#a8bda1");
  drawRealPeonyLeaf(515, 875, -12, 1.12, "#4e6544", "#bfd3b7", true);
  drawRealPeonyLeaf(580, 865, 45, 0.98, "#3f5338", "#a3b79c");
  drawRealPeonyLeaf(460, 845, -26, 1.05, "#526b48", "#c5dac0");
  drawRealPeonyLeaf(625, 840, -18, 0.95, "#475f3f", "#adc2a6", true);
  drawRealPeonyLeaf(540, 830, 16, 1.18, "#496340", "#b5cbb0");
  drawRealPeonyLeaf(475, 795, 28, 1.0, "#58734e", "#cbdec5");
  drawRealPeonyLeaf(565, 788, -22, 1.15, "#516b47", "#c0d5ba", true);
  drawRealPeonyLeaf(615, 795, 22, 0.92, "#48603e", "#b1c5ab");
  drawRealPeonyLeaf(505, 778, -8, 1.2, "#5d7b53", "#d2e6cd");

  // Silver needles in bed
  drawRealNeedle(510, 915, -18, 0.95);
  drawRealNeedle(575, 905, 22, 1.0);
  drawRealNeedle(468, 870, 34, 1.05);
  drawRealNeedle(542, 855, -10, 1.1);
  drawRealNeedle(608, 865, -28, 0.98);
  drawRealNeedle(482, 825, 16, 1.15);
  drawRealNeedle(532, 810, -15, 1.2);
  drawRealNeedle(588, 820, 26, 1.1);
  drawRealNeedle(448, 785, -30, 1.08);
  drawRealNeedle(622, 780, 18, 1.12);

  // Protruding top silver needles (80% full crest, tips to Y: 748)
  drawRealNeedle(438, 766, -24, 1.25);
  drawRealNeedle(472, 758, -12, 1.3);
  drawRealNeedle(506, 752, 8, 1.35);
  drawRealNeedle(540, 748, -4, 1.38);
  drawRealNeedle(574, 754, 15, 1.32);
  drawRealNeedle(608, 760, -20, 1.28);
  drawRealNeedle(638, 770, 26, 1.2);

  // Fluffy undulating crest outline
  ctx.strokeStyle = "#7da36e";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(420, 772);
  ctx.quadraticCurveTo(450, 758, 480, 762);
  ctx.quadraticCurveTo(510, 752, 540, 756);
  ctx.quadraticCurveTo(570, 750, 600, 758);
  ctx.quadraticCurveTo(630, 754, 660, 774);
  ctx.stroke();

  ctx.restore(); // end clip
  ctx.restore(); // end coolCavityGrad

  // E. Pulsing Golden Aroma Qi Sphere (After AROMA_BURST_AT)
  if (frame >= AROMA_BURST_AT) {
    const aromaProgress = getSpring(frame - AROMA_BURST_AT, 22);
    const breathingCycle = Math.sin((frame - AROMA_BURST_AT) * 0.08);
    const aromaScale = (0.2 + 0.8 * aromaProgress) * (1 + breathingCycle * 0.04);
    const aromaOpacity = Math.min(0.85, aromaProgress * 0.85) * (1 + breathingCycle * 0.12);

    ctx.save();
    ctx.translate(cx, cy + 25);
    ctx.scale(aromaScale, aromaScale);
    ctx.globalAlpha = aromaOpacity;

    const aromaGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 145);
    aromaGrad.addColorStop(0, "rgba(250, 220, 120, 0.9)");
    aromaGrad.addColorStop(0.45, "rgba(235, 190, 75, 0.45)");
    aromaGrad.addColorStop(0.8, "rgba(215, 160, 45, 0.15)");
    aromaGrad.addColorStop(1, "rgba(215, 160, 45, 0)");

    ctx.fillStyle = aromaGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 145, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 230, 130, 0.55)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 105 + breathingCycle * 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 240, 160, 0.7)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 68 + breathingCycle * 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // B. Clay biscuit cross sections (Left & Right)
  const clayGrad = ctx.createLinearGradient(0, 660, 0, 974);
  clayGrad.addColorStop(0, "#f5f0e6");
  clayGrad.addColorStop(0.5, "#ece4d3");
  clayGrad.addColorStop(1, "#dfd5c1");
  ctx.fillStyle = clayGrad;
  ctx.strokeStyle = "#2b261c";
  ctx.lineWidth = 1.8;

  // Left biscuit
  ctx.beginPath();
  ctx.moveTo(454, 660);
  ctx.lineTo(472, 660);
  ctx.lineTo(472, 696);
  ctx.bezierCurveTo(472, 730, 422, 755, 422, 820);
  ctx.bezierCurveTo(422, 890, 440, 954, 540, 954);
  ctx.lineTo(540, 974);
  ctx.bezierCurveTo(445, 974, 402, 910, 402, 820);
  ctx.bezierCurveTo(402, 745, 454, 720, 454, 696);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Right biscuit
  ctx.beginPath();
  ctx.moveTo(626, 660);
  ctx.lineTo(608, 660);
  ctx.lineTo(608, 696);
  ctx.bezierCurveTo(608, 730, 658, 755, 658, 820);
  ctx.bezierCurveTo(658, 890, 640, 954, 540, 954);
  ctx.lineTo(540, 974);
  ctx.bezierCurveTo(635, 974, 678, 910, 678, 820);
  ctx.bezierCurveTo(678, 745, 626, 720, 626, 696);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // C. Celadon glaze outer rim line
  ctx.strokeStyle = "#5c7a6e";
  ctx.lineWidth = 3.4;
  ctx.lineCap = "round";

  // Left lip & belly
  ctx.beginPath();
  ctx.moveTo(454, 660);
  ctx.lineTo(454, 696);
  ctx.bezierCurveTo(454, 720, 402, 745, 402, 820);
  ctx.bezierCurveTo(402, 910, 445, 974, 540, 974);
  ctx.stroke();

  // Right lip & belly
  ctx.beginPath();
  ctx.moveTo(626, 660);
  ctx.lineTo(626, 696);
  ctx.bezierCurveTo(626, 720, 678, 745, 678, 820);
  ctx.bezierCurveTo(678, 910, 635, 974, 540, 974);
  ctx.stroke();

  // Top lip hatch lines
  ctx.strokeStyle = "#b0a592";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(454, 660);
  ctx.lineTo(472, 660);
  ctx.moveTo(608, 660);
  ctx.lineTo(626, 660);
  ctx.stroke();

  // Foot ring
  ctx.fillStyle = "#d2c7b5";
  ctx.strokeStyle = "#2b261c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.rect(465, 974, 150, 10);
  ctx.fill();
  ctx.stroke();

  ctx.restore(); // Restore jar elastic scale

  // ----------------------------------------------------
  // 3. Movable Wooden Lid & Silicone Gasket
  // ----------------------------------------------------
  const lidProgress = getSpring(frame - LID_START_AT, 22);
  const lidYOffset = (1 - lidProgress) * -180;

  const siliconeProgress = getSpring(frame - SILICONE_TOUCH_AT, 20);
  const siliconeScaleY = 1.0 - 0.6 * siliconeProgress;
  const siliconeScaleX = 1.0 + 0.24 * siliconeProgress;

  ctx.save();
  ctx.translate(0, lidYOffset);

  // Lower wooden plug
  ctx.fillStyle = "#734d2c";
  ctx.strokeStyle = "#2b261c";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(475, 654, 130, 36, 3);
  ctx.fill();
  ctx.stroke();

  // Left silicone ring
  ctx.save();
  ctx.translate(474, 672);
  ctx.scale(siliconeScaleX, siliconeScaleY);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#b5bcc0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Right silicone ring
  ctx.save();
  ctx.translate(606, 672);
  ctx.scale(siliconeScaleX, siliconeScaleY);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#b5bcc0";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Wooden Lid Overhanging Cap
  const woodLidGrad = ctx.createLinearGradient(440, 0, 640, 0);
  woodLidGrad.addColorStop(0, "#7a5230");
  woodLidGrad.addColorStop(0.35, "#966842");
  woodLidGrad.addColorStop(0.7, "#845a35");
  woodLidGrad.addColorStop(1, "#684424");
  ctx.fillStyle = woodLidGrad;
  ctx.strokeStyle = "#2b261c";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(440, 656);
  ctx.bezierCurveTo(440, 648, 480, 634, 540, 634);
  ctx.bezierCurveTo(600, 634, 640, 648, 640, 656);
  ctx.lineTo(640, 662);
  ctx.lineTo(440, 662);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wooden Knob
  ctx.beginPath();
  ctx.ellipse(cx, 622, 16, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ----------------------------------------------------
  // 4. Light Beams & High-Impact Dramatic Deflection
  // ----------------------------------------------------
  if (frame >= LIGHT_START_AT) {
    const beams = [
      { startX: 110, startY: 440, hitX: 414, hitY: 735, delay: 0 },
      { startX: 85, startY: 495, hitX: 405, hitY: 778, delay: 2 },
      { startX: 110, startY: 555, hitX: 410, hitY: 822, delay: 1 },
    ];

    beams.forEach((beam) => {
      const bProg = getSpring(frame - LIGHT_START_AT - beam.delay, 16);
      const curX = beam.startX + (beam.hitX - beam.startX) * bProg;
      const curY = beam.startY + (beam.hitY - beam.startY) * bProg;

      ctx.save();
      ctx.strokeStyle = "rgba(255, 215, 60, 0.45)";
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(beam.startX, beam.startY);
      ctx.lineTo(curX, curY);
      ctx.stroke();

      ctx.strokeStyle = "#fff2a8";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(beam.startX, beam.startY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
      ctx.restore();
    });

    if (frame >= LIGHT_IMPACT_AT) {
      const impactProg = Math.min(1, (frame - LIGHT_IMPACT_AT) / 16);

      const refRays = [
        { hitX: 414, hitY: 735, refX: 65, refY: 385 },
        { hitX: 405, hitY: 778, refX: 40, refY: 510 },
        { hitX: 410, hitY: 822, refX: 75, refY: 635 },
      ];

      refRays.forEach((ref, idx) => {
        const endX = ref.hitX + (ref.refX - ref.hitX) * impactProg;
        const endY = ref.hitY + (ref.refY - ref.hitY) * impactProg;

        ctx.save();
        // 1. Wide ambient golden beam glow
        ctx.strokeStyle = "rgba(255, 225, 100, 0.42)";
        ctx.lineWidth = 24;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(ref.hitX, ref.hitY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 2. Rich golden gradient deflected beam
        ctx.strokeStyle = "rgba(255, 240, 150, 0.95)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(ref.hitX, ref.hitY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 3. White-hot central core line
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(ref.hitX, ref.hitY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // 4. Primary glaze impact hotspot
        ctx.fillStyle = "rgba(255, 255, 220, 0.96)";
        ctx.beginPath();
        ctx.arc(ref.hitX, ref.hitY, 20 * (1 - impactProg * 0.28), 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 240, 160, 0.88)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ref.hitX, ref.hitY, 36 * impactProg, 0, Math.PI * 2);
        ctx.stroke();

        // 5. Rotating diamond star flare on impact
        ctx.save();
        ctx.translate(ref.hitX, ref.hitY);
        ctx.rotate((idx * 30 + frame * 3.5) * (Math.PI / 180));
        const flareScale = Math.min(1.25, Math.max(0.6, 1.25 - impactProg * 0.55));
        ctx.scale(flareScale, flareScale);
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.moveTo(0, -26);
        ctx.quadraticCurveTo(0, 0, 26, 0);
        ctx.quadraticCurveTo(0, 0, 0, 26);
        ctx.quadraticCurveTo(0, 0, -26, 0);
        ctx.quadraticCurveTo(0, 0, 0, -26);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();
      });

      // Concentric Optical Refraction Shockwaves radiating off the glazed porcelain
      hitOrigins.forEach((pt, sIdx) => {
        const sDelta = frame - LIGHT_IMPACT_AT - sIdx * 1.5;
        if (sDelta < 0 || sDelta > 20) return;
        const ringP = sDelta / 20;
        const ringR1 = ringP * 54;
        const ringR2 = ringP * 30;
        const ringAlpha = (1 - ringP) * 0.82;

        ctx.save();
        ctx.strokeStyle = "rgba(255, 245, 180, 0.9)";
        ctx.lineWidth = Math.max(0.5, (1 - ringP) * 3);
        ctx.globalAlpha = ringAlpha;
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, ringR1, ringR1 * 0.85, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 215, 60, 0.7)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, ringR2, ringR2 * 0.85, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // 28 Dynamic, Curved Ballistic Refraction Particles
      REFRACT_PARTICLES.forEach((pt) => {
        const pFrame = frame - LIGHT_IMPACT_AT - pt.delay;
        if (pFrame < 0 || pFrame > pt.life) return;

        const prog = pFrame / pt.life;
        const easeProg = 1 - Math.pow(1 - prog, 2.3);
        const arc = Math.sin(prog * Math.PI);
        const wobbleX = Math.sin(prog * pt.wobbleFreq) * pt.wobbleAmp;
        const wobbleY = Math.cos(prog * pt.wobbleFreq) * (pt.wobbleAmp * 0.65);

        const origin = hitOrigins[pt.originIdx];
        const curX = origin.x + pt.vx * easeProg + pt.curveX * arc + wobbleX;
        const curY = origin.y + pt.vy * easeProg + pt.curveY * arc + wobbleY;

        const tailProg = Math.max(0, prog - 0.16);
        const tailEase = 1 - Math.pow(1 - tailProg, 2.3);
        const tailArc = Math.sin(tailProg * Math.PI);
        const tailX = origin.x + pt.vx * tailEase + pt.curveX * tailArc;
        const tailY = origin.y + pt.vy * tailEase + pt.curveY * tailArc;

        const alpha =
          Math.min(1, prog / 0.14) *
          Math.max(0, 1 - Math.pow(prog, 2.6)) *
          (0.85 + 0.15 * Math.sin(pFrame * 1.6));

        let curR = pt.size;
        if (prog < 0.25) {
          curR = pt.size * (0.8 + (prog / 0.25) * 0.45);
        } else if (prog < 0.8) {
          curR = pt.size * (1.25 - ((prog - 0.25) / 0.55) * 0.35);
        } else {
          curR = pt.size * (0.9 - ((prog - 0.8) / 0.2) * 0.55);
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        // Motion streak comet trail
        if (pt.hasTrail) {
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = Math.max(1, curR * 0.75);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(curX, curY);
          ctx.stroke();
        }

        // Luminous outer halo
        ctx.fillStyle = pt.glowColor;
        ctx.beginPath();
        ctx.arc(curX, curY, curR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Core glowing spark
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(curX, curY, curR, 0, Math.PI * 2);
        ctx.fill();

        // White-hot center
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(curX, curY, curR * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // 4-pointed diamond star flare
        if (pt.isStar) {
          ctx.save();
          ctx.translate(curX, curY);
          ctx.rotate((pFrame * 7 + pt.id * 32) * (Math.PI / 180));
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.92));
          const sl = curR * 2.5;
          ctx.beginPath();
          ctx.moveTo(0, -sl);
          ctx.quadraticCurveTo(0, 0, sl, 0);
          ctx.quadraticCurveTo(0, 0, 0, sl);
          ctx.quadraticCurveTo(0, 0, -sl, 0);
          ctx.quadraticCurveTo(0, 0, 0, -sl);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      });
    }
  }

  // ----------------------------------------------------
  // 5. Large Vertical Stamps & Leader Lines (Scaled by fontScale)
  // ----------------------------------------------------
  const topStampPos = { x: 540, y: 410 };
  const bottomStampPos = { x: 540, y: 1210 };

  const stampLightProg = getSpring(frame - STAMP_LIGHT_AT, 18);
  const stampSealProg = getSpring(frame - STAMP_SEAL_AT, 18);

  // A. Top Leader Line (Points to Silicone Gasket Seal)
  if (stampSealProg > 0.05) {
    ctx.save();
    ctx.strokeStyle = "#a33226";
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = Math.min(1, stampSealProg * 1.5);

    // Trunk line from stamp down
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(topStampPos.x, topStampPos.y + 44 * fontScale);
    ctx.lineTo(topStampPos.x, 636 + lidYOffset * 0.3);
    ctx.stroke();

    // Branch line across
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(474, 636 + lidYOffset * 0.3);
    ctx.lineTo(606, 636 + lidYOffset * 0.3);
    ctx.moveTo(474, 636 + lidYOffset * 0.3);
    ctx.lineTo(474, 665 + lidYOffset);
    ctx.moveTo(606, 636 + lidYOffset * 0.3);
    ctx.lineTo(606, 665 + lidYOffset);
    ctx.stroke();

    // Target circles
    ctx.fillStyle = "#a33226";
    ctx.beginPath();
    ctx.arc(474, 665 + lidYOffset, 4.5, 0, Math.PI * 2);
    ctx.arc(606, 665 + lidYOffset, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(474, 665 + lidYOffset, 8.0, 0, Math.PI * 2);
    ctx.arc(606, 665 + lidYOffset, 8.0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // B. Bottom Leader Line (Points to Ceramic Wall Reflection Zone)
  if (stampLightProg > 0.05) {
    ctx.save();
    ctx.strokeStyle = "#a33226";
    ctx.lineWidth = 2.4;
    ctx.globalAlpha = Math.min(1, stampLightProg * 1.5);
    ctx.setLineDash([5, 3]);

    ctx.beginPath();
    ctx.moveTo(bottomStampPos.x, bottomStampPos.y - 44 * fontScale);
    ctx.lineTo(bottomStampPos.x, 1060);
    ctx.lineTo(410, 880);
    ctx.lineTo(405, 780);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = "#a33226";
    ctx.beginPath();
    ctx.arc(405, 780, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(405, 780, 9.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // C. Helper to draw large prominent stamp (Scaled by fontScale)
  function drawLargeStamp(x: number, y: number, text: string, prog: number) {
    if (prog <= 0.01) return;
    const baseScale = 1.38 - 0.38 * prog;
    const effScale = baseScale * fontScale;
    const alpha = Math.min(1, prog * 1.8);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(effScale, effScale);
    ctx.globalAlpha = alpha;

    // 2. 澄心堂纸与印泥的正片叠底融合 (Multiply blending with Xuan paper)
    ctx.globalCompositeOperation = "multiply";

    // Outer border & warm seal base
    ctx.fillStyle = "#fdfbf6";
    ctx.strokeStyle = "#a33226";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-160, -44, 320, 88, 10);
    ctx.fill();
    ctx.stroke();

    // Paper micro-grain dots & fiber specks (纸张微杂色与纸纤维颗粒)
    ctx.fillStyle = "rgba(140, 40, 25, 0.12)";
    for (let gi = 0; gi < 36; gi++) {
      const gx = -150 + ((gi * 47 + 19) % 300);
      const gy = -38 + ((gi * 23 + 11) % 76);
      const gr = gi % 3 === 0 ? 1.3 : 0.8;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(70, 50, 30, 0.08)";
    for (let gi = 0; gi < 24; gi++) {
      const gx = -146 + ((gi * 53 + 31) % 292);
      const gy = -34 + ((gi * 17 + 13) % 68);
      ctx.beginPath();
      ctx.arc(gx, gy, 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner dashed decorative border
    ctx.strokeStyle = "rgba(163, 50, 38, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.roundRect(-154, -38, 308, 76, 6);
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
    ctx.font = `700 48px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 3);

    if (hasFilter) {
      ctx.filter = "none";
    }

    ctx.restore();
  }

  // Top Stamp (密封 ✔)
  drawLargeStamp(topStampPos.x, topStampPos.y, sealStampText, stampSealProg);

  // Bottom Stamp (避光 ✔)
  drawLargeStamp(bottomStampPos.x, bottomStampPos.y, lightStampText, stampLightProg);
}

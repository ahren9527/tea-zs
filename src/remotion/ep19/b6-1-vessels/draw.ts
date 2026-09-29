import { FONT_SONG, type AnimParams } from "@/remotion/shared/theme";
import {
  TITLE_DEFAULT,
  STAMP_DEFAULT,
} from "./data";
import { GOLDEN_STARS } from "./Comp";

export function draw(ctx: CanvasRenderingContext2D, elapsed: number, params: AnimParams) {
  const fontScale = params.fontScale ?? 1;
  const titleText = params.customTexts?.title || TITLE_DEFAULT;
  const stampText = params.customTexts?.stamp || STAMP_DEFAULT;

  const t = elapsed / 1000; // time in seconds

  function clamp(val: number, min: number, max: number) {
    return Math.max(min, Math.min(max, val));
  }

  function easeBackOut(prog: number, s = 1.8) {
    const p = clamp(prog, 0, 1) - 1;
    return p * p * ((s + 1) * p + s) + 1;
  }

  function easePower2Out(prog: number) {
    const p = clamp(prog, 0, 1);
    return 1 - (1 - p) * (1 - p);
  }

  // ----------------------------------------------------
  // 1. 上半屏：暗仓夜境（沿斜杠 X: 0, Y: 1040 ➔ X: 1080, Y: 840 裁切）
  // ----------------------------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(1080, 0);
  ctx.lineTo(1080, 840);
  ctx.lineTo(0, 1040);
  ctx.closePath();
  ctx.clip();

  const nightBgGrad = ctx.createLinearGradient(0, 0, 0, 1040);
  nightBgGrad.addColorStop(0, "#18110D");
  nightBgGrad.addColorStop(0.6, "#2A201A");
  nightBgGrad.addColorStop(1, "#3A2D23");
  ctx.fillStyle = nightBgGrad;
  ctx.fillRect(0, 0, 1080, 1040);

  // 暗夜暗角蒙版
  const vig = ctx.createRadialGradient(540, 360, 0, 540, 360, 720);
  vig.addColorStop(0, "rgba(62, 48, 37, 0.45)");
  vig.addColorStop(0.7, "rgba(28, 20, 14, 0.85)");
  vig.addColorStop(1, "rgba(18, 12, 8, 0.98)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 1080, 1040);

  // 微小金色圆形粒子不规则循环闪烁效果
  GOLDEN_STARS.forEach((star) => {
    const wave = (Math.sin((t * Math.PI) / star.dur + star.delay * 2) + 1) / 2;
    const twinkle = 0.15 + 0.85 * wave;
    const sScale = 0.6 + 0.75 * wave;

    ctx.save();
    ctx.globalAlpha = twinkle;
    ctx.translate(star.x, star.y);
    ctx.scale(sScale, sScale);

    // 金色粒子柔和光晕
    const sGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, star.r * 2.6);
    sGlow.addColorStop(0, "rgba(255, 253, 231, 0.95)");
    sGlow.addColorStop(0.45, "rgba(255, 224, 130, 0.75)");
    sGlow.addColorStop(1, "rgba(255, 179, 0, 0)");
    ctx.fillStyle = sGlow;
    ctx.beginPath();
    ctx.arc(0, 0, star.r * 2.6, 0, Math.PI * 2);
    ctx.fill();

    // 核心亮圆
    ctx.fillStyle = "#FFE082";
    ctx.beginPath();
    ctx.arc(0, 0, star.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 细线金色残月 (🌙 cx: 860, cy: 190)
  const moonBreath = 0.95 + 0.08 * Math.sin(t * 2.6);
  ctx.save();
  ctx.translate(860, 190);
  ctx.scale(moonBreath, moonBreath);

  const moonHalo = ctx.createRadialGradient(0, 0, 0, 0, 0, 38);
  moonHalo.addColorStop(0, "rgba(255, 249, 196, 0.35)");
  moonHalo.addColorStop(0.6, "rgba(255, 213, 79, 0.18)");
  moonHalo.addColorStop(1, "rgba(255, 179, 0, 0)");
  ctx.fillStyle = moonHalo;
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFE082";
  ctx.strokeStyle = "#FFD54F";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(18, -32);
  ctx.bezierCurveTo(34, -14, 34, 14, 18, 32);
  ctx.bezierCurveTo(8, 18, 8, -18, 18, -32);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 大陶瓮侧影沉睡 (X: 340, Y: 500)
  ctx.save();
  ctx.translate(340, 500);

  // 瓮底阴影
  ctx.fillStyle = "rgba(10, 6, 4, 0.75)";
  ctx.beginPath();
  ctx.ellipse(0, 225, 100, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // 瓮体
  const urnGrad = ctx.createLinearGradient(-90, -20, 90, 230);
  urnGrad.addColorStop(0, "#3A281E");
  urnGrad.addColorStop(0.35, "#4D3629");
  urnGrad.addColorStop(0.7, "#2E1F16");
  urnGrad.addColorStop(1, "#1A110C");
  ctx.fillStyle = urnGrad;
  ctx.strokeStyle = "#150E09";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-54, -20);
  ctx.bezierCurveTo(-90, 25, -104, 105, -96, 175);
  ctx.bezierCurveTo(-88, 220, -64, 230, -44, 230);
  ctx.lineTo(44, 230);
  ctx.bezierCurveTo(64, 230, 88, 220, 96, 175);
  ctx.bezierCurveTo(104, 105, 90, 25, 54, -20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 陶瓮暗部轮廓深沉高光
  ctx.strokeStyle = "rgba(255, 235, 205, 0.14)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-48, -18);
  ctx.bezierCurveTo(-78, 28, -90, 100, -84, 165);
  ctx.stroke();

  // 封口布
  ctx.fillStyle = "#8C7456";
  ctx.strokeStyle = "#3D2E20";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-55, -20);
  ctx.quadraticCurveTo(0, -38, 55, -20);
  ctx.lineTo(58, 6);
  ctx.quadraticCurveTo(0, -4, -58, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 红绳缠绕
  ctx.strokeStyle = "#C33E32";
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.ellipse(0, -6, 52, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 封签 [封]
  ctx.save();
  ctx.translate(20, 60);
  ctx.fillStyle = "#C33E32";
  ctx.strokeStyle = "#8E1C12";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(-11, 0, 22, 38, 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#FAF5EE";
  ctx.font = `900 14px ${FONT_SONG}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("封", 0, 21);
  ctx.restore();

  // 0.7s 飘起手绘淡水墨「Zzz」
  if (t >= 0.7) {
    const zConfigs = [
      { start: 0.7, size: 34, baseX: 20, baseY: -45, color: "#D7C4A5" },
      { start: 0.96, size: 26, baseX: 38, baseY: -78, color: "#BFAF95" },
      { start: 1.22, size: 20, baseX: 52, baseY: -108, color: "#9E8F7A" },
    ];
    zConfigs.forEach((zc) => {
      if (t >= zc.start) {
        const zProg = clamp((t - zc.start) / 1.3, 0, 1);
        const zFade = t > zc.start + 1.0 ? clamp(1 - (t - (zc.start + 1.0)) / 0.8, 0, 1) : clamp(zProg * 2.5, 0, 1);
        const zOffset = -35 * easePower2Out(zProg);
        const zXOffset = 14 * zProg;

        ctx.save();
        ctx.globalAlpha = zFade * 0.82;
        ctx.fillStyle = zc.color;
        ctx.font = `900 ${zc.size}px ${FONT_SONG}`;
        ctx.textAlign = "center";
        ctx.fillText(zc.size > 28 ? "Z" : "z", zc.baseX + zXOffset, zc.baseY + zOffset);
        ctx.restore();
      }
    });
  }
  ctx.restore();
  ctx.restore();

  // ----------------------------------------------------
  // 2. 下半屏：晨曦案头（沿斜杠 X: 0, Y: 1040 ➔ X: 1080, Y: 840 裁切）
  // ----------------------------------------------------
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 1040);
  ctx.lineTo(1080, 840);
  ctx.lineTo(1080, 1920);
  ctx.lineTo(0, 1920);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = "#FAF7F0";
  ctx.fillRect(0, 840, 1080, 1080);

  // ☀️ 晨曦暖阳 (位于案头左上方 X: 220, Y: 1140，清晰可见)
  ctx.save();
  ctx.translate(220, 1140);
  const sunAlpha = easePower2Out(clamp((t - 0.7) / 1.2, 0, 1));
  ctx.globalAlpha = sunAlpha;

  // 暖阳光芒光晕
  const sunAura = ctx.createRadialGradient(0, 0, 0, 0, 0, 140);
  sunAura.addColorStop(0, "rgba(255, 224, 130, 0.85)");
  sunAura.addColorStop(0.5, "rgba(255, 204, 128, 0.45)");
  sunAura.addColorStop(0.85, "rgba(255, 224, 130, 0.15)");
  sunAura.addColorStop(1, "rgba(250, 247, 240, 0)");
  ctx.fillStyle = sunAura;
  ctx.beginPath();
  ctx.arc(0, 0, 140, 0, Math.PI * 2);
  ctx.fill();

  // 暖阳光芒金线
  ctx.strokeStyle = "#FFE082";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  rayAngles.forEach((ang) => {
    const rad = (ang * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * 70, Math.sin(rad) * 70);
    ctx.lineTo(Math.cos(rad) * 96, Math.sin(rad) * 96);
    ctx.stroke();
  });

  // 暖阳核心圆轮
  const sunCoreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
  sunCoreGrad.addColorStop(0, "#FFF9C4");
  sunCoreGrad.addColorStop(0.4, "#FFE082");
  sunCoreGrad.addColorStop(0.7, "#FFA726");
  sunCoreGrad.addColorStop(1, "#FB8C00");
  ctx.fillStyle = sunCoreGrad;
  ctx.strokeStyle = "#FFA000";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 晨光斜照金束 (Sunbeam Ray)
  if (t >= 0.8) {
    const sunbeamAlpha = easePower2Out(clamp((t - 0.8) / 1.2, 0, 1)) * 0.88;
    ctx.save();
    ctx.globalAlpha = sunbeamAlpha;

    const sunbeamGrad = ctx.createLinearGradient(220, 1140, 1080, 1780);
    sunbeamGrad.addColorStop(0, "rgba(255, 236, 179, 0.45)");
    sunbeamGrad.addColorStop(0.55, "rgba(255, 248, 225, 0.18)");
    sunbeamGrad.addColorStop(1, "rgba(250, 247, 240, 0)");

    ctx.fillStyle = sunbeamGrad;
    ctx.beginPath();
    ctx.moveTo(220, 1140);
    ctx.lineTo(1080, 1260);
    ctx.lineTo(1080, 1780);
    ctx.lineTo(460, 1920);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 小瓷罐特写（X: 680, Y: 1390）
  ctx.save();
  ctx.translate(680, 1390);

  // 晨光下柔和投影
  ctx.fillStyle = "rgba(70, 50, 35, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 195, 76, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 墨绿瓷罐主体
  const celadonMorningGrad = ctx.createLinearGradient(-70, -10, 70, 195);
  celadonMorningGrad.addColorStop(0, "#1E3827");
  celadonMorningGrad.addColorStop(0.3, "#2E523A");
  celadonMorningGrad.addColorStop(0.6, "#457052");
  celadonMorningGrad.addColorStop(0.85, "#2A4A34");
  celadonMorningGrad.addColorStop(1, "#162B1D");

  ctx.fillStyle = celadonMorningGrad;
  ctx.strokeStyle = "#15291C";
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(-44, -10);
  ctx.bezierCurveTo(-72, 30, -78, 105, -70, 165);
  ctx.bezierCurveTo(-64, 195, -46, 195, -32, 195);
  ctx.lineTo(32, 195);
  ctx.bezierCurveTo(46, 195, 64, 195, 70, 165);
  ctx.bezierCurveTo(78, 105, 72, 30, 44, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 强玉质晨光高光
  ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-36, 24);
  ctx.bezierCurveTo(-54, 66, -56, 115, -48, 160);
  ctx.stroke();

  // 莹白敞开瓷罐口
  ctx.fillStyle = "#FAF7F0";
  ctx.strokeStyle = "#7A8F80";
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.ellipse(0, -10, 44, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 敞口茶香内膛
  const innerAromaLight = ctx.createRadialGradient(0, -9, 0, 0, -9, 38);
  innerAromaLight.addColorStop(0, "rgba(255, 224, 130, 0.9)");
  innerAromaLight.addColorStop(0.45, "rgba(165, 214, 167, 0.5)");
  innerAromaLight.addColorStop(1, "rgba(46, 77, 56, 0)");
  ctx.fillStyle = innerAromaLight;
  ctx.beginPath();
  ctx.ellipse(0, -9, 38, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 瓷盖安放于罐体右侧案头（避免遮挡茶叶）
  ctx.save();
  ctx.translate(108, 172);
  ctx.rotate((16 * Math.PI) / 180);

  // 盖子在案头上的投影
  ctx.fillStyle = "rgba(70, 50, 35, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 14, 44, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // 盖身
  ctx.fillStyle = celadonMorningGrad;
  ctx.strokeStyle = "#15291C";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 42, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-42, 0);
  ctx.bezierCurveTo(-42, -14, 42, -14, 42, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 顶钮
  ctx.fillStyle = "#4E785C";
  ctx.beginPath();
  ctx.ellipse(0, -16, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 1.0s - 2.8s: 3 层淡金竹青色茶香光晕波纹 (从敞开口顺畅升腾)
  if (t >= 1.0) {
    const waveDelays = [0, 0.3, 0.6];
    waveDelays.forEach((del, i) => {
      const wStart = 1.0 + del;
      if (t >= wStart) {
        const wProg = clamp((t - wStart) / 1.4, 0, 1);
        const wAlpha = t > wStart + 0.9 ? clamp(1 - (t - (wStart + 0.9)) / 0.5, 0, 1) : clamp(wProg * 2.2, 0, 0.85);
        const wScale = 0.5 + 1.15 * easePower2Out(wProg);
        const wYOffset = -42 * easePower2Out(wProg) - i * 16;

        ctx.save();
        ctx.globalAlpha = wAlpha;
        const waveGrad = ctx.createRadialGradient(0, -18 + wYOffset, 0, 0, -18 + wYOffset, 52 * wScale);
        waveGrad.addColorStop(0, "rgba(255, 224, 130, 0.8)");
        waveGrad.addColorStop(0.55, "rgba(129, 199, 132, 0.45)");
        waveGrad.addColorStop(1, "rgba(102, 187, 106, 0)");

        ctx.fillStyle = waveGrad;
        ctx.strokeStyle = i % 2 === 0 ? "rgba(197, 160, 89, 0.8)" : "rgba(129, 199, 132, 0.8)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, -18 + wYOffset, (50 + i * 8) * wScale, (22 + i * 4) * wScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  // 淡金绿叶（🍃）聚香飞旋 (1.0s - 2.8s，视野开阔无遮挡)
  if (t >= 1.0) {
    const leafProg = clamp((t - 1.0) / 0.9, 0, 1);
    const leafAlpha = clamp(leafProg * 1.5, 0, 1);
    let leafY = -24 - 12 * easePower2Out(leafProg);
    let leafRot = 12 * easePower2Out(leafProg);

    if (t > 1.9) {
      const p2 = clamp((t - 1.9) / 1.3, 0, 1);
      leafY = -36 - 4 * Math.sin(p2 * Math.PI);
      leafRot = 12 - 20 * p2;
    }

    ctx.save();
    ctx.translate(0, leafY);
    ctx.rotate((leafRot * Math.PI) / 180);
    ctx.globalAlpha = leafAlpha;

    // 主叶
    const leafGrad = ctx.createLinearGradient(-4, 0, 4, -46);
    leafGrad.addColorStop(0, "#81C784");
    leafGrad.addColorStop(0.5, "#4CAF50");
    leafGrad.addColorStop(1, "#2E7D32");

    ctx.fillStyle = leafGrad;
    ctx.strokeStyle = "#1B5E20";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-10, -18, -5, -36, 5, -46);
    ctx.bezierCurveTo(10, -30, 14, -14, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 侧伴叶
    ctx.beginPath();
    ctx.moveTo(2, -10);
    ctx.bezierCurveTo(14, -16, 20, -30, 18, -40);
    ctx.bezierCurveTo(12, -30, 5, -18, 2, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 金色光尘
    ctx.fillStyle = "#FFE082";
    ctx.beginPath();
    ctx.arc(3, -32, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
  ctx.restore();

  // ----------------------------------------------------
  // 3. 中间分割线：纯净金色与朱砂双线【斜杠】(无突兀阴影涂抹)
  // ----------------------------------------------------
  ctx.save();
  const slashAuraGrad = ctx.createLinearGradient(0, 1040, 1080, 840);
  slashAuraGrad.addColorStop(0, "rgba(255, 224, 130, 0)");
  slashAuraGrad.addColorStop(0.35, "rgba(255, 224, 130, 0.35)");
  slashAuraGrad.addColorStop(0.65, "rgba(195, 62, 50, 0.25)");
  slashAuraGrad.addColorStop(1, "rgba(255, 224, 130, 0)");
  ctx.strokeStyle = slashAuraGrad;
  ctx.lineWidth = 20;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 1040);
  ctx.lineTo(1080, 840);
  ctx.stroke();

  // 斜杠金色主线
  const slashGoldGrad = ctx.createLinearGradient(0, 1040, 1080, 840);
  slashGoldGrad.addColorStop(0, "rgba(197, 160, 89, 0.85)");
  slashGoldGrad.addColorStop(0.5, "#FFE082");
  slashGoldGrad.addColorStop(1, "rgba(197, 160, 89, 0.85)");
  ctx.strokeStyle = slashGoldGrad;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(-10, 1042);
  ctx.lineTo(1090, 838);
  ctx.stroke();

  // 斜杠朱砂红细线
  ctx.strokeStyle = "rgba(195, 62, 50, 0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 1046);
  ctx.lineTo(1090, 842);
  ctx.stroke();
  ctx.restore();

  // ----------------------------------------------------
  // 4. 居中交界处压轴主标（画面唯一文字，破空砸落横幅）
  // ----------------------------------------------------
  if (t >= 0.4) {
    const bannerProg = clamp((t - 0.4) / 0.55, 0, 1);
    const bannerScale = 2.2 - (2.2 - 1.0) * easeBackOut(bannerProg, 1.8);
    const bannerYOffset = (1 - easeBackOut(bannerProg, 1.8)) * -80;
    const bannerRot = (1 - easeBackOut(bannerProg, 1.8)) * -6;
    const bannerAlpha = clamp(bannerProg * 2.5, 0, 1);

    const bannerW = 760;
    const bannerH = 96;
    const bannerCenterX = 540;
    const bannerCenterY = 875 + bannerH / 2 + bannerYOffset;

    ctx.save();
    ctx.translate(bannerCenterX, bannerCenterY);
    ctx.scale(bannerScale, bannerScale);
    ctx.rotate((bannerRot * Math.PI) / 180);
    ctx.globalAlpha = bannerAlpha;

    // 悬浮阴影
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.roundRect(-bannerW / 2 + 6, -bannerH / 2 + 10, bannerW, bannerH, 8);
    ctx.fill();

    // 横幅底盒
    ctx.fillStyle = "#FAF5EE";
    ctx.strokeStyle = "#C33E32";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 8);
    ctx.fill();
    ctx.stroke();

    // 内嵌金色边框
    ctx.strokeStyle = "#C5A059";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-bannerW / 2 + 4, -bannerH / 2 + 4, bannerW - 8, bannerH - 8, 5);
    ctx.stroke();

    // 主标题文字
    ctx.fillStyle = "#4A3425";
    ctx.font = `700 ${Math.round(54 * fontScale)}px ${FONT_SONG}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const titleWidth = ctx.measureText(titleText).width;
    const stampSize = 56 * fontScale;
    const gap = 24;
    const totalW = titleWidth + gap + stampSize;
    const startX = -totalW / 2;

    ctx.fillText(titleText, startX, 0);

    // 朱砂红印章 [准则]
    const stampX = startX + titleWidth + gap + stampSize / 2;
    ctx.save();
    ctx.translate(stampX, 0);

    ctx.fillStyle = "rgba(195, 62, 50, 0.08)";
    ctx.strokeStyle = "#C33E32";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-stampSize / 2, -stampSize / 2, stampSize, stampSize, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#C33E32";
    ctx.font = `900 ${Math.round(22 * fontScale)}px ${FONT_SONG}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stampText, 0, -1);
    ctx.restore();

    ctx.restore();
  }

  // ----------------------------------------------------
  // 四角古典 L 型细线框
  // ----------------------------------------------------
  ctx.save();
  const pad = 50;
  const len = 36;
  ctx.strokeStyle = "rgba(255, 235, 205, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad + len, pad);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad, pad + len);
  ctx.moveTo(1080 - pad - len, pad);
  ctx.lineTo(1080 - pad, pad);
  ctx.lineTo(1080 - pad, pad + len);
  ctx.stroke();

  ctx.strokeStyle = "rgba(110, 83, 63, 0.4)";
  ctx.beginPath();
  ctx.moveTo(pad + len, 1920 - pad);
  ctx.lineTo(pad, 1920 - pad);
  ctx.lineTo(pad, 1920 - pad - len);
  ctx.moveTo(1080 - pad - len, 1920 - pad);
  ctx.lineTo(1080 - pad, 1920 - pad);
  ctx.lineTo(1080 - pad, 1920 - pad - len);
  ctx.stroke();
  ctx.restore();
}

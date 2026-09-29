import fs from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 44100;

function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(intSample), 44 + i * 2);
  }

  return buffer;
}

// Simple 2-pole resonant bandpass filter
class BPF {
  constructor(freq, q, sr = SAMPLE_RATE) {
    const w0 = (2 * Math.PI * freq) / sr;
    const alpha = Math.sin(w0) / (2 * q);
    this.b0 = alpha;
    this.b1 = 0;
    this.b2 = -alpha;
    this.a0 = 1 + alpha;
    this.a1 = -2 * Math.cos(w0);
    this.a2 = 1 - alpha;
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
  }
  process(x) {
    const y =
      (this.b0 / this.a0) * x +
      (this.b1 / this.a0) * this.x1 +
      (this.b2 / this.a0) * this.x2 -
      (this.a1 / this.a0) * this.y1 -
      (this.a2 / this.a0) * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

// 1. 沉木印章声（低钝实感）：古木方章盖在宣纸上的沉闷微顿声（咚/笃），不要尖锐金属声，沉稳有分量
function genWoodStamp() {
  const duration = 0.42;
  const N = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(N);

  const bpfLow = new BPF(120, 2.5);
  const bpfMid = new BPF(240, 3.0);
  const bpfPaper = new BPF(900, 1.2);

  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;
    // Pitch drops from 190Hz down to 80Hz rapidly in 25ms
    const pitch = 80 + 110 * Math.exp(-t * 80);
    const phase = 2 * Math.PI * pitch * t;

    // Wooden thud body
    const bodyEnv = Math.exp(-t * 22);
    const body = Math.sin(phase) * 0.7 + Math.sin(phase * 2) * 0.25 + Math.sin(phase * 0.5) * 0.3;
    const bodyFiltered = bpfLow.process(body * bodyEnv) + bpfMid.process(body * bodyEnv) * 0.4;

    // Rice paper impact slap (first 18ms)
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 120);
    const paper = bpfPaper.process(noise) * 0.45;

    // Solid wood rebound click
    const click = t < 0.005 ? Math.sin((t / 0.005) * Math.PI) * 0.5 : 0;

    out[i] = (bodyFiltered * 1.4 + paper + click) * 0.95;
  }
  return out;
}

// 2. 干茶沙沙声 + 微弱气流声：抓动干燥白茶条索的细碎摩擦声，夹带一丝极轻微的放气声（微嗤--）
function genTeaRustleHiss() {
  const duration = 0.75;
  const N = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(N);

  const bpfHiss = new BPF(3800, 2.2);
  const bpfTea1 = new BPF(2200, 4.0);
  const bpfTea2 = new BPF(4200, 5.0);

  // Random micro-grains for crisp tea leaf friction
  const grains = [];
  for (let g = 0; g < 36; g++) {
    grains.push({
      time: 0.08 + Math.random() * 0.55,
      dur: 0.004 + Math.random() * 0.008,
      amp: 0.2 + Math.random() * 0.6,
      freq: 1800 + Math.random() * 3200,
    });
  }

  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;

    // a) Air puff / hiss ("微嗤--")
    let hissEnv = 0;
    if (t < 0.08) hissEnv = (t / 0.08) * 0.4;
    else if (t < 0.35) hissEnv = 0.4 * Math.exp(-(t - 0.08) * 8);

    const whiteNoise = Math.random() * 2 - 1;
    const hiss = bpfHiss.process(whiteNoise) * hissEnv;

    // b) Dry tea leaf strip rustling / friction grains
    let grainVal = 0;
    for (const gr of grains) {
      if (t >= gr.time && t < gr.time + gr.dur) {
        const gt = (t - gr.time) / gr.dur;
        const gEnv = Math.sin(gt * Math.PI);
        const gNoise = (Math.random() * 2 - 1) * gEnv * gr.amp;
        grainVal += gNoise;
      }
    }
    const teaFiltered = bpfTea1.process(grainVal) * 0.6 + bpfTea2.process(grainVal) * 0.5;

    out[i] = (hiss * 0.65 + teaFiltered * 0.85) * 0.9;
  }
  return out;
}

// 3. 空灵微风声（柔和泛音）：极低音量的气流轻拂竹林声，或单声空灵木质小泛音，声音随着粒子上升逐渐消隐
function genEtherealBreeze() {
  const duration = 1.35;
  const N = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(N);

  const bpfWind = new BPF(1600, 1.4);

  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;

    // Gentle swell envelope: attack 140ms, long smooth tail
    const env = t < 0.14 ? Math.sin((t / 0.14) * (Math.PI / 2)) : Math.exp(-(t - 0.14) * 2.8);

    // Warm pentatonic bamboo bell overtone: E5 (659.3Hz) + B5 (987.8Hz) + E6 (1318.5Hz)
    const f1 = 659.25;
    const f2 = 987.77;
    const f3 = 1318.5;
    const harmonic =
      Math.sin(2 * Math.PI * f1 * t) * 0.5 +
      Math.sin(2 * Math.PI * f2 * t) * 0.32 * Math.exp(-t * 3.5) +
      Math.sin(2 * Math.PI * f3 * t) * 0.18 * Math.exp(-t * 5.0);

    // Subtle breath of wind
    const windNoise = (Math.random() * 2 - 1) * 0.12 * Math.exp(-t * 2.2);
    const filteredWind = bpfWind.process(windNoise);

    out[i] = (harmonic * 0.42 + filteredWind * 0.28) * env * 0.9;
  }
  return out;
}

// 4. 空谷水滴声（单声）：清脆、圆润的一记泉水滴入深潭声（叮咚/滴），点出“潮气入内”
function genWaterDrop() {
  const duration = 0.55;
  const N = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(N);

  const bpfCave = new BPF(820, 4.5);

  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;

    // Pitch sweep: upward plink (880Hz to 1680Hz in first 16ms), then gentle ring
    let freq;
    if (t < 0.016) {
      freq = 880 + 800 * (t / 0.016);
    } else {
      freq = 1680 * Math.exp(-(t - 0.016) * 7);
    }

    const env = t < 0.003 ? t / 0.003 : Math.exp(-(t - 0.003) * 16);
    const dropTone = Math.sin(2 * Math.PI * freq * t) * env;

    // Secondary cavern/depth resonance
    const deepTone = Math.sin(2 * Math.PI * 540 * t) * Math.exp(-t * 12) * 0.35;
    const caveReverb = bpfCave.process(dropTone) * 0.35 * Math.exp(-t * 8);

    out[i] = (dropTone * 0.8 + deepTone + caveReverb) * 0.85;
  }
  return out;
}

// 5. 竹算盘拨珠声 / 木棘轮连响：清脆连续的木珠拨动声（嗒嗒嗒嗒嗒），传达数值快速下坠
function genAbacusSlide() {
  const duration = 1.9;
  const N = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(N);

  // Generate 16 distinct crisp bamboo bead clicks accelerating then slowing slightly
  const clicks = [];
  const count = 15;
  let curT = 0.04;
  for (let c = 0; c < count; c++) {
    const progress = c / count;
    // Spacing narrows then slightly settles
    const step = 0.14 - progress * 0.075;
    clicks.push({
      time: curT,
      freq: 1500 + Math.random() * 500,
      pitchDrop: 400 + Math.random() * 200,
      amp: 0.45 + (1 - Math.abs(progress - 0.5)) * 0.45,
    });
    curT += step;
  }

  for (const clk of clicks) {
    const startIdx = Math.floor(clk.time * SAMPLE_RATE);
    const clickLen = Math.floor(0.028 * SAMPLE_RATE);
    for (let j = 0; j < clickLen && startIdx + j < N; j++) {
      const ct = j / SAMPLE_RATE;
      const cEnv = Math.exp(-ct * 160);
      const curFreq = clk.freq - clk.pitchDrop * Math.exp(-ct * 200);
      const tone = (Math.sin(2 * Math.PI * curFreq * ct) + (Math.random() * 2 - 1) * 0.35) * cEnv;
      out[startIdx + j] += tone * clk.amp * 0.5;
    }
  }

  // Normalize
  let maxA = 0;
  for (let i = 0; i < N; i++) if (Math.abs(out[i]) > maxA) maxA = Math.abs(out[i]);
  if (maxA > 0) {
    for (let i = 0; i < N; i++) out[i] = (out[i] / maxA) * 0.82;
  }

  return out;
}

// 6. 滑动条到尾定格声：滑槽阻尼滑行微声 + 终点磁吸/卡扣限位落槽声（清脆顺滑归位）
function genSliderLock() {
  const duration = 0.38;
  const N = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(N);

  const bpfFriction = new BPF(2800, 2.5);
  const bpfNotch = new BPF(1850, 4.2);
  const bpfThump = new BPF(210, 2.8);

  const stopTime = 0.095; // moment slider hits end notch

  for (let i = 0; i < N; i++) {
    const t = i / SAMPLE_RATE;

    // A. Slide friction (from t=0 to stopTime)
    let slide = 0;
    if (t < stopTime) {
      const st = t / stopTime;
      const sEnv = Math.pow(st, 1.4) * 0.45;
      const noise = (Math.random() * 2 - 1) * sEnv;
      slide = bpfFriction.process(noise);
    }

    // B. Tactile notch lock / latch (at stopTime)
    let latch = 0;
    if (t >= stopTime) {
      const lt = t - stopTime;
      const snapEnv = Math.exp(-lt * 120);
      const snapNoise = (Math.random() * 2 - 1) * snapEnv * 0.7;
      const filteredSnap = bpfNotch.process(snapNoise);

      const clickTone =
        (Math.sin(2 * Math.PI * 1920 * lt) * 0.55 + Math.sin(2 * Math.PI * 960 * lt) * 0.4) *
        Math.exp(-lt * 85);

      const thumpPhase = 2 * Math.PI * 180 * lt;
      const thumpTone = Math.sin(thumpPhase) * Math.exp(-lt * 35) * 0.5;
      const filteredThump = bpfThump.process(thumpTone);

      latch = filteredSnap + clickTone + filteredThump;
    }

    out[i] = (slide * 0.85 + latch * 1.1) * 0.88;
  }

  let maxA = 0;
  for (let i = 0; i < N; i++) if (Math.abs(out[i]) > maxA) maxA = Math.abs(out[i]);
  if (maxA > 0) {
    for (let i = 0; i < N; i++) out[i] = (out[i] / maxA) * 0.85;
  }

  return out;
}

const dir = path.resolve("public/tea/sfx");
fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(dir, "wood-stamp.wav"), createWavBuffer(genWoodStamp()));
fs.writeFileSync(path.join(dir, "tea-rustle-hiss.wav"), createWavBuffer(genTeaRustleHiss()));
fs.writeFileSync(path.join(dir, "ethereal-breeze.wav"), createWavBuffer(genEtherealBreeze()));
fs.writeFileSync(path.join(dir, "water-drop.wav"), createWavBuffer(genWaterDrop()));
fs.writeFileSync(path.join(dir, "abacus-slide.wav"), createWavBuffer(genAbacusSlide()));
fs.writeFileSync(path.join(dir, "slider-settle.wav"), createWavBuffer(genSliderLock()));

console.log("Successfully generated all 6 tea-aesthetic SFX files in public/tea/sfx/!");

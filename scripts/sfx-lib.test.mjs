// 音效库纯函数：确定性微随机、底噪包络、WAV 长度 = 帧数 / 29.97（node --test，Node 22 直接剥离 TS 类型）
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  BRAND,
  FOLEY,
  SFX_MASTER,
  envelopeAt,
  foley,
  resolveHit,
  roomBed,
  samplesForFrames,
} from "../src/remotion/shared/sfx-lib.ts";

test("每个物件音效与品牌声的文件都存在", () => {
  const names = [...Object.values(FOLEY).flat(), ...Object.values(BRAND), "room-tone"];
  for (const n of names) assert.ok(existsSync(`public/tea/sfx/${n}.wav`), n);
});

test("微随机按 src+at 确定，且在范围内", () => {
  const h = foley("cakeThud", 120, { vary: 0.05 });
  const a = resolveHit(h, 600);
  const b = resolveHit({ ...h }, 600);
  assert.deepEqual(a, b);
  assert.ok(Math.abs(a.rate - 1) <= 0.05 + 1e-9);
  assert.ok(Math.abs(a.gain / SFX_MASTER - 1) <= 0.05 + 1e-9);
  const plain = resolveHit({ src: "tea/sfx/wood.wav", at: 10 }, 600);
  assert.equal(plain.rate, 1);
  assert.equal(plain.gain, 0.42 * SFX_MASTER);
});

test("底噪循环到片段末尾，淡入淡出包络", () => {
  const r = resolveHit(roomBed(), 300);
  assert.equal(r.loop, true);
  assert.equal(r.until, 300);
  assert.equal(envelopeAt(r, 0), 0);
  assert.equal(envelopeAt(r, 10), 0.5);
  assert.equal(envelopeAt(r, 150), 1);
  assert.equal(envelopeAt(r, 288), 0.5);
  assert.equal(envelopeAt(r, 300), 0);
});

test("WAV 采样数 = 帧数 / 29.97 × 48000", () => {
  assert.equal(samplesForFrames(2997, 29.97), 4_800_000);
  assert.equal(samplesForFrames(450, 29.97), Math.round((450 / 29.97) * 48000));
});

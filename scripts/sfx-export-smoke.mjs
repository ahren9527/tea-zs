#!/usr/bin/env node
/**
 * 音效分轨导出冒烟测试（无界面 Chromium）：
 *   node scripts/sfx-export-smoke.mjs <站点URL> <输出目录>
 * 1) 面板里选「音效：分轨」→ 点 MP4，收下载：_音效.wav（+ 浏览器能编 H.264 时的 _无音效.mp4）
 * 2) 若是 vite dev（能 import 源码）：直接用 src/lib/sfx-mix.ts 把新物件库 + 品牌声 + 底噪混成 10 秒 WAV
 * 结果文件写到输出目录，用 ffmpeg 看长度 / 响度。CHROME=可执行文件路径（可选）。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:4177/";
const out = process.argv[3] || "screenshots/sfx-smoke";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--autoplay-policy=no-user-gesture-required"],
});
const result = { downloads: [], errors: [] };
try {
  const page = await browser.newPage({
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 },
  });
  page.on("pageerror", (e) => result.errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[aria-label="音效导出方式"]', { timeout: 30000 });

  if (process.env.MIX_ONLY !== "1") {
    await page.getByRole("radio", { name: /分轨/ }).click();
    const seen = [];
    page.on("download", async (d) => {
      const p = join(out, d.suggestedFilename());
      seen.push(p);
      await d.saveAs(p);
    });
    // FORMAT=webm 时点「快速 WebM」（无界面 Chromium 没有 H.264 编码器时用它验证无音效视频）
    const fmt = process.env.FORMAT === "webm" ? /WebM/ : /MP4/;
    await page.getByRole("button", { name: fmt }).first().click();
    const t0 = Date.now();
    while (Date.now() - t0 < 90000) {
      await page.waitForTimeout(500);
      const err = await page.locator("text=导出遇到问题").count();
      if (seen.length >= 2 || err) break;
    }
    await page.waitForTimeout(800);
    result.downloads = seen;
    result.dialog = (
      await page
        .locator('[class*="fixed inset-0"]')
        .first()
        .innerText()
        .catch(() => "")
    ).slice(0, 400);
  }

  if (process.env.MIX_DEV === "1") {
    const b64 = await page.evaluate(async () => {
      const mix = await import("/src/lib/sfx-mix.ts");
      const lib = await import("/src/remotion/shared/sfx-lib.ts");
      const F = 29.97;
      const hits = [
        lib.foley("paperRustle", 15),
        lib.foley("cakeThud", 45),
        lib.foley("needlePierce", 75),
        lib.foley("needleScrape", 95),
        lib.foley("cakeCrack", 120),
        lib.foley("leafScatter", 128, { volume: 0.5 }),
        lib.foley("foilCrinkle", 165),
        lib.foley("foilSeal", 190),
        lib.foley("jarLid", 215),
        lib.brandHit(245),
        lib.roomBed(),
      ];
      const r = await mix.renderSfx(hits, 300, F);
      const blob = mix.audioBufferToWav(r.buffer);
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (let i = 0; i < buf.length; i += 0x8000)
        s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return {
        b64: btoa(s),
        frames: r.frames,
        hits: r.hits,
        length: r.buffer.length,
        sr: r.buffer.sampleRate,
      };
    });
    writeFileSync(join(out, "mix-test-300f.wav"), Buffer.from(b64.b64, "base64"));
    result.mix = { frames: b64.frames, hits: b64.hits, length: b64.length, sr: b64.sr };
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(result, null, 2));

import { randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, readFile, unlink, writeFile } from "node:fs/promises";
import { createFileRoute } from "@tanstack/react-router";

async function resolveFfmpeg() {
  const candidates: string[] = [];
  if (process.env.FFMPEG_BIN) candidates.push(process.env.FFMPEG_BIN);
  try {
    const which = execFileSync("which", ["ffmpeg"], { encoding: "utf8" }).trim();
    if (which) candidates.push(which);
  } catch {
    /* optional */
  }
  candidates.push("/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg");

  const seen = new Set<string>();
  for (const bin of candidates) {
    if (!bin || seen.has(bin)) continue;
    seen.add(bin);
    try {
      await access(bin, constants.X_OK);
      return bin;
    } catch {
      /* try next */
    }
  }
  throw new Error("找不到转码程序");
}

function runFfmpeg(bin: string, input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(
      bin,
      [
        "-y",
        "-i",
        input,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-r",
        "30000/1001",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-an",
        output,
      ],
      {
        env: { ...process.env, PATH: `/usr/local/bin:/usr/bin:${process.env.PATH ?? ""}` },
      },
    );
    let err = "";
    proc.stderr.on("data", (d) => {
      err += String(d);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(err.slice(-400) || "ffmpeg failed"));
    });
  });
}

export const Route = createFileRoute("/api/export-mp4")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const video = form.get("video");
        if (!(video instanceof File)) {
          return new Response("缺少视频", { status: 400 });
        }
        const id = randomUUID();
        const input = `/tmp/${id}.webm`;
        const output = `/tmp/${id}.mp4`;
        try {
          const bin = await resolveFfmpeg();
          await writeFile(input, Buffer.from(await video.arrayBuffer()));
          await runFfmpeg(bin, input, output);
          const buf = await readFile(output);
          return new Response(buf, {
            headers: {
              "Content-Type": "video/mp4",
              "Content-Disposition": 'attachment; filename="tea-cards.mp4"',
            },
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : "转码失败";
          return new Response(message, { status: 500 });
        } finally {
          await unlink(input).catch(() => undefined);
          await unlink(output).catch(() => undefined);
        }
      },
    },
  },
});

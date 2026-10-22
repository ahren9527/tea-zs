#!/usr/bin/env python3
"""
正上茶舍 · 物件音效库构建（可重跑）。
  python3 scripts/sfx/build-foley.py [--cache /tmp/tea-sfx-src]

从 CC0 源（Freesound CC0 试听 HQ mp3、Kenney CC0 音效包）下载原始录音，
按「高级、克制」统一处理后写入 public/tea/sfx/*.wav（48 kHz / 16-bit / 单声道）：
  截取 → 去首尾静音 → 高通 80 Hz → 1–4 kHz 下挖约 -3.5 dB（让位人声）→ 柔化高频
  → 3 ms 起音淡入 + 尾部淡出 → 峰值归一到 -12 dBFS（环境底噪：-40 LUFS，无缝循环）
依赖：ffmpeg、python3 + numpy。来源与许可证见 public/tea/sfx/LICENSES.md。
"""
import argparse, io, json, os, subprocess, sys, urllib.request, zipfile
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "tea", "sfx")
SR = 48000
UA = {"User-Agent": "Mozilla/5.0"}

KENNEY = {
    "impact": "https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip",
    "rpg": "https://kenney.nl/media/pages/assets/rpg-audio/8e99002d76-1677590336/kenney_rpg-audio.zip",
}

def fs(sid, path):  # Freesound CC0 HQ preview
    return {"kind": "freesound", "id": sid, "url": f"https://cdn.freesound.org/previews/{path}-hq.mp3"}

def kn(pack, name):
    return {"kind": "kenney", "pack": pack, "name": name}

FS = {
    "paper-rustle-a": fs(211246, "211/211246_1506161"),
    "paper-rustle-b": fs(181774, "181/181774_3153523"),
    "paper-tear": fs(181773, "181/181773_3153523"),
    "chips-bag": fs(411221, "411/411221_6023964"),
    "tinfoil": fs(337524, "337/337524_5923045"),
    "ziplock": fs(326466, "326/326466_5639585"),
    "stab-box": fs(778123, "778/778123_16720822"),
    "bag-stab": fs(363191, "363/363191_6460155"),
    "knife-carve": fs(767324, "767/767324_15758192"),
    "crisp-crunch": fs(443469, "443/443469_7919598"),
    "leaves": fs(867127, "867/867127_18601704"),
    "teapot-lid": fs(390342, "390/390342_1830834"),
    "stamp": fs(470710, "470/470710_9906084"),
    "scroll": fs(185051, "185/185051_3050308"),
    "swoosh": fs(349698, "349/349698_5632532"),
    "broom-whoosh": fs(816262, "816/816262_5287430"),
    "guzheng": fs(847157, "847/847157_18537710"),
    "bowl": fs(271370, "271/271370_5159066"),
    "roomtone": fs(329569, "329/329569_4437257"),
    "breeze": fs(181251, "181/181251_499617"),
}

# name: (layers [(source, start s, dur s, gain dB)], fade_out s, lowpass Hz or None)
HITS = {
    "cake-thud": ([(kn("impact", "impactSoft_heavy_000"), 0, 0.5, 0), (kn("impact", "impactWood_light_000"), 0, 0.25, -9)], 0.12, 5000),
    "cake-thud-2": ([(kn("impact", "impactSoft_heavy_002"), 0, 0.5, 0), (kn("impact", "impactWood_light_001"), 0, 0.25, -10)], 0.12, 5000),
    "paper-rustle": ([(FS["paper-rustle-a"], 0.18, 0.85, 0)], 0.15, 9000),
    "paper-rustle-2": ([(FS["paper-rustle-b"], 0.33, 0.9, 0)], 0.2, 9000),
    "paper-tear": ([(FS["paper-tear"], 0.42, 0.95, 0)], 0.15, 9000),
    "foil-crinkle": ([(FS["chips-bag"], 0.0, 0.62, 0)], 0.15, 10000),
    "foil-crinkle-2": ([(FS["tinfoil"], 1.55, 0.8, 0)], 0.2, 10000),
    "foil-seal": ([(FS["ziplock"], 0.05, 0.85, 0)], 0.15, 9000),
    "needle-pierce": ([(FS["stab-box"], 2.42, 0.5, 0)], 0.15, 8000),
    "needle-pierce-2": ([(FS["bag-stab"], 1.47, 0.45, 0)], 0.15, 8000),
    "needle-scrape": ([(FS["knife-carve"], 0.85, 0.5, 0)], 0.12, 8000),
    "cake-crack": ([(FS["crisp-crunch"], 0.3, 0.6, 0)], 0.15, 8000),
    "cake-crack-2": ([(FS["crisp-crunch"], 2.12, 0.6, 0)], 0.15, 8000),
    "leaf-scatter": ([(FS["leaves"], 0.0, 1.4, 0)], 0.5, 8000),
    "jar-lid": ([(FS["teapot-lid"], 0.08, 0.5, 0)], 0.15, 9000),
    "jar-lid-2": ([(FS["teapot-lid"], 2.22, 0.55, 0)], 0.15, 9000),
    "seal-wood": ([(FS["stamp"], 0.4, 0.6, 0)], 0.15, 6000),
    "cloth-unroll": ([(kn("rpg", "cloth1"), 0, 0.66, 0), (kn("rpg", "cloth3"), 0, 0.48, -3, 0.42)], 0.2, 8000),
    "scroll-unroll": ([(FS["scroll"], 0.05, 1.3, 0)], 0.35, 8000),
    "paperweight": ([(kn("rpg", "bookPlace2"), 0, 0.35, 0), (kn("impact", "impactWood_light_001"), 0, 0.25, -8)], 0.1, 5000),
    "whoosh-soft": ([(FS["swoosh"], 0.15, 1.55, 0)], 0.4, 6000),
    "whoosh-soft-2": ([(FS["broom-whoosh"], 0.0, 0.5, 0)], 0.15, 6000),
    # 品牌声（只给口诀落印 / 金句）
    "zheng-pluck": ([(FS["guzheng"], 0.0, 3.4, 0)], 1.6, 9000),
    "bowl-strike": ([(FS["bowl"], 0.0, 4.2, 0)], 1.8, 9000),
}
HIT_PEAK_DB = -12.0
# 持续型（沙沙、风声、碎叶）按峰值归一会显得比瞬态响：短时响度（400 ms）再封顶到 -30 LUFS，听感一致
HIT_MOMENTARY_CAP = -30.0
BRAND_NAMES = {"zheng-pluck", "bowl-strike"}
BED_LUFS = -40.0
BED_SEC, BED_XFADE = 20.0, 2.0

def cache_get(cache, src):
    os.makedirs(cache, exist_ok=True)
    if src["kind"] == "freesound":
        p = os.path.join(cache, f"fs-{src['id']}.mp3")
        if not os.path.exists(p):
            with urllib.request.urlopen(urllib.request.Request(src["url"], headers=UA)) as r:
                open(p, "wb").write(r.read())
        return p
    d = os.path.join(cache, "kenney-" + src["pack"])
    if not os.path.isdir(d):
        with urllib.request.urlopen(urllib.request.Request(KENNEY[src["pack"]], headers=UA)) as r:
            zipfile.ZipFile(io.BytesIO(r.read())).extractall(d)
    for base, _, files in os.walk(d):
        if src["name"] + ".ogg" in files:
            return os.path.join(base, src["name"] + ".ogg")
    raise FileNotFoundError(src["name"])

def decode(path, start, dur, filters):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start), "-t", str(dur), "-i", path, "-ac", "1", "-ar", str(SR)]
    if filters:
        cmd += ["-af", filters]
    cmd += ["-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).copy()

def chain(lowpass):
    f = ["highpass=f=80:poles=2", "equalizer=f=2000:width_type=o:width=1.6:g=-3.5"]
    if lowpass:
        f.append(f"lowpass=f={lowpass}:poles=1")
    return ",".join(f)

def trim_silence(x, head_db=-30, tail_db=-45):
    """起音对齐到帧：头部从 -30 dB（相对峰值）处起切，尾部保留到 -45 dB。"""
    pk = np.abs(x).max()
    head = np.where(np.abs(x) > pk * 10 ** (head_db / 20))[0]
    tail = np.where(np.abs(x) > pk * 10 ** (tail_db / 20))[0]
    if not len(head):
        return x
    a = max(0, head[0] - int(0.004 * SR))
    b = min(len(x), tail[-1] + int(0.01 * SR))
    return x[a:b]

def fades(x, fin=0.003, fout=0.1):
    x = x.copy()
    ni, no = min(len(x), int(fin * SR)), min(len(x), int(fout * SR))
    x[:ni] *= np.linspace(0, 1, ni)
    x[len(x) - no:] *= np.cos(np.linspace(0, np.pi / 2, no)) ** 2
    return x

def write_wav(path, x):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "pcm_s16le", "-ar", str(SR), path], input=x.astype(np.float32).tobytes(), check=True)

def lufs(path):
    # 补 0.5 s 静音，让短于 400 ms 的瞬态也能测到短时响度
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "apad=pad_dur=0.5,ebur128", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    tail = r[r.rfind("Summary:"):]
    for line in tail.splitlines():
        if line.strip().startswith("I:"):
            return float(line.split()[1])
    return None

def max_momentary(path):
    # 补 0.5 s 静音，让短于 400 ms 的瞬态也能测到短时响度
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "apad=pad_dur=0.5,ebur128", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    vals = [float(t.split()[0]) for t in r.split("M:")[1:]]
    vals = [v for v in vals if v > -100]
    return max(vals) if vals else None

def build_hit(cache, name, spec):
    layers, fout, lp = spec
    mix = None
    for layer in layers:
        src, start, dur, gdb = layer[:4]
        offset = layer[4] if len(layer) > 4 else 0
        y = decode(cache_get(cache, src), start, dur, chain(lp)) * 10 ** (gdb / 20)
        y = np.concatenate([np.zeros(int(offset * SR), np.float32), y])
        if mix is None:
            mix = y
        else:
            n = max(len(mix), len(y))
            mix = np.pad(mix, (0, n - len(mix))) + np.pad(y, (0, n - len(y)))
    x = fades(trim_silence(mix), 0.003, fout)
    x *= 10 ** (HIT_PEAK_DB / 20) / (np.abs(x).max() + 1e-12)
    path = os.path.join(OUT, name + ".wav")
    write_wav(path, x)
    m = max_momentary(path)
    if name not in BRAND_NAMES and m is not None and m > HIT_MOMENTARY_CAP:
        write_wav(path, x * 10 ** ((HIT_MOMENTARY_CAP - m) / 20))

def build_bed(cache):
    filt = "highpass=f=80:poles=2,lowpass=f=5000,equalizer=f=2000:width_type=o:width=1.6:g=-3.5"
    room = decode(cache_get(cache, FS["roomtone"]), 4.0, BED_SEC + BED_XFADE, filt)
    wind = decode(cache_get(cache, FS["breeze"]), 6.0, BED_SEC + BED_XFADE,
                  "highpass=f=120,lowpass=f=900,equalizer=f=2000:width_type=o:width=1.6:g=-3.5")
    room /= np.sqrt(np.mean(room ** 2)) + 1e-12
    wind /= np.sqrt(np.mean(wind ** 2)) + 1e-12
    n = min(len(room), len(wind))
    src = room[:n] + 0.35 * wind[:n]  # 远处的风只是一层很淡的气
    N, X = int(BED_SEC * SR), int(BED_XFADE * SR)
    out = src[:N].copy()
    t = np.linspace(0, np.pi / 2, X)
    out[:X] = src[:X] * np.sin(t) + src[N:N + X] * np.cos(t)  # 等功率交叉：尾 → 头，无缝循环
    path = os.path.join(OUT, "room-tone.wav")
    out *= 0.05 / (np.abs(out).max() + 1e-12)
    write_wav(path, out)
    gain = 10 ** ((BED_LUFS - lufs(path)) / 20)
    write_wav(path, out * gain)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default="/tmp/tea-sfx-src")
    ap.add_argument("--only", nargs="*")
    a = ap.parse_args()
    for name, spec in HITS.items():
        if a.only and name not in a.only:
            continue
        build_hit(a.cache, name, spec)
        print("✔", name)
    if not a.only or "room-tone" in a.only:
        build_bed(a.cache)
        print("✔ room-tone")

if __name__ == "__main__":
    main()

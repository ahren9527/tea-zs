#!/usr/bin/env python3
"""
口播对齐：真人录音 → 每个节拍每个字的开口时刻 → src/remotion/epNN/kit/vo-times.json

用法：
  pip install faster-whisper numpy        # 一次即可（CPU 能跑，small 模型约 1–2 分钟/2 分钟音频）
  python3 scripts/vo/align-vo.py 口播.mp3 src/remotion/ep21/kit/vo-segments.json \
      --out src/remotion/ep21/kit/vo-times.json --prompt "新茶老茶，海交会，老白茶，饼茶。"

vo-segments.json：按口播顺序排列的整条定稿文案，分段写：
  [ {"key": "b1", "text": "新茶老茶混着存……"},
    {"key": "-",  "text": "上期饼茶的存和撬讲完了……"},   ← 没有 HTML 节拍的段落（即梦镜头/纯口播）key 写 "-"，参与对齐但不输出
    {"key": "b2", "text": "……"} ]
  key 必须和节拍 data.ts 里 makeVoAtFromTimes("b2", …) 的 key 一致，text 必须和该拍 SCRIPT 一字不差。

做法：ffmpeg 解码为 16 kHz 单声道 → faster-whisper 逐词时间戳 → 把「整条定稿」与识别结果做一次整体单调匹配
（difflib），识别错的字按前后已匹配字线性插值。每段打印起止秒与匹配率，匹配率 < 70% 要人工检查。
"""
import argparse, json, re, subprocess, difflib, sys
import numpy as np

ok = lambda c: re.match(r"[\u4e00-\u9fff0-9A-Za-z]", c)

ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("segments")
ap.add_argument("--out", required=True)
ap.add_argument("--prompt", default="")
ap.add_argument("--model", default="small")
a = ap.parse_args()

# 1) 解码（直接喂 numpy，避开 faster-whisper 自带 av 解码的兼容问题）
pcm = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", a.audio, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
    check=True, capture_output=True).stdout
aud = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
print(f"音频 {len(aud)/16000:.2f}s", file=sys.stderr)

# 2) 识别
from faster_whisper import WhisperModel
m = WhisperModel(a.model, device="cpu", compute_type="int8")
segs, _ = m.transcribe(aud, language="zh", word_timestamps=True, vad_filter=True,
                       initial_prompt=(a.prompt + "以下是普通话的句子。"))
chars = []
for s in segs:
    for w in s.words:
        cs = [c for c in w.word if ok(c)]
        if not cs: continue
        d = (w.end - w.start) / len(cs)
        chars += [(c, w.start + i * d) for i, c in enumerate(cs)]
asr = "".join(c for c, _ in chars)

# 3) 整条定稿一次性单调匹配
S = json.load(open(a.segments, encoding="utf-8"))
full, spans = "", []
for seg in S:
    c = "".join(x for x in seg["text"] if ok(x))
    spans.append((seg, len(full), len(full) + len(c))); full += c
times = [None] * len(full)
for i0, j0, n in difflib.SequenceMatcher(None, full, asr, autojunk=False).get_matching_blocks():
    for k in range(n): times[i0 + k] = chars[j0 + k][1]
idx = [i for i, t in enumerate(times) if t is not None]; hit = set(idx)
if not idx: sys.exit("识别结果与定稿完全对不上，检查音频/文案")
for i in range(len(times)):
    if times[i] is None:
        lo = max([j for j in idx if j < i], default=None); hi = min([j for j in idx if j > i], default=None)
        times[i] = (times[hi] - 0.25 * (hi - i) if lo is None else
                    times[lo] + 0.25 * (i - lo) if hi is None else
                    times[lo] + (times[hi] - times[lo]) * (i - lo) / (hi - lo))

res = {}
for seg, s0, s1 in spans:
    tt = times[s0:s1]; rate = sum(1 for i in range(s0, s1) if i in hit) / max(1, s1 - s0)
    print(f'{seg["key"]:>5}  {tt[0]:7.2f}–{tt[-1]:7.2f}s  匹配 {rate:.0%}' + ("  ⚠ 请人工检查" if rate < 0.7 else ""))
    if seg["key"] != "-":
        res[seg["key"]] = {"script": seg["text"], "chars": full[s0:s1], "times": [round(x, 3) for x in tt]}
json.dump(res, open(a.out, "w", encoding="utf-8"), ensure_ascii=False)
print("写入", a.out)

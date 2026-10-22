#!/usr/bin/env python3
"""
正上茶舍 · 动画风（motion-graphics）音效库构建 —— 全部在仓库里合成，可一键重跑、逐字节可复现。
  python3 scripts/sfx/build-mograph.py

为什么合成：画面是插画 / 动态图形，写实录音和画面不搭；合成音色同一家族、音高统一调到
D 大调五声（D E F# A B），和品牌声古筝单音（A4 ≈ 438 Hz）同调。
风格：夸张但不吵 —— 起音干净、尾巴短、有音高（参照 Kurzgesagt / 高端解说 mograph）。

处理链（每个文件）：合成 → 高通 35 Hz → 1–4 kHz 下挖约 -3 dB（中心 2.2 kHz，让位人声）
  → 2 ms 起音淡入 + 尾部淡出 → 峰值归一到 -11 dBFS → 48 kHz / 16-bit / 单声道 WAV。
依赖：python3 + numpy + scipy（无网络、无外部素材）。随机数种子固定 → 输出确定。
输出：public/tea/sfx/mg-*.wav；许可证：本仓库合成（与项目同许可，无第三方素材）。
"""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, lfilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "tea", "sfx")
SR = 48000
PEAK_DB = -11.0

# D 大调五声音高（Hz）
def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, octv = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[n] + 12 * (octv - 4)) / 12)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def rng(seed):
    return np.random.default_rng(seed)


def env_exp(t, tau):
    return np.exp(-t / tau)


def sweep_sine(f0, f1, dur, tau_f, phase_env=None):
    """频率从 f0 指数滑到 f1（时间常数 tau_f）的正弦"""
    t = t_axis(dur)
    f = f1 + (f0 - f1) * np.exp(-t / tau_f)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph), t


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return sosfilt(sos, x)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, btype="low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, btype="high", fs=SR, output="sos"), x)


def peaking(x, f0, gain_db, q):
    """RBJ peaking EQ"""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A]
    a = [1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A]
    return lfilter(np.array(b) / a[0], np.array(a) / a[0], x)


def tv_bandpass(noise, f_start, f_end, q=2.0):
    """时变带通（逐块更新的 SVF），做 swoosh 的音高滑动"""
    n = len(noise)
    out = np.zeros(n)
    low = band = 0.0
    fc = f_start * (f_end / f_start) ** (np.arange(n) / max(1, n - 1))
    damp = 1.0 / q
    for i in range(n):
        f = 2 * np.sin(np.pi * min(fc[i], SR / 6) / SR)
        low += f * band
        high = noise[i] - low - damp * band
        band += f * high
        out[i] = band
    return out


def reverb(x, dur=0.6, wet=0.18, seed=1, damp_hz=5000):
    """极简混响：指数衰减噪声 IR 卷积（低通过），干湿混合"""
    r = rng(seed)
    t = t_axis(dur)
    ir = r.standard_normal(len(t)) * np.exp(-t / (dur / 5))
    ir = lp(ir, damp_hz)
    ir[: int(0.008 * SR)] = 0  # 8 ms 预延迟
    ir /= np.sqrt(np.sum(ir**2)) + 1e-12
    y = np.convolve(x, ir)
    xx = np.concatenate([x, np.zeros(len(y) - len(x))])
    return (1 - wet) * xx + wet * y * 0.9


def pad(x, dur):
    n = int(dur * SR)
    return np.concatenate([x, np.zeros(max(0, n - len(x)))])[: max(n, len(x))]


def place(dst, src, at):
    i = int(at * SR)
    end = min(len(dst), i + len(src))
    dst[i:end] += src[: end - i]
    return dst


# ---------------------------------------------------------------- 音色

def mallet(f, dur=0.9, bright=1.0, seed=0):
    """木琴 / 马林巴式软槌：基频 + 4.0x / 9.2x 分音（高分音衰减快）+ 槌头噪声"""
    t = t_axis(dur)
    x = np.sin(2 * np.pi * f * t) * env_exp(t, 0.28)
    x += 0.35 * bright * np.sin(2 * np.pi * f * 3.98 * t) * env_exp(t, 0.045)
    x += 0.12 * bright * np.sin(2 * np.pi * f * 9.2 * t) * env_exp(t, 0.015)
    x += 0.25 * np.sin(2 * np.pi * f * 0.5 * t) * env_exp(t, 0.12)  # 下八度一点体感
    click = bp(rng(seed).standard_normal(len(t)), 1500, 5000) * env_exp(t, 0.003) * 0.25
    return x + click


def bell(f, dur=1.6, seed=0):
    """小钟 / 铃：非谐分音（1, 2.0, 2.76, 5.4, 8.9）"""
    t = t_axis(dur)
    parts = [(1.0, 1.0, 0.9), (2.0, 0.45, 0.6), (2.76, 0.3, 0.35), (5.4, 0.18, 0.15), (8.93, 0.08, 0.06)]
    x = sum(a * np.sin(2 * np.pi * f * r * t + k) * env_exp(t, tau) for k, (r, a, tau) in enumerate(parts))
    x *= 1 - np.exp(-t / 0.002)
    return x


def thump(f0, f1, dur=0.5, tau=0.12, click=0.4, seed=0, wood=0.0):
    """重落地：音高下滑的正弦 + 次低频 + 起音咔嗒 +（可选）木质共振"""
    s, t = sweep_sine(f0, f1, dur, 0.035)
    x = s * env_exp(t, tau)
    sub, _ = sweep_sine(f1 * 1.2, f1 * 0.75, dur, 0.06)
    x += 0.6 * sub * env_exp(t, tau * 1.4)
    r = rng(seed)
    x += click * lp(r.standard_normal(len(t)), 3500) * env_exp(t, 0.004)
    if wood:
        x += wood * np.sin(2 * np.pi * f0 * 2.3 * t) * env_exp(t, 0.03)
    return np.tanh(1.6 * x) / np.tanh(1.6)


def pop(f, dur=0.16, seed=0):
    """亮 pop / plip：快速下滑的正弦泡泡"""
    s, t = sweep_sine(f * 1.9, f, dur, 0.012)
    x = s * env_exp(t, 0.035) * (1 - np.exp(-t / 0.0015))
    x += 0.15 * hp(rng(seed).standard_normal(len(t)), 3000) * env_exp(t, 0.002)
    return x


def swoosh(f_start, f_end, dur, seed=0, tone=None):
    """空气 swoosh：时变带通噪声 + 可选滑音正弦，包络先涨后落"""
    r = rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    noise = r.standard_normal(n)
    x = lp(tv_bandpass(noise, f_start, f_end, q=1.6), max(f_start, f_end) * 1.6, order=4)  # 收掉嘶声
    peak = 0.62 * dur
    e = np.where(t < peak, (t / peak) ** 2, np.exp(-(t - peak) / (0.18 * dur)))
    x = x * e
    if tone:
        tf0, tf1 = tone
        f = tf0 * (tf1 / tf0) ** (t / dur)
        x = x / (np.max(np.abs(x)) + 1e-9) + 0.22 * np.sin(2 * np.pi * np.cumsum(f) / SR) * e
    return x


def wood_tok(f, dur=0.35, seed=0):
    """空心木块 tok：两个共振模态（1x, 2.71x）快速衰减 + 敲击噪声"""
    t = t_axis(dur)
    x = np.sin(2 * np.pi * f * t) * env_exp(t, 0.05)
    x += 0.5 * np.sin(2 * np.pi * f * 2.71 * t) * env_exp(t, 0.018)
    x += 0.3 * bp(rng(seed).standard_normal(len(t)), f * 1.5, min(f * 6, 9000)) * env_exp(t, 0.004)
    return x


def crinkle_grains(dur, n, seed, lo=2500, hi=9000, decay=0.006, amp_decay=None):
    """一串尖脆的 snap 颗粒（时间、亮度、响度随机）"""
    r = rng(seed)
    out = np.zeros(int(dur * SR))
    times = np.sort(r.uniform(0, dur * 0.8, n))
    for i, at in enumerate(times):
        g = int(0.03 * SR)
        tt = np.arange(g) / SR
        c = r.uniform(lo, hi)
        grain = bp(r.standard_normal(g), c * 0.7, min(c * 1.4, 20000)) * np.exp(-tt / decay)
        a = r.uniform(0.4, 1.0)
        if amp_decay:
            a *= np.exp(-at / amp_decay)
        place(out, grain * a, at)
    return out


# ---------------------------------------------------------------- 成品

def build():
    S = {}
    D2, A2, D3, A3 = note("D2"), note("A2"), note("D3"), note("A3")

    # 重落地（茶饼落桌）：D3 → D2，夸张的「咚」+ 次低频 + 短尾
    S["mg-thump"] = reverb(thump(D3 * 1.5, D2, 0.55, 0.13, 0.45, seed=11, wood=0.12), 0.35, 0.10, seed=2)
    S["mg-thump-2"] = reverb(thump(D3 * 1.6, D2 * 1.03, 0.55, 0.12, 0.5, seed=12, wood=0.10), 0.35, 0.10, seed=3)
    # 轻落地（罐子落定 / 茶块落进罐里）：A2 一档、更短更圆
    S["mg-thump-soft"] = reverb(thump(A3, A2, 0.4, 0.08, 0.25, seed=13, wood=0.18), 0.3, 0.10, seed=4)

    # 亮 pop / plip（小物件、小元素冒出来）
    S["mg-pop"] = pop(note("A5"), seed=21)
    S["mg-pop-2"] = pop(note("B5"), seed=22)
    S["mg-pop-3"] = pop(note("D6"), seed=23)

    # 滑入：空气 swoosh，音高上扬（+ 一丝滑音 A3→A4）
    S["mg-swoosh-up"] = swoosh(350, 3200, 0.42, seed=31, tone=(A3, note("A4")))
    # 落下 / 拉远：音高下行
    S["mg-swoosh-down"] = swoosh(2800, 300, 0.45, seed=32, tone=(note("A4"), A3))

    # 大字落定：软槌 ding（D 五声各一，前后句可走音阶）
    for i, nm in enumerate(["D5", "E5", "F#5", "A5", "B5"]):
        key = "mg-ding-" + nm.lower().replace("#", "s")
        S[key] = reverb(mallet(note(nm), 0.9, seed=31 + i), 0.9, 0.22, seed=5)
    # 低一档的 ding（「碎」「下期见」这种重字）
    S["mg-ding-d4"] = reverb(mallet(note("D4"), 1.0, bright=0.8, seed=41), 0.9, 0.22, seed=6)

    # 品牌层：小铃 D6（叠在古筝 A4 上，五度 / 四度关系）
    S["mg-bell"] = reverb(bell(note("D6"), 1.6), 1.4, 0.28, seed=7)

    # 印章：厚实的 thunk + 一下小回弹
    st = thump(D3 * 1.2, D2 * 1.1, 0.45, 0.07, 0.6, seed=51, wood=0.35)
    st = place(pad(st, 0.5), 0.35 * thump(D3 * 1.5, D3 * 0.8, 0.2, 0.03, 0.3, seed=52, wood=0.3)[: int(0.2 * SR)], 0.085)
    S["mg-stamp"] = reverb(st, 0.3, 0.08, seed=8)

    # 裂 / 碎：短促 crunch（多颗粒 + 低频一下）
    cr = crinkle_grains(0.22, 22, 62, lo=900, hi=6000, decay=0.008, amp_decay=0.08)
    body, tb = sweep_sine(note("A3"), note("D3"), 0.22, 0.02)
    cr = cr / (np.max(np.abs(cr)) + 1e-9) + 0.5 * body * env_exp(tb, 0.03)
    S["mg-crunch"] = cr
    # 闪光散落：五声高音小颗粒（D7 E7 F#7 A7 B7 → 落到 A6）
    sp = np.zeros(int(0.7 * SR))
    r = rng(71)
    tones = [note(x) for x in ["A6", "B6", "D7", "E7", "F#7", "A7"]]
    for i, at in enumerate(np.sort(r.uniform(0, 0.42, 9))):
        f = tones[r.integers(len(tones))]
        g = pop(f, 0.12, seed=72 + i) * r.uniform(0.35, 1.0) * np.exp(-at / 0.35)
        place(sp, g, at)
    S["mg-sparkle"] = reverb(sp, 0.6, 0.25, seed=9)

    # 罐盖：空心木 tok（A4）→ clonk（D4，70 ms 后）
    tk = pad(wood_tok(note("A4"), 0.3, seed=81), 0.45)
    place(tk, 0.85 * wood_tok(note("D4"), 0.35, seed=82), 0.07)
    S["mg-tok"] = reverb(tk, 0.35, 0.12, seed=10)
    # 单下 tok（掀盖一线 / 轻碰）
    S["mg-tok-light"] = reverb(wood_tok(note("A4"), 0.3, seed=83), 0.3, 0.12, seed=11)

    # 毛笔划掉 / 快速一扫：短 swish
    S["mg-swish"] = swoosh(900, 4200, 0.2, seed=91)

    # 纸 / 铝箔：夸张的 crinkle snap（短）
    S["mg-crinkle"] = lp(crinkle_grains(0.36, 14, 101, lo=1800, hi=7000, decay=0.005), 8000)
    S["mg-crinkle-2"] = lp(crinkle_grains(0.3, 11, 102, lo=2000, hi=7500, decay=0.004), 8000)

    # 戳 / 扎：一下尖 click + 快速下滑的 blip（茶针扎进）
    pk, tp = sweep_sine(note("D6") * 1.6, note("A4"), 0.12, 0.01)
    pk = pk * env_exp(tp, 0.025) + 0.5 * hp(rng(111).standard_normal(len(tp)), 2500) * env_exp(tp, 0.002)
    S["mg-poke"] = pk
    # 顺纹推 / 刮：带音高的短刮擦（锯齿 AM 噪声，音高略升）
    t = t_axis(0.32)
    am = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 38 * t))
    sc = bp(rng(121).standard_normal(len(t)), 1500, 5000) * am
    sc *= np.minimum(1, t / 0.03) * np.exp(-np.maximum(0, t - 0.2) / 0.04)
    S["mg-scrape"] = sc + 0.25 * np.sin(2 * np.pi * np.cumsum(note("D5") * (1 + 0.5 * t / 0.32)) / SR) * np.minimum(1, t / 0.03) * np.exp(-t / 0.15)
    # 拧进：低一点的棘轮 tick ×3
    rt = np.zeros(int(0.3 * SR))
    for i, at in enumerate([0, 0.075, 0.15]):
        place(rt, (0.7 + 0.15 * i) * wood_tok(note("D5") * (1 + 0.06 * i), 0.08, seed=130 + i), at)
    S["mg-ratchet"] = rt

    # 展开（茶巾 / 卷轴 / 竹帘）：抖动的 flutter swoosh
    fl = swoosh(500, 2000, 0.5, seed=141)
    tt = np.arange(len(fl)) / SR
    S["mg-flutter"] = fl * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 11 * tt)))
    # 压封口：利落的 snap（tok + 高 click）
    sn = wood_tok(note("A5"), 0.18, seed=151) + 0.6 * hp(rng(152).standard_normal(int(0.18 * SR)), 4000) * env_exp(t_axis(0.18), 0.0025)
    S["mg-snap"] = sn
    return S


def finish(x, name):
    x = hp(x, 35)
    x = peaking(x, 2200, -3.0, 0.7)  # 1–4 kHz 让位人声
    # 去掉尾部近似静音
    thr = np.max(np.abs(x)) * 10 ** (-60 / 20)
    nz = np.nonzero(np.abs(x) > thr)[0]
    x = x[: nz[-1] + 1] if len(nz) else x
    n = len(x)
    fi = int(0.002 * SR)
    fo = min(int(0.05 * SR), n // 3)
    x[:fi] *= np.linspace(0, 1, fi)
    x[n - fo :] *= np.linspace(1, 0, fo) ** 2
    x = x / (np.max(np.abs(x)) + 1e-12) * 10 ** (PEAK_DB / 20)
    pcm = np.round(x * 32767).astype(np.int16)
    path = os.path.join(OUT, name + ".wav")
    wavfile.write(path, SR, pcm)
    return path, n / SR


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    total = 0
    for name, x in build().items():
        path, d = finish(np.asarray(x, dtype=np.float64), name)
        sz = os.path.getsize(path)
        total += sz
        print(f"{name:16s} {d:5.2f}s {sz/1024:6.1f} KB")
    print(f"total {total/1024/1024:.2f} MB")

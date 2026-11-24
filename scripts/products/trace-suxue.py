#!/usr/bin/env python3
"""
从产品实物照片描出「素雪 · 白牡丹-白茶」包装印刷图案 → src/remotion/shared/products/suxue-data.ts

  pip install numpy pillow contourpy
  python3 scripts/products/trace-suxue.py attachments/products/素雪-茶饼.jpg

分层（HSV 阈值见 classify）：
  gray      灰色线描（古塔 / 牡丹 / 远山）：低饱和、比局部纸面暗 0.05 以上
  frame     蓝灰波浪边线：色相 185–250
  foil      翠绿镭射烫字「素雪」+ 飘带：色相 100–185，饱和度 > 0.07（淡薄荷绿的反光处也算）
  snow      雪花（浅）/ snowDark 雪花（深墨绿）
  flag      翠绿燕尾（含梳齿）
  dark      深色字：一叶倾心 / 白牡丹-白茶 / 净含量
  ribbonText 丝带上的白字（丝带本身用拟合圆弧画）
顶部 logo 区清空（代码里用官方 logo 矢量），位置与大小写进 SUXUE_LOGO。
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from trace_common import ROOT, UNIT, blurf, dilate, encode_layers, grid, morph, prep, ribbon_fit, ribbon_mask, upright_setup, write_ts  # noqa: E402

OUT = ROOT / "src/remotion/shared/products/suxue-data.ts"
# 照片里量出来的（摆正后、饼半径 = 2000）：丝带两端斜切、logo 位置
RIBBON_ENDS = (0.46, 0.55)
LOGO = {"emblem": (-23, -1770, 495), "wordmark": (-377, 287, -1477, -1256)}
LOGO_BOX = (-420, 320, -2050, -1235)
SNOW_BOX = (820, 1330, -1130, -740)


def classify(D):
    H, Sa, V, ins, ax, rr = D["H"], D["Sa"], D["V"], D["inside"], D["ax"], D["rr"]
    Vb = blurf(V, 20)
    yy, xx = ax[:, None] / rr, ax[None, :] / rr
    rad = np.hypot(xx, yy)
    band = yy > 0.6
    yiye = (xx < -0.45) & (yy > 0.2) & (yy < 0.65)  # 一叶倾心：镜头色散让黑字边上带绿 / 蓝边，这一块按「比纸暗」判断
    dark = ins & (V < 0.45) & (Sa < 0.3)
    dark |= ins & yiye & (V < Vb - 0.18)
    green_h = (H > 100) & (H < 185)
    foil = ins & green_h & (((Sa > 0.07) & (V > 0.45)) | ((Sa > 0.25) & (V > 0.15))) & ~band & ~yiye
    flag = ins & (H > 65) & (H < 110) & (Sa > 0.35) & (V > 0.4)
    flag |= ins & band & (H > 110) & (H < 230) & (Sa > 0.3) & (V > 0.45) & (np.abs(xx) > 0.45)
    ribbon = ins & band & (H > 100) & (H < 200) & (Sa > 0.2) & (V < 0.5)
    frame = ins & (H > 185) & (H < 250) & (Sa > 0.08) & (rad > 0.6) & ~band
    gray = ins & (Sa < 0.16) & (V < Vb - 0.05) & ~dark & ~foil & ~yiye
    snow = (H > 100) & (H < 190) & (Sa > 0.12) & (V > 0.12)
    snow_dark = (H > 100) & (H < 190) & (Sa > 0.2) & (V > 0.08) & (V < 0.5)
    paper = (Sa < 0.25) & (V > 0.62)
    return dict(foil=foil, flag=flag, ribbon=ribbon, frame=frame, gray=gray, dark=dark, snow=snow, snowDark=snow_dark, paper=paper)


def main(photo):
    D = prep(photo, (330, 1300))
    L = classify(D)
    up, half = upright_setup(L, D["NX"], D["NY"], D["NR"], ["ribbon", "flag"])
    C0, NR = half, D["NR"]
    top, bot = ribbon_fit(up(ribbon_mask(D, (90, 230), 0.15, 0.75)), C0, NR, 0.12)
    T = {k: up(v) for k, v in L.items()}
    X, Y = grid(2 * half, C0, NR)
    yT = (top[0] + np.sqrt(np.maximum(top[1] ** 2 - (X / UNIT) ** 2, 0))) * UNIT
    yB = (bot[0] + np.sqrt(np.maximum(bot[1] ** 2 - (X / UNIT) ** 2, 0))) * UNIT
    inrib = (Y > yT - 30) & (Y < yB + 30) & (np.abs(X) < 1300)
    logo = (X > LOGO_BOX[0]) & (X < LOGO_BOX[1]) & (Y > LOGO_BOX[2]) & (Y < LOGO_BOX[3])
    snowbox = (X > SNOW_BOX[0]) & (X < SNOW_BOX[1]) & (Y > SNOW_BOX[2]) & (Y < SNOW_BOX[3])
    for k in ("frame", "gray", "dark"):
        T[k] &= ~logo & ~inrib
    T["foil"] = morph(T["foil"] & ~logo, 7, "close") & ~snowbox & ~inrib
    T["flag"] = morph(T["flag"] & ~logo & ~((Y > yT + 15) & (Y < yB - 15) & (np.abs(X) < 1040)), 5, "close")
    T["snow"] = morph(T["snow"] & snowbox, 3, "close")
    T["snowDark"] = morph(T["snowDark"] & snowbox, 3, "close")
    T["ribbonText"] = morph(T["paper"] & (Y > yT + 0.03 * UNIT) & (Y < yB - 0.03 * UNIT) & (np.abs(X) < 0.47 * UNIT), 3, "close")
    T["dark"] = morph(T["dark"], 3, "close")
    T["frame"] = morph(T["frame"], 5, "close")
    T["gray"] = morph(morph(T["gray"], 3, "close"), 5, "close") & ~dilate(T["foil"], 17)  # 去掉烫字边缘被当成灰线的一圈
    spec = dict(gray=(70, 40, 1.3, 1.2), frame=(40, 30, 0.9, 1.0), flag=(60, 60, 0.9, 1.0), foil=(150, 1500, 0.9, 1.4),
                snow=(15, 15, 0.6, 0.8), snowDark=(15, 15, 0.6, 0.8), dark=(20, 30, 0.9, 1.0), ribbonText=(60, 30, 0.9, 1.0))
    enc = encode_layers(T, spec, C0, NR)
    write_ts(OUT, "SUXUE", "素雪茶饼", "attachments/products/素雪-茶饼.jpg", "scripts/products/trace-suxue.py",
             enc, (top, bot, *RIBBON_ENDS), LOGO)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "attachments/products/素雪-茶饼.jpg"))

# 手工核对（每次重描后，用 render-frames 或面板放大看）：
# 1.「素雪」笔画实心、没有灰色描边；雪花深浅两层都在；飘带细线连续。
# 2. 丝带两端斜切与照片一致（RIBBON_ENDS），白字完整、上下白线不进白字层。
# 3. logo 区干净（LOGO_BOX 内全清），代码画的 logo 和照片位置、大小对上（LOGO）。

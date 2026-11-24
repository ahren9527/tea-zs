#!/usr/bin/env python3
"""
从产品实物照片描出「月影 · 贡眉-白茶」包装印刷图案 → src/remotion/shared/products/yueying-data.ts

  pip install numpy pillow contourpy
  python3 scripts/products/trace-yueying.py attachments/products/月影-茶饼.jpg

分层（HSV 阈值见 classify）：
  gray       灰色线描（楼阁 / 远山 / 栏杆）
  ring       「月影」外的细环线（偏紫的冰蓝细线，和烫字重叠的部分被烫字盖住）
  blue       冰蓝镭射烫字「月影」+ 月牙 + 星星：色相 175–240，饱和度 > 0.08
  leaf       飘落的小绿叶
  flag       黄绿燕尾（含梳齿）
  dark       深色字：一叶倾心 / 贡眉-白茶 / 净含量（中间这块用局部阈值，「眉」字偏灰）
  ribbonText 丝带上的白字（丝带本身用拟合圆弧画）
"""
import sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from trace_common import ROOT, UNIT, blurf, dilate, encode_layers, grid, morph, prep, ribbon_fit, upright_setup, write_ts  # noqa: E402

OUT = ROOT / "src/remotion/shared/products/yueying-data.ts"
# 照片里量出来的：丝带上沿（中段被「净含量」挡住，自动拟合偏弯，按照片手量）、两端斜切、logo 位置
RIBBON_TOP = (-0.183, 0.914)
RIBBON_ENDS = (0.45, 0.55)
LOGO = {"emblem": (97, -1726, 490), "wordmark": (-269, 406, -1412, -1210)}
LOGO_BOX = (-300, 460, -2050, -1190)


def classify(D):
    H, Sa, V, ins, ax, rr = D["H"], D["Sa"], D["V"], D["inside"], D["ax"], D["rr"]
    Vb = blurf(V, 20)
    yy, xx = ax[:, None] / rr, ax[None, :] / rr
    band = yy > 0.6
    yiye = (xx < -0.45) & (yy > 0.2) & (yy < 0.65)
    dark = ins & (V < 0.45) & (Sa < 0.35)
    dark |= ins & yiye & (V < Vb - 0.18)
    Vb2 = blurf(V, 25)
    dark |= ins & (np.abs(xx) < 0.42) & (yy > 0.3) & (yy < 0.64) & (V < Vb2 - 0.16) & (Sa < 0.35)
    blue = ins & (H > 175) & (H < 240) & (Sa > 0.08) & (V > 0.35) & ~band & ~yiye
    ring = ins & (np.abs(xx) < 0.8) & (yy > -0.7) & (yy < 0.55) & (H > 195) & (H < 285) & (Sa > 0.06) & (V > 0.35) & (V < 0.9)
    leaf = ins & (H > 55) & (H < 110) & (Sa > 0.3) & (V > 0.45) & ~band
    flag = (yy > 0.45) & (np.abs(xx) > 0.38) & (np.abs(xx) < 0.75) & (H > 40) & (H < 100) & (Sa > 0.35) & (V > 0.5)
    ribbon = (yy > 0.6) & (np.abs(xx) < 0.62) & (H > 35) & (H < 100) & (Sa > 0.2) & (V < 0.75)
    gray = ins & (Sa < 0.16) & (V < Vb - 0.05) & ~dark & ~blue & ~yiye
    paper = (Sa < 0.25) & (V > 0.62)
    return dict(blue=blue, ring=ring, leaf=leaf, flag=flag, ribbon=ribbon, gray=gray, dark=dark, paper=paper)


def main(photo):
    D = prep(photo, (320, 1320))
    L = classify(D)
    up, half = upright_setup(L, D["NX"], D["NY"], D["NR"], ["ribbon", "flag"])
    C0, NR = half, D["NR"]
    T = {k: up(v) for k, v in L.items()}
    _, bot = ribbon_fit(morph(morph(T["ribbon"], 21, "close"), 9, "open"), C0, NR, 0.2)
    top = RIBBON_TOP
    X, Y = grid(2 * half, C0, NR)
    yT = (top[0] + np.sqrt(np.maximum(top[1] ** 2 - (X / UNIT) ** 2, 0))) * UNIT
    yB = (bot[0] + np.sqrt(np.maximum(bot[1] ** 2 - (X / UNIT) ** 2, 0))) * UNIT
    inrib = (Y > yT - 30) & (Y < yB + 40) & (np.abs(X) < 1150)
    logo = (X > LOGO_BOX[0]) & (X < LOGO_BOX[1]) & (Y > LOGO_BOX[2]) & (Y < LOGO_BOX[3])
    for k in ("blue", "leaf", "gray", "dark"):
        T[k] &= ~logo & ~inrib
    T["flag"] = morph(T["flag"] & ~logo & ~((Y > yT + 15) & (Y < yB - 15) & (np.abs(X) < 1000)), 5, "close")
    T["ribbonText"] = morph(morph(T["paper"] & (Y > yT + 0.035 * UNIT) & (Y < yB - 0.035 * UNIT) & (np.abs(X) < 0.46 * UNIT), 3, "close"), 5, "open")
    T["blue"] = morph(T["blue"], 7, "close")
    T["gray"] = morph(T["gray"] & ~dilate(T["blue"], 17), 5, "close")
    T["leaf"] = morph(T["leaf"], 5, "close")
    T["dark"] = morph(T["dark"], 3, "close")
    T["ring"] = morph(T["ring"], 5, "close") & ~dilate(T["dark"], 15) & ~logo
    spec = dict(gray=(70, 40, 1.3, 1.2), ring=(60, 30, 0.8, 0.8), blue=(120, 1500, 0.9, 1.4), leaf=(40, 40, 0.9, 1.0),
                flag=(60, 60, 0.9, 1.0), dark=(20, 30, 0.9, 1.0), ribbonText=(60, 30, 0.9, 1.0))
    enc = encode_layers(T, spec, C0, NR)
    write_ts(OUT, "YUEYING", "月影茶饼", "attachments/products/月影-茶饼.jpg", "scripts/products/trace-yueying.py",
             enc, (top, bot, *RIBBON_ENDS), LOGO)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "attachments/products/月影-茶饼.jpg"))

# 手工核对（每次重描后放大看）：
# 1.「月影」笔画实心，「影」上下两个口、月牙、四颗星都在；外圈细环线连续。
# 2. 「贡眉-白茶」完整（「眉」字偏灰，靠局部阈值）；小绿叶都在。
# 3. 丝带上沿与照片一致（RIBBON_TOP 手量）；logo 区干净，代码 logo 对上照片。

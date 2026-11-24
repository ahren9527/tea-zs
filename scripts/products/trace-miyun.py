#!/usr/bin/env python3
"""
从产品实物照片描出包装印刷图案 → src/remotion/shared/products/miyun-data.ts

  pip install numpy pillow contourpy
  python3 scripts/products/trace-miyun.py attachments/products/蜜韵-茶饼.jpg

做法（照片 → 纯代码路径，不贴图）：
  1. 找饼：按「低饱和、高亮度」的纸面拟合饼的圆心和半径。
  2. 分层：按色相 / 饱和度 / 亮度把印刷分成 金（烫金）、绿（品牌标与字）、浅绿（远山）、
     棕红（丝带与「一叶倾心」）、深色（寿眉-白茶、净含量）。金箔反光处补回金色，再做闭运算填小缝。
  3. 摆正：照片里饼转了约 5°，按左右对称度搜索角度和中轴，把图案转正、中轴对到 x = 0。
  4. 丝带：上下沿各拟合一段圆心在中轴上的圆弧（代码里按圆弧画，竖纹和奶金细线也是代码画），
     丝带上的白字单独描成一层。
  5. 描边：每层轮廓用 contourpy 提取（带洞），Douglas-Peucker 简化，金色层去掉反光留下的小洞，
     坐标以「饼半径 = 2000」取整，Google polyline 编码写进 TS。
换包装、换照片后重跑本脚本，再用面板 / render-frames 抽帧核对。新产品照这个脚本复制一份改颜色阈值即可。
"""
import json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import contourpy

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src/remotion/shared/products/miyun-data.ts"
UNIT = 2000


def hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = np.maximum(mx - mn, 1e-6)
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = (mx - mn) / np.maximum(mx, 1e-6)
    return h.astype(np.float32), s.astype(np.float32), mx.astype(np.float32)


def morph(m, k, op):
    im = Image.fromarray((m * 255).astype(np.uint8))
    a, b = (ImageFilter.MaxFilter(k), ImageFilter.MinFilter(k)) if op == "close" else (ImageFilter.MinFilter(k), ImageFilter.MaxFilter(k))
    return np.asarray(im.filter(a).filter(b)) > 127


def fit_circle(pts):
    p = np.asarray(pts, float)
    A = np.c_[2 * p[:, 0], 2 * p[:, 1], np.ones(len(p))]
    cx, cy, c = np.linalg.lstsq(A, (p ** 2).sum(1), rcond=None)[0]
    return cx, cy, math.sqrt(c + cx * cx + cy * cy)


def row_extents(mask, y0, y1, step=8, min_px=100):
    out = []
    for y in range(y0, y1, step):
        xs = np.nonzero(mask[y])[0]
        if len(xs) > min_px:
            out += [(xs.min(), y), (xs.max(), y)]
    return out


def rdp(pts, eps):
    keep = np.zeros(len(pts), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        p, q = pts[a], pts[b]
        seg = q - p
        sub = pts[a + 1 : b]
        L2 = (seg ** 2).sum()
        t = np.clip(((sub - p) @ seg) / L2, 0, 1) if L2 else np.zeros(len(sub))
        dd = np.hypot(*(sub - (p + np.outer(t, seg))).T)
        i = int(np.argmax(dd))
        if dd[i] > eps:
            k = a + 1 + i
            keep[k] = True
            stack += [(a, k), (k, b)]
    return pts[keep]


def area(p):
    x, y = p[:, 0], p[:, 1]
    return 0.5 * (np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))


def trace(mask, min_outer, min_hole, eps=0.9, blur=1.0):
    z = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))).astype(np.float32) / 255
    polys, offs = contourpy.contour_generator(z=z, fill_type="OuterOffset").filled(0.5, 2.0)
    rings = []
    for pts, off in zip(polys, offs):
        for i in range(len(off) - 1):
            r = pts[off[i] : off[i + 1]]
            if len(r) > 1 and np.allclose(r[0], r[-1]):
                r = r[:-1]
            A = abs(area(r))
            if i == 0 and A < min_outer:
                break
            if i > 0 and A < min_hole:
                continue
            s = rdp(np.vstack([r, r[:1]]), eps)[:-1]
            if len(s) >= 3:
                rings.append(s)
    return rings


# 金色层里真正的字框 / 纹样镂空（数据坐标中心）：「蜜」宝盖下的点框、小花花心、两侧卷草的眼
GOLD_KEEP_HOLES = [(241, -714), (10, 397), (1669, -997), (-1547, -621), (1734, -834)]


def trace_gold(mask, C0, U, blur=1.6, eps=0.9):
    """金色层专用描边：反光造成的小洞填实，只留真字框（面积 ≥ 6000 单位²、在保留名单里、或在两座小山里）；
    碎金点 < 1500 单位²丢掉，但「mi yun」一行（i 的点、n 的竖）放宽到 150"""
    z = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))).astype(np.float32) / 255
    polys, offs = contourpy.contour_generator(z=z, fill_type="OuterOffset").filled(0.5, 2.0)
    def c_of(r):
        return (r.mean(0) - C0) * U
    def in_hill(c):
        return (-1960 < c[0] < -1300 or 1300 < c[0] < 1960) and (-1250 < c[1] < -500)
    out = []
    for pts, off in zip(polys, offs):
        r0 = pts[off[0] : off[1]]
        c0 = c_of(r0)
        in_my = -800 < c0[0] < 100 and 250 < c0[1] < 600
        if abs(area(r0)) * U * U < (150 if in_my else 1500):
            continue
        for i in range(len(off) - 1):
            r = pts[off[i] : off[i + 1]]
            if len(r) > 1 and np.allclose(r[0], r[-1]):
                r = r[:-1]
            if i > 0:
                c = c_of(r)
                keep = abs(area(r)) * U * U >= 6000 or in_hill(c) or any(abs(c[0] - x) < 60 and abs(c[1] - y) < 60 for x, y in GOLD_KEEP_HOLES)
                if not keep:
                    continue
            s = rdp(np.vstack([r, r[:1]]), eps)[:-1]
            if len(s) >= 3:
                out.append(s)
    return out


def encode(flat):
    out, px, py = [], 0, 0
    for i in range(0, len(flat), 2):
        x, y = flat[i], flat[i + 1]
        for v in (x - px, y - py):
            v = (v << 1) if v >= 0 else ((~v) << 1 | 1)
            while v >= 0x20:
                out.append(chr((0x20 | (v & 0x1F)) + 63))
                v >>= 5
            out.append(chr(v + 63))
        px, py = x, y
    return "".join(out)


def main(photo):
    src = Image.open(photo).convert("RGB")
    W0, H0 = src.size

    # 1. 粗找饼（缩到 3000 宽）
    S = 3000 / W0
    small = np.asarray(src.resize((3000, int(H0 * S)), Image.LANCZOS)).astype(np.float32) / 255
    _, s_, v_ = hsv(small)
    paper = (s_ < 0.12) & (v_ > 0.72)
    paper[:, :800] = False
    paper[:, 2300:] = False
    pts = [p for p in row_extents(paper, 380, 1480, 10, 50)]
    cx, cy, rr = (v / S for v in fit_circle(pts))
    del small, s_, v_, paper

    # 2. 原图分辨率裁出饼，分层
    pad = int(rr * 1.03)
    X0, Y0 = int(cx - pad), int(cy - pad)
    crop = np.asarray(src.crop((X0, Y0, X0 + 2 * pad, Y0 + 2 * pad))).astype(np.float32) / 255
    H, Sa, V = hsv(crop)
    del crop
    n = H.shape[0]
    ax = np.arange(n, dtype=np.float32) - pad
    rad = np.hypot(ax[None, :], ax[:, None])
    paperish = (Sa < 0.16) & (V > 0.62)
    ang = np.arctan2(ax[:, None], ax[None, :])
    bins = (((ang + np.pi) / (2 * np.pi)) * 720).astype(np.int32) % 720
    edge = np.full(720, rr)
    for k in range(720):
        m = (bins == k) & paperish & (rad < rr * 1.08)
        if m.sum() > 50:
            edge[k] = np.percentile(rad[m], 99.5)
    edge = np.minimum(np.convolve(np.r_[edge[-4:], edge, edge[:4]], np.ones(9) / 9, "valid"), rr * 1.06)
    inside = rad < edge[bins] - 6
    del ang, bins, paperish

    gold = inside & (H > 14) & (H < 56) & (Sa > 0.26) & (V > 0.42)
    near = np.asarray(Image.fromarray((gold * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(21))) > 0
    gold |= inside & near & (V > 0.9) & (Sa > 0.1) & (H > 12) & (H < 60)  # 金箔反光
    green = inside & (H > 55) & (H < 115) & (Sa > 0.25) & (V < 0.65)
    mint = inside & (H > 95) & (H < 185) & (Sa > 0.07) & (V > 0.5)
    maroon = inside & ((H < 16) | (H > 330)) & (Sa > 0.3) & (V < 0.72) & (V > 0.15)
    dark = inside & (V < 0.5) & (Sa < 0.32) & ~maroon & ~green
    band = (ax[:, None] / rr) > 0.62
    rib = morph((maroon | gold) & band & inside, 7, "close")
    rib &= ~morph(band & (Sa < 0.18) & (V > 0.7), 3, "close")
    dens = np.asarray(Image.fromarray((maroon * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(15))) / 255
    ribbon = rib & (dens > 0.25)
    # 2026-11 补：金箔正反光处（V≈1、饱和度 0.05–0.14、色相偏黄）原规则漏掉，笔画会变空心（如「虫」右竖）
    near2 = np.asarray(Image.fromarray((gold * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(25))) > 0
    refl2 = inside & near2 & (V > 0.95) & (Sa > 0.05) & (H > 28) & (H < 72)
    # 两侧两座金线小山：线条之间的空隙很窄，只轻微补缝，不用 7×7 闭运算（否则糊成一块）
    hill_raw = inside & (((H > 14) & (H < 56) & (Sa > 0.26) & (V > 0.42)) | ((H > 18) & (H < 58) & (Sa > 0.15) & (V > 0.5)))
    layers = {
        "gold": morph(gold & ~ribbon, 7, "close"),
        "goldRefl": refl2 & ~ribbon,
        "goldHill": hill_raw & ~ribbon,
        "green": morph(green, 3, "close"),
        "mint": morph(mint, 9, "close"),
        "ribbon": ribbon,
        "maroon": morph(maroon & ~band, 3, "close"),
        "dark": morph(dark, 3, "close"),
    }
    paper_full = (Sa < 0.2) & (V > 0.62)
    loose = (Sa < 0.22) & (V > 0.5)
    del H, Sa, V, gold, green, mint, maroon, dark, rib, dens, near, rad

    # 用更宽的纸面判断精拟合（阴影一侧的纸也算上）→ 设计坐标的圆心与半径
    pts = row_extents(loose, int(0.25 * n), int(0.8 * n), 8, 100)
    for x in range(int(pad - rr * 0.5), int(pad + rr * 0.5), 8):
        ys = np.nonzero(loose[:, x])[0]
        if len(ys):
            pts.append((x, ys.min()))
    NX, NY, NR = fit_circle(pts)
    del loose

    # 3. 摆正：按左右对称度搜角度与中轴
    half = int(NR * 0.98)
    def frame(m):
        f = np.zeros((2 * half, 2 * half), bool)
        y0, x0 = int(NY - half), int(NX - half)
        ys0, xs0 = max(0, y0), max(0, x0)
        ys1, xs1 = min(m.shape[0], y0 + 2 * half), min(m.shape[1], x0 + 2 * half)
        f[ys0 - y0 : ys1 - y0, xs0 - x0 : xs1 - x0] = m[ys0:ys1, xs0:xs1]
        return f
    allp = frame(layers["gold"] | layers["ribbon"] | layers["green"] | layers["dark"])
    im0 = Image.fromarray((allp * 255).astype(np.uint8))
    best = (-1, 0, 0)
    for a in np.arange(-10, 10.1, 0.5):
        g = np.asarray(im0.rotate(a, resample=Image.BILINEAR).resize((400, 400))) / 255.0
        for sh in range(-16, 17, 2):
            b = np.roll(g, sh, axis=1)
            score = (b * b[:, ::-1]).sum() / max((b * b).sum(), 1e-6)
            if score > best[0]:
                best = (score, a, sh)
    theta, shift = best[1], best[2] / 400 * 2 * half
    print(f"摆正：旋转 {theta}°，中轴平移 {shift:.0f}px", file=sys.stderr)
    def upright(m):
        return np.asarray(Image.fromarray((frame(m) * 255).astype(np.uint8)).rotate(theta, resample=Image.BILINEAR, translate=(shift, 0))) > 127
    T = {k: upright(v) for k, v in layers.items()}
    C0 = half
    axn = (np.arange(2 * half, dtype=np.float32) - C0) / NR

    # 4. 丝带：上下沿拟合圆心在中轴上的圆弧
    Rt = T["ribbon"]
    tops, bots = [], []
    for x in range(0, Rt.shape[1], 5):
        ys = np.nonzero(Rt[:, x])[0]
        if len(ys) > 60:
            tops.append((x, ys.min()))
            bots.append((x, ys.max()))
    tops, bots = np.array(tops, float), np.array(bots, float)
    lo, hi = tops[:, 0].min(), tops[:, 0].max()
    def sym_fit(P):
        P = P[(P[:, 0] > lo + 0.12 * (hi - lo)) & (P[:, 0] < hi - 0.12 * (hi - lo))]
        x, y = (P[:, 0] - C0) / NR, (P[:, 1] - C0) / NR
        cy_, k = np.linalg.lstsq(np.c_[2 * y, np.ones(len(y))], x * x + y * y, rcond=None)[0]
        return float(cy_), float(math.sqrt(k + cy_ * cy_))
    top, bot = sym_fit(tops), sym_fit(bots)
    y_top = top[0] + np.sqrt(np.maximum(top[1] ** 2 - axn[None, :] ** 2, 0))
    y_bot = bot[0] + np.sqrt(np.maximum(bot[1] ** 2 - axn[None, :] ** 2, 0))
    inband = (axn[:, None] > y_top + 0.028) & (axn[:, None] < y_bot - 0.028) & (np.abs(axn[None, :]) < 0.44)
    T["ribbonText"] = morph(upright(paper_full) & inband, 3, "close")

    # 金色层合成：原规则 + 正反光（logo 区除外）；两座小山换成只轻补缝的细线版
    n2 = 2 * half
    gx = ((np.arange(n2, dtype=np.float32) - C0) / NR * UNIT)[None, :]
    gy = ((np.arange(n2, dtype=np.float32) - C0) / NR * UNIT)[:, None]
    hillbox = ((gx > -1960) & (gx < -1300) | (gx > 1300) & (gx < 1960)) & (gy > -1250) & (gy < -500)
    logo_u = (gx > -420) & (gx < 400) & (gy < -1230)
    Gd = T["gold"] | (T["goldRefl"] & ~hillbox & ~logo_u)
    hill = morph(morph(T["goldHill"], 3, "close"), 3, "open")
    Gd[hillbox] = hill[hillbox]
    T["gold"] = morph(Gd, 3, "close")

    # 5. 描边 + 编码
    spec = dict(mint=(80, 200), green=(20, 30), maroon=(20, 30), dark=(20, 30), ribbonText=(20, 30))
    U = UNIT / NR
    enc = {}
    for k, (mo, mh) in spec.items():
        rings = trace(T[k], mo, mh)
        enc[k] = [encode(np.round((r - C0) * U).astype(int).flatten().tolist()) for r in rings]
        print(f"{k}: {len(rings)} 个轮廓", file=sys.stderr)
    enc["gold"] = [encode(np.round((r - C0) * U).astype(int).flatten().tolist()) for r in trace_gold(T["gold"], C0, U)]
    enc = {k: enc[k] for k in ("mint", "gold", "green", "maroon", "dark", "ribbonText")}

    ts = [
        "/**",
        " * 蜜韵茶饼包装的印刷图案（由 attachments/products/蜜韵-茶饼.jpg 按颜色分层描出，勿手改）。",
        " * 重描：python3 scripts/products/trace-miyun.py（需要 numpy、pillow、contourpy）。",
        " * 坐标单位：饼半径 = 2000，原点为饼心；每个字符串是一个闭合轮廓（Google polyline 编码，差分 + zigzag）。",
        " * 同一层的所有轮廓按 evenodd 一起填色，洞（字的内框）自然留空。",
        " */",
        f"export const MIYUN_UNIT = {UNIT};",
        "",
        "export const MIYUN_LAYERS = {",
    ]
    for k in enc:
        ts.append(f"  {k}: [")
        ts += [f"    {json.dumps(s)}," for s in enc[k]]
        ts.append("  ],")
    ts += [
        "} as const;",
        "",
        "/** 丝带几何（同一照片拟合，单位：饼半径 = 1）：上沿 / 下沿是两段圆弧，圆心在饼的中轴上 */",
        "export const MIYUN_RIBBON = {",
        f"  top: {{ cy: {top[0]:.4f}, r: {top[1]:.4f} }},",
        f"  bottom: {{ cy: {bot[0]:.4f}, r: {bot[1]:.4f} }},",
        "  /** 两端斜切：上沿端点 |x|、下沿端点 |x| */",
        "  endTopX: 0.455,",
        "  endBottomX: 0.515,",
        "};",
        "",
    ]
    OUT.write_text("\n".join(ts), encoding="utf-8")
    print(f"写入 {OUT.relative_to(ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / "attachments/products/蜜韵-茶饼.jpg"))


# 手工核对（每次重描后）：放大看「虫」两个口一样大、右竖是实心；「日」两个口、小花花心、「mi yun」字母都在；
# 两侧两座金线小山是一道道细线而不是一整块。不对就调 trace_gold 的保留名单或 refl2 阈值，不要手改 miyun-data.ts。

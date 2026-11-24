"""
照片描图的共用流程（素雪、月影；蜜韵的 trace-miyun.py 是同一套做法的早期版本）。

  pip install numpy pillow contourpy

步骤：找饼（纸面拟合圆）→ 原图分辨率裁饼、转 HSV → 各款自己的 classify() 分层 →
按丝带 + 燕尾的左右对称度摆正 → 拟合丝带上下沿圆弧 → 清 logo 区和丝带区 →
contourpy 描边（带洞）+ Douglas-Peucker 简化 → 坐标以「饼半径 = 2000」取整，Google polyline 编码写 TS。
"""
import json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import contourpy

ROOT = Path(__file__).resolve().parents[2]
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


def dilate(m, k):
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(k))) > 0


def blurf(a, r):
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.BoxBlur(r))).astype(np.float32) / 255


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
    """描边：外轮廓面积 < min_outer 的碎块丢掉；洞面积 < min_hole 的填实（反光造成的假镂空）"""
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


def prep(photo, yr, xr=(800, 2300)):
    """找饼 + 裁饼 + HSV。yr / xr 是缩到 3000 宽后找纸面的行、列范围（避开木托和背景）"""
    src = Image.open(photo).convert("RGB")
    W0, H0 = src.size
    S = 3000 / W0
    small = np.asarray(src.resize((3000, int(H0 * S)), Image.LANCZOS)).astype(np.float32) / 255
    _, s_, v_ = hsv(small)
    paper = (s_ < 0.12) & (v_ > 0.72)
    paper[:, : xr[0]] = False
    paper[:, xr[1] :] = False
    cx, cy, rr = (v / S for v in fit_circle(row_extents(paper, yr[0], yr[1], 10, 50)))
    pad = int(rr * 1.03)
    X0, Y0 = int(cx - pad), int(cy - pad)
    crop = np.asarray(src.crop((X0, Y0, X0 + 2 * pad, Y0 + 2 * pad))).astype(np.float32) / 255
    H, Sa, V = hsv(crop)
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
    # 精拟合：宽松的纸面判断（阴影一侧也算）
    loose = (Sa < 0.22) & (V > 0.5)
    pts = row_extents(loose, int(0.25 * n), int(0.8 * n), 8, 100)
    for x in range(int(pad - rr * 0.5), int(pad + rr * 0.5), 8):
        ys = np.nonzero(loose[:, x])[0]
        if len(ys):
            pts.append((x, ys.min()))
    NX, NY, NR = fit_circle(pts)
    return dict(H=H, Sa=Sa, V=V, inside=inside, ax=ax, rr=rr, NX=NX, NY=NY, NR=NR)


def upright_setup(layers, NX, NY, NR, sym_keys, hk=1.06):
    """按 sym_keys 几层（丝带、燕尾）的左右对称度搜旋转角与中轴平移"""
    half = int(NR * hk)
    def frame(m):
        f = np.zeros((2 * half, 2 * half), bool)
        y0, x0 = int(NY - half), int(NX - half)
        ys0, xs0 = max(0, y0), max(0, x0)
        ys1, xs1 = min(m.shape[0], y0 + 2 * half), min(m.shape[1], x0 + 2 * half)
        f[ys0 - y0 : ys1 - y0, xs0 - x0 : xs1 - x0] = m[ys0:ys1, xs0:xs1]
        return f
    allp = np.zeros((2 * half, 2 * half), bool)
    for k in sym_keys:
        allp |= frame(layers[k])
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
    return upright, half


def ribbon_mask(D, hue, sat, val):
    H, Sa, V, ax, rr = D["H"], D["Sa"], D["V"], D["ax"], D["rr"]
    yy, xx = ax[:, None] / rr, ax[None, :] / rr
    m = (yy > 0.62) & (np.abs(xx) < 0.62) & (np.hypot(xx, yy) < 1.08) & (H > hue[0]) & (H < hue[1]) & (Sa > sat) & (V < val)
    return morph(morph(m, 21, "close"), 9, "open")


def ribbon_fit(Rt, C0, NR, trim=0.2):
    """丝带上下沿各拟合一段圆心在中轴上的圆弧（只用中段，两端被燕尾挡住）"""
    tops, bots = [], []
    for x in range(0, Rt.shape[1], 5):
        ys = np.nonzero(Rt[:, x])[0]
        if len(ys) > 60:
            tops.append((x, ys.min()))
            bots.append((x, ys.max()))
    tops, bots = np.array(tops, float), np.array(bots, float)
    lo, hi = tops[:, 0].min(), tops[:, 0].max()
    def sym_fit(P):
        P = P[(P[:, 0] > lo + trim * (hi - lo)) & (P[:, 0] < hi - trim * (hi - lo))]
        x, y = (P[:, 0] - C0) / NR, (P[:, 1] - C0) / NR
        cy_, k = np.linalg.lstsq(np.c_[2 * y, np.ones(len(y))], x * x + y * y, rcond=None)[0]
        return float(cy_), float(math.sqrt(k + cy_ * cy_))
    return sym_fit(tops), sym_fit(bots)


def write_ts(path, NAME, title, photo_rel, script_rel, enc, ribbon, logo):
    t, b, et, eb = ribbon
    ts = [
        "/**",
        f" * {title}包装的印刷图案（由 {photo_rel} 按颜色分层描出，勿手改）。",
        f" * 重描：python3 {script_rel}（需要 numpy、pillow、contourpy），描完按脚本里的「手工核对」看一遍。",
        " * 坐标单位：饼半径 = 2000，原点为饼心；每个字符串是一个闭合轮廓（Google polyline 编码，差分 + zigzag）。",
        " * 同一层的所有轮廓按 evenodd 一起填色，洞（字的内框）自然留空。顶部 logo 区已清空，logo 用 emblem.ts 的官方矢量。",
        " */",
        f"export const {NAME}_UNIT = {UNIT};",
        "",
        f"export const {NAME}_LAYERS = {{",
    ]
    for k, v in enc.items():
        ts.append(f"  {k}: [")
        ts += [f"    {json.dumps(s)}," for s in v]
        ts.append("  ],")
    ts += [
        "} as const;",
        "",
        "/** 丝带几何（同一照片拟合，单位：饼半径 = 1）：上沿 / 下沿是两段圆弧，圆心在饼的中轴上 */",
        f"export const {NAME}_RIBBON = {{",
        f"  top: {{ cy: {t[0]:.4f}, r: {t[1]:.4f} }},",
        f"  bottom: {{ cy: {b[0]:.4f}, r: {b[1]:.4f} }},",
        f"  endTopX: {et:.3f},",
        f"  endBottomX: {eb:.3f},",
        "};",
        "",
        "/** 照片里 logo 的位置（数据坐标）：壶形标中心与高度（含茶烟）、品牌字 + 拼音外框 */",
        f"export const {NAME}_LOGO = {{",
        f"  emblem: {{ x: {logo['emblem'][0]}, y: {logo['emblem'][1]}, h: {logo['emblem'][2]} }},",
        f"  wordmark: {{ x0: {logo['wordmark'][0]}, x1: {logo['wordmark'][1]}, y0: {logo['wordmark'][2]}, y1: {logo['wordmark'][3]} }},",
        "};",
        "",
    ]
    Path(path).write_text("\n".join(ts), encoding="utf-8")
    print(f"写入 {path}", file=sys.stderr)


def encode_layers(T, spec, C0, NR):
    U = UNIT / NR
    enc = {}
    for k, (mo, mh, eps, blur) in spec.items():
        rings = trace(T[k], mo, mh, eps, blur)
        enc[k] = [encode(np.round((r - C0) * U).astype(int).flatten().tolist()) for r in rings]
        print(f"{k}: {len(rings)} 个轮廓", file=sys.stderr)
    return enc


def grid(n, C0, NR):
    a = (np.arange(n, dtype=np.float32) - C0) / NR * UNIT
    return a[None, :], a[:, None]

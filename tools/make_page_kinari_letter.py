"""信条の便箋用・生成りの簀の目紙。
   墨 #241E16 を載せて最悪画素で 7.83 を超えることを、符号化後の実測で保証する。
   生成AIではなく決定論的に作る理由: 明度の床を確実に満たす必要があり、
   生成物は必ず後処理が要るため（page_beni_dark と同じ方針）。"""
import numpy as np, subprocess, os
from PIL import Image, ImageFilter

FLOOR_CT = 7.83          # 本文コントラストの床
INK = (0x24, 0x1E, 0x16) # 墨
TARGET_CT = 8.60         # 余裕を見た目標

def s2l(a): return np.where(a > 0.04045, ((a + 0.055) / 1.055) ** 2.4, a / 12.92)
def l2s(a):
    a = np.clip(a, 0, 1)
    return np.where(a > 0.0031308, 1.055 * a ** (1 / 2.4) - 0.055, a * 12.92)
def lum(rgb01):
    l = s2l(rgb01); return 0.2126*l[...,0] + 0.7152*l[...,1] + 0.0722*l[...,2]

INK_L = float(lum(np.array(INK, float)[None, None, :] / 255.)[0, 0])
CREAM = np.array([0xF4, 0xEE, 0xE0], float) / 255.    # 生成り
SHADE = np.array([0xD8, 0xCE, 0xB8], float) / 255.    # 簀の目の谷

def build(W, depth):
    H = round(W * 0.62)
    s = W / 2400.
    rng = np.random.default_rng(20260820)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)

    # 簀の目：細かい縦の筋。周期を少し揺らして機械的にしない
    per = 5.2 * s
    jitter = np.asarray(Image.fromarray((rng.random((H, W))*255).astype(np.uint8))
             .filter(ImageFilter.GaussianBlur(radius=max(26*s,8))), dtype=np.float64)/255.
    lines = np.sin((xx + (jitter-.5)*per*3.2) * 2*np.pi/per)*.5 + .5
    lines = lines*0.72 + 0.28*np.asarray(Image.fromarray((lines*255).astype(np.uint8))
            .filter(ImageFilter.GaussianBlur(radius=max(2.2*s,1.2))),dtype=np.float64)/255.

    # 糸目：広い間隔の縦の帯（手漉きの簀を留める糸の跡）
    chain = np.sin(xx * 2*np.pi/(per*13)) * .5 + .5

    # 楮の繊維：縦に流れる細い筋
    fib = np.zeros((H, W))
    for _ in range(int(4200*s*s + 1800)):
        cy, cx = rng.integers(0, H), rng.integers(0, W)
        ln = rng.uniform(14, 70)*s; th = rng.normal(np.pi/2, .16)
        for t in np.linspace(-ln/2, ln/2, max(int(ln), 2)):
            y = int(cy + t*np.sin(th)); x = int(cx + t*np.cos(th))
            if 0 <= y < H and 0 <= x < W: fib[y, x] = 1.
    fib = np.asarray(Image.fromarray((fib*255).astype(np.uint8))
          .filter(ImageFilter.GaussianBlur(radius=max(.9*s,.6))), dtype=np.float64)/255.

    # 漉きムラ：ごく低周波の濃淡
    cloud = np.asarray(Image.fromarray((rng.random((H, W))*255).astype(np.uint8))
            .filter(ImageFilter.GaussianBlur(radius=max(W/11, 20))), dtype=np.float64)/255.
    cloud = (cloud - cloud.mean())/max(cloud.std(), 1e-6)

    t = (lines*.34 + chain*.11 + fib*.40 + np.clip(cloud*.5+.5, 0, 1)*.15)
    t = (t - t.min())/(t.max()-t.min())
    t = t ** 1.05
    d = depth * t[..., None]                       # 0=生成り 〜 depth=谷
    out = CREAM[None, None, :]*(1-d) + SHADE[None, None, :]*d
    return (np.clip(out, 0, 1)*255).round().astype(np.uint8)

def measure(path):
    L = lum(np.asarray(Image.open(path).convert("RGB")).astype(np.float64)/255.)
    return L.min(), np.median(L), (L.min()+0.05)/(INK_L+0.05), os.path.getsize(path)

TMP = "/private/tmp/claude-501/-Users-takahirokamino-Downloads---------------/4e0b121d-2b86-4c29-a86a-82fc506b160b/scratchpad"
print("墨 #241E16 の相対輝度 = %.4f" % INK_L)
for W in (1800, 2400):
    depth = 0.85
    for it in range(10):
        png = f"{TMP}/kl{W}.png"; Image.fromarray(build(W, depth)).save(png)
        out = f"assets/std/page_kinari_letter_{W}.webp"
        subprocess.run(["magick", png, "-quality", "93", "-define", "webp:method=6",
                        "-define", "webp:use-sharp-yuv=1", out], check=True)
        mn, md, ct, sz = measure(out)
        if ct >= FLOOR_CT + 0.4:
            print("  %d  Lmin=%.3f 中央値=%.3f  墨との最悪コントラスト=%.2f  %5.1fKB (補正%d回 depth=%.2f)"
                  % (W, mn, md, ct, sz/1024, it, depth)); break
        depth *= 0.86
    else:
        print("  %d 収束せず ct=%.2f" % (W, ct))

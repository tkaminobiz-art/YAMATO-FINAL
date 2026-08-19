import numpy as np, subprocess, os
from PIL import Image, ImageFilter

SRC="assets/std/page_beni.webp"; CEIL=0.0508; RMAX=2.0; CT=0.8575
def s2l(a): return np.where(a>0.04045, ((a+0.055)/1.055)**2.4, a/12.92)
def l2s(a):
    a=np.clip(a,0,1); return np.where(a>0.0031308, 1.055*a**(1/2.4)-0.055, a*12.92)
def lum(x):
    l=s2l(x); return 0.2126*l[...,0]+0.7152*l[...,1]+0.0722*l[...,2]
BENI=np.array([189,27,33])/255.; BL=s2l(BENI); BLu=float(lum(BENI[None,None,:])[0,0])

def build(W_out, L_light, L_dark):
    im=Image.open(SRC).convert("RGB")
    # 四隅の牡丹の装飾を避けるため中央だけを使う（仕様の「四隅の大きな装飾図柄」を避ける）
    iw,ih=im.size; cw,ch=int(iw*0.66),int(ih*0.66)
    im=im.crop(((iw-cw)//2,(ih-ch)//2,(iw+cw)//2,(ih+ch)//2))
    if W_out!=im.size[0]:
        im=im.resize((W_out, round(im.size[1]*W_out/im.size[0])), Image.LANCZOS)
    W,H=im.size; s=W/2400.
    tex=lum(np.asarray(im).astype(np.float64)/255.)

    # 低周波の傾斜だけ除去し、紙自身の細かなムラは残す
    low=np.asarray(Image.fromarray((np.clip(tex,0,1)**(1/2.2)*255).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(radius=W/14)),dtype=np.float64)/255.
    flat=tex/np.maximum(np.maximum(low,1e-3)**2.2,1e-6)
    lo,hi=np.percentile(flat,2.0),np.percentile(flat,98.0)
    base=np.clip((flat-lo)/(hi-lo),0,1)

    rng=np.random.default_rng(20260819)
    yy,xx=np.mgrid[0:H,0:W].astype(np.float64)

    # 絹目＝縦横の細かな織り目。周期は2400px基準で約2.6px
    per=2.6*s
    weave=(np.sin(xx*2*np.pi/per)*0.5+np.sin(yy*2*np.pi/(per*1.07))*0.5)
    weave*=(0.55+0.45*np.asarray(Image.fromarray((rng.random((H,W))*255).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(radius=max(9*s,3))),dtype=np.float64)/255.)

    # 楮の繊維＝細く長い筋。方向をばらして紙漉きの気配を出す
    fib=np.zeros((H,W))
    for _ in range(int(2600*s*s+900)):
        cy,cx=rng.integers(0,H),rng.integers(0,W)
        ln=rng.uniform(6,34)*s; th=rng.uniform(0,np.pi); amp=rng.uniform(.35,1.)
        n=max(int(ln),2)
        for t in np.linspace(-ln/2,ln/2,n):
            y=int(cy+t*np.sin(th)); x=int(cx+t*np.cos(th))
            if 0<=y<H and 0<=x<W: fib[y,x]=max(fib[y,x],amp)
    fib=np.asarray(Image.fromarray((fib*255).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(radius=max(.7*s,.55))),dtype=np.float64)/255.

    n=np.clip(base*0.62 + (weave*0.5+0.5)*0.20 + fib*0.55, 0, 1)
    n=n**0.92
    out=BL[None,None,:]*((L_dark+(L_light-L_dark)*n)/BLu)[...,None]
    return (np.clip(l2s(out),0,1)*255).round().astype(np.uint8)

def meas(p):
    L=lum(np.asarray(Image.open(p).convert("RGB")).astype(np.float64)/255.)
    return L.max(), L.max()/L.min(), (CT+0.05)/(L.max()+0.05), os.path.getsize(p)

T="/private/tmp/claude-501/-Users-takahirokamino-Downloads---------------/4e0b121d-2b86-4c29-a86a-82fc506b160b/scratchpad"
for W_out in (1200,1800,2400):
    Ll,Ld=0.0500,0.0290
    for it in range(9):
        png=f"{T}/n{W_out}.png"; Image.fromarray(build(W_out,Ll,Ld)).save(png)
        out=f"assets/std/page_beni_dark_{W_out}.webp"
        subprocess.run(["magick",png,"-quality","93","-define","webp:method=6",
                        "-define","webp:use-sharp-yuv=1",out],check=True)
        m,r,c,sz=meas(out)
        if m<=CEIL and r<=RMAX:
            print("  %d  Lmax=%.4f 比=%.2f コントラスト=%.2f  %5.1fKB (補正%d回)"%(W_out,m,r,c,sz/1024,it)); break
        Ll*=CEIL/m*0.995; Ld=max(Ld, Ll/1.90)
    else: print("  %d 収束せず Lmax=%.4f 比=%.2f"%(W_out,m,r))

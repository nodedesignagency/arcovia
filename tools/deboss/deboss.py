"""Press the Arcovia lockup into the front face of the deck's concrete render (the About hero's image).

    node tools/deboss/render-mask.js                       # once: the official lockup as a 2400px mask
    python3 tools/deboss/deboss.py <render> <out.jpg> [logo width] [centre x] [centre y]

Made for the October deck's render of two white concrete blocks on charcoal (2000 x 1125): the logo
sits on the right block's front face, centred at (1460, 650), 320px wide before foreshortening.
The face is drawn isometric: verticals stay vertical, horizontals rise at 0.59 (about 30.5 deg),
so the flat logo is narrowed by cos(theta) and sheared. Lit from the upper right, like the render."""
import sys, numpy as np
from PIL import Image
import os
SP = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1]; OUT = sys.argv[2]
W_LOGO = float(sys.argv[3]) if len(sys.argv) > 3 else 320.0   # flat logo width in output px
CX, CY = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (1460.0, 650.0)
S = 4                     # supersampling
SLOPE = 0.59              # the face's horizontals: y rises 0.59 per px to the right
COS = 1 / np.sqrt(1 + SLOPE ** 2)

def blur(a, sigma):
    """Gaussian blur through the FFT (no scipy here)."""
    h, w = a.shape
    fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.rfftfreq(w)[None, :]
    k = np.exp(-2 * (np.pi * sigma) ** 2 * (fx ** 2 + fy ** 2))
    return np.fft.irfft2(np.fft.rfft2(a) * k, s=a.shape)

base = Image.open(SRC).convert('RGB')
img = np.asarray(base).astype(np.float32)

# ---- the flat logo (supersampled), narrowed for the face's foreshortening
mask = Image.open(f'{SP}/lockup-mask.png').convert('L')
lw, lh = int(round(W_LOGO * COS * S)), int(round(W_LOGO * S))
m = np.asarray(mask.resize((lw, lh), Image.LANCZOS)).astype(np.float32) / 255
P = 60 * S
M = np.zeros((lh + 2 * P, lw + 2 * P), np.float32); M[P:P + lh, P:P + lw] = m
cfx, cfy = M.shape[1] / 2, M.shape[0] / 2

# ---- relief: a recess with short, steep walls (crisp carving), lit from the upper right
H = blur(M, 1.6 * S)                       # wall softness ~1.6px
gy, gx = np.gradient(H)
k = 1.25 * S                               # wall steepness
nx, ny, nz = k * gx, k * gy, np.ones_like(H)
n = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
L = np.array([0.42, -0.50, 0.76]); L = L / np.linalg.norm(L)   # x right, y down: upper right
shade = (nx * L[0] + ny * L[1] + nz * L[2]) / n / L[2]
# the floor: a little darker, and the rim's shadow cast down-left onto it
sh = int(round(3.2 * S))
Ms = np.zeros_like(M); Ms[sh:, :-sh] = M[:-sh, sh:]       # M at (x + sh, y - sh): towards the light
cast = blur(np.clip(M - Ms, 0, 1) * M, 1.2 * S)
Mb = blur(M, 0.8 * S)
F = shade * (1 - 0.07 * Mb) * (1 - 0.22 * cast)

# ---- onto the face: affine (narrowed + sheared), in a local supersampled region
half_w = W_LOGO * COS / 2 + 70; half_h = W_LOGO / 2 + SLOPE * W_LOGO * COS / 2 + 70
RX, RY = int(CX - half_w), int(CY - half_h); RW, RH = int(2 * half_w), int(2 * half_h)
a, b, c = 1, 0, cfx + S * (RX - CX)
d, e, f = SLOPE, 1, cfy + S * (RY - CY) + S * SLOPE * (RX - CX)
Fi = Image.fromarray(F.astype(np.float32), 'F')
Fw = Fi.transform((RW * S, RH * S), Image.AFFINE, (a, b, c, d, e, f), resample=Image.BILINEAR, fillcolor=1.0)
Fw = np.asarray(Fw.resize((RW, RH), Image.BOX)).astype(np.float32)[:, :, None]

crop = img[RY:RY + RH, RX:RX + RW]
lit = np.where(Fw >= 1, crop + (255 - crop) * (Fw - 1) * 0.9, crop * Fw)   # light walls lift towards white, others darken
img[RY:RY + RH, RX:RX + RW] = np.clip(lit, 0, 255)
Image.fromarray(img.astype(np.uint8)).save(OUT, quality=92)
print('region', RX, RY, RW, RH, 'logo flat', W_LOGO, 'screen width', round(W_LOGO * COS))

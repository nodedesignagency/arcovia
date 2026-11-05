"""
Sets a transparent Cycles render on the flat charcoal ground and gives it a
fine monochrome film grain, as in the references. Writes a JPEG (and a WebP).

    python finish.py out/narrative.png ../../site/assets/services/narrative --size 1600
"""
import argparse

import numpy as np
from PIL import Image

CHARCOAL = (0x56, 0x56, 0x56)  # --color-charcoal


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst", help="output path without extension")
    ap.add_argument("--size", type=int, default=1600, help="output width; the height keeps the render's proportions")
    ap.add_argument("--grain", type=float, default=2.2, help="grain strength, in 8-bit levels")
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()

    im = Image.open(a.src)
    rgba = np.asarray(im).astype(np.float64)
    rgba /= 65535.0 if rgba.max() > 255 else 255.0
    rgb, alpha = rgba[..., :3], rgba[..., 3:4]
    ground = np.array(CHARCOAL, dtype=np.float64) / 255.0
    out = rgb * alpha + ground * (1.0 - alpha) if im.mode == "RGBA" or rgba.shape[2] == 4 else rgb

    rng = np.random.default_rng(a.seed)
    noise = rng.normal(0.0, a.grain / 255.0, out.shape[:2])[..., None]
    out = np.clip(out + noise, 0.0, 1.0)

    img = Image.fromarray((out * 255.0 + 0.5).astype(np.uint8), "RGB")
    if img.width != a.size:
        img = img.resize((a.size, round(a.size * img.height / img.width)), Image.LANCZOS)
    img.save(a.dst + ".jpg", quality=88, optimize=True, progressive=True)
    img.save(a.dst + ".webp", quality=86, method=6)


if __name__ == "__main__":
    main()

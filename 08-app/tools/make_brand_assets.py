#!/usr/bin/env python3
"""Prepare the supplied master logo for web use without recolouring the artwork."""
from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parent.parent / "app"
ASSETS = APP / "assets"
SOURCES = [
    Path("/data/user/0/com.foxdebug.acodefree/files/public/softlife/05-assets/slessets/SoftLifeCovers/main logo.png"),
    Path("/public/softlife/05-assets/slessets/SoftLifeCovers/main logo.png"),
]


def master_logo() -> Image.Image:
    for path in SOURCES:
        if path.exists():
            return Image.open(path).convert("RGBA")
    existing = ASSETS / "logo-softlife.png"
    if existing.exists():
        return Image.open(existing).convert("RGBA")
    raise SystemExit("Master logo not found")


def crop_content(img: Image.Image) -> Image.Image:
    alpha = np.asarray(img)[:, :, 3]
    ys, xs = np.where(alpha > 8)
    if not len(xs):
        raise SystemExit("Logo has no visible pixels")
    return img.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def pad(img: Image.Image, fraction: float = 0.055) -> Image.Image:
    w, h = img.size
    px = int(round(w * fraction))
    py = int(round(h * fraction))
    out = Image.new("RGBA", (w + px * 2, h + py * 2), (0, 0, 0, 0))
    out.alpha_composite(img, (px, py))
    return out


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    padded = pad(crop_content(master_logo()))
    for height, name in ((300, "logo-softlife.png"), (150, "logo-softlife-header.png")):
        scale = height / padded.height
        resized = padded.resize((max(1, round(padded.width * scale)), height), Image.LANCZOS)
        resized.save(ASSETS / name, optimize=True)
        print(f"{name}: {resized.size}, original colours preserved")
    for stale in ("logo-softlife-on-dark.png",):
        path = ASSETS / stale
        if path.exists():
            path.unlink()


if __name__ == "__main__":
    main()

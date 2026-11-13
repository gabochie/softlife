#!/usr/bin/env python3
"""Generate the Soft Life app icons (plum field, gold lotus glyph)."""
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "app" / "assets" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

PLUM = (43, 16, 85, 255)
ROYAL2 = (93, 33, 137, 255)
GOLD = (232, 185, 59, 255)
PINK = (240, 120, 168, 255)
CREAM = (251, 245, 240, 255)


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), PLUM)
    d = ImageDraw.Draw(img)
    s = size
    # gradient wash (royal → violet)
    for y in range(s):
        t = y / s
        d.line([(0, y), (s, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(PLUM, ROYAL2)))
    # gold ring
    r = int(s * 0.36)
    d.ellipse([s // 2 - r, s // 2 - r, s // 2 + r, s // 2 + r], outline=GOLD, width=max(2, s // 38))
    # lotus: five pink petals with gold center petal
    cx, cy = s // 2, int(s * 0.56)
    petal = int(s * 0.15)
    for dx in (-2, -1, 1, 2):
        px = cx + dx * petal * 0.85
        py = cy - abs(dx) * petal * 0.35
        d.ellipse([px - petal * 0.34, py - petal, px + petal * 0.34, py], fill=PINK)
    d.ellipse([cx - petal * 0.3, cy - petal, cx + petal * 0.3, cy], fill=GOLD)
    # water line
    wy = cy + int(petal * 0.55)
    d.line([(cx - petal * 1.9, wy), (cx + petal * 1.9, wy)], fill=CREAM, width=max(2, s // 55))
    return img


for size in (192, 512):
    draw_icon(size).save(OUT / f"icon-{size}.png")
    print(f"icon-{size}.png written")

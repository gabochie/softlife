#!/usr/bin/env python3
"""Generate blog cover images, Open Graph cards and favicon."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
OUT = APP / "assets" / "blog"
COVER_SRC = ROOT.parent / "05-assets" / "covers" / "01-soft-life-system" / "cover-soft-life-system-v1.png"
FONT_BOLD = "/usr/share/fonts/opensans/OpenSans-Bold.ttf"
FONT_SEMI = "/usr/share/fonts/opensans/OpenSans-SemiBold.ttf"
FONT_REG = "/usr/share/fonts/opensans/OpenSans-Regular.ttf"

CARDS = [
    ("og-default.png", "A business that works 15 hours a week.", "The Soft Life System"),
    ("og-15-hour-workweek.png", "The 15-Hour Workweek for Women Who Are Done Doing Everything", "Soft Life"),
    ("og-hustle-hangover-signs.png", "The Hustle Hangover: 7 Signs You Built a Job, Not a Business", "Strategy"),
    ("og-design-a-soft-life-week.png", "How to Design a Soft Life Week", "Systems · Free 90-day plan"),
    ("og-one-offer-premium-price.png", "One Offer, Premium Price", "Offer Design"),
    ("og-ai-agents-soft-life-business.png", "AI Agents Are Coming for Your Busywork", "AI & Systems"),
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        candidate = (line + " " + word).strip()
        if draw.textlength(candidate, font=fnt) <= max_width or not line:
            line = candidate
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def rounded_cover(size: tuple[int, int]) -> Image.Image:
    cover = Image.open(COVER_SRC).convert("RGB")
    cover.thumbnail((size[0] * 2, size[1] * 2), Image.LANCZOS)
    target_ratio = size[0] / size[1]
    width, height = cover.size
    if width / height > target_ratio:
        new_width = int(height * target_ratio)
        cover = cover.crop(((width - new_width) // 2, 0, (width + new_width) // 2, height))
    else:
        new_height = int(width / target_ratio)
        cover = cover.crop((0, (height - new_height) // 2, width, (height + new_height) // 2))
    cover = cover.resize(size, Image.LANCZOS)
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0], size[1]), radius=24, fill=255)
    result = Image.new("RGB", size, "#2b1055")
    result.paste(cover, (0, 0), mask)
    return result


def make_card(filename: str, title: str, kicker: str) -> None:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), "#2b1055")
    draw = ImageDraw.Draw(img)

    # Vertical-ish royal gradient with pink/gold light.
    for y in range(H):
        t = y / H
        r = int(43 + (93 - 43) * t)
        g = int(16 + (33 - 16) * t)
        b = int(85 + (137 - 85) * t)
        draw.line((0, y, W, y), fill=(r, g, b))

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-180, 320, 420, 920), fill=(240, 120, 168, 70))
    gd.ellipse((760, -250, 1320, 310), fill=(232, 185, 59, 60))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Cover art on the right.
    cover = rounded_cover((340, 510))
    img.paste(cover, (805, 60))
    draw.rounded_rectangle((805, 60, 1145, 570), radius=24, outline=(240, 120, 168, 180), width=2)

    # Left copy.
    draw.rectangle((80, 84, 150, 90), fill="#e8b93b")
    draw.text((80, 112), "THE SOFT LIFE JOURNAL", font=font(FONT_SEMI, 20), fill="#f9c9dc")

    title_font = font(FONT_BOLD, 52 if len(title) < 55 else 45)
    lines = wrap(draw, title, title_font, 680)
    y = 190
    for line in lines[:5]:
        draw.text((80, y), line, font=title_font, fill="#ffffff")
        y += int(title_font.size * 1.16)

    draw.text((80, 520), kicker.upper(), font=font(FONT_SEMI, 20), fill="#e8b93b")
    draw.text((80, 558), "soft.gabochie.com", font=font(FONT_REG, 21), fill="#d8c8ef")

    OUT.mkdir(parents=True, exist_ok=True)
    img.save(OUT / filename, "PNG", optimize=True)
    print("wrote", OUT / filename)


def build_cover() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    cover = Image.open(COVER_SRC).convert("RGB")
    cover.thumbnail((900, 1350), Image.LANCZOS)
    cover.save(OUT / "soft-life-cover.jpg", "JPEG", quality=84, optimize=True)
    print("wrote", OUT / "soft-life-cover.jpg")


def build_favicon() -> None:
    icon = Image.open(APP / "assets" / "icons" / "icon-192.png").convert("RGBA")
    icon.save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("wrote", APP / "favicon.ico")


if __name__ == "__main__":
    build_cover()
    for filename, title, kicker in CARDS:
        make_card(filename, title, kicker)
    build_favicon()

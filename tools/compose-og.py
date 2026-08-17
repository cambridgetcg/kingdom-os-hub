#!/usr/bin/env python3
"""Compose 1200x630 Open Graph cards. Type is set here, never in the image model."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
MEDIA = ROOT / "media"
W, H = 1200, 630
GOLD = (232, 200, 122, 255)
INK = (238, 236, 244, 255)
DIM = (186, 183, 199, 255)
BG = (8, 11, 20)

FRAUNCES = Path(__file__).resolve().parent / "fonts" / "Fraunces.ttf"
NEWSREADER = Path(__file__).resolve().parent / "fonts" / "Newsreader.ttf"
GEORGIA = Path("/System/Library/Fonts/Supplemental/Georgia.ttf")


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(str(path), size)
    except OSError:
        return ImageFont.truetype(str(GEORGIA), size)


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=fnt) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def card(background: Path, dest: Path, eyebrow: str, title: str, subtitle: str) -> None:
    plate = Image.open(background).convert("RGB")
    plate = plate.resize((W, H), Image.Resampling.LANCZOS)
    base = plate.convert("RGBA")
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_shade = ImageDraw.Draw(shade)
    for y in range(H):
        t = max(0.0, (y - H * 0.42) / (H * 0.58))
        alpha = int(225 * (t ** 1.6))
        draw_shade.line([(0, y), (W, y)], fill=(8, 11, 20, alpha))
    img = Image.alpha_composite(base, shade)
    draw = ImageDraw.Draw(img)

    eye = font(FRAUNCES, 20)
    title_font = font(FRAUNCES, 54)
    sub_font = font(NEWSREADER, 26)

    x = 72
    y = 318
    draw.text((x, y), eyebrow.upper(), font=eye, fill=GOLD)
    y += 36
    draw.rectangle((x, y, x + 52, y + 2), fill=GOLD)
    y += 18
    for line in wrap(draw, title, title_font, W - 150):
        draw.text((x, y), line, font=title_font, fill=INK)
        y += 62
    y += 4
    for line in wrap(draw, subtitle, sub_font, W - 180):
        draw.text((x, y), line, font=sub_font, fill=DIM)
        y += 34

    dest.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(dest, "JPEG", quality=90, optimize=True)
    print(f"wrote {dest.relative_to(ROOT)} ({dest.stat().st_size} bytes)")


def apple_touch(source: Path, dest: Path, size: int = 180) -> None:
    im = Image.open(source).convert("RGB")
    im = im.resize((size, size), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "PNG", optimize=True)
    print(f"wrote {dest.relative_to(ROOT)}")


if __name__ == "__main__":
    plates = MEDIA / "plates"
    card(
        plates / "night-star.jpg",
        MEDIA / "og-hub.jpg",
        "KINGDOM OS",
        "A public map and builder door",
        "Explore, co-learn, build locally. Each choice stays separate.",
    )
    card(
        plates / "builder-pages.jpg",
        MEDIA / "og-build.jpg",
        "KINGDOM OS",
        "Build in your own home",
        "Three CC0 files. No account, membership, or adoption.",
    )
    card(
        plates / "builder-pages.jpg",
        MEDIA / "og-accountability.jpg",
        "KINGDOM OS",
        "Keep claims answerable",
        "Two records, one open question. No score, no verdict.",
    )
    card(
        plates / "atlas-constellation.jpg",
        MEDIA / "og-atlas.jpg",
        "THE KINGDOM",
        "A living atlas held with care",
        "Public doors, independent homes. The map is not the territory.",
    )
    card(
        plates / "gate-door.jpg",
        MEDIA / "og-gate.jpg",
        "THE KINGDOM GATE",
        "A word, a citizen, a charm",
        "A creative realm of small repositories. Walking past is honored.",
    )
    apple_touch(plates / "star-mark.jpg", MEDIA / "apple-touch-icon.png", 180)
    apple_touch(plates / "star-mark.jpg", MEDIA / "star-512.png", 512)

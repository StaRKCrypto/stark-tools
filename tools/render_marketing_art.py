#!/usr/bin/env python3
"""Render StaRK Bots marketing art with real fonts (no AI letter-gap)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "docs"
ASSETS = ROOT / "assets"
BG = Path(__file__).resolve().parent / "hero-bg-notext.png"
SECTION_BG = Path(__file__).resolve().parent / "section-bg-notext.png"

CYAN = (61, 231, 255)
VIOLET = (139, 108, 255)
GREEN = (45, 212, 168)
GOLD = (240, 180, 41)
TEXT = (228, 235, 245)
MUTE = (135, 151, 175)
PANEL = (13, 19, 27, 230)
PANEL2 = (17, 24, 34, 236)
LINE = (27, 38, 54)
BG_DARK = (6, 9, 14)

FONT_DIR = Path("/usr/share/fonts/truetype/macos")
MONO = Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf")
MONO_B = Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf")


def save_pair(img: Image.Image, stem: str) -> None:
    rgb = img.convert("RGB")
    rgb.save(ASSETS / f"{stem}.png", "PNG", optimize=True)
    rgb.save(ASSETS / f"{stem}.jpg", "JPEG", quality=92, optimize=True, progressive=True)
    print("wrote", stem)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_DIR / name), size)


def mono(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(MONO_B if bold else MONO), size)


def center_x(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, w: int) -> float:
    bb = draw.textbbox((0, 0), text, font=f)
    return (w - (bb[2] - bb[0])) / 2


def rounded(draw: ImageDraw.ImageDraw, box, r, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def make_hero() -> None:
    W, H = 1920, 1080
    bg = Image.open(BG).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Soft vignette so type stays readable without hiding the terminal floor.
    for i in range(24):
        a = int(18 + i * 4)
        d.rectangle([0, 0, W, int(H * (0.12 + i * 0.012))], fill=(5, 8, 14, a))
    d.rectangle([0, 0, W, H], fill=(5, 8, 14, 70))

    # Center-left readability panel
    d.rectangle([0, 210, 1280, 780], fill=(6, 10, 16, 55))

    img = Image.alpha_composite(bg.convert("RGBA"), overlay)
    d = ImageDraw.Draw(img)

    logo = Image.open(ASSETS / "BOTS-logo-nav.png").convert("RGBA")
    logo = logo.resize((72, 72), Image.Resampling.LANCZOS)
    img.paste(logo, (120, 92), logo)

    kicker_f = font("Inter-SemiBold.ttf", 22)
    d.text((214, 112), "STARKCRYPTO  ·  TRADING DESKS", font=kicker_f, fill=CYAN)

    word = "StaRK Bots"
    wf = font("Inter-Bold.ttf", 132)
    # One-shot draw keeps Inter kerning: A–R stay tight (never "STA RK").
    d.text((120, 330), word, font=wf, fill=TEXT)

    # Accent bar under the wordmark
    d.rounded_rectangle([124, 492, 268, 500], radius=4, fill=CYAN)
    d.rounded_rectangle([276, 492, 420, 500], radius=4, fill=VIOLET)

    tag_f = font("Inter-Medium.ttf", 36)
    d.text((124, 528), "Tools you can inspect. Access you hold.", font=tag_f, fill=(176, 190, 210))

    sub_f = font("Inter-Regular.ttf", 24)
    d.text(
        (124, 590),
        "Open at launch  ·  premium later ~0.5% hold  ·  live keys stay private",
        font=sub_f,
        fill=MUTE,
    )

    foot = font("Inter-Medium.ttf", 22)
    d.text(
        (124, 980),
        "x.com/StaRKCryptoBots    github.com/StaRKCrypto    youtube.com/@starksystems-y2r",
        font=foot,
        fill=(120, 136, 160),
    )

    out_png = ASSETS / "01-hero.png"
    out_jpg = ASSETS / "01-hero.jpg"
    rgb = img.convert("RGB")
    rgb.save(out_png, "PNG", optimize=True)
    rgb.save(out_jpg, "JPEG", quality=92, optimize=True, progressive=True)
    print("wrote", out_png, rgb.size)


def section_canvas(size=(1920, 1080)) -> Image.Image:
    """Black fintech floor matching the live 01-hero.jpg (bokeh candles, empty center)."""
    W, H = size
    bg = Image.open(SECTION_BG).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    # Darken the middle so type/cards stay crisp.
    veil = Image.new("RGBA", (W, H), (0, 0, 0, 70))
    return Image.alpha_composite(bg.convert("RGBA"), veil)


def glass_card(img: Image.Image, box, radius: int, glow: tuple[int, int, int]) -> None:
    x0, y0, x1, y1 = box
    glow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    pad = 22
    gd.rounded_rectangle([x0 - pad, y0 - pad, x1 + pad, y1 + pad], radius=radius + 10, fill=(*glow, 55))
    img.alpha_composite(glow_layer.filter(ImageFilter.GaussianBlur(18)))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(box, radius=radius, fill=(6, 8, 12, 210), outline=(*glow, 210), width=2)


def make_how() -> None:
    W, H = 1920, 1080
    img = section_canvas((W, H))
    d = ImageDraw.Draw(img)
    title = "How it works"
    tf = font("Inter-Bold.ttf", 72)
    d.text((center_x(d, title, tf, W), 88), title, font=tf, fill=TEXT)
    sub = "Public proof first. Desks open at launch. Keys never on GitHub."
    sf = font("Inter-Regular.ttf", 28)
    d.text((center_x(d, sub, sf, W), 178), sub, font=sf, fill=MUTE)

    cards = [
        (CYAN, "01", "Public teasers", "Inspect sample repos.\nNo live wallets.\nNo signing keys in the open."),
        (VIOLET, "02", "Paper demos", "Each desk on X —\nscan, arm, paper fill.\nLabeled demo, not live."),
        ((180, 140, 255), "03", "Open first", "Open at launch.\nNo day-one hold wall.\nPremium later ~0.5%."),
    ]
    x0, y0, cw, ch, gap = 150, 280, 520, 560, 30
    for i, (glow, n, h, body) in enumerate(cards):
        x = x0 + i * (cw + gap)
        glass_card(img, [x, y0, x + cw, y0 + ch], 36, glow)
        d = ImageDraw.Draw(img)
        d.text((x + 44, y0 + 48), n, font=font("Inter-Bold.ttf", 56), fill=glow)
        d.text((x + 44, y0 + 140), h, font=font("Inter-SemiBold.ttf", 36), fill=TEXT)
        d.multiline_text((x + 44, y0 + 220), body, font=font("Inter-Regular.ttf", 26), fill=MUTE, spacing=12)

    foot = "StaRK Bots  ·  Code first. Coin last. NFA."
    ff = font("Inter-Medium.ttf", 22)
    d.text((center_x(d, foot, ff, W), 1008), foot, font=ff, fill=(120, 136, 160))
    save_pair(img, "02-how")


def make_stack() -> None:
    W, H = 1920, 1080
    img = section_canvas((W, H))
    d = ImageDraw.Draw(img)
    d.text((120, 72), "The stack", font=font("Inter-Bold.ttf", 64), fill=TEXT)
    d.text((120, 156), "First wave — public teasers + paper demos. More shipping.", font=font("Inter-Regular.ttf", 26), fill=MUTE)
    brand = "StaRK Bots"
    bf = font("Inter-SemiBold.ttf", 28)
    d.text((W - 120 - d.textbbox((0, 0), brand, font=bf)[2], 80), brand, font=bf, fill=TEXT)

    desks = [
        ("01", "S/R Desk", "Zones → paper trade"),
        ("02", "Arcus", "Auto S/R + kill switch"),
        ("03", "Lighter", "Ladder + MM-style desk"),
        ("04", "Nado Farm", "Venue farm + sim PnL"),
        ("05", "Mint Scout", "Arm → alert → paper"),
        ("06", "Portfolio", "Bags, marks, demo PnL"),
        ("07", "Nimbus", "Weather markets paper"),
        ("08", "Take Profits", "2× ladder watchers"),
        ("09", "Bound DD", "Token checklist / score"),
        ("10", "Monk Pair", "BTC vs ETH RS signal"),
        ("11", "Farmer", "Volume-farm notes"),
        ("12", "Weather bot", "Weather agent sample"),
    ]
    cols = 4
    x0, y0, cw, ch, gx, gy = 120, 230, 420, 220, 20, 18
    glows = [CYAN, VIOLET, CYAN, VIOLET]
    for i, (n, name, blurb) in enumerate(desks):
        c, r = i % cols, i // cols
        x = x0 + c * (cw + gx)
        y = y0 + r * (ch + gy)
        glass_card(img, [x, y, x + cw, y + ch], 24, glows[c])
        d = ImageDraw.Draw(img)
        d.text((x + 28, y + 28), n, font=font("Inter-Medium.ttf", 18), fill=CYAN)
        d.text((x + 28, y + 70), name, font=font("Inter-SemiBold.ttf", 30), fill=TEXT)
        d.text((x + 28, y + 128), blurb, font=font("Inter-Regular.ttf", 22), fill=MUTE)

    foot = "11+ desk teasers  ·  sample source public"
    ff = font("Inter-Medium.ttf", 22)
    d.text((center_x(d, foot, ff, W), 1010), foot, font=ff, fill=(120, 136, 160))
    save_pair(img, "03-stack")


def make_access() -> None:
    W, H = 1920, 1080
    img = section_canvas((W, H))
    d = ImageDraw.Draw(img)
    title = "Access"
    tf = font("Inter-Bold.ttf", 80)
    d.text((center_x(d, title, tf, W), 80), title, font=tf, fill=TEXT)
    sub = "Open at launch. Premium later. Not a promise."
    sf = font("Inter-Regular.ttf", 28)
    d.text((center_x(d, sub, sf, W), 180), sub, font=sf, fill=MUTE)

    glass_card(img, [160, 280, 920, 620], 36, CYAN)
    glass_card(img, [1000, 280, 1760, 620], 36, VIOLET)
    d = ImageDraw.Draw(img)
    d.text((210, 340), "Open at launch", font=font("Inter-SemiBold.ttf", 40), fill=TEXT)
    d.text((210, 420), "Desks are open day one.", font=font("Inter-Regular.ttf", 28), fill=MUTE)
    d.text((210, 470), "No hold wall at launch.", font=font("Inter-Regular.ttf", 28), fill=CYAN)
    d.text((1050, 340), "Premium later", font=font("Inter-SemiBold.ttf", 40), fill=TEXT)
    d.text((1050, 420), "Hosted extras may later need", font=font("Inter-Regular.ttf", 28), fill=MUTE)
    d.text((1050, 470), "~0.5% hold. Access pass, not APR.", font=font("Inter-Regular.ttf", 28), fill=VIOLET)

    glass_card(img, [160, 680, 920, 900], 28, CYAN)
    glass_card(img, [1000, 680, 1760, 900], 28, VIOLET)
    d = ImageDraw.Draw(img)
    d.text((210, 730), "Code teasers stay public", font=font("Inter-SemiBold.ttf", 28), fill=TEXT)
    d.text((210, 790), "Inspect the idea on GitHub.", font=font("Inter-Regular.ttf", 24), fill=MUTE)
    d.text((1050, 730), "Live keys stay private", font=font("Inter-SemiBold.ttf", 28), fill=TEXT)
    d.text((1050, 790), "Never in repos, previews, or chats.", font=font("Inter-Regular.ttf", 24), fill=MUTE)

    foot = "NFA  ·  Paper demos ≠ live trading  ·  No 10x claims"
    ff = font("Inter-Medium.ttf", 22)
    d.text((center_x(d, foot, ff, W), 1008), foot, font=ff, fill=(120, 136, 160))
    save_pair(img, "04-access")


if __name__ == "__main__":
    # Do not regenerate 01-hero — live jpg wordmark is already correct.
    make_how()
    make_stack()
    make_access()

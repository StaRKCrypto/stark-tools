#!/usr/bin/env python3
"""Render StaRK Bots marketing art with real fonts (no AI letter-gap)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "docs"
ASSETS = ROOT / "assets"
BG = Path(__file__).resolve().parent / "hero-bg-notext.png"

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


def card_bg(size=(1920, 1080)) -> Image.Image:
    W, H = size
    img = Image.new("RGB", (W, H), BG_DARK)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse((-400, -280, 720, 520), fill=(61, 231, 255, 28))
    d.ellipse((1280, -200, 2200, 620), fill=(139, 108, 255, 32))
    d.ellipse((400, 760, 1600, 1400), fill=(45, 212, 168, 18))
    # faint grid
    for x in range(0, W, 48):
        d.line([(x, 0), (x, H)], fill=(27, 38, 54, 90), width=1)
    for y in range(0, H, 48):
        d.line([(0, y), (W, y)], fill=(27, 38, 54, 90), width=1)
    return img.filter(ImageFilter.GaussianBlur(0.4))


def make_how() -> None:
    W, H = 1920, 1080
    img = card_bg((W, H)).convert("RGBA")
    d = ImageDraw.Draw(img)
    title = font("Inter-Bold.ttf", 64)
    d.text((120, 72), "How it works", font=title, fill=TEXT)
    sub = font("Inter-Regular.ttf", 28)
    d.text((120, 160), "One pipeline. Public proof first. Keys never on GitHub.", font=sub, fill=MUTE)

    cards = [
        ("01", "VERIFY", "Public teasers", "Clean sample repos.\nInspect the craft.\nNo live wallets or\nsigning keys in the open."),
        ("02", "WATCH", "Paper demos", "Each desk shown on X —\nscan, arm, paper fill.\nClearly labeled demo.\nNot live trading."),
        ("03", "ACCESS", "Open first", "Desks open at launch.\nNo day-one hold wall.\nLater premium may need\n~0.5% hold."),
    ]
    x0, y0, cw, ch, gap = 120, 250, 540, 640, 40
    for i, (n, kicker, h, body) in enumerate(cards):
        x = x0 + i * (cw + gap)
        rounded(d, [x, y0, x + cw, y0 + ch], 28, fill=PANEL, outline=LINE, width=2)
        nf = mono(22, bold=True)
        d.text((x + 36, y0 + 36), f"{n}  /  {kicker}", font=nf, fill=CYAN)
        hf = font("Inter-Bold.ttf", 40)
        d.text((x + 36, y0 + 96), h, font=hf, fill=TEXT)
        d.rounded_rectangle([x + 36, y0 + 160, x + 140, y0 + 166], radius=3, fill=VIOLET if i == 2 else CYAN)
        bf = font("Inter-Regular.ttf", 28)
        d.multiline_text((x + 36, y0 + 200), body, font=bf, fill=MUTE, spacing=10)
        if i < 2:
            ax = x + cw + 4
            d.polygon([(ax, y0 + ch / 2 - 12), (ax + 22, y0 + ch / 2), (ax, y0 + ch / 2 + 12)], fill=CYAN)

    foot = font("Inter-Medium.ttf", 22)
    d.text((120, 980), "StaRK Bots  ·  Code first. Coin last. NFA.", font=foot, fill=(120, 136, 160))
    img.convert("RGB").save(ASSETS / "02-how.png", "PNG", optimize=True)
    print("wrote 02-how.png")


def make_stack() -> None:
    W, H = 1920, 1080
    img = card_bg((W, H)).convert("RGBA")
    d = ImageDraw.Draw(img)
    d.text((120, 64), "The stack", font=font("Inter-Bold.ttf", 64), fill=TEXT)
    d.text((120, 148), "First wave of desks — public teasers + paper demos. More shipping.", font=font("Inter-Regular.ttf", 26), fill=MUTE)

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
    cols, rows = 4, 3
    x0, y0, cw, ch, gx, gy = 120, 230, 420, 220, 20, 20
    for i, (n, name, blurb) in enumerate(desks):
        c, r = i % cols, i // cols
        x = x0 + c * (cw + gx)
        y = y0 + r * (ch + gy)
        rounded(d, [x, y, x + cw, y + ch], 22, fill=PANEL2, outline=LINE, width=2)
        d.text((x + 28, y + 28), n, font=mono(18, bold=True), fill=CYAN)
        d.text((x + 28, y + 70), name, font=font("Inter-SemiBold.ttf", 30), fill=TEXT)
        d.text((x + 28, y + 128), blurb, font=font("Inter-Regular.ttf", 22), fill=MUTE)

    d.text((120, 1008), "StaRK Bots  ·  11+ desk teasers  ·  sample source public", font=font("Inter-Medium.ttf", 22), fill=(120, 136, 160))
    img.convert("RGB").save(ASSETS / "03-stack.png", "PNG", optimize=True)
    print("wrote 03-stack.png")


def make_access() -> None:
    W, H = 1920, 1080
    img = card_bg((W, H)).convert("RGBA")
    d = ImageDraw.Draw(img)
    d.text((120, 72), "Access pass — not a promise", font=font("Inter-Bold.ttf", 58), fill=TEXT)
    d.text((120, 160), "Open desks on day one. Premium is later — not a launch wall.", font=font("Inter-Regular.ttf", 28), fill=MUTE)

    rows = [
        (GREEN, "Open at launch", "Everyone can use desks when we ship. No day-one hold gate."),
        (GOLD, "Premium later ~0.5%", "Hosted convenience may later need a small hold. Coin is an access pass."),
        (CYAN, "Code teasers stay public", "Inspect the idea on GitHub. Craft is visible. Samples stay readable."),
        (VIOLET, "Live keys stay private", "Signing keys never go in public repos, previews, or chats."),
    ]
    y = 250
    for color, title, body in rows:
        rounded(d, [120, y, 1800, y + 150], 22, fill=PANEL, outline=LINE, width=2)
        d.ellipse([156, y + 54, 188, y + 86], fill=color)
        d.text((220, y + 32), title, font=font("Inter-SemiBold.ttf", 32), fill=TEXT)
        d.text((220, y + 82), body, font=font("Inter-Regular.ttf", 24), fill=MUTE)
        y += 170

    d.text((120, 1000), "NFA  ·  Paper demos ≠ live trading  ·  No APR / 10x claims", font=font("Inter-Medium.ttf", 22), fill=(120, 136, 160))
    img.convert("RGB").save(ASSETS / "04-access.png", "PNG", optimize=True)
    print("wrote 04-access.png")


if __name__ == "__main__":
    make_hero()
    make_how()
    make_stack()
    make_access()

#!/usr/bin/env python3
"""Key magenta, normalize sprites, pixelate rooms, draw UI icons."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    "/home/espen/.grok/sessions/%2Fhome%2Fespen%2Fprosjekter%2FChaos%20in%20Kalanthia"
    "/01a00eee-2bff-7cd1-ba3e-a347628e86d4/images"
)
OUT = ROOT / "web" / "assets"
ROOM_SIZE = (640, 360)
# True VGA-ish pixel height, then nearest-upscaled so the engine draws fat pixels.
PIXEL_H = 50
PIXEL_SCALE = 4
SPRITE_H = PIXEL_H * PIXEL_SCALE
ITEM_SIZE = (48, 48)
ICON_SIZE = 32


def key_magenta(im: Image.Image) -> Image.Image:
    src = im.convert("RGBA")
    px = src.load()
    w, h = src.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # Magenta key plus JPEG pink/grey fringe — drop it, do not keep a ghost box.
            magenta = r > 150 and b > 150 and g < 130 and (r + b) > g * 2.1
            pink_fringe = r > 120 and b > 120 and abs(r - b) < 40 and g < 160
            if magenta or pink_fringe or a < 30:
                px[x, y] = (0, 0, 0, 0)
    return src


def bbox_opaque(im: Image.Image, pad: int = 2) -> tuple[int, int, int, int]:
    alpha = im.split()[-1]
    box = alpha.getbbox()
    if not box:
        return (0, 0, im.width, im.height)
    x0, y0, x1, y1 = box
    return (
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(im.width, x1 + pad),
        min(im.height, y1 + pad),
    )


def posterize_rgba(im: Image.Image, bits: int = 4) -> Image.Image:
    """Flatten color so the sprite reads as a limited VGA palette."""
    out = im.copy()
    px = out.load()
    w, h = out.size
    shift = 8 - bits
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 80:
                px[x, y] = (0, 0, 0, 0)
                continue
            px[x, y] = (
                (r >> shift) << shift,
                (g >> shift) << shift,
                (b >> shift) << shift,
                255,
            )
    return out


def normalize_sprite(im: Image.Image, height: int = SPRITE_H) -> Image.Image:
    keyed = key_magenta(im)
    box = bbox_opaque(keyed)
    cropped = keyed.crop(box)
    tiny_w = max(1, int(round(cropped.width * PIXEL_H / cropped.height)))
    tiny = cropped.resize((tiny_w, PIXEL_H), Image.Resampling.BOX)
    tiny = posterize_rgba(tiny, bits=4)
    big = tiny.resize((tiny_w * PIXEL_SCALE, PIXEL_H * PIXEL_SCALE), Image.Resampling.NEAREST)
    canvas_w = max(big.width + 8, int(height * 0.72))
    canvas = Image.new("RGBA", (canvas_w, height), (0, 0, 0, 0))
    canvas.paste(big, ((canvas_w - big.width) // 2, height - big.height), big)
    return canvas


def flip_h(im: Image.Image) -> Image.Image:
    return im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)


def pixelate_room(im: Image.Image) -> Image.Image:
    wide = im.convert("RGB").resize(ROOM_SIZE, Image.Resampling.LANCZOS)
    # Soft VGA crunch so the two rooms sit in the same resolution family.
    small = wide.resize((320, 180), Image.Resampling.LANCZOS)
    return small.resize(ROOM_SIZE, Image.Resampling.NEAREST)


def key_item(im: Image.Image) -> Image.Image:
    keyed = key_magenta(im)
    box = bbox_opaque(keyed, pad=4)
    cropped = keyed.crop(box)
    cropped.thumbnail((ITEM_SIZE[0] - 4, ITEM_SIZE[1] - 4), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", ITEM_SIZE, (0, 0, 0, 0))
    x = (ITEM_SIZE[0] - cropped.width) // 2
    y = (ITEM_SIZE[1] - cropped.height) // 2
    canvas.paste(cropped, (x, y), cropped)
    return canvas


def draw_icon(kind: str) -> Image.Image:
    im = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    amber = (232, 162, 58, 255)
    light = (248, 220, 160, 255)
    ink = (28, 18, 12, 255)
    cyan = (58, 212, 212, 255)

    if kind == "walk":
        # Two footprints.
        for ox, oy in ((6, 8), (16, 14)):
            d.ellipse((ox, oy, ox + 8, oy + 12), fill=amber, outline=ink)
            d.ellipse((ox + 2, oy - 4, ox + 6, oy + 1), fill=amber, outline=ink)
    elif kind == "look":
        d.ellipse((4, 10, 28, 22), outline=ink, fill=light, width=2)
        d.ellipse((12, 11, 20, 21), fill=cyan, outline=ink)
        d.ellipse((15, 13, 18, 16), fill=ink)
    elif kind == "use":
        # Open hand.
        d.rounded_rectangle((10, 14, 24, 28), radius=4, fill=amber, outline=ink)
        for x in (10, 14, 18, 22):
            d.rectangle((x, 6, x + 3, 16), fill=amber, outline=ink)
    elif kind == "pickup":
        d.rounded_rectangle((4, 16, 16, 28), radius=3, fill=amber, outline=ink)
        d.rectangle((7, 8, 10, 18), fill=amber, outline=ink)
        d.rectangle((11, 6, 14, 18), fill=amber, outline=ink)
        d.rectangle((15, 9, 18, 18), fill=amber, outline=ink)
        d.ellipse((18, 12, 28, 22), fill=light, outline=ink)
    elif kind == "talk":
        d.rounded_rectangle((5, 6, 26, 20), radius=4, fill=light, outline=ink)
        d.polygon([(10, 19), (8, 27), (16, 19)], fill=light, outline=ink)
        d.line((10, 11, 21, 11), fill=ink, width=2)
        d.line((10, 15, 18, 15), fill=ink, width=2)
    elif kind == "inv":
        d.rounded_rectangle((7, 10, 25, 27), radius=3, fill=amber, outline=ink)
        d.arc((11, 5, 21, 16), 180, 0, fill=ink, width=2)
    return im


def draw_cursor(kind: str) -> Image.Image:
    im = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    amber = (232, 162, 58, 255)
    ink = (20, 12, 8, 255)
    if kind == "walk":
        d.line((4, 12, 20, 12), fill=amber, width=2)
        d.line((12, 4, 12, 20), fill=amber, width=2)
        d.ellipse((9, 9, 15, 15), outline=ink, fill=amber)
    elif kind == "look":
        d.ellipse((3, 7, 21, 17), outline=ink, fill=amber)
        d.ellipse((9, 8, 15, 16), fill=ink)
    elif kind == "use":
        d.polygon([(3, 3), (8, 21), (11, 14), (21, 17)], fill=amber, outline=ink)
    elif kind == "pickup":
        d.polygon([(3, 20), (8, 6), (12, 12), (20, 8)], fill=amber, outline=ink)
    elif kind == "talk":
        d.rounded_rectangle((2, 3, 18, 14), radius=3, fill=amber, outline=ink)
        d.polygon([(6, 13), (4, 21), (11, 13)], fill=amber, outline=ink)
    elif kind == "wait":
        d.polygon([(6, 3), (18, 3), (12, 12), (18, 21), (6, 21), (12, 12)], fill=amber, outline=ink)
    return im


def save(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)
    print(f"  {path.relative_to(ROOT)}  {im.size[0]}x{im.size[1]}")


def main() -> None:
    import sys

    sprites_only = "--sprites" in sys.argv
    if not sprites_only:
        print("Rooms")
        save(pixelate_room(Image.open(SRC / "2.jpg")), OUT / "rooms" / "base-exterior.png")
        save(pixelate_room(Image.open(SRC / "7.jpg")), OUT / "rooms" / "base-interior.png")
        zero_src = OUT / "_src" / "zero-street.jpg"
        if zero_src.exists():
            save(pixelate_room(Image.open(zero_src)), OUT / "rooms" / "zero-street.png")

    print("Sprites")
    src_dir = OUT / "_src"
    mapping = {
        "russell-down": "russell-down.jpg",
        "russell-up": "russell-up.jpg",
        "russell-right": "russell-right.jpg",
        "russell-down-walk": "russell-down-walk.jpg",
        "russell-up-walk": "russell-up-walk.jpg",
        "russell-right-walk": "russell-right-walk.jpg",
        "russell-emerge": "russell-emerge.jpg",
    }
    sprites = {name: normalize_sprite(Image.open(src_dir / src)) for name, src in mapping.items()}
    for name, im in sprites.items():
        save(im, OUT / "sprites" / f"{name}.png")
    save(flip_h(sprites["russell-right"]), OUT / "sprites" / "russell-left.png")
    save(flip_h(sprites["russell-right-walk"]), OUT / "sprites" / "russell-left-walk.png")

    if not sprites_only:
        print("Items")
        save(key_item(Image.open(SRC / "1.jpg")), OUT / "items" / "crowbar.png")
        save(key_item(Image.open(SRC / "4.jpg")), OUT / "items" / "dataslug.png")

        print("UI")
        for kind in ("walk", "look", "use", "pickup", "talk", "inv"):
            save(draw_icon(kind), OUT / "ui" / f"icon-{kind}.png")
            save(draw_cursor(kind), OUT / "ui" / f"cursor-{kind}.png")
        save(draw_cursor("wait"), OUT / "ui" / "cursor-wait.png")
    print("done")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Frog PFP Pixel Art Generator
Generates 100 unique animated pixel frog GIFs with rarity system.
Deterministic: seed=42 for reproducibility.
"""

import json
import os
import random
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Installing Pillow...")
    os.system("pip install Pillow")
    from PIL import Image, ImageDraw

# ─── CONFIG ───
SEED = 42
SIZE = 48
TOTAL = 100
FRAMES = 4
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "frogs"

# Rarity distribution
RARITY_TIERS = [
    ("common", 40),
    ("uncommon", 25),
    ("rare", 15),
    ("epic", 10),
    ("legendary", 8),
    ("mythic", 2),
]

# Color palettes per rarity
PALETTES = {
    "common": {
        "body": ["#1a5c1a", "#2d8c2d", "#1f6b1f"],
        "belly": "#39FF14",
        "eyes": "#ffffff",
        "pupil": "#000000",
        "bg": ["#0a0a0a", "#0d0d0d"],
    },
    "uncommon": {
        "body": ["#1a7a1a", "#3aad3a", "#2d9c2d"],
        "belly": "#44ff44",
        "eyes": "#ffffff",
        "pupil": "#111111",
        "bg": ["#0d1a0d", "#0a150a"],
    },
    "rare": {
        "body": ["#1a6baa", "#2d8ccc", "#3a9ddd"],
        "belly": "#66ccff",
        "eyes": "#ffffff",
        "pupil": "#000033",
        "bg": ["#0a0d1a", "#0d1020"],
    },
    "epic": {
        "body": ["#6b1aaa", "#8c2dcc", "#9d3add"],
        "belly": "#cc66ff",
        "eyes": "#ffcc00",
        "pupil": "#330033",
        "bg": ["#1a0a1a", "#150d15"],
    },
    "legendary": {
        "body": ["#cc8800", "#ddaa00", "#ffcc00"],
        "belly": "#ffee88",
        "eyes": "#ff4444",
        "pupil": "#330000",
        "bg": ["#1a1500", "#201a00"],
    },
    "mythic": {
        "body": ["#ff3333", "#ff5555", "#ff6666"],
        "belly": "#ffaaaa",
        "eyes": "#ffffff",
        "pupil": "#ff0000",
        "bg": ["#1a0505", "#200808"],
    },
}

# Accessories by rarity
ACCESSORIES = {
    "common": ["none"],
    "uncommon": ["none", "spots", "stripe"],
    "rare": ["spots", "stripe", "crown_small"],
    "epic": ["crown", "halo", "sunglasses"],
    "legendary": ["crown", "halo", "wings", "aura"],
    "mythic": ["crown_gold", "halo_fire", "wings", "aura_fire", "third_eye"],
}

# Eye styles
EYE_STYLES = ["round", "wide", "sleepy", "angry", "cute"]

# Mouth styles
MOUTH_STYLES = ["smile", "neutral", "open", "frog", "tiny"]


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def assign_rarities(rng):
    """Assign rarity to each token based on distribution."""
    rarities = []
    for name, pct in RARITY_TIERS:
        count = round(TOTAL * pct / 100)
        rarities.extend([name] * count)
    # Pad or trim to exactly TOTAL
    while len(rarities) < TOTAL:
        rarities.append("common")
    rarities = rarities[:TOTAL]
    rng.shuffle(rarities)
    return rarities


def draw_frog_body(draw, palette, frame_offset=0):
    """Draw the main frog body (ellipse)."""
    body_colors = [hex_to_rgb(c) for c in palette["body"]]
    belly = hex_to_rgb(palette["belly"])

    # Body ellipse centered at (24, 26)
    cx, cy = 24, 26
    rx, ry = 16, 14
    for y in range(max(0, cy - ry - 2), min(SIZE, cy + ry + 2)):
        for x in range(max(0, cx - rx - 2), min(SIZE, cx + rx + 2)):
            dx = (x - cx) / rx
            dy = (y - cy) / ry
            if dx * dx + dy * dy < 1.0:
                # Body color with variation
                idx = (x * 7 + y * 13 + frame_offset) % len(body_colors)
                color = body_colors[idx]
                # Belly area (lower center)
                bx = (x - cx) / 10
                by = (y - (cy + 4)) / 8
                if bx * bx + by * by < 0.8 and y > cy:
                    color = belly
                draw.point((x, y), fill=color)


def draw_frog_eyes(draw, palette, style="round", frame=0):
    """Draw frog eyes."""
    eye_color = hex_to_rgb(palette["eyes"])
    pupil_color = hex_to_rgb(palette["pupil"])

    positions = [(16, 18), (31, 18)]
    pupil_offset = 0
    if frame % 2 == 1:
        pupil_offset = 1  # Slight animation

    for ex, ey in positions:
        if style == "round":
            r = 4
        elif style == "wide":
            r = 5
        elif style == "sleepy":
            r = 3
        elif style == "angry":
            r = 4
        else:  # cute
            r = 4

        # Eye white
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1):
                if dx * dx + dy * dy <= r * r:
                    px, py = ex + dx, ey + dy
                    if 0 <= px < SIZE and 0 <= py < SIZE:
                        draw.point((px, py), fill=eye_color)

        # Pupil
        pr = 2
        for dy in range(-pr, pr + 1):
            for dx in range(-pr, pr + 1):
                if dx * dx + dy * dy <= pr * pr:
                    px = ex + dx + pupil_offset
                    py = ey + dy
                    if 0 <= px < SIZE and 0 <= py < SIZE:
                        draw.point((px, py), fill=pupil_color)

        # Sleepy eyelid
        if style == "sleepy":
            for dx in range(-r, r + 1):
                for dy in range(-r, -r + 2):
                    px, py = ex + dx, ey + dy
                    if 0 <= px < SIZE and 0 <= py < SIZE:
                        bg = hex_to_rgb("#0a0a0a")
                        draw.point((px, py), fill=bg)


def draw_frog_mouth(draw, style="smile", frame=0):
    """Draw frog mouth."""
    mouth_color = hex_to_rgb("#0d3d0d")
    cx = 24

    if style == "smile":
        for x in range(16, 32):
            y = 32 + int(1.5 * __import__("math").sin((x - 16) * 0.3))
            if 0 <= y < SIZE:
                draw.point((x, y), fill=mouth_color)
    elif style == "neutral":
        for x in range(18, 30):
            draw.point((x, 33), fill=mouth_color)
    elif style == "open":
        for x in range(18, 30):
            for y in range(32, 35):
                draw.point((x, y), fill=mouth_color)
    elif style == "frog":
        for x in range(20, 28):
            y = 33 + (1 if 22 < x < 26 else 0)
            draw.point((x, y), fill=mouth_color)
    else:  # tiny
        for x in range(21, 27):
            draw.point((x, 33), fill=mouth_color)


def draw_frog_legs(draw, palette, frame=0):
    """Draw frog legs."""
    body_colors = [hex_to_rgb(c) for c in palette["body"]]
    leg_color = body_colors[0]
    bounce = 1 if frame % 2 == 0 else 0

    # Front legs
    for lx in [10, 12]:
        for y in range(36 + bounce, 42 + bounce):
            if 0 <= y < SIZE:
                draw.point((lx, y), fill=leg_color)
    for rx in [35, 37]:
        for y in range(36 + bounce, 42 + bounce):
            if 0 <= y < SIZE:
                draw.point((rx, y), fill=leg_color)

    # Back feet
    for fx in [9, 10, 11, 13]:
        y = 41 + bounce
        if 0 <= y < SIZE:
            draw.point((fx, y), fill=leg_color)
    for fx in [34, 36, 37, 38]:
        y = 41 + bounce
        if 0 <= y < SIZE:
            draw.point((fx, y), fill=leg_color)


def draw_accessory(draw, accessory, rarity):
    """Draw accessory on frog."""
    if accessory == "none":
        return

    gold = hex_to_rgb("#ffcc00")
    red = hex_to_rgb("#ff4444")
    white = hex_to_rgb("#ffffff")

    if accessory in ("crown", "crown_small", "crown_gold"):
        color = gold
        base_y = 10 if accessory == "crown" else 12
        for x in range(18, 30):
            draw.point((x, base_y), fill=color)
            draw.point((x, base_y + 1), fill=color)
        # Crown points
        for dx, dy in [(0, -2), (5, -3), (10, -2)]:
            draw.point((18 + dx, base_y + dy), fill=color)
            draw.point((18 + dx, base_y + dy + 1), fill=color)
    elif accessory in ("halo", "halo_fire"):
        color = gold if accessory == "halo" else red
        for x in range(14, 34):
            draw.point((x, 8), fill=color)
        draw.point((14, 9), fill=color)
        draw.point((33, 9), fill=color)
    elif accessory == "sunglasses":
        black = hex_to_rgb("#000000")
        for x in range(12, 21):
            for y in range(16, 21):
                draw.point((x, y), fill=black)
        for x in range(27, 36):
            for y in range(16, 21):
                draw.point((x, y), fill=black)
        for x in range(21, 27):
            draw.point((x, 18), fill=black)
    elif accessory == "spots":
        spot_color = hex_to_rgb("#44aa44")
        spots = [(14, 24), (32, 22), (20, 34), (28, 30)]
        for sx, sy in spots:
            if 0 <= sx < SIZE and 0 <= sy < SIZE:
                draw.point((sx, sy), fill=spot_color)
                draw.point((sx + 1, sy), fill=spot_color)
    elif accessory == "stripe":
        stripe_color = hex_to_rgb("#44cc44")
        for x in range(16, 32):
            y = 24 + (1 if x % 3 == 0 else 0)
            if 0 <= y < SIZE:
                draw.point((x, y), fill=stripe_color)
    elif accessory in ("aura", "aura_fire"):
        color = hex_to_rgb("#39FF14") if accessory == "aura" else red
        for angle in range(0, 360, 30):
            import math
            rad = math.radians(angle)
            px = int(24 + 20 * math.cos(rad))
            py = int(26 + 18 * math.sin(rad))
            if 0 <= px < SIZE and 0 <= py < SIZE:
                draw.point((px, py), fill=color)
    elif accessory == "wings":
        wing = hex_to_rgb("#aaddff")
        for dy in range(-5, 5):
            for dx in range(-8, -2):
                px, py = 8 + dx, 22 + dy
                if 0 <= px < SIZE and 0 <= py < SIZE:
                    draw.point((px, py), fill=wing)
            for dx in range(2, 8):
                px, py = 39 + dx, 22 + dy
                if 0 <= px < SIZE and 0 <= py < SIZE:
                    draw.point((px, py), fill=wing)
    elif accessory == "third_eye":
        tx, ty = 24, 12
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                if dx * dx + dy * dy <= 4:
                    draw.point((tx + dx, ty + dy), fill=white)
        draw.point((tx, ty), fill=hex_to_rgb("#ff0000"))


def generate_frog(token_id, rarity, rng):
    """Generate a single animated frog as a list of PIL Images."""
    palette = PALETTES[rarity]
    eye_style = rng.choice(EYE_STYLES)
    mouth_style = rng.choice(MOUTH_STYLES)
    accessory = rng.choice(ACCESSORIES[rarity])

    frames = []
    for f in range(FRAMES):
        img = Image.new("RGBA", (SIZE, SIZE), hex_to_rgb(palette["bg"][f % len(palette["bg"])]))
        draw = ImageDraw.Draw(img)

        draw_frog_body(draw, palette, frame_offset=f * 3)
        draw_frog_legs(draw, palette, frame=f)
        draw_frog_eyes(draw, palette, style=eye_style, frame=f)
        draw_frog_mouth(draw, style=mouth_style, frame=f)
        draw_accessory(draw, accessory, rarity)

        frames.append(img)

    return frames, {
        "eye_style": eye_style,
        "mouth_style": mouth_style,
        "accessory": accessory,
    }


def main():
    rng = random.Random(SEED)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    rarities = assign_rarities(rng)
    manifest = []

    for i in range(TOTAL):
        token_id = i + 1
        rarity = rarities[i]

        frames, traits = generate_frog(token_id, rarity, rng)

        # Save GIF
        gif_name = f"frog_{token_id:04d}_{rarity}.gif"
        gif_path = OUTPUT_DIR / gif_name
        frames[0].save(
            gif_path,
            save_all=True,
            append_images=frames[1:],
            duration=300,
            loop=0,
            optimize=True,
        )

        # Save metadata
        meta = {
            "name": f"Frog PFP #{token_id}",
            "description": f"A unique animated pixel art frog from the Frog PFP collection. Rarity: {rarity.title()}. {token_id} of {TOTAL}.",
            "image": f"ipfs://PLACEHOLDER/{gif_name}",
            "attributes": [
                {"trait_type": "Rarity", "value": rarity.title()},
                {"trait_type": "Token ID", "value": token_id},
                {"trait_type": "Eye Style", "value": traits["eye_style"].title()},
                {"trait_type": "Mouth", "value": traits["mouth_style"].title()},
                {"trait_type": "Accessory", "value": traits["accessory"].replace("_", " ").title()},
                {"trait_type": "Animation", "value": "Idle"},
            ],
        }
        meta_name = f"frog_{token_id:04d}.json"
        meta_path = OUTPUT_DIR / meta_name
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

        manifest.append(
            {"token_id": token_id, "rarity": rarity, "gif": gif_name, "meta": meta_name}
        )

        if token_id % 20 == 0:
            print(f"Generated {token_id}/{TOTAL} frogs")

    # Save manifest
    manifest_path = OUTPUT_DIR / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    # Print stats
    from collections import Counter
    rarity_counts = Counter(rarities)
    print(f"\nGeneration complete! {TOTAL} frogs saved to {OUTPUT_DIR}")
    print("\nRarity distribution:")
    for rarity, count in sorted(rarity_counts.items(), key=lambda x: -x[1]):
        print(f"  {rarity.title():12s}: {count:3d} ({count}%)")
    print(f"\nManifest: {manifest_path}")


if __name__ == "__main__":
    main()

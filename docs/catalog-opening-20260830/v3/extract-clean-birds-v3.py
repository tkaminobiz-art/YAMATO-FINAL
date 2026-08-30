#!/usr/bin/env python3
"""Create true-alpha swallow plates from the cover crops.

The V2 crop files are opaque rectangles.  This script isolates the largest
connected gold component (the swallow), preserves soft edge pixels, and drops
all disconnected peony fragments without regenerating the artwork.
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[3]
SOURCE_DIR = ROOT / "assets/catalog/raw/v2-composite"
OUTPUT_DIR = ROOT / "assets/catalog/raw/v3-composite"

SOURCES = {
    "bird-pc-top-clean.png": ("bird-pc-top.png", (245, 320)),
    "bird-pc-bottom-clean.png": ("bird-pc-bottom.png", (340, 315)),
    "bird-sp-top-clean.png": ("bird-sp-top.png", (100, 210)),
    "bird-sp-bottom-clean.png": ("bird-sp-bottom.png", (220, 160)),
}


def seeded_component(mask: np.ndarray, seed: tuple[int, int]) -> np.ndarray:
    height, width = mask.shape
    sx, sy = seed
    if not (0 <= sx < width and 0 <= sy < height and mask[sy, sx]):
        raise RuntimeError(f"seed is outside gold matte: {seed}")
    seen = np.zeros_like(mask, dtype=bool)
    queue = deque([(sy, sx)])
    seen[sy, sx] = True
    component: list[tuple[int, int]] = []
    while queue:
        cy, cx = queue.popleft()
        component.append((cy, cx))
        for ny in range(max(0, cy - 1), min(height, cy + 2)):
            for nx in range(max(0, cx - 1), min(width, cx + 2)):
                if mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((ny, nx))

    keep = np.zeros_like(mask, dtype=np.uint8)
    if component:
        yy, xx = zip(*component)
        keep[np.asarray(yy), np.asarray(xx)] = 255
    return keep


def extract(source: Path, destination: Path, seed: tuple[int, int]) -> None:
    image = Image.open(source).convert("RGB")
    rgb = np.asarray(image).astype(np.float32)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    # Gold foil is markedly greener and bluer than the deep crimson paper.
    # Taking the weaker of both separations prevents pale paper highlights
    # from joining the matte while retaining the swallow's engraved texture.
    green_separation = (green - (0.52 * red + 15.0)) / 58.0
    blue_separation = (blue - (0.28 * red + 8.0)) / 62.0
    soft_alpha = np.clip(np.minimum(green_separation, blue_separation), 0.0, 1.0)
    soft_alpha = np.power(soft_alpha, 0.72)

    connectivity = np.asarray(
        Image.fromarray((soft_alpha > 0.035).astype(np.uint8) * 255, mode="L").filter(
            ImageFilter.MaxFilter(7)
        )
    ) > 0
    component = seeded_component(connectivity, seed)
    component = np.asarray(
        Image.fromarray(component, mode="L").filter(ImageFilter.MaxFilter(5))
    ).astype(np.float32) / 255.0

    alpha = np.clip(soft_alpha * component * 255.0, 0, 255).astype(np.uint8)
    alpha = np.asarray(
        Image.fromarray(alpha, mode="L").filter(ImageFilter.GaussianBlur(0.45))
    )

    rgba = np.dstack([rgb.astype(np.uint8), alpha])
    destination.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, mode="RGBA").save(destination, optimize=True)

    nonzero = np.argwhere(alpha > 4)
    if nonzero.size == 0:
        raise RuntimeError(f"empty matte: {destination}")
    y0, x0 = nonzero.min(axis=0)
    y1, x1 = nonzero.max(axis=0)
    print(
        f"{destination.name}: canvas={image.width}x{image.height} "
        f"content={x1 - x0 + 1}x{y1 - y0 + 1}+{x0}+{y0}"
    )


def main() -> None:
    for output_name, (source_name, seed) in SOURCES.items():
        extract(SOURCE_DIR / source_name, OUTPUT_DIR / output_name, seed)


if __name__ == "__main__":
    main()

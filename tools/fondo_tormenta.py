"""Genera las capas del fondo de tormenta morada de Draguz Shop.

Uso:  pip install pillow numpy && python3 tools/fondo_tormenta.py
Crea en assets/img/:
  bg-clouds.webp / bg-clouds-m.webp   nubes moradas de fondo (escritorio / celular)
  bg-fog.webp                         neblina morada con transparencia (se desplaza encima)
Los rayos NO van en las imágenes: los dibuja js/storm.js en vivo.
Cambia SEED para obtener otras nubes.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SEED = 7
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'img'

INK = np.array([9, 9, 12]) / 255
PURPLE_DEEP = np.array([42, 27, 61]) / 255      # morado del manual (#2A1B3D)
PURPLE = np.array([92, 38, 160]) / 255
VIOLET = np.array([150, 70, 255]) / 255


def fractal_noise(w, h, rng, octaves=6, base=3):
    """Ruido de valor fractal en [0,1]."""
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        cells = base * 2 ** o
        grid = rng.random((cells + 1, int(cells * h / w) + 2)).astype(np.float32)
        img = Image.fromarray((grid.T * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += np.asarray(img, np.float32) / 255 * amp
        total += amp
        amp *= 0.52
    out /= total
    return (out - out.min()) / (out.max() - out.min())


def blur(a, r):
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def cloud_field(w, h, rng):
    n = fractal_noise(w, h, rng, octaves=7, base=2)
    detail = fractal_noise(w, h, rng, octaves=5, base=6)
    billow = 1 - np.abs(detail * 2 - 1)            # bordes de nube más definidos
    c = blur(np.clip(n * 0.85 + billow * 0.45 - 0.35, 0, 1), max(w, h) / 520)
    k = int(h / 90)
    above = np.vstack([np.repeat(c[:1], k, axis=0), c[:-k]])
    shade = np.clip(c - above * 0.9, -0.2, 0.3)    # luz desde arriba
    return np.clip(c ** 1.25 + shade * 0.9, 0, 1)


def render_clouds(w, h, name, seed):
    rng = np.random.default_rng(seed)
    clouds = cloud_field(w, h, rng)
    # Más luz en los bordes y oscuro al centro, para que el texto se lea
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = (xx / w - 0.5) * 2, (yy / h - 0.5) * 2
    edge = np.clip(np.maximum(np.abs(cx) ** 1.6, np.abs(cy) ** 2.2) * 1.15, 0, 1)
    t = np.clip(clouds * (0.35 + 0.9 * edge), 0, 1)[..., None]
    col = INK + (PURPLE_DEEP - INK) * np.clip(t * 2.2, 0, 1)
    col += (PURPLE - PURPLE_DEEP) * np.clip(t * 2 - 0.35, 0, 1)
    col += (VIOLET - PURPLE) * np.clip(t * 2 - 1.1, 0, 1) * 0.8
    Image.fromarray((np.clip(col, 0, 1) * 255).astype(np.uint8)).save(OUT / f'{name}.webp', quality=80, method=6)
    print('ok', name, w, h)


def render_fog(w, h, name, seed):
    """Jirones de neblina violeta con transparencia; más densa arriba y abajo."""
    rng = np.random.default_rng(seed)
    n = fractal_noise(w, h, rng, octaves=6, base=3)
    wisp = blur(np.clip((n - 0.48) * 2.6, 0, 1), w / 300)
    yy = np.linspace(-1, 1, h, dtype=np.float32)[:, None]
    band = 0.35 + 0.65 * np.abs(yy) ** 1.4
    alpha = np.clip(wisp * band * 0.8, 0, 1)
    rgb = np.ones((h, w, 3), np.float32) * (np.array([150, 90, 235]) / 255)
    rgb = rgb + (1 - rgb) * wisp[..., None] * 0.25    # centros de la neblina un poco más claros
    rgba = np.dstack([rgb, alpha])
    Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(OUT / f'{name}.webp', quality=70, method=6)
    print('ok', name, w, h)


if __name__ == '__main__':
    render_clouds(1920, 1200, 'bg-clouds', SEED)
    render_clouds(1080, 1920, 'bg-clouds-m', SEED + 1)
    render_fog(1200, 600, 'bg-fog', SEED + 2)   # es borrosa: basta media resolución

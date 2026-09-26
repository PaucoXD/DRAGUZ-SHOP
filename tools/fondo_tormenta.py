"""Genera el fondo de tormenta morada con rayos de Draguz Shop.

Uso:  pip install pillow numpy && python3 tools/fondo_tormenta.py
Crea en assets/img/:
  bg-storm.webp / bg-storm-m.webp   fondo completo (escritorio / celular)
  bg-bolts.webp / bg-bolts-m.webp   solo los rayos, con transparencia (para el destello animado)
Cambia SEED para obtener otra forma de rayos y nubes.
"""
import math
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SEED = 7
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'img'

INK = np.array([9, 9, 12]) / 255
PURPLE_DEEP = np.array([42, 27, 61]) / 255      # morado del manual (#2A1B3D)
PURPLE = np.array([92, 38, 160]) / 255
VIOLET = np.array([150, 70, 255]) / 255
BOLT_GLOW = (255, 96, 20)     # naranja del halo
BOLT_MID = (255, 170, 60)
BOLT_CORE = (255, 244, 220)


def fractal_noise(w, h, rng, octaves=6, base=3):
    """Ruido de valor fractal en [0,1] (nubes)."""
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
    out = (out - out.min()) / (out.max() - out.min())
    return out


def bolt_points(start, end, rnd, detail=8, spread=0.2):
    """Rayo por desplazamiento del punto medio."""
    pts = [start, end]
    disp = math.dist(start, end) * spread
    for _ in range(detail):
        new = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
            dx, dy = b[0] - a[0], b[1] - a[1]
            ln = math.hypot(dx, dy) or 1
            off = rnd.uniform(-disp, disp)
            new += [(mx - dy / ln * off, my + dx / ln * off), b]
        pts = new
        disp *= 0.5
    return pts


def draw_bolt(draws, start, end, rnd, width, depth=0):
    pts = bolt_points(start, end, rnd)
    glow, mid, core = draws
    glow.line(pts, fill=255, width=int(width * 9), joint='curve')
    mid.line(pts, fill=255, width=max(1, int(width * 2.6)), joint='curve')
    core.line(pts, fill=255, width=max(1, int(width)), joint='curve')
    if depth < 2:
        for _ in range(rnd.randint(2, 4) if depth == 0 else rnd.randint(0, 2)):
            i = rnd.randint(len(pts) // 6, len(pts) - 2)
            sx, sy = pts[i]
            ang = math.atan2(end[1] - start[1], end[0] - start[0]) + rnd.uniform(-0.9, 0.9)
            ln = math.dist(start, end) * rnd.uniform(0.18, 0.4) / (depth + 1)
            draw_bolt(draws, (sx, sy), (sx + math.cos(ang) * ln, sy + math.sin(ang) * ln), rnd, width * 0.55, depth + 1)


def render(w, h, bolts, name, seed):
    rng = np.random.default_rng(seed)
    rnd = random.Random(seed)

    # ── nubes ──
    n = fractal_noise(w, h, rng, octaves=7, base=2)
    detail = fractal_noise(w, h, rng, octaves=5, base=6)
    billow = 1 - np.abs(detail * 2 - 1)            # bordes de nube más definidos
    clouds = np.clip(n * 0.85 + billow * 0.45 - 0.35, 0, 1)
    clouds = np.asarray(Image.fromarray((clouds * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(max(w, h) / 520)), np.float32) / 255
    # sombreado: iluminar desde arriba restando la versión desplazada
    k = int(h / 90)
    above = np.vstack([np.repeat(clouds[:1], k, axis=0), clouds[:-k]])  # sin dar la vuelta al borde
    shade = np.clip(clouds - above * 0.9, -0.2, 0.3)
    clouds = np.clip(clouds ** 1.25 + shade * 0.9, 0, 1)

    # Más luz en los bordes y oscuro al centro, para que el texto se lea
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = (xx / w - 0.5) * 2, (yy / h - 0.5) * 2
    edge = np.clip((np.maximum(np.abs(cx) ** 1.6, np.abs(cy) ** 2.2)) * 1.15, 0, 1)
    light = clouds * (0.35 + 0.9 * edge)

    # ── rayos ──
    layers = [Image.new('L', (w, h)) for _ in range(3)]
    draws = [ImageDraw.Draw(l) for l in layers]
    for (sx, sy), (ex, ey), wd in bolts:
        draw_bolt(draws, (sx * w, sy * h), (ex * w, ey * h), rnd, wd * w / 1920)
    glow_m = np.asarray(layers[0].filter(ImageFilter.GaussianBlur(w / 120)), np.float32) / 255
    mid_m = np.asarray(layers[1].filter(ImageFilter.GaussianBlur(w / 900)), np.float32) / 255
    core_m = np.asarray(layers[2].filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255
    halo = np.asarray(layers[0].filter(ImageFilter.GaussianBlur(w / 14)), np.float32) / 255
    halo = np.clip(halo * 4.0, 0, 1)
    bloom = np.clip(np.asarray(layers[0].filter(ImageFilter.GaussianBlur(w / 40)), np.float32) / 255 * 3.5, 0, 1)

    # ── color de las nubes ──
    t = np.clip(light + halo * 0.6 * (0.4 + clouds), 0, 1)[..., None]
    col = INK + (PURPLE_DEEP - INK) * np.clip(t * 2.2, 0, 1)
    col += (PURPLE - PURPLE_DEEP) * np.clip(t * 2 - 0.35, 0, 1)
    col += (VIOLET - PURPLE) * np.clip(t * 2 - 1.1, 0, 1) * 0.8
    col += np.array([1.0, 0.42, 0.12]) * (halo[..., None] * (0.25 + clouds[..., None]) * 0.42)  # luz naranja del rayo en las nubes
    col += np.array([1.0, 0.5, 0.2]) * bloom[..., None] * 0.18
    base = np.clip(col, 0, 1)

    def paint(img, m, color, strength):
        c = np.array(color) / 255
        return img + (1 - img) * (m[..., None] * strength) * c

    full = paint(base, glow_m, BOLT_GLOW, 0.9)
    full = paint(full, mid_m, BOLT_MID, 1.0)
    full = paint(full, core_m, BOLT_CORE, 1.0)
    full = np.clip(full, 0, 1)
    Image.fromarray((full * 255).astype(np.uint8)).save(OUT / f'{name}.webp', quality=80, method=6)

    # Solo rayos (con alfa) para el destello animado
    alpha = np.clip(glow_m * 0.75 + mid_m + core_m + halo * 0.25, 0, 1)
    rgb = np.zeros((h, w, 3), np.float32)
    rgb = paint(rgb, halo, (170, 80, 255), 0.6)
    rgb = paint(rgb, glow_m, BOLT_GLOW, 1)
    rgb = paint(rgb, mid_m, BOLT_MID, 1)
    rgb = paint(rgb, core_m, BOLT_CORE, 1)
    rgba = np.dstack([np.clip(rgb, 0, 1), alpha])
    Image.fromarray((rgba * 255).astype(np.uint8), 'RGBA').save(OUT / f'{name.replace("storm", "bolts")}.webp', quality=78, method=6)
    print('ok', name, w, h)


if __name__ == '__main__':
    # (inicio x,y), (fin x,y), grosor — coordenadas relativas 0..1
    desktop = [
        ((0.00, 0.02), (0.20, 0.34), 3.2),   # esquina superior izquierda
        ((1.00, 0.00), (0.80, 0.30), 3.4),   # esquina superior derecha
        ((1.00, 0.72), (0.84, 0.96), 2.6),   # abajo a la derecha
        ((0.00, 0.80), (0.13, 1.00), 2.2),   # abajo a la izquierda
    ]
    # En celular el fondo queda fijo detrás de los títulos: rayos en los costados y abajo, lejos del texto
    mobile = [
        ((0.00, 0.34), (0.10, 0.56), 2.4),   # costado izquierdo
        ((1.00, 0.50), (0.90, 0.72), 2.4),   # costado derecho
        ((1.00, 0.86), (0.66, 1.00), 3.0),   # abajo a la derecha
        ((0.00, 0.90), (0.26, 1.00), 2.4),   # abajo a la izquierda
    ]
    render(1920, 1200, desktop, 'bg-storm', SEED)
    render(1080, 1920, mobile, 'bg-storm-m', SEED + 1)

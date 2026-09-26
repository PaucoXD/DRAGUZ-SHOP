/* Tormenta en vivo del fondo: rayos dibujados al momento, destellos entre las nubes
   y un poco de profundidad al hacer scroll. Solo dibuja mientras hay un rayo activo. */
(function () {
  'use strict';
  const cv = document.getElementById('storm');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clouds = document.querySelector('.storm-clouds'), fogs = document.querySelectorAll('.storm-fog');
  let W = 0, H = 0, events = [], raf = 0, timer = 0;

  const rnd = (a, b) => a + Math.random() * (b - a);
  const mobile = () => W < 760;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, mobile() ? 1.5 : 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';  // nunca ocupa espacio en la página, aunque falte el CSS
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Rayo por desplazamiento del punto medio
  function zigzag(x1, y1, x2, y2, detail) {
    let pts = [[x1, y1], [x2, y2]], disp = Math.hypot(x2 - x1, y2 - y1) * 0.22;
    for (let d = 0; d < detail; d++) {
      const out = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i], len = Math.hypot(bx - ax, by - ay) || 1, o = rnd(-disp, disp);
        out.push([(ax + bx) / 2 - (by - ay) / len * o, (ay + by) / 2 + (bx - ax) / len * o], pts[i]);
      }
      pts = out; disp *= 0.5;
    }
    return pts;
  }

  // Punto de salida en los bordes, lejos del centro donde está el texto
  function origin() {
    const m = mobile(), side = Math.random();
    if (!m && side < 0.65) {                                   // desde arriba, en los extremos
      const x = Math.random() < 0.5 ? rnd(0, 0.28) : rnd(0.72, 1);
      // baja pegado a su orilla: se inclina hacia afuera, nunca hacia el centro
      return { x: x * W, y: -10, ang: Math.PI / 2 + (x < 0.5 ? rnd(-0.15, 0.5) : -rnd(-0.15, 0.5)), top: true };
    }
    const left = Math.random() < 0.5, y = rnd(m ? 0.22 : 0.04, m ? 0.95 : 0.55) * H;  // desde un costado
    return { x: left ? -10 : W + 10, y, ang: left ? rnd(0.35, 1.15) : Math.PI - rnd(0.35, 1.15) };
  }

  function makeBolt(o) {
    let len = Math.min(W, H) * (o.top ? rnd(0.4, 0.65) : rnd(mobile() ? 0.35 : 0.45, mobile() ? 0.6 : 0.8));
    // que no avance demasiado hacia el centro, donde va el texto
    len = Math.min(len, W * (mobile() ? 0.5 : 0.26) / Math.max(0.25, Math.abs(Math.cos(o.ang))));
    const w = mobile() ? rnd(1.4, 2.2) : rnd(1.8, 3);
    const main = zigzag(o.x, o.y, o.x + Math.cos(o.ang) * len, o.y + Math.sin(o.ang) * len, 7);
    const segs = [{ pts: main, w, at: 0 }];
    const nb = 2 + Math.floor(Math.random() * 3);
    for (let b = 0; b < nb; b++) {
      const i = Math.floor(rnd(0.2, 0.85) * main.length), [sx, sy] = main[i];
      const a = o.ang + rnd(-0.9, 0.9), l = len * rnd(0.18, 0.42);
      segs.push({ pts: zigzag(sx, sy, sx + Math.cos(a) * l, sy + Math.sin(a) * l, 5), w: w * 0.55, at: i / main.length });
    }
    return segs;
  }

  // Intensidad en el tiempo: crece, parpadea y se apaga
  function intensity(t, e) {
    if (t < e.grow) return 1;
    const f = t - e.grow;
    if (f < 70) return 1;
    if (f < 110) return 0.25;
    if (f < 170) return e.double ? 1 : 0.6;
    return Math.max(0, Math.exp(-(f - 170) / (e.decay)) - 0.02);
  }

  function strike(kind) {
    const o = origin(), now = performance.now();
    const sheet = kind === 'sheet' || (kind !== 'bolt' && Math.random() < 0.28);  // relámpago entre nubes, sin rayo
    events.push({ o, segs: sheet ? null : makeBolt(o), born: now, grow: sheet ? 0 : rnd(90, 160), decay: sheet ? 260 : rnd(180, 320), double: Math.random() < 0.5, power: sheet ? rnd(0.9, 1.3) : 1 });
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function drawPath(pts, upto) {
    const n = Math.max(2, Math.ceil(pts.length * upto));
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = ctx.lineCap = 'round';
    events = events.filter(e => {
      const t = now - e.born, a = intensity(t, e) * e.power;
      if (t > e.grow + 170 && a <= 0) return false;
      // luz sobre las nubes
      const r = Math.max(W, H) * (e.segs ? 0.75 : 0.55);
      const cx = Math.min(Math.max(e.o.x, 0), W), cy = Math.min(Math.max(e.o.y, 0), H);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(255,120,45,${0.32 * a})`);
      g.addColorStop(0.35, `rgba(150,70,255,${0.2 * a})`);
      g.addColorStop(1, 'rgba(60,20,120,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (e.segs) {
        const grow = Math.min(1, t / e.grow);
        for (const s of e.segs) {
          if (grow < s.at) continue;
          const upto = s.at ? Math.min(1, (grow - s.at) / (1 - s.at) * 1.6) : grow;
          ctx.strokeStyle = `rgba(255,90,20,${0.12 * a})`; ctx.lineWidth = s.w * 12; drawPath(s.pts, upto);
          ctx.strokeStyle = `rgba(255,150,50,${0.38 * a})`; ctx.lineWidth = s.w * 4; drawPath(s.pts, upto);
          ctx.strokeStyle = `rgba(255,244,225,${0.95 * a})`; ctx.lineWidth = s.w * 1.3; drawPath(s.pts, upto);
        }
      }
      return true;
    });
    raf = events.length ? requestAnimationFrame(frame) : 0;
    if (!raf) ctx.clearRect(0, 0, W, H);
  }

  function schedule(first) {
    clearTimeout(timer);
    if (reduce.matches || document.hidden) return;
    timer = setTimeout(() => {
      strike();
      if (Math.random() < 0.3) setTimeout(() => strike('bolt'), rnd(140, 520));  // a veces caen dos seguidos
      schedule();
    }, first ? 1400 : rnd(2600, 7000));
  }

  // Profundidad: las capas se mueven a distinta velocidad al hacer scroll
  let st = 0;
  function parallax() {
    st = 0;
    const y = window.scrollY || 0;
    if (clouds) clouds.style.translate = `0 ${Math.max(-H * 0.05, -y * 0.03)}px`;
    fogs.forEach((f, i) => { f.style.translate = `0 ${Math.max(-H * 0.09, -y * (0.06 + i * 0.03))}px`; });
  }
  window.addEventListener('scroll', () => { if (!st && !reduce.matches) st = requestAnimationFrame(parallax); }, { passive: true });

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => schedule());
  if (reduce.addEventListener) reduce.addEventListener('change', () => schedule());
  resize(); schedule(true);
  window.Storm = { strike };
})();

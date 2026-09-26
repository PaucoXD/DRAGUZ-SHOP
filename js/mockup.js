/* Vista previa del diseño sobre la prenda: el cliente sube su logo, lo acomoda y lo adjunta a su cotización. */
window.Mockup = (function () {
  'use strict';
  const S = 400; // sistema de coordenadas de las prendas (400×400)

  // Silueta, detalles y área de impresión de cada prenda
  const G = {
    tee: {
      body: 'M130 60 L78 82 L28 142 L74 184 L110 152 L110 350 Q200 362 290 350 L290 152 L326 184 L372 142 L322 82 L270 60 Q200 102 130 60 Z',
      front: { detail: ['M130 60 Q200 102 270 60 Q200 84 130 60 Z'], area: [140, 118, 120, 150] },
      back: { detail: ['M140 62 Q200 80 260 62 Q200 72 140 62 Z'], area: [128, 96, 144, 185] },
      seams: ['M110 152 L110 190', 'M290 152 L290 190']
    },
    polo: {
      body: 'M132 62 L80 84 L30 142 L74 184 L110 152 L110 350 Q200 362 290 350 L290 152 L326 184 L372 142 L320 84 L268 62 L232 70 L200 112 L168 70 Z',
      front: { detail: ['M168 70 L200 112 L186 124 L148 74 Z', 'M232 70 L200 112 L214 124 L252 74 Z', 'M196 112 L204 112 L204 190 L196 190 Z'], area: [152, 128, 96, 105] },
      back: { detail: ['M150 64 Q200 80 250 64 L250 74 Q200 90 150 74 Z'], area: [128, 100, 144, 180] },
      seams: []
    },
    hoodie: {
      body: 'M140 58 Q200 22 260 58 L320 82 L374 196 L336 210 L300 154 L300 356 Q200 368 100 356 L100 154 L64 210 L26 196 L80 82 Z',
      front: { detail: ['M158 64 Q200 124 242 64 Q200 84 158 64 Z', 'M130 272 L270 272 L286 332 L114 332 Z'], lines: ['M186 108 L182 170', 'M214 108 L218 170', 'M146 64 Q156 30 200 26 Q244 30 254 64', 'M100 330 L300 330'], area: [146, 134, 108, 110] },
      back: { detail: ['M150 60 Q200 30 250 60 Q248 118 200 128 Q152 118 150 60 Z'], area: [126, 140, 148, 160] },
      seams: []
    },
    cap: {
      body: 'M92 244 Q92 108 200 102 Q308 108 308 244 Z',
      front: { detail: ['M66 240 Q200 280 334 240 Q312 304 200 306 Q88 304 66 240 Z'], lines: ['M200 104 L200 244', 'M140 118 Q120 180 124 244', 'M260 118 Q280 180 276 244'], dots: [[200, 104, 7]], area: [138, 138, 124, 80] },
      seams: []
    },
    mug: {
      body: 'M112 110 L288 110 L288 316 Q288 330 274 330 L126 330 Q112 330 112 316 Z',
      front: { detail: [], lines: [], handle: true, area: [128, 142, 144, 150] },
      seams: []
    },
    bag: {
      body: 'M98 150 L302 150 L310 362 L90 362 Z',
      front: { detail: [], handles: true, area: [128, 186, 144, 144] },
      seams: []
    },
    sticker: { sticker: true, front: { area: [70, 70, 260, 260] } }
  };
  const kindOf = p => (G[p && p.kind] ? p.kind : 'tee');

  function shade(hex, k) {
    const n = parseInt(String(hex || '#1a1a1f').replace('#', '').padEnd(6, '0').slice(0, 6), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  const lum = hex => { const n = parseInt(String(hex || '#000').replace('#', '').padEnd(6, '0').slice(0, 6), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

  // Luces y sombras sobre la tela para que no se vea plana
  function fabricShading(ctx, light) {
    const g1 = ctx.createLinearGradient(0, 0, S, 0);
    g1.addColorStop(0, 'rgba(0,0,0,.28)'); g1.addColorStop(0.28, 'rgba(0,0,0,0)'); g1.addColorStop(0.72, 'rgba(0,0,0,0)'); g1.addColorStop(1, 'rgba(0,0,0,.32)');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, S, S);
    const g2 = ctx.createRadialGradient(170, 150, 10, 170, 150, 230);
    g2.addColorStop(0, light ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, S, S);
    const g3 = ctx.createLinearGradient(0, 250, 0, 370);
    g3.addColorStop(0, 'rgba(0,0,0,0)'); g3.addColorStop(1, 'rgba(0,0,0,.22)');
    ctx.fillStyle = g3; ctx.fillRect(0, 0, S, S);
  }

  function drawGarment(ctx, kind, color, side) {
    const g = G[kind], v = g[side] || g.front, light = lum(color) > 0.6;
    const body = new Path2D(g.body);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
    ctx.fillStyle = color; ctx.fill(body);
    ctx.restore();
    if (v.handle) { ctx.save(); ctx.lineWidth = 22; ctx.strokeStyle = shade(color, 0.92); ctx.beginPath(); ctx.moveTo(288, 150); ctx.bezierCurveTo(356, 150, 356, 280, 288, 280); ctx.stroke(); ctx.restore(); }
    if (v.handles) { ctx.save(); ctx.lineWidth = 12; ctx.strokeStyle = shade(color, 0.8); ctx.beginPath(); ctx.moveTo(145, 152); ctx.bezierCurveTo(145, 62, 255, 62, 255, 152); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.clip(body);
    fabricShading(ctx, light);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = shade(color, light ? 0.86 : 0.7);
    (v.detail || []).forEach(d => ctx.fill(new Path2D(d)));
    ctx.strokeStyle = light ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.1)'; ctx.lineWidth = 2;
    (v.lines || []).concat(g.seams || []).forEach(d => ctx.stroke(new Path2D(d)));
    (v.dots || []).forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); });
    if (kind === 'mug') { ctx.fillStyle = shade(color, 0.8); ctx.beginPath(); ctx.ellipse(200, 110, 88, 12, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = light ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.08)'; ctx.lineWidth = 1.5; ctx.stroke(body);
    ctx.restore();
    return body;
  }

  // Blanco del sticker troquelado: engrosa la silueta del diseño
  function stickerOutline(img, w, h, pad) {
    const c = document.createElement('canvas'); c.width = w + pad * 2; c.height = h + pad * 2;
    const x = c.getContext('2d');
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    const tx = t.getContext('2d'); tx.drawImage(img, 0, 0, w, h); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = '#fff'; tx.fillRect(0, 0, w, h);
    for (let a = 0; a < 24; a++) { const r = a / 24 * Math.PI * 2; x.drawImage(t, pad + Math.cos(r) * pad, pad + Math.sin(r) * pad); }
    x.drawImage(t, pad, pad);
    return c;
  }

  // Carga la imagen del cliente, la reduce y opcionalmente quita el fondo blanco
  function loadDesign(file) {
    return new Promise((res, rej) => {
      if (!/^image\//.test(file.type)) return rej(new Error('Sube una imagen (PNG, JPG, WEBP o SVG).'));
      const fr = new FileReader();
      fr.onload = () => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('No se pudo leer la imagen.')); im.src = fr.result; };
      fr.onerror = () => rej(new Error('No se pudo leer el archivo.')); fr.readAsDataURL(file);
    });
  }
  function toCanvas(im, max, removeWhite) {
    const k = Math.min(1, max / Math.max(im.naturalWidth || im.width, im.naturalHeight || im.height));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round((im.naturalWidth || im.width) * k)); c.height = Math.max(1, Math.round((im.naturalHeight || im.height) * k));
    const x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height);
    if (removeWhite) {
      const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        const mn = Math.min(p[i], p[i + 1], p[i + 2]), mx = Math.max(p[i], p[i + 1], p[i + 2]);
        if (mx - mn < 28 && mn > 200) p[i + 3] = Math.round(p[i + 3] * Math.max(0, Math.min(1, (245 - mn) / 45)));
      }
      x.putImageData(d, 0, 0);
    }
    return c;
  }
  function exportDesign(c) {
    // PNG con transparencia; si pesa mucho, se reduce para que quepa en la cotización
    let url = c.toDataURL('image/png'), size = c.width;
    while (url.length > 320000 && size > 260) { size = Math.round(size * 0.75); const t = toCanvas(c, size, false); url = t.toDataURL('image/png'); }
    return url;
  }

  /* ── editor ── */
  function open(o) {
    const { openModal, closeModal, toast, esc } = window.DZ;
    const product = o.product || {}, kind = kindOf(product);
    const colors = (product.colors && product.colors.length) ? product.colors : [{ name: 'Blanco', hex: kind === 'mug' ? '#f4f4f4' : '#111114' }];
    const st = { color: (colors.find(c => c.name === o.color) || colors[0]), side: 'front', img: null, src: null, scale: 0.8, cx: 0.5, cy: 0.45, removeWhite: false };
    const hasBack = !!(G[kind] && G[kind].back);
    const m = openModal(`<h3 class="m-title">¿Cómo queda?</h3><p class="m-sub">${esc(product.name || 'Tu prenda')} · sube tu diseño y acomódalo con el dedo o el mouse.</p>
      <div class="mk"><div class="mk-stage"><canvas id="mk-cv" width="800" height="800"></canvas><div class="mk-empty" id="mk-empty"><b>Sube tu logo o diseño</b><span>PNG con fondo transparente se ve mejor</span></div></div>
      <div class="mk-side">
        <label class="btn" style="width:100%"><input type="file" id="mk-file" accept="image/*" hidden>${o.current ? 'Cambiar diseño' : 'Subir diseño'}</label>
        ${hasBack ? '<div class="mk-seg"><button data-side="front" class="on">Frente</button><button data-side="back">Espalda</button></div>' : ''}
        ${colors.length > 1 ? `<span class="lbl">Color</span><div class="swatches">${colors.map(c => `<button class="sw ${c.name === st.color.name ? 'on' : ''}" data-mkcolor="${esc(c.name)}" title="${esc(c.name)}" style="--c:${esc(c.hex)}"></button>`).join('')}</div>` : ''}
        <span class="lbl">Tamaño</span><input type="range" id="mk-size" min="15" max="100" value="80">
        <label class="check"><input type="checkbox" id="mk-white"><span>Quitar fondo blanco (para logos en JPG)</span></label>
        <button class="link" id="mk-center" type="button">Centrar diseño</button>
        <div class="mk-actions"><button class="btn" id="mk-use" disabled>Usar en mi cotización</button><button class="btn ghost" id="mk-dl" disabled>Descargar imagen</button></div>
        <p class="tag mk-note">Es una vista aproximada: el tamaño y la posición finales los confirmamos contigo antes de imprimir.</p>
      </div></div>`, { wide: true });
    const cv = m.querySelector('#mk-cv'), ctx = cv.getContext('2d'), K = cv.width / S;
    let designC = null;

    const area = () => { const g = G[kind], v = g[st.side] || g.front; return v.area; };
    function rect() {
      if (!designC) return null;
      const [ax, ay, aw, ah] = area();
      const k = Math.min(aw / designC.width, ah / designC.height) * st.scale;
      const w = designC.width * k, h = designC.height * k;
      const x = Math.min(Math.max(ax + st.cx * aw - w / 2, ax), ax + aw - w), y = Math.min(Math.max(ay + st.cy * ah - h / 2, ay), ay + ah - h);
      return { x, y, w, h };
    }
    function draw(forExport) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      const bg = ctx.createLinearGradient(0, 0, 0, cv.height); bg.addColorStop(0, '#2a2438'); bg.addColorStop(1, '#141219');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(K, 0, 0, K, 0, 0);
      const r = rect();
      if (G[kind].sticker) {
        if (r) { const pad = 7, o2 = stickerOutline(designC, r.w * K, r.h * K, pad * K); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16; ctx.drawImage(o2, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2); ctx.restore(); ctx.drawImage(designC, r.x, r.y, r.w, r.h); }
      } else {
        const body = drawGarment(ctx, kind, st.color.hex, st.side);
        if (r) {
          ctx.save(); ctx.clip(body);
          ctx.globalAlpha = 0.96; ctx.drawImage(designC, r.x, r.y, r.w, r.h); ctx.globalAlpha = 1;
          ctx.restore();
          // la tela "atraviesa" el estampado: las mismas sombras, solo donde hay diseño, en modo multiplicar
          const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height;
          const tx = t.getContext('2d'); tx.setTransform(K, 0, 0, K, 0, 0);
          tx.fillStyle = '#fff'; tx.fillRect(0, 0, S, S); fabricShading(tx, lum(st.color.hex) > 0.6);
          tx.globalCompositeOperation = 'destination-in'; tx.drawImage(designC, r.x, r.y, r.w, r.h);
          ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.6; ctx.drawImage(t, 0, 0); ctx.restore();
        }
      }
      if (r && !forExport) { ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1; const [ax, ay, aw, ah] = area(); ctx.strokeRect(ax, ay, aw, ah); ctx.restore(); }
      m.querySelector('#mk-empty').hidden = !!designC;
      m.querySelector('#mk-use').disabled = m.querySelector('#mk-dl').disabled = !designC;
    }
    function rebuild() { if (st.img) designC = toCanvas(st.img, 900, st.removeWhite); draw(); }

    m.querySelector('#mk-file').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { st.img = await loadDesign(f); st.cx = 0.5; st.cy = kind === 'tee' || kind === 'hoodie' ? 0.4 : 0.5; rebuild(); } catch (er) { toast(er.message, true); }
      e.target.value = '';
    };
    m.querySelector('#mk-size').oninput = e => { st.scale = +e.target.value / 100; draw(); };
    m.querySelector('#mk-white').onchange = e => { st.removeWhite = e.target.checked; rebuild(); };
    m.querySelector('#mk-center').onclick = () => { st.cx = 0.5; st.cy = 0.45; draw(); };
    m.addEventListener('click', e => {
      const sd = e.target.closest('[data-side]'); if (sd) { st.side = sd.dataset.side; m.querySelectorAll('[data-side]').forEach(b => b.classList.toggle('on', b === sd)); draw(); }
      const c = e.target.closest('[data-mkcolor]'); if (c) { st.color = colors.find(x => x.name === c.dataset.mkcolor) || st.color; m.querySelectorAll('[data-mkcolor]').forEach(b => b.classList.toggle('on', b === c)); draw(); }
    });
    // Arrastrar el diseño dentro del área de impresión
    let drag = null;
    const pt = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / b.width * S, y: (e.clientY - b.top) / b.height * S }; };
    cv.addEventListener('pointerdown', e => { const r = rect(); if (!r) return; const p = pt(e); drag = { p, cx: st.cx, cy: st.cy }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!drag) return; const p = pt(e), [, , aw, ah] = area(); st.cx = Math.min(1, Math.max(0, drag.cx + (p.x - drag.p.x) / aw)); st.cy = Math.min(1, Math.max(0, drag.cy + (p.y - drag.p.y) / ah)); draw(); });
    const end = () => { drag = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

    function exportMockup() {
      draw(true);
      const out = document.createElement('canvas'); out.width = out.height = 640;
      out.getContext('2d').drawImage(cv, 0, 0, 640, 640);
      draw();
      return out.toDataURL('image/jpeg', 0.84);
    }
    m.querySelector('#mk-dl').onclick = () => { const a = document.createElement('a'); a.href = exportMockup(); a.download = 'draguz-vista-previa.jpg'; a.click(); };
    m.querySelector('#mk-use').onclick = () => {
      const res = { mockup: exportMockup(), design: exportDesign(designC), color: st.color.name, side: st.side };
      closeModal(); if (o.onUse) o.onUse(res);
    };
    draw();
  }

  return { open, kinds: Object.keys(G) };
})();

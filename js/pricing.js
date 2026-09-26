/* Precios: menudeo / mayoreo por línea, recargos por talla y extras. */
window.Pricing = (function () {
  const sum = o => Object.values(o || {}).reduce((a, b) => a + (+b || 0), 0);
  const money = n => { n = Number(n || 0); const d = Number.isInteger(n) ? 0 : 2; return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: 2 }); };

  function qtyOf(line, p) { return (p.sizes || []).length ? sum(line.sizes) : (+line.qty || 0); }

  function calcLine(line, p, extras) {
    const qty = qtyOf(line, p);
    const mayoreo = qty >= (+p.mayoreoMin || 1e9);
    const unit = mayoreo ? +p.priceMayoreo : +p.priceMenudeo;
    let sizeExtraTotal = 0;
    Object.entries(line.sizes || {}).forEach(([s, q]) => { sizeExtraTotal += ((p.sizeExtra || {})[s] || 0) * (+q || 0); });
    const chosen = (line.extraIds || []).map(id => extras.find(e => e.id === id)).filter(Boolean);
    const ex = chosen.map(e => ({ name: e.name, price: +e.price, scope: e.scope, total: e.scope === 'unico' ? +e.price : +e.price * qty }));
    const extrasTotal = ex.reduce((a, e) => a + e.total, 0);
    const subtotal = qty > 0 ? unit * qty + sizeExtraTotal + extrasTotal : 0;
    const faltan = mayoreo ? 0 : Math.max(0, (+p.mayoreoMin || 0) - qty);
    return { qty, unit, tier: mayoreo ? 'Mayoreo' : 'Menudeo', faltan, sizeExtraTotal, extras: ex, subtotal };
  }

  function folio() {
    const d = new Date(), z = n => String(n).padStart(2, '0');
    return 'DZ-' + String(d.getFullYear()).slice(2) + z(d.getMonth() + 1) + z(d.getDate()) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  /* Convierte el estado del cotizador en un objeto guardable / imprimible */
  function snapshot(state, catalog, extras, settings) {
    const lines = [];
    state.lines.forEach(l => {
      const p = catalog.find(x => x.id === l.productId); if (!p) return;
      const c = calcLine(l, p, extras);
      if (c.qty <= 0) return;
      lines.push({ lid: l.lid, productId: p.id, name: p.name, cut: l.cut || '', color: l.color || '', sizes: l.sizes || {}, qty: c.qty, unit: c.unit, tier: c.tier, sizeExtraTotal: c.sizeExtraTotal, extras: c.extras, subtotal: c.subtotal, notes: l.notes || '', mockup: l.mockup || '', designId: l.designId || '' });
    });
    const total = lines.reduce((a, l) => a + l.subtotal, 0);
    const pct = +settings.anticipoPct || 0;
    return { folio: state.folio || folio(), date: Date.now(), customer: state.customer || {}, lines, total, anticipoPct: pct, anticipo: Math.round(total * pct) / 100, validityDays: +settings.validityDays || 7 };
  }

  return { qtyOf, calcLine, snapshot, money, sum };
})();

/* ───────────── TICKET (canvas → PNG) ───────────── */
window.Ticket = (function () {
  const money = window.Pricing.money;
  const W = 620, PAD = 38, DPR = 2;
  const INK = '#0A0A0C', GRAY = '#6B6B78', RED = '#E3000F', PAPER = '#F4F1E9';
  let logoImg;

  function loadLogo() {
    if (logoImg) return Promise.resolve(logoImg);
    return new Promise(res => { const i = new Image(); i.onload = () => { logoImg = i; res(i); }; i.onerror = () => res(null); i.src = window.LOGO_DATA; });
  }
  function wrap(ctx, text, maxW) {
    const words = String(text).split(/\s+/), out = []; let line = '';
    words.forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; });
    if (line) out.push(line); return out;
  }
  function dashed(ctx, y) { ctx.save(); ctx.strokeStyle = '#b9b5a8'; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke(); ctx.restore(); }
  const F = (w, s, mono) => `${w} ${s}px ${mono ? "'JB',monospace" : "'Montserrat',Arial,sans-serif"}`;

  function paint(ctx, H, q, s, logo) {
    // papel con bordes en zig-zag
    ctx.fillStyle = PAPER; ctx.beginPath(); ctx.moveTo(0, 8);
    for (let x = 0; x <= W; x += 16) { ctx.lineTo(x + 8, 0); ctx.lineTo(x + 16, 8); }
    ctx.lineTo(W, H - 8);
    for (let x = W; x >= 0; x -= 16) { ctx.lineTo(x - 8, H); ctx.lineTo(x - 16, H - 8); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = RED; ctx.fillRect(0, 8, W, 6);

    let y = 46;
    if (logo) { const lw = 300, lh = lw * logo.height / logo.width; ctx.drawImage(logo, (W - lw) / 2, y, lw, lh); y += lh + 26; }
    ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.font = F(800, 26); ctx.fillText('COTIZACIÓN', W / 2, y); y += 34;
    ctx.textAlign = 'left';

    const row = (k, v) => { ctx.font = F(500, 13, true); ctx.fillStyle = GRAY; ctx.fillText(k.toUpperCase(), PAD, y); ctx.textAlign = 'right'; ctx.font = F(700, 15); ctx.fillStyle = INK; ctx.fillText(v, W - PAD, y); ctx.textAlign = 'left'; y += 26; };
    const d = new Date(q.date);
    row('Folio', q.folio);
    row('Fecha', d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }));
    if (q.customer && q.customer.name) row('Cliente', q.customer.name);
    y += 4; dashed(ctx, y); y += 30;

    q.lines.forEach(l => {
      ctx.font = F(800, 19); ctx.fillStyle = INK;
      wrap(ctx, l.name, W - 2 * PAD).forEach(t => { ctx.fillText(t, PAD, y); y += 24; });
      const sizes = Object.entries(l.sizes || {}).filter(([, n]) => +n > 0).map(([k, n]) => `${k}×${n}`).join('  ');
      const meta = [l.cut ? 'Corte: ' + l.cut : '', l.color ? 'Color: ' + l.color : '', sizes ? 'Tallas: ' + sizes : ''].filter(Boolean).join('  ·  ');
      if (meta) { ctx.font = F(500, 14); ctx.fillStyle = GRAY; wrap(ctx, meta, W - 2 * PAD).forEach(t => { ctx.fillText(t, PAD, y); y += 20; }); }
      ctx.font = F(600, 15); ctx.fillStyle = INK;
      ctx.fillText(`${l.qty} pzas × ${money(l.unit)}  (${l.tier})`, PAD, y);
      ctx.textAlign = 'right'; ctx.font = F(800, 17); ctx.fillText(money(l.qty * l.unit), W - PAD, y); ctx.textAlign = 'left'; y += 24;
      if (l.sizeExtraTotal) { ctx.font = F(500, 13); ctx.fillStyle = GRAY; ctx.fillText('+ Recargo por talla', PAD + 10, y); ctx.textAlign = 'right'; ctx.fillText(money(l.sizeExtraTotal), W - PAD, y); ctx.textAlign = 'left'; y += 20; }
      l.extras.forEach(e => {
        ctx.font = F(500, 13); ctx.fillStyle = GRAY;
        const lbl = '+ ' + e.name + (e.scope === 'unico' ? '' : ` (${money(e.price)} c/u)`);
        const lines = wrap(ctx, lbl, W - 2 * PAD - 110);
        lines.forEach((t, i) => { ctx.fillText(t, PAD + 10, y); if (i === 0) { ctx.textAlign = 'right'; ctx.fillText(money(e.total), W - PAD, y); ctx.textAlign = 'left'; } y += 19; });
      });
      if (l.notes) { ctx.font = F(500, 13); ctx.fillStyle = GRAY; wrap(ctx, 'Nota: ' + l.notes, W - 2 * PAD - 10).forEach(t => { ctx.fillText(t, PAD + 10, y); y += 19; }); }
      ctx.font = F(700, 15); ctx.fillStyle = INK; ctx.textAlign = 'right'; ctx.fillText('Subtotal  ' + money(l.subtotal), W - PAD, y + 4); ctx.textAlign = 'left';
      y += 24; dashed(ctx, y); y += 30;
    });

    ctx.font = F(800, 22); ctx.fillStyle = INK; ctx.fillText('TOTAL', PAD, y);
    ctx.textAlign = 'right'; ctx.font = F(900, 32); ctx.fillStyle = RED; ctx.fillText(money(q.total), W - PAD, y + 2); ctx.textAlign = 'left'; y += 36;
    if (q.anticipoPct) { ctx.font = F(600, 15); ctx.fillStyle = INK; ctx.fillText(`Anticipo (${q.anticipoPct} %)`, PAD, y); ctx.textAlign = 'right'; ctx.fillText(money(q.anticipo), W - PAD, y); ctx.textAlign = 'left'; y += 26; }
    ctx.font = F(500, 13, true); ctx.fillStyle = GRAY; ctx.fillText(`VIGENCIA: ${q.validityDays} DÍAS`, PAD, y); y += 26;
    dashed(ctx, y); y += 34;
    ctx.textAlign = 'center'; ctx.font = F(900, 20); ctx.fillStyle = INK; ctx.fillText('DEFINE YOUR DIFFERENT', W / 2, y); y += 24;
    ctx.font = F(500, 12); ctx.fillStyle = GRAY;
    ['Precios sujetos a confirmación de diseño y disponibilidad.', s && s.whatsapp ? 'WhatsApp: +' + s.whatsapp : ''].filter(Boolean).forEach(t => { ctx.fillText(t, W / 2, y); y += 18; });
    ctx.textAlign = 'left';
    return y + 30;
  }

  async function build(q, settings) {
    try { await Promise.all([document.fonts.load("800 20px 'Montserrat'"), document.fonts.load("500 13px 'JB'")]); } catch (e) { }
    const logo = await loadLogo();
    const probe = document.createElement('canvas'); probe.width = W; probe.height = 4000;
    const H = Math.ceil(paint(probe.getContext('2d'), 4000, q, settings, logo));
    const c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR;
    const ctx = c.getContext('2d'); ctx.scale(DPR, DPR);
    paint(ctx, H, q, settings, logo);
    return c;
  }
  return { build };
})();

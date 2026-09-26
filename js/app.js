/* Draguz Shop — app principal */
(function () {
  'use strict';
  const DB = window.DB, CFG = window.DRAGUZ_CONFIG || {}, P = window.Pricing, L = window.Loyalty;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const money = P.money;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const S = {
    catalog: [], extras: [], stock: [], settings: {}, user: null, isAdmin: false, cat: 'Todo', draft: null,
    quote: (function () { try { return JSON.parse(localStorage.getItem('dz_quote')) || null; } catch (e) { return null; } })() || { lines: [], customer: { name: '', phone: '', notes: '' } }
  };
  const persist = () => localStorage.setItem('dz_quote', JSON.stringify(S.quote));

  /* ───── utilidades UI ───── */
  let tt;
  function toast(m, err) { const t = $('#toast'); t.textContent = m; t.className = 'show' + (err ? ' err' : ''); clearTimeout(tt); tt = setTimeout(() => { t.className = ''; }, 3400); }
  function openModal(html, opts) {
    opts = opts || {}; const root = $('#modal-root');
    root.innerHTML = `<div class="modal-bg"><div class="modal ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true"><button class="modal-x" aria-label="Cerrar">×</button>${html}</div></div>`;
    const bg = $('.modal-bg', root);
    bg.addEventListener('mousedown', e => { if (e.target === bg) closeModal(); });
    $('.modal-x', root).onclick = closeModal; document.body.classList.add('noscroll');
    return $('.modal', root);
  }
  function closeModal() { $('#modal-root').innerHTML = ''; document.body.classList.remove('noscroll'); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  function resizeImage(file, max, q) {
    max = max || 700; q = q || .72;
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const im = new Image();
        im.onload = () => {
          const k = Math.min(1, max / Math.max(im.width, im.height));
          const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', q));
        };
        im.onerror = () => rej(new Error('No se pudo leer la imagen')); im.src = fr.result;
      };
      fr.onerror = () => rej(new Error('No se pudo leer el archivo')); fr.readAsDataURL(file);
    });
  }

  /* ───── datos ───── */
  const byOrder = (a, b) => (a.order || 999) - (b.order || 999) || String(a.name).localeCompare(b.name);
  async function loadAll() {
    const [c, e, s, st] = await Promise.all([DB.list('catalog'), DB.list('extras'), DB.list('stock'), DB.getSettings()]);
    S.catalog = c.sort(byOrder); S.extras = e.sort(byOrder); S.stock = s.sort(byOrder); S.settings = st;
  }
  async function reload() { await loadAll(); renderHome(); }
  const imgOf = p => (p.images && p.images[0]) || window.ph(p.kind || 'tee', (p.colors && p.colors[0] && p.colors[0].hex) || '#1a1a1f');
  const activeStock = () => S.stock.filter(x => x.active !== false);
  const activeCat = () => S.catalog.filter(x => x.active !== false);
  const activeExtras = () => S.extras.filter(x => x.active !== false);

  /* ───── HERO ───── */
  const SLIDES = [
    { img: 'assets/img/cap.jpg', k: 'Streetwear a tu medida', t: 'Define your <em>different</em>', p: 'Playeras, hoodies y gorras personalizadas con DTF, UV y vinil.', a: ['Cotizar ahora', '#/cotizador'], b: ['Ver stock', '#/stock'] },
    { img: 'assets/img/box_dark.jpg', k: 'Unboxing premium', t: 'Cada pedido, en caja negra', p: 'Empaque mate, hang tag y detalles con tu identidad.', a: ['Ver stock', '#/stock'] },
    { img: 'assets/img/tag_h.jpg', k: 'Mayoreo', t: 'Más piezas, <em>mejor precio</em>', p: 'Arma tu cotización y mira el precio de menudeo o mayoreo al instante.', a: ['Cotizar mayoreo', '#/cotizador'] }
  ];
  let hi = 0, ht;
  function renderHero() {
    const h = $('#hero');
    h.innerHTML = SLIDES.map((s, i) => `<div class="slide ${i === hi ? 'on' : ''}" style="background-image:url(${s.img})"><div class="wrap"><div class="slide-txt"><span class="kicker">${s.k}</span><h1>${s.t}</h1><p>${s.p}</p><div class="row"><a class="btn" href="${s.a[1]}">${s.a[0]}</a>${s.b ? `<a class="btn ghost" href="${s.b[1]}">${s.b[0]}</a>` : ''}</div></div></div></div>`).join('')
      + '<button class="arrow prev" aria-label="Anterior">‹</button><button class="arrow next" aria-label="Siguiente">›</button><div class="dots">' + SLIDES.map((_, i) => `<button class="${i === hi ? 'on' : ''}" data-i="${i}" aria-label="Ir a ${i + 1}"></button>`).join('') + '</div>';
  }
  function goSlide(i) {
    hi = (i + SLIDES.length) % SLIDES.length;
    $$('#hero .slide').forEach((s, k) => s.classList.toggle('on', k === hi));
    $$('#hero .dots button').forEach((s, k) => s.classList.toggle('on', k === hi));
    clearInterval(ht); ht = setInterval(() => goSlide(hi + 1), 6500);
  }

  /* ───── STOCK ───── */
  function renderStock() {
    const items = activeStock();
    const cats = ['Todo', ...new Set(items.map(x => x.category).filter(Boolean))];
    if (!cats.includes(S.cat)) S.cat = 'Todo';
    $('#stock-tabs').innerHTML = cats.map(c => `<button class="${c === S.cat ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    const list = items.filter(x => S.cat === 'Todo' || x.category === S.cat);
    $('#stock-grid').innerHTML = list.length ? list.map(p => {
      const q = +p.qty || 0, badge = q <= 0 ? '<span class="badge">Agotado</span>' : q <= 3 ? '<span class="badge red">Últimas piezas</span>' : '';
      return `<article class="card" data-id="${p.id}" tabindex="0"><div class="card-img"><img loading="lazy" src="${imgOf(p)}" alt="${esc(p.name)}">${badge}</div><div class="card-body"><span class="cat">${esc(p.category)}</span><h3>${esc(p.name)}</h3><div class="price">${money(p.price)}</div></div></article>`;
    }).join('') : '<div class="empty">Pronto subiremos piezas nuevas. Mientras tanto, cotiza lo tuyo abajo.</div>';
  }
  function openStock(id) {
    const p = S.stock.find(x => x.id === id); if (!p) return;
    const imgs = (p.images && p.images.length) ? p.images : [imgOf(p)];
    const q = +p.qty || 0;
    const m = openModal(`<div class="pgal"><div><div class="main"><img id="pg-main" src="${imgs[0]}" alt="${esc(p.name)}"></div>${imgs.length > 1 ? '<div class="thumbs">' + imgs.map((s, i) => `<button class="${i ? '' : 'on'}" data-i="${i}"><img src="${s}" alt=""></button>`).join('') + '</div>' : ''}</div>
      <div class="pinfo"><span class="tag">${esc(p.category)}</span><h3>${esc(p.name)}</h3><div class="price">${money(p.price)}</div>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      ${(p.sizes || []).length ? `<span class="lbl">Tallas</span><div class="chips">${p.sizes.map(s => `<span>${esc(s)}</span>`).join('')}</div>` : ''}
      <p class="tag">${q > 0 ? q + ' en stock' : 'Agotado por ahora'}</p>
      <button class="btn" id="st-wa" ${q <= 0 ? 'disabled' : ''}>Apartar por WhatsApp</button>
      <a class="btn ghost" href="#/cotizador" id="st-custom">Quiero algo personalizado</a></div></div>`, { wide: true });
    $$('.thumbs button', m).forEach(b => b.onclick = () => { $('#pg-main', m).src = imgs[+b.dataset.i]; $$('.thumbs button', m).forEach(x => x.classList.toggle('on', x === b)); });
    $('#st-wa', m).onclick = () => openWA(`Hola Draguz Shop, quiero apartar: ${p.name} (${money(p.price)}). ¿Sigue disponible?`);
    $('#st-custom', m).onclick = closeModal;
  }
  function openWA(text) {
    const n = (S.settings.whatsapp || CFG.whatsapp || '').replace(/\D/g, '');
    if (!n) { toast('Aún no hay número de WhatsApp configurado (Admin › Ajustes).', true); return false; }
    window.open('https://wa.me/' + n + '?text=' + encodeURIComponent(text), '_blank', 'noopener'); return true;
  }

  /* ───── PROMOS ───── */
  function renderPromos() {
    const cats = [...new Set(activeCat().map(x => x.category))];
    const first = k => (activeCat().find(x => x.category === k) || activeCat()[0] || {}).id || '';
    const tiles = [
      { img: 'assets/img/tag_v1.jpg', k: 'Playeras y polos', t: 'Tu marca en cada prenda', cat: 'Playeras' },
      { img: 'assets/img/cap.jpg', k: 'Gorras y accesorios', t: 'Detalles que se notan', cat: 'Gorras' },
      { img: 'assets/img/box_dark.jpg', k: 'Acabado premium', t: 'Tu diseño, en tu prenda', cat: 'Hoodies' }
    ];
    $('#promos').innerHTML = tiles.map(t => `<a class="promo" href="#/cotizador" data-pid="${first(t.cat)}" style="background-image:url(${t.img})"><div><span class="kicker">${t.k}</span><h3>${t.t}</h3><span class="btn sm ghost">Cotizar</span></div></a>`).join('')
      + `<a class="promo solid" href="#/cotizador"><div><span class="kicker" style="color:#fff">Precio por volumen</span><div class="big">Mayoreo</div><p style="margin:10px 0 16px;color:#cfcfe0">Más piezas, mejor precio unitario.</p><span class="btn sm">Ver precios</span></div></a>`;
  }

  /* ───── COTIZADOR ───── */
  function renderQProducts() {
    const list = activeCat();
    $('#q-products').innerHTML = list.length ? list.map(p => `<button class="qp ${S.draft && S.draft.productId === p.id ? 'on' : ''}" data-id="${p.id}"><div class="im"><img src="${imgOf(p)}" alt=""></div><div class="tx"><b>${esc(p.name)}</b><span>desde ${money(p.priceMayoreo || p.priceMenudeo)}</span></div></button>`).join('') : '<div class="q-empty">El catálogo aún está vacío.</div>';
  }
  function startDraft(pid) {
    const p = S.catalog.find(x => x.id === pid); if (!p) return;
    S.draft = { productId: pid, color: (p.colors && p.colors[0] && p.colors[0].name) || '', cut: (p.cuts && p.cuts[0]) || '', sizes: {}, qty: 0, extraIds: [], notes: '' };
    renderQProducts(); renderConfig();
  }
  function draftCalc() { const p = S.catalog.find(x => x.id === S.draft.productId); return { p, c: P.calcLine(S.draft, p, S.extras) }; }
  function renderConfig() {
    const box = $('#q-config'), d = S.draft;
    if (!d) { box.hidden = true; return; }
    const p = S.catalog.find(x => x.id === d.productId); if (!p) { box.hidden = true; return; }
    const hasSizes = (p.sizes || []).length > 0;
    box.hidden = false;
    box.innerHTML = `<div class="cfg-head"><h3><b>2</b> Configura: ${esc(p.name)}</h3><button class="link" data-act="cancel">Cambiar</button></div>
      ${p.description ? `<p class="hint" style="margin:0">${esc(p.description)}</p>` : ''}
      ${(p.colors || []).length ? `<div class="cfg-block"><span class="lbl">Color</span><div class="swatches">${p.colors.map(c => `<button class="sw ${c.name === d.color ? 'on' : ''}" data-color="${esc(c.name)}" title="${esc(c.name)}" style="--c:${esc(c.hex)}" aria-label="${esc(c.name)}"></button>`).join('')}<span class="hint">${esc(d.color)}</span></div></div>` : ''}
      ${(p.cuts || []).length ? `<div class="cfg-block"><span class="lbl">Corte</span><div class="cut-chips">${p.cuts.map(c => `<button type="button" class="${c === d.cut ? 'on' : ''}" data-cut="${esc(c)}">${esc(c)}</button>`).join('')}</div></div>` : ''}
      <div class="cfg-block"><span class="lbl">${hasSizes ? 'Cantidad por talla' : 'Cantidad'}</span>
      ${hasSizes ? `<div class="sizes">${p.sizes.map(s => `<label class="size"><span>${esc(s)}</span>${(p.sizeExtra || {})[s] ? `<i>+${money(p.sizeExtra[s])}</i>` : ''}<input type="number" min="0" inputmode="numeric" data-size="${esc(s)}" value="${d.sizes[s] || ''}" placeholder="0"></label>`).join('')}</div>`
        : `<input type="number" min="0" inputmode="numeric" id="qty-input" value="${d.qty || ''}" placeholder="0" style="max-width:160px">`}</div>
      ${activeExtras().length ? `<div class="cfg-block"><span class="lbl">Personalización y extras</span>${activeExtras().map(e => `<label class="check"><input type="checkbox" data-extra="${e.id}" ${d.extraIds.includes(e.id) ? 'checked' : ''}><span>${esc(e.name)}<em>+${money(e.price)} ${e.scope === 'unico' ? 'único' : 'c/u'}</em></span></label>`).join('')}</div>` : ''}
      <div class="cfg-block"><span class="lbl">Notas de esta línea (opcional)</span><textarea id="line-notes" rows="2" placeholder="Ubicación del diseño, colores de tinta, etc.">${esc(d.notes)}</textarea></div>
      <div class="live" id="live"></div>
      <button class="btn" data-act="add">Agregar a la cotización</button>`;
    updateLive();
  }
  function updateLive() {
    const el = $('#live'); if (!el || !S.draft) return;
    const { p, c } = draftCalc();
    if (c.qty <= 0) { el.innerHTML = 'Escribe cuántas piezas quieres para ver el precio.'; return; }
    const mayor = c.tier === 'Mayoreo';
    el.innerHTML = `<b>${c.qty}</b> pzas · precio <b>${c.tier}</b> ${money(c.unit)} c/u`
      + (!mayor && c.faltan ? `<br>Te faltan <b>${c.faltan}</b> pzas para precio de mayoreo (${money(p.priceMayoreo)} c/u).` : '')
      + `<span class="big">${money(c.subtotal)}</span>`;
  }
  function addLine() {
    const { p, c } = draftCalc();
    if (c.qty <= 0) { toast('Agrega al menos una pieza.', true); return; }
    const d = S.draft;
    S.quote.lines.push({ lid: Math.random().toString(36).slice(2, 9), productId: d.productId, color: d.color, cut: d.cut || '', sizes: Object.fromEntries(Object.entries(d.sizes).filter(([, n]) => +n > 0)), qty: (p.sizes || []).length ? 0 : d.qty, extraIds: d.extraIds.slice(), notes: d.notes });
    persist(); S.draft = null; renderQProducts(); renderConfig(); refreshSummary();
    toast('Agregado a tu cotización'); $('#q-right').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function snap() { return P.snapshot(S.quote, S.catalog, S.extras, S.settings); }
  let tpt;
  function refreshSummary() {
    const q = snap(); const n = q.lines.length;
    const cnt = $('#quote-count'); cnt.textContent = n; cnt.dataset.n = n;
    $('#q-lines').innerHTML = n ? q.lines.map(l => {
      const sz = Object.entries(l.sizes).filter(([, v]) => +v > 0).map(([k, v]) => `${k}×${v}`).join(' ');
      return `<div class="ql"><button class="rm" data-rm="${l.lid}" aria-label="Quitar">×</button><b>${esc(l.name)}</b><small>${[l.cut, l.color, sz].filter(Boolean).map(esc).join(' · ')}<br>${l.qty} pzas · ${l.tier} ${money(l.unit)} c/u${l.extras.length ? '<br>+ ' + l.extras.map(e => esc(e.name)).join(', ') : ''}</small><div class="sub"><span></span><span>${money(l.subtotal)}</span></div></div>`;
    }).join('') : '<div class="q-empty">Aún no agregas nada. Elige un producto a la izquierda.</div>';
    $('#q-totals').innerHTML = n ? `<div class="tot"><span>Total</span><b>${money(q.total)}</b></div>${q.anticipoPct ? `<div class="tot-sub"><span>Anticipo ${q.anticipoPct} %</span><span>${money(q.anticipo)}</span></div>` : ''}<div class="tot-sub"><span>Vigencia</span><span>${q.validityDays} días</span></div>` : '';
    ['q-send', 'q-wa', 'q-dl', 'q-clear'].forEach(id => { $('#' + id).disabled = !n; });
    $('#q-clear').hidden = !n;
    clearTimeout(tpt);
    if (!n) { $('#ticket-prev').hidden = true; return; }
    tpt = setTimeout(async () => {
      const c = await window.Ticket.build(snap(), S.settings); const cv = $('#ticket-canvas');
      cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0); $('#ticket-prev').hidden = false;
    }, 180);
  }
  async function downloadTicket(q) {
    q = q || snap(); const c = await window.Ticket.build(q, S.settings);
    c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = q.folio + '.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
  }
  async function showTicket(q) {
    const m = openModal('<h3 class="m-title">Cotización ' + esc(q.folio) + '</h3><p class="m-sub">Puedes descargarla como imagen.</p><canvas id="mt" style="width:100%;border-radius:4px"></canvas><div style="display:flex;gap:10px;margin-top:18px"><button class="btn" id="mt-dl">Descargar PNG</button></div>', { wide: true });
    const c = await window.Ticket.build(q, S.settings); const cv = $('#mt', m); cv.width = c.width; cv.height = c.height; cv.getContext('2d').drawImage(c, 0, 0);
    $('#mt-dl', m).onclick = () => downloadTicket(q);
  }
  function waText(q) {
    const L = q.lines.map(l => { const sz = Object.entries(l.sizes).filter(([, v]) => +v > 0).map(([k, v]) => `${k}×${v}`).join(' '); return `• ${l.name}${l.cut ? ' ' + l.cut : ''}${l.color ? ' (' + l.color + ')' : ''} — ${l.qty} pzas${sz ? ' [' + sz + ']' : ''} = ${money(l.subtotal)}`; }).join('\n');
    return `Hola Draguz Shop, quiero cotizar:\n${L}\nTotal: ${money(q.total)}\nFolio: ${q.folio}${q.customer.name ? '\nNombre: ' + q.customer.name : ''}${q.customer.notes ? '\nNotas: ' + q.customer.notes : ''}${L.normCode(S.quote.cardCode) ? '\nTarjeta: ' + L.normCode(S.quote.cardCode) : ''}`;
  }
  async function sendRequest() {
    const q = snap(); if (!q.lines.length) return;
    // Sin cuenta: basta con nombre y WhatsApp para poder contactarlo
    if (!S.user) {
      const name = (q.customer.name || '').trim(), phone = (q.customer.phone || '').replace(/\D/g, '');
      if (!name) { toast('Escribe tu nombre para enviar la solicitud.', true); $('#q-name').focus(); return; }
      if (phone.length < 10) { toast('Escribe tu WhatsApp (10 dígitos) para que te contactemos.', true); $('#q-phone').focus(); return; }
    }
    const btn = $('#q-send'); btn.disabled = true;
    try {
      const who = S.user
        ? { uid: S.user.uid, email: S.user.email, name: q.customer.name || S.user.name }
        : { uid: null, guest: true, email: '', name: q.customer.name.trim(), customer: Object.assign({}, q.customer, { name: q.customer.name.trim(), phone: q.customer.phone.replace(/\D/g, '') }) };
      await DB.save('quotes', Object.assign({}, q, who, { cardCode: L.normCode(S.quote.cardCode), status: 'nueva', createdAt: Date.now() }));
      toast('¡Solicitud enviada! ' + q.folio + (S.user ? '' : ' · Te contactaremos por WhatsApp')); S.quote = { lines: [], customer: S.quote.customer, cardCode: S.quote.cardCode }; persist(); refreshSummary();
    } catch (e) { toast(DB.friendlyError(e), true); } finally { btn.disabled = false; }
  }

  /* ───── AUTH ───── */
  function openAuth(mode, after) {
    let m = mode || 'login';
    const draw = () => {
      const el = openModal(`<h3 class="m-title">${m === 'login' ? 'Entrar' : 'Crear cuenta'}</h3><p class="m-sub">${m === 'login' ? 'Accede para guardar tus cotizaciones y ver tu historial.' : 'Guarda tus cotizaciones y síguelas desde tu cuenta.'}</p>
      <div class="mtabs"><button data-m="login" class="${m === 'login' ? 'on' : ''}">Entrar</button><button data-m="signup" class="${m === 'signup' ? 'on' : ''}">Crear cuenta</button></div>
      <form class="fcol" id="auth-f">${m === 'signup' ? '<input name="name" placeholder="Tu nombre" autocomplete="name" required>' : ''}<input name="email" type="email" placeholder="Correo" autocomplete="email" required><input name="pw" type="password" placeholder="Contraseña (mín. 6 caracteres)" autocomplete="${m === 'login' ? 'current-password' : 'new-password'}" minlength="6" ${DB.mode === 'demo' ? '' : 'required'}><div class="err" id="auth-err"></div><button class="btn">${m === 'login' ? 'Entrar' : 'Crear cuenta'}</button></form>
      <div class="sep">o</div><button class="btn ghost" id="g-btn" style="width:100%">Continuar con Google</button>`);
      $$('.mtabs button', el).forEach(b => b.onclick = () => { m = b.dataset.m; draw(); });
      const done = () => { closeModal(); toast('Sesión iniciada'); if (after) setTimeout(after, 250); };
      $('#auth-f', el).onsubmit = async e => {
        e.preventDefault(); const f = new FormData(e.target), btn = $('.btn', e.target); btn.disabled = true; $('#auth-err', el).textContent = '';
        try { if (m === 'login') await DB.signIn(f.get('email'), f.get('pw')); else await DB.signUp(f.get('email'), f.get('pw'), f.get('name')); done(); }
        catch (er) { $('#auth-err', el).textContent = DB.friendlyError(er); btn.disabled = false; }
      };
      $('#g-btn', el).onclick = async () => { try { await DB.signInGoogle(); done(); } catch (er) { $('#auth-err', el).textContent = DB.friendlyError(er); } };
    };
    draw();
  }

  /* ───── CUENTA ───── */
  const ST = { nueva: 'Nueva', proceso: 'En proceso', cotizada: 'Cotizada', cerrada: 'Cerrada', cancelada: 'Cancelada' };
  async function renderAccount() {
    const v = $('#view-account');
    if (!S.user) { v.innerHTML = '<span class="kicker"><i class="slash"></i>Mi cuenta</span><h1>Entra a tu cuenta</h1><p class="sub" style="color:var(--mute);margin-bottom:22px">Inicia sesión para ver tus cotizaciones.</p><button class="btn" id="acc-login">Entrar o crear cuenta</button>'; $('#acc-login').onclick = () => openAuth('login'); return; }
    v.innerHTML = `<div class="acc-head"><div><span class="kicker"><i class="slash"></i>Mi cuenta</span><h1 style="margin-bottom:6px">Hola, ${esc(S.user.name)}</h1><span class="tag">${esc(S.user.email)}</span></div><div style="display:flex;gap:10px">${S.isAdmin ? '<a class="btn ghost sm" href="#/admin">Panel admin</a>' : ''}<button class="btn ghost sm" id="acc-out">Cerrar sesión</button></div></div><h3 class="lbl">Mis cotizaciones</h3><div id="acc-list" class="tblwrap"><div class="q-empty" style="border:0">Cargando…</div></div>`;
    $('#acc-out').onclick = async () => { await DB.signOut(); location.hash = '#/'; };
    try {
      const qs = (await DB.list('quotes', { mine: true })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      $('#acc-list').innerHTML = qs.length ? `<table class="tbl"><thead><tr><th>Folio</th><th>Fecha</th><th>Piezas</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody>${qs.map(q => `<tr><td><b>${esc(q.folio)}</b></td><td>${new Date(q.createdAt || q.date).toLocaleDateString('es-MX')}</td><td>${q.lines.reduce((a, l) => a + l.qty, 0)}</td><td>${money(q.total)}</td><td><span class="st ${q.status}">${ST[q.status] || q.status}</span></td><td class="acts"><button class="btn ghost sm" data-ticket="${q.id}">Ver ticket</button></td></tr>`).join('')}</tbody></table>` : '<div class="q-empty" style="border:0">Todavía no has enviado cotizaciones.</div>';
      $$('[data-ticket]', v).forEach(b => b.onclick = () => showTicket(qs.find(q => q.id === b.dataset.ticket)));
    } catch (e) { $('#acc-list').innerHTML = '<div class="q-empty" style="border:0">' + esc(DB.friendlyError(e)) + '</div>'; }
  }

  /* ───── TARJETA DE CLIENTE ───── */
  function rememberCard(code) {
    try { localStorage.setItem('dz_card', code); } catch (e) { }
    S.quote.cardCode = code; persist();
    const i = $('#q-card'); if (i && i.value !== code) { i.value = code; checkCard(); }
  }
  const firstName = n => String(n || '').trim().split(/\s+/)[0] || '';
  async function renderCard(raw) {
    const v = $('#view-card'), code = L.normCode(raw);
    const head = '<span class="kicker"><i class="slash"></i>Tarjeta de cliente</span>';
    if (!code) {
      v.innerHTML = `${head}<h1>Mi tarjeta</h1><p class="sub muted">Escribe el código que viene en tu tarjeta Draguz, o escanea su QR con la cámara.</p>
        <form id="card-find" class="card-find"><input name="code" placeholder="DZ-0000-XXX" required maxlength="16" autocomplete="off" value="${esc(raw || '')}"><button class="btn">Ver mi tarjeta</button></form>
        ${raw ? '<p class="err">Ese código no es válido. Revisa que esté completo, por ejemplo DZ-0147-K7Q.</p>' : ''}`;
      $('#card-find').onsubmit = e => { e.preventDefault(); const t = String(new FormData(e.target).get('code') || '').trim(); location.hash = '#/tarjeta/' + (L.normCode(t) || encodeURIComponent(t)); };
      return;
    }
    v.innerHTML = `${head}<h1>Mi tarjeta</h1><div class="q-empty">Cargando…</div>`;
    let card;
    try { card = await DB.get('cards', code); } catch (e) { v.innerHTML = `${head}<h1>Mi tarjeta</h1><p class="err">${esc(DB.friendlyError(e))}</p>`; return; }
    if (!card) { v.innerHTML = `${head}<h1>Mi tarjeta</h1><p class="err">No encontramos la tarjeta <b>${esc(code)}</b>. Revisa el código.</p><a class="btn ghost" href="#/tarjeta">Probar otro código</a>`; return; }
    const st = L.status(card, S.settings);
    const perks = `<ul class="perks">${st.pct ? `<li><b>${st.every}ª compra:</b> ${st.pct}% de descuento, y el ciclo vuelve a empezar.</li>` : ''}<li><b>1ª compra:</b> participas en el sorteo del mes${st.prize ? ' (' + esc(st.prize) + ')' : ''}.</li>${st.min ? `<li>Cuentan las compras desde ${money(st.min)}.</li>` : ''}</ul>`;

    if (card.status !== 'activa') {
      v.innerHTML = `${head}<h1>Activa tu tarjeta</h1><p class="sub muted">Tarjeta <b>${esc(code)}</b>. Regístrala una sola vez para empezar a acumular tus compras.</p>
        <div class="card-cols"><form id="card-reg" class="fcol card-reg"><input name="name" placeholder="Tu nombre" required maxlength="80" autocomplete="name"><input name="phone" type="tel" placeholder="Tu WhatsApp (10 dígitos)" required maxlength="20" autocomplete="tel"><div class="err" id="card-err"></div><button class="btn">Activar mi tarjeta</button></form>
        <div class="card-perks"><h3 class="lbl">Beneficios</h3>${perks}</div></div>`;
      $('#card-reg').onsubmit = async e => {
        e.preventDefault(); const f = new FormData(e.target), btn = $('.btn', e.target);
        const name = String(f.get('name') || '').trim(), phone = String(f.get('phone') || '').replace(/\D/g, '');
        if (phone.length < 10) { $('#card-err').textContent = 'Escribe tu WhatsApp completo (10 dígitos).'; return; }
        btn.disabled = true;
        try {
          await DB.save('cards', Object.assign({}, card, { status: 'activa', name, phone, activatedAt: Date.now() }));
          rememberCard(code); toast('¡Tarjeta activada!'); renderCard(code);
        } catch (er) { $('#card-err').textContent = DB.friendlyError(er); btn.disabled = false; }
      };
      return;
    }

    rememberCard(code);
    const stamps = Array.from({ length: st.every }, (_, i) => {
      const n = i + 1, gift = n === st.every && st.pct;
      return `<span class="stamp ${n <= st.filled ? 'on' : ''} ${gift ? 'gift' : ''}">${gift ? st.pct + '%' : n}</span>`;
    }).join('');
    const msg = !st.pct ? `Llevas <b>${st.done}</b> compras registradas.`
      : st.nextHasDiscount ? `<b>¡Tu próxima compra tiene ${st.pct}% de descuento!</b>`
      : `Llevas <b>${st.filled}</b> de ${st.every}. Te ${st.left === 1 ? 'falta <b>1</b> compra' : `faltan <b>${st.left}</b> compras`} y la siguiente tiene <b>${st.pct}% de descuento</b>.`;
    const raffle = st.nextIsFirst ? `Con tu primera compra participas en el sorteo del mes${st.prize ? ': <b>' + esc(st.prize) + '</b>' : ''}.`
      : card.firstPurchaseAt ? `Participaste en el sorteo de <b>${L.monthName(L.monthKey(card.firstPurchaseAt))}</b>.` : '';
    v.innerHTML = `${head}<div class="lcard"><div class="lc-top"><img src="assets/img/logo.png" alt="Draguz Shop"><span class="lc-code">${esc(code)}</span></div>
      <h2>Hola, ${esc(firstName(card.name))}</h2><div class="stamps">${stamps}</div><p class="lc-msg">${msg}</p>${raffle ? `<p class="lc-raffle">🎟️ ${raffle}</p>` : ''}</div>
      <div class="card-actions"><a class="btn" href="#/cotizador">Cotizar con mi tarjeta</a><button class="btn ghost" id="card-wa">Escribir por WhatsApp</button></div>
      <div class="card-perks"><h3 class="lbl">Cómo funciona</h3>${perks}<p class="tag" style="text-transform:none;letter-spacing:.02em">Tus compras se registran cuando recibes tu pedido. Guarda esta página o tu tarjeta física.</p></div>`;
    $('#card-wa').onclick = () => openWA(`Hola Draguz Shop, tengo la tarjeta ${code}.`);
  }

  let ckt;
  function checkCard() {
    const inp = $('#q-card'), hint = $('#q-card-hint'); if (!inp) return;
    clearTimeout(ckt);
    const raw = inp.value.trim(), code = L.normCode(raw);
    hint.className = 'q-card-hint';
    if (!raw) { hint.textContent = ''; return; }
    if (!code) { hint.textContent = 'Código incompleto (ej. DZ-0147-K7Q).'; return; }
    hint.textContent = 'Buscando tarjeta…';
    ckt = setTimeout(async () => {
      let card = null; try { card = await DB.get('cards', code); } catch (e) { }
      if (L.normCode(inp.value) !== code) return;
      if (!card) { hint.textContent = 'No encontramos esa tarjeta.'; hint.classList.add('bad'); return; }
      if (card.status !== 'activa') { hint.innerHTML = `Tarjeta sin activar. <a href="#/tarjeta/${code}">Actívala aquí</a>.`; return; }
      const st = L.status(card, S.settings);
      hint.classList.add('ok');
      hint.innerHTML = `✓ Tarjeta de ${esc(firstName(card.name))} · ` + (st.nextHasDiscount ? `<b>esta compra lleva ${st.pct}% de descuento</b>` : st.pct ? `sería tu compra ${st.filled + 1} de ${st.every}` : `${st.done} compras registradas`);
    }, 350);
  }

  /* ───── RUTAS ───── */
  const SECTIONS = ['stock', 'personaliza', 'cotizador', 'proceso', 'contacto'];
  function show(name) { ['home', 'account', 'admin', 'card'].forEach(n => { $('#view-' + n).hidden = n !== name; }); document.body.classList.toggle('in-admin', name === 'admin'); }
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    if (h === 'cuenta') { show('account'); renderAccount(); window.scrollTo(0, 0); }
    else if (h === 'tarjeta' || h.startsWith('tarjeta/')) { show('card'); renderCard(decodeURIComponent(h.slice(8))); window.scrollTo(0, 0); }
    else if (h === 'admin') {
      if (!S.isAdmin && S.adminPending) { show('home'); return; }
      if (!S.isAdmin) { show('home'); if (S.user) toast('Tu cuenta no tiene permisos de administrador.', true); else openAuth('login'); return; }
      show('admin'); window.Admin.render(); window.scrollTo(0, 0);
    } else {
      show('home');
      if (SECTIONS.includes(h)) { const el = document.getElementById(h); if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 30); }
      else if (!h) window.scrollTo(0, 0);
    }
  }

  /* ───── render global ───── */
  function renderHome() {
    renderStock(); renderPromos(); renderQProducts(); renderConfig(); refreshSummary();
    const wa = (S.settings.whatsapp || CFG.whatsapp || '').replace(/\D/g, '');
    $('#ft-wa').href = wa ? 'https://wa.me/' + wa : '#'; $('#ft-wa').hidden = !wa;
    $('#wa-float').href = wa ? 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hola Draguz Shop, quiero información.') : '#';
    $('#wa-float').hidden = !wa;
    if (CFG.facebook) { $('#ft-fb').href = CFG.facebook; $('#ft-fb').hidden = false; }
    $('#q-name').value = S.quote.customer.name || ''; $('#q-phone').value = S.quote.customer.phone || ''; $('#q-notes').value = S.quote.customer.notes || '';
    if (!S.quote.cardCode) { try { S.quote.cardCode = localStorage.getItem('dz_card') || ''; } catch (e) { } }
    $('#q-card').value = S.quote.cardCode || ''; checkCard();
  }

  function bind() {
    $('#hero').addEventListener('click', e => {
      if (e.target.closest('.prev')) goSlide(hi - 1); else if (e.target.closest('.next')) goSlide(hi + 1);
      else { const d = e.target.closest('.dots button'); if (d) goSlide(+d.dataset.i); }
    });
    $('#stock-tabs').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { S.cat = b.dataset.cat; renderStock(); } });
    $('#stock-grid').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) openStock(c.dataset.id); });
    $('#stock-grid').addEventListener('keydown', e => { if (e.key === 'Enter') { const c = e.target.closest('.card'); if (c) openStock(c.dataset.id); } });
    $('#promos').addEventListener('click', e => { const p = e.target.closest('[data-pid]'); if (p && p.dataset.pid) setTimeout(() => startDraft(p.dataset.pid), 120); });
    $('#q-products').addEventListener('click', e => { const b = e.target.closest('.qp'); if (b) { startDraft(b.dataset.id); setTimeout(() => $('#q-config').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60); } });
    const cfg = $('#q-config');
    cfg.addEventListener('click', e => {
      const c = e.target.closest('[data-color]'); if (c) { S.draft.color = c.dataset.color; renderConfig(); return; }
      const ct = e.target.closest('[data-cut]'); if (ct) { S.draft.cut = ct.dataset.cut; renderConfig(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act === 'cancel') { S.draft = null; renderQProducts(); renderConfig(); } else if (a.dataset.act === 'add') addLine();
    });
    cfg.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.size !== undefined) S.draft.sizes[t.dataset.size] = Math.max(0, parseInt(t.value) || 0);
      else if (t.id === 'qty-input') S.draft.qty = Math.max(0, parseInt(t.value) || 0);
      else if (t.id === 'line-notes') S.draft.notes = t.value;
      updateLive();
    });
    cfg.addEventListener('change', e => { const x = e.target.dataset.extra; if (x) { const s = new Set(S.draft.extraIds); e.target.checked ? s.add(x) : s.delete(x); S.draft.extraIds = [...s]; updateLive(); } });
    $('#q-lines').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { S.quote.lines = S.quote.lines.filter(l => l.lid !== b.dataset.rm); persist(); refreshSummary(); } });
    const cust = () => { S.quote.customer = { name: $('#q-name').value, phone: $('#q-phone').value, notes: $('#q-notes').value }; persist(); refreshSummary(); };
    ['q-name', 'q-phone', 'q-notes'].forEach(id => $('#' + id).addEventListener('input', cust));
    $('#q-card').addEventListener('input', () => { S.quote.cardCode = $('#q-card').value.trim().toUpperCase(); persist(); checkCard(); });
    $('#q-dl').onclick = () => downloadTicket();
    $('#q-wa').onclick = () => openWA(waText(snap()));
    $('#q-send').onclick = sendRequest;
    $('#q-clear').onclick = () => { if (confirm('¿Vaciar tu cotización?')) { S.quote.lines = []; persist(); refreshSummary(); } };
    $('#btn-account').onclick = () => { if (S.user) location.hash = '#/cuenta'; else openAuth('login'); };
    window.addEventListener('hashchange', route);
  }

  async function boot() {
    $('#yr').textContent = new Date().getFullYear();
    if (DB.mode === 'demo') $('#demo-banner').hidden = false;
    renderHero(); goSlide(0); bind();
    DB.onAuth((u, admin, pending) => {
      S.user = u; S.isAdmin = !!admin; S.adminPending = !!pending; $('#btn-admin').hidden = !admin; $('#acc-dot').hidden = !u;
      $('#btn-account').title = u ? u.email : 'Entrar';
      if (window.__booted) route();
    });
    try { await DB.init(); } catch (e) { toast(DB.friendlyError(e), true); }
    try { await loadAll(); } catch (e) { toast('No se pudo cargar el catálogo: ' + DB.friendlyError(e), true); }
    renderHome(); window.__booted = true; route();
  }

  window.DZ = { S, DB, $, $$, money, esc, toast, openModal, closeModal, reload, resizeImage, showTicket, boot, imgOf };
})();

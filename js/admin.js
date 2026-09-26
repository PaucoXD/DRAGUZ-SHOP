/* Panel de administración */
window.Admin = (function () {
  'use strict';
  const { S, DB, $, $$, money, esc, toast, openModal, closeModal, reload, resizeImage, showTicket } = window.DZ;
  const clone = o => JSON.parse(JSON.stringify(o));
  const TABS = [['resumen', 'Resumen'], ['cotizaciones', 'Cotizaciones'], ['tarjetas', 'Tarjetas y lealtad'], ['lisas', 'Inventario lisas'], ['contenido', 'Galería, opiniones y FAQ'], ['stock', 'Stock'], ['catalogo', 'Catálogo personalizable'], ['extras', 'Extras y estampados'], ['ajustes', 'Ajustes']];
  const STATUS = { nueva: 'Nueva', cotizada: 'Cotizada', proceso: 'En proceso', cerrada: 'Cerrada (entregada)', cancelada: 'Cancelada' };
  const KINDS = [['tee', 'Playera'], ['polo', 'Polo'], ['hoodie', 'Hoodie'], ['cap', 'Gorra'], ['mug', 'Taza'], ['bag', 'Bolsa'], ['sticker', 'Sticker']];
  let tab = 'resumen', quotes = [];

  /* ── conversores texto ↔ dato ── */
  const listOut = a => (a || []).join(', ');
  const listIn = t => String(t || '').split(',').map(x => x.trim()).filter(Boolean);
  const pairsOut = o => Object.entries(o || {}).map(([k, v]) => k + ':' + v).join(', ');
  const pairsIn = t => Object.fromEntries(listIn(t).map(x => x.split(':')).filter(p => p[0] && !isNaN(+p[1])).map(p => [p[0].trim(), +p[1]]));
  const colorsOut = a => (a || []).map(c => c.name + ':' + c.hex).join(', ');
  const colorsIn = t => listIn(t).map(x => { const i = x.lastIndexOf(':'); return i > 0 ? { name: x.slice(0, i).trim(), hex: x.slice(i + 1).trim() } : null; }).filter(c => c && /^#[0-9a-f]{3,8}$/i.test(c.hex));

  /* ── formulario genérico ── */
  function fieldHTML(f, v) {
    const val = v[f.key];
    const wrap = (inner, full) => `<div class="${f.full || full ? 'full' : ''}"><label class="l">${f.label}</label>${inner}${f.hint ? `<small>${f.hint}</small>` : ''}</div>`;
    switch (f.type) {
      case 'number': return wrap(`<input type="number" step="any" name="${f.key}" value="${val == null ? '' : val}" ${f.req ? 'required' : ''}>`);
      case 'area': return wrap(`<textarea name="${f.key}" rows="3">${esc(val || '')}</textarea>`, true);
      case 'select': return wrap(`<select name="${f.key}">${f.opts.map(o => `<option value="${o[0]}" ${o[0] === val ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`);
      case 'check': return `<label class="ck"><input type="checkbox" name="${f.key}" ${val !== false ? 'checked' : ''}> ${f.label}</label>`;
      case 'list': return wrap(`<input name="${f.key}" value="${esc(listOut(val))}" placeholder="${f.ph || ''}">`);
      case 'pairs': return wrap(`<input name="${f.key}" value="${esc(pairsOut(val))}" placeholder="${f.ph || ''}">`);
      case 'colors': return wrap(`<input name="${f.key}" value="${esc(colorsOut(val))}" placeholder="${f.ph || ''}">`, true);
      case 'images': return `<div class="full"><label class="l">${f.label}</label><div class="imgs" id="imgs-${f.key}"></div>${f.hint ? `<small>${f.hint}</small>` : ''}<input type="file" id="file-${f.key}" accept="image/*" multiple hidden></div>`;
      default: return wrap(`<input name="${f.key}" value="${esc(val || '')}" ${f.req ? 'required' : ''} ${f.list ? 'list="dl-' + f.key + '"' : ''} placeholder="${f.ph || ''}">${f.list ? `<datalist id="dl-${f.key}">${f.list.map(o => `<option value="${esc(o)}">`).join('')}</datalist>` : ''}`);
    }
  }
  function form(o) {
    const v = clone(o.values || {}), imgState = {};
    const m = openModal(`<h3 class="m-title">${o.title}</h3><form id="af" class="fgrid">${o.fields.map(f => fieldHTML(f, v)).join('')}<div class="f-actions"><button type="button" class="btn ghost" id="af-c">Cancelar</button><button class="btn">Guardar</button></div></form>`, { wide: true });
    o.fields.filter(f => f.type === 'images').forEach(f => {
      imgState[f.key] = (v[f.key] || []).slice();
      const box = $('#imgs-' + f.key, m), file = $('#file-' + f.key, m), max = f.max || 3;
      const draw = () => {
        box.innerHTML = imgState[f.key].map((s, i) => `<div class="im"><img src="${s}" alt=""><button type="button" data-i="${i}" aria-label="Quitar">×</button></div>`).join('') + (imgState[f.key].length < max ? '<div class="add" title="Subir foto">+</div>' : '');
        $$('.im button', box).forEach(b => b.onclick = () => { imgState[f.key].splice(+b.dataset.i, 1); draw(); });
        const add = $('.add', box); if (add) add.onclick = () => file.click();
      };
      file.onchange = async () => {
        for (const fl of [...file.files]) { if (imgState[f.key].length >= max) break; try { imgState[f.key].push(await resizeImage(fl, 700, .72)); } catch (e) { toast('No se pudo procesar ' + fl.name, true); } }
        file.value = ''; draw();
      };
      draw();
    });
    $('#af-c', m).onclick = closeModal;
    $('#af', m).onsubmit = async e => {
      e.preventDefault(); const fd = new FormData(e.target), out = Object.assign({}, o.values || {});
      o.fields.forEach(f => {
        if (f.type === 'images') out[f.key] = imgState[f.key];
        else if (f.type === 'check') out[f.key] = !!fd.get(f.key);
        else if (f.type === 'number') out[f.key] = fd.get(f.key) === '' ? 0 : +fd.get(f.key);
        else if (f.type === 'list') out[f.key] = listIn(fd.get(f.key));
        else if (f.type === 'pairs') out[f.key] = pairsIn(fd.get(f.key));
        else if (f.type === 'colors') out[f.key] = colorsIn(fd.get(f.key));
        else out[f.key] = String(fd.get(f.key) || '').trim();
      });
      const btn = $('.btn:not(.ghost)', e.target); btn.disabled = true;
      try { await o.onSave(out); closeModal(); toast('Guardado'); await refresh(); } catch (er) { toast(DB.friendlyError(er), true); btn.disabled = false; }
    };
  }

  /* ── definiciones por colección ── */
  const cats = () => [...new Set([...S.stock, ...S.catalog].map(x => x.category).filter(Boolean))];
  const DEFS = {
    stock: {
      title: 'Stock', add: 'Nuevo producto en stock', blank: () => ({ name: '', category: '', price: 0, qty: 1, sizes: [], description: '', images: [], active: true }),
      fields: () => [{ key: 'name', label: 'Nombre', req: 1 }, { key: 'category', label: 'Categoría', list: cats(), ph: 'Playeras, Hoodies, Gorras…' }, { key: 'price', label: 'Precio (MXN)', type: 'number', req: 1 }, { key: 'qty', label: 'Piezas disponibles', type: 'number' },
        { key: 'sizes', label: 'Tallas disponibles', type: 'list', ph: 'S, M, L, XL', hint: 'Separadas por coma. Déjalo vacío si no aplica.' }, { key: 'active', label: 'Visible en la tienda', type: 'check' },
        { key: 'description', label: 'Descripción', type: 'area' }, { key: 'images', label: 'Fotos (hasta 3)', type: 'images', max: 3, hint: 'Se comprimen automáticamente. La primera es la portada.' }],
      cols: [['', r => `<img src="${window.DZ.imgOf(r)}" alt="">`], ['Producto', r => `<b>${esc(r.name)}</b><br><span class="tag">${esc(r.category)}</span>`], ['Precio', r => money(r.price)], ['Piezas', r => r.qty > 0 ? r.qty : '<span class="st nueva">Agotado</span>'], ['Visible', r => r.active !== false ? 'Sí' : 'No']]
    },
    catalog: {
      title: 'Catálogo personalizable', add: 'Nuevo producto personalizable', blank: () => ({ name: '', category: '', kind: 'tee', description: '', priceMenudeo: 0, priceMayoreo: 0, mayoreoMin: 12, sizes: [], sizeExtra: {}, cuts: [], colors: [], images: [], active: true, order: 99 }),
      fields: () => [{ key: 'name', label: 'Nombre', req: 1 }, { key: 'category', label: 'Categoría', list: cats() }, { key: 'priceMenudeo', label: 'Precio menudeo (por pieza)', type: 'number', req: 1 }, { key: 'priceMayoreo', label: 'Precio mayoreo (por pieza)', type: 'number', req: 1 },
        { key: 'mayoreoMin', label: 'Mayoreo desde (piezas)', type: 'number' }, { key: 'kind', label: 'Ícono si no hay foto', type: 'select', opts: KINDS },
        { key: 'sizes', label: 'Tallas', type: 'list', ph: 'S, M, L, XL, XXL', hint: 'Vacío = se cotiza por cantidad total (gorras, tazas…).' }, { key: 'sizeExtra', label: 'Recargo por talla (por pieza)', type: 'pairs', ph: 'XXL:20, 3XL:35' },
        { key: 'cuts', label: 'Cortes (opcional)', type: 'list', ph: 'Caballero, Dama, Niño', hint: 'Si lo llenas, el cliente elige el corte y el inventario de lisas lo distingue.' },
        { key: 'colors', label: 'Colores', type: 'colors', ph: 'Negro:#0d0d10, Blanco:#f4f4f4, Rojo:#E3000F', hint: 'Formato Nombre:#hex separados por coma.' }, { key: 'order', label: 'Orden', type: 'number' }, { key: 'active', label: 'Visible en el cotizador', type: 'check' },
        { key: 'description', label: 'Descripción', type: 'area' }, { key: 'images', label: 'Foto (opcional)', type: 'images', max: 1 }],
      cols: [['', r => `<img src="${window.DZ.imgOf(r)}" alt="">`], ['Producto', r => `<b>${esc(r.name)}</b><br><span class="tag">${esc(r.category)}</span>`], ['Menudeo', r => money(r.priceMenudeo)], ['Mayoreo', r => money(r.priceMayoreo) + `<br><span class="tag">desde ${r.mayoreoMin} pzas</span>`], ['Visible', r => r.active !== false ? 'Sí' : 'No']]
    },
    extras: {
      title: 'Extras y estampados', add: 'Nuevo extra', blank: () => ({ name: '', price: 0, scope: 'pieza', hint: '', active: true, order: 99 }),
      fields: () => [{ key: 'name', label: 'Nombre', req: 1, full: 1 }, { key: 'price', label: 'Precio (MXN)', type: 'number', req: 1 }, { key: 'scope', label: 'Se cobra…', type: 'select', opts: [['pieza', 'Por pieza'], ['unico', 'Una sola vez por línea']] }, { key: 'order', label: 'Orden', type: 'number' }, { key: 'active', label: 'Visible en el cotizador', type: 'check' }],
      cols: [['Extra', r => `<b>${esc(r.name)}</b>`], ['Precio', r => money(r.price)], ['Cobro', r => r.scope === 'unico' ? 'Único' : 'Por pieza'], ['Visible', r => r.active !== false ? 'Sí' : 'No']]
    }
  };

  Object.assign(DEFS, {
    gallery: {
      title: 'Trabajos reales', add: 'Nueva foto de trabajo', blank: () => ({ caption: '', category: '', images: [], active: true, order: 99, createdAt: Date.now() }),
      fields: () => [{ key: 'caption', label: 'Descripción corta', ph: 'Playeras para equipo de fútbol' }, { key: 'category', label: 'Categoría', list: cats() }, { key: 'order', label: 'Orden', type: 'number' }, { key: 'active', label: 'Visible en la página', type: 'check' },
        { key: 'images', label: 'Fotos (hasta 4)', type: 'images', max: 4, hint: 'Solo fotos de pedidos reales. Evita que salgan caras o datos del cliente sin su permiso.' }],
      cols: [['', r => r.images && r.images[0] ? `<img src="${r.images[0]}" alt="">` : ''], ['Trabajo', r => `<b>${esc(r.caption || '(sin descripción)')}</b><br><span class="tag">${esc(r.category || '')}</span>`], ['Fotos', r => (r.images || []).length], ['Visible', r => r.active !== false ? 'Sí' : 'No']]
    },
    testimonials: {
      title: 'Opiniones', add: 'Nueva opinión', blank: () => ({ name: '', product: '', source: 'WhatsApp', chat: 'C: \nD: ', active: true, order: 99 }),
      fields: () => [{ key: 'name', label: 'Iniciales del cliente', ph: 'K. L.', hint: 'Por privacidad usa solo iniciales.' }, { key: 'product', label: 'Producto o servicio', ph: 'Playeras para evento' }, { key: 'source', label: 'Canal', type: 'select', opts: [['WhatsApp', 'WhatsApp'], ['Instagram', 'Instagram'], ['Facebook', 'Facebook']] }, { key: 'order', label: 'Orden', type: 'number' },
        { key: 'chat', label: 'Conversación', type: 'area', hint: 'Una línea por mensaje. Empieza con "C:" si lo dijo el cliente o "D:" si lo dijo Draguz. Sin teléfonos, direcciones ni datos de pago.' }, { key: 'active', label: 'Visible en la página', type: 'check' }],
      cols: [['Cliente', r => `<b>${esc(r.name || 'Cliente')}</b><br><span class="tag">${esc(r.product || '')}</span>`], ['Canal', r => esc(r.source || '')], ['Mensajes', r => String(r.chat || '').split('\n').filter(x => x.trim()).length], ['Visible', r => r.active !== false ? 'Sí' : 'No']]
    },
    faqs: {
      title: 'Preguntas frecuentes', add: 'Nueva pregunta', blank: () => ({ q: '', a: '', active: true, order: 99 }),
      fields: () => [{ key: 'q', label: 'Pregunta', req: 1, full: 1 }, { key: 'a', label: 'Respuesta', type: 'area', hint: 'Puedes escribir {anticipo} y se reemplaza por el % de anticipo de Ajustes.' }, { key: 'order', label: 'Orden', type: 'number' }, { key: 'active', label: 'Visible en la página', type: 'check' }],
      cols: [['Pregunta', r => `<b>${esc(r.q)}</b>`], ['Orden', r => r.order || ''], ['Visible', r => r.active !== false ? 'Sí' : 'No']]
    }
  });
  function contentHTML() {
    const seeded = S.testimonialsSeeded || S.faqsSeeded;
    const note = seeded ? `<div class="note">Estás viendo las <b>${[S.testimonialsSeeded && 'opiniones', S.faqsSeeded && 'preguntas'].filter(Boolean).join(' y ')} de ejemplo</b> (se muestran en la página mientras no guardes las tuyas). <button class="btn sm" id="ct-seed" style="margin-left:8px">Guardarlas para poder editarlas</button></div>` : '';
    const ro = col => (col === 'testimonials' && S.testimonialsSeeded) || (col === 'faqs' && S.faqsSeeded);
    return note + ['gallery', 'testimonials', 'faqs'].map(c => `<div class="ct-block">${tableHTML(c, ro(c))}</div>`).join('');
  }
  function tableHTML(col, readOnly) {
    const d = DEFS[col], rows = S[col === 'catalog' ? 'catalog' : col];
    if (readOnly) return `<div class="adm-h"><h2>${d.title}</h2></div><div class="tblwrap"><table class="tbl"><thead><tr>${d.cols.map(c => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${d.cols.map(c => `<td>${c[1](r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<div class="adm-h"><h2>${d.title}</h2><button class="btn sm" data-add="${col}">+ ${d.add}</button></div>
      <div class="tblwrap"><table class="tbl"><thead><tr>${d.cols.map(c => `<th>${c[0]}</th>`).join('')}<th></th></tr></thead><tbody>
      ${rows.length ? rows.map(r => `<tr>${d.cols.map(c => `<td>${c[1](r)}</td>`).join('')}<td><div class="acts"><button class="btn ghost sm" data-edit="${col}:${r.id}">Editar</button><button class="btn danger sm" data-del="${col}:${r.id}">Borrar</button></div></td></tr>`).join('') : `<tr><td colspan="${d.cols.length + 1}" style="text-align:center;color:var(--mute);padding:36px">Nada por aquí todavía.</td></tr>`}
      </tbody></table></div>`;
  }

  async function quotesHTML() {
    try { quotes = (await DB.list('quotes')).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); } catch (e) { return '<div class="note">' + esc(DB.friendlyError(e)) + '</div>'; }
    try { await Promise.all([loadBlanks(), loadLoyalty()]); } catch (e) { }
    return `<div class="adm-h"><h2>Cotizaciones</h2></div><div class="tblwrap"><table class="tbl"><thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>Piezas</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody>
      ${quotes.length ? quotes.map(q => `<tr><td><b>${esc(q.folio)}</b></td><td>${new Date(q.createdAt || q.date).toLocaleDateString('es-MX')}</td><td>${esc(q.name || q.customer.name || '—')}<br><span class="tag">${[q.email ? esc(q.email) : '', q.customer && q.customer.phone ? `<a href="${waLink(q.customer.phone)}" target="_blank" rel="noopener" style="color:#25D366">${esc(q.customer.phone)}</a>` : '', q.guest ? 'sin cuenta' : ''].filter(Boolean).join(' · ')}</span></td><td>${q.lines.reduce((a, l) => a + l.qty, 0)}${stockBadge(q)}</td><td><b>${money(q.total)}</b>${cardBadge(q)}</td>
      <td><select data-st="${q.id}">${Object.entries(STATUS).map(([k, l]) => `<option value="${k}" ${q.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
      <td><div class="acts">${hasDesign(q) ? `<button class="btn sm" data-design="${q.id}">🎨 Diseño</button>` : ''}<button class="btn ghost sm" data-ticket="${q.id}">Ticket</button><button class="btn danger sm" data-delq="${q.id}">Borrar</button></div></td></tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--mute);padding:36px">Aún no llegan solicitudes.</td></tr>'}
      </tbody></table></div>`;
  }

  async function summaryHTML() {
    try { quotes = await DB.list('quotes'); } catch (e) { quotes = []; }
    const nuevas = quotes.filter(q => q.status === 'nueva').length;
    return `<div class="adm-h"><h2>Resumen</h2></div><div class="stats">
      <div class="stat hot"><b>${nuevas}</b><span>Cotizaciones nuevas</span></div><div class="stat"><b>${quotes.length}</b><span>Cotizaciones totales</span></div>
      <div class="stat"><b>${S.stock.filter(x => x.active !== false && x.qty > 0).length}</b><span>Productos en stock</span></div><div class="stat"><b>${S.catalog.filter(x => x.active !== false).length}</b><span>Productos personalizables</span></div></div>
      ${DB.mode === 'demo' ? '<div class="note"><b>Estás en modo demo.</b> Todo lo que cambies se guarda solo en este navegador. Configura Firebase en <code>js/config.js</code> para que sea real (guía en el README).</div>' : ''}
      <div class="note">Los precios de ejemplo son de muestra. Ajústalos en <b>Catálogo personalizable</b> y <b>Extras</b>. Los precios del <b>Polo Dri-Fit</b> vienen de tu lista.</div>`;
  }

  function settingsHTML() {
    const s = S.settings;
    return `<div class="adm-h"><h2>Ajustes</h2></div><form class="tset" id="set-f">
      <div><label class="lbl">WhatsApp del negocio</label><input name="whatsapp" value="${esc(s.whatsapp || '')}" placeholder="5218112345678"><small style="color:var(--dim)">Con código de país, sin + ni espacios.</small></div>
      <div><label class="lbl">Anticipo (%) en la cotización</label><input type="number" name="anticipoPct" min="0" max="100" value="${+s.anticipoPct || 0}"></div>
      <div><label class="lbl">Vigencia de la cotización (días)</label><input type="number" name="validityDays" min="1" value="${+s.validityDays || 7}"></div>
      <h3 class="lbl" style="margin-top:18px;color:var(--red)">Tarjeta de lealtad</h3>
      <div><label class="lbl">Descuento cada cuántas compras</label><input type="number" name="loyaltyEvery" min="2" value="${L.conf(s).every}"><small style="color:var(--dim)">Ej. 8: la 8ª compra lleva descuento y el ciclo vuelve a empezar.</small></div>
      <div><label class="lbl">Descuento (%)</label><input type="number" name="loyaltyPct" min="0" max="100" value="${L.conf(s).pct}"></div>
      <div><label class="lbl">Compra mínima para contar (MXN)</label><input type="number" name="loyaltyMin" min="0" value="${L.conf(s).min}"><small style="color:var(--dim)">0 = cualquier compra cuenta.</small></div>
      <div><label class="lbl">Premio del sorteo mensual</label><input name="rafflePrize" maxlength="80" value="${esc(s.rafflePrize || '')}" placeholder="Una prenda personalizada"></div>
      <button class="btn" style="justify-self:start">Guardar ajustes</button></form>
      <h3 class="lbl" style="margin-top:38px">Datos</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn ghost sm" id="d-seed">Cargar datos de ejemplo</button><button class="btn ghost sm" id="d-exp">Exportar catálogo (JSON)</button><button class="btn ghost sm" id="d-imp">Importar catálogo (JSON)</button>${DB.mode === 'demo' ? '<button class="btn danger sm" id="d-reset">Restablecer demo</button>' : ''}<input type="file" id="d-file" accept="application/json" hidden></div>
      <p class="tag" style="margin-top:14px;max-width:560px;text-transform:none;letter-spacing:.02em">“Cargar datos de ejemplo” agrega o reemplaza los productos de muestra (mismos ids), sin tocar los que tú creaste.</p>`;
  }

  /* ───────────── TARJETAS Y LEALTAD ───────────── */
  const L = window.Loyalty;
  let cards = [], purchases = [], raffles = [], rMonth = L.monthKey(Date.now()), cardQ = '';
  const waLink = ph => { const d = String(ph || '').replace(/\D/g, ''); return d ? 'https://wa.me/' + (d.length === 10 ? '52' : '') + d : ''; };
  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const pickRandom = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  async function loadLoyalty() {
    const [c, p, r] = await Promise.all([DB.list('cards'), DB.list('purchases'), DB.list('raffles')]);
    cards = c.sort((a, b) => (a.seq || 0) - (b.seq || 0)); purchases = p.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); raffles = r;
  }
  const findCard = code => cards.find(c => c.id === L.normCode(code));
  const cardByPhone = ph => { const d = String(ph || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? cards.find(c => c.status === 'activa' && String(c.phone || '').slice(-10) === d) : null; };

  function cardsHTML() {
    const cf = L.conf(S.settings), act = cards.filter(c => c.status === 'activa');
    const q = cardQ.toLowerCase();
    const rows = cards.filter(c => !q || [c.id, c.name, c.phone].some(x => String(x || '').toLowerCase().includes(q)));
    const months = [...new Set([L.monthKey(Date.now()), ...purchases.map(p => p.raffleMonth).filter(Boolean)])].sort().reverse();
    const part = purchases.filter(p => p.raffleMonth === rMonth);
    const win = raffles.find(r => r.id === rMonth);
    return `<div class="adm-h"><h2>Tarjetas y lealtad</h2><div class="acts"><button class="btn sm" id="lc-buy">+ Registrar compra</button><button class="btn ghost sm" id="lc-gen">Generar tarjetas</button></div></div>
      <div class="stats"><div class="stat"><b>${cards.length}</b><span>Tarjetas generadas</span></div><div class="stat hot"><b>${act.length}</b><span>Tarjetas activas</span></div><div class="stat"><b>${purchases.length}</b><span>Compras registradas</span></div><div class="stat"><b>${purchases.filter(p => p.discountPct).length}</b><span>Descuentos dados</span></div></div>
      <div class="note">Programa actual: <b>${cf.pct ? `compra ${cf.every} = ${cf.pct}% de descuento` : 'sin descuento'}</b> · <b>1ª compra = sorteo del mes</b>${cf.prize ? ' (' + esc(cf.prize) + ')' : ''}${cf.min ? ` · cuentan compras desde ${money(cf.min)}` : ''}. Cámbialo en <b>Ajustes</b>.</div>
      <h3 class="lbl" style="margin-top:26px">Para la imprenta</h3>
      <div class="lc-print"><select id="lc-which"><option value="libres">Solo tarjetas sin activar (${cards.length - act.length})</option><option value="todas">Todas (${cards.length})</option></select><button class="btn ghost sm" id="lc-csv">Descargar códigos (CSV)</button><button class="btn ghost sm" id="lc-sheet">Hoja con QR para imprimir</button></div>
      <p class="tag lc-help">El CSV trae el código y el link del QR de cada tarjeta: es lo que pide la imprenta para "datos variables". La hoja con QR la puedes imprimir tú o guardarla como PDF.</p>
      <h3 class="lbl" style="margin-top:30px">Tarjetas</h3>
      <input id="lc-q" placeholder="Buscar por código, nombre o WhatsApp" value="${esc(cardQ)}" style="max-width:420px;margin-bottom:14px">
      <div class="tblwrap"><table class="tbl"><thead><tr><th>Código</th><th>Estado</th><th>Cliente</th><th>Compras</th><th>Última compra</th><th></th></tr></thead><tbody>
      ${rows.length ? rows.map(c => { const st = L.status(c, S.settings); return `<tr><td><b class="mono">${esc(c.id)}</b></td>
        <td>${c.status === 'activa' ? '<span class="st cerrada">Activa</span>' : '<span class="st">Sin activar</span>'}</td>
        <td>${c.name ? esc(c.name) + '<br>' : ''}${c.phone ? `<a class="tag" href="${waLink(c.phone)}" target="_blank" rel="noopener" style="color:#25D366">${esc(c.phone)}</a>` : ''}</td>
        <td><b>${st.done}</b>${st.pct ? ` <span class="tag">(${st.filled}/${st.every})</span>` : ''}${st.nextHasDiscount ? `<br><span class="st nueva">Próxima: ${st.pct}%</span>` : ''}</td>
        <td>${fmtDate(c.lastPurchaseAt)}</td>
        <td><div class="acts"><button class="btn sm" data-buy="${esc(c.id)}">Compra</button><button class="btn ghost sm" data-hist="${esc(c.id)}">Historial</button><a class="btn ghost sm" href="#/tarjeta/${esc(c.id)}" target="_blank" rel="noopener">Ver</a></div></td></tr>`; }).join('')
        : `<tr><td colspan="6" style="text-align:center;color:var(--mute);padding:36px">${cards.length ? 'Sin resultados.' : 'Aún no generas tarjetas. Pulsa “Generar tarjetas”.'}</td></tr>`}
      </tbody></table></div>
      <h3 class="lbl" style="margin-top:34px">Sorteo mensual</h3>
      <div class="lc-raffle-box"><div class="lc-print"><select id="lc-month">${months.map(m => `<option value="${m}" ${m === rMonth ? 'selected' : ''}>${L.monthName(m)}</option>`).join('')}</select>
        ${part.length ? `<button class="btn sm" id="lc-draw">${win ? 'Volver a sortear' : 'Elegir ganador al azar'}</button>` : ''}</div>
        ${win ? `<div class="note" style="margin-top:14px">🏆 Ganador de ${L.monthName(rMonth)}: <b>${esc(win.winnerName)}</b> (${esc(win.winnerCode)})${win.winnerPhone ? ` · <a href="${waLink(win.winnerPhone)}" target="_blank" rel="noopener" style="color:#25D366">${esc(win.winnerPhone)}</a>` : ''} · sorteado el ${fmtDate(win.drawnAt)} entre ${win.participants} participante${win.participants === 1 ? '' : 's'}.</div>` : ''}
        <p class="tag lc-help">${part.length} participante${part.length === 1 ? '' : 's'}: clientes cuya primera compra fue en ${L.monthName(rMonth)}.</p>
        ${part.length ? `<div class="chips">${part.map(p => `<span>${esc(p.name || p.cardCode)}</span>`).join('')}</div>` : ''}</div>`;
  }

  async function generateCards() {
    const n = parseInt(prompt('¿Cuántas tarjetas quieres generar? (máx. 500)', '100'), 10);
    if (!n || n < 1) return; if (n > 500) { toast('Máximo 500 por vez.', true); return; }
    let seq = cards.reduce((m, c) => Math.max(m, c.seq || 0), 0);
    const now = Date.now(), batch = [];
    for (let i = 0; i < n; i++) { seq++; const code = L.genCode(seq); batch.push({ id: code, code, seq, status: 'libre', name: '', phone: '', activatedAt: null, purchases: 0, rewardsUsed: 0, createdAt: now }); }
    try {
      for (let i = 0; i < batch.length; i += 20) { toast(`Generando… ${Math.min(i + 20, n)} de ${n}`); await Promise.all(batch.slice(i, i + 20).map(c => DB.save('cards', c))); }
      toast(`${n} tarjetas generadas`); await loadLoyalty(); paint();
    } catch (er) { toast(DB.friendlyError(er), true); }
  }
  const printable = () => ($('#lc-which') && $('#lc-which').value === 'todas') ? cards : cards.filter(c => c.status !== 'activa');
  function downloadCSV() {
    const list = printable(); if (!list.length) { toast('No hay tarjetas para exportar.', true); return; }
    const csv = '﻿codigo,link_qr\n' + list.map(c => `${c.id},${L.cardUrl(c.id)}`).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'draguz-tarjetas.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function loadQR() { return window.qrcode ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/vendor/qrcode.js'; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar el generador de QR')); document.head.appendChild(s); }); }
  async function printSheet() {
    const list = printable(); if (!list.length) { toast('No hay tarjetas para imprimir.', true); return; }
    const w = window.open('', '_blank'); if (!w) { toast('Permite las ventanas emergentes para ver la hoja.', true); return; }
    w.document.write('<p style="font-family:sans-serif">Generando…</p>');
    try { await loadQR(); } catch (er) { w.close(); toast(er.message, true); return; }
    const cf = L.conf(S.settings), host = location.host + location.pathname.replace(/index\.html$/, '');
    const qr = url => { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); };
    const one = c => `<div class="bc"><div class="qr">${qr(L.cardUrl(c.id))}</div><div class="tx"><div class="k">Tarjeta de cliente</div><div class="code">${esc(c.id)}</div><div class="p">Escanea el QR y acumula tus compras</div>
      ${cf.pct ? `<div class="b"><b>${cf.every}ª compra:</b> ${cf.pct}% de descuento</div>` : ''}<div class="b"><b>1ª compra:</b> entras al sorteo del mes</div><div class="u">${esc(host)}</div></div></div>`;
    w.document.open();
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Tarjetas Draguz (${list.length})</title><style>
      @page{size:letter;margin:10mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Montserrat,Arial,sans-serif;color:#0a0a0c}
      .bar{padding:14px;font-size:14px;background:#f4f1e9;display:flex;gap:12px;align-items:center}.bar button{padding:8px 14px;font-weight:700;cursor:pointer}
      .grid{display:grid;grid-template-columns:repeat(2,90mm);gap:0;justify-content:center;padding:6mm 0}
      .bc{width:90mm;height:50mm;border:0.2mm dashed #bbb;display:flex;gap:4mm;align-items:center;padding:4mm;break-inside:avoid;page-break-inside:avoid}
      .qr{width:30mm;height:30mm;flex:none}.qr svg{width:100%;height:100%}
      .tx{min-width:0}.k{font:700 7pt monospace;letter-spacing:.14em;text-transform:uppercase;color:#E3000F}
      .code{font:800 13pt monospace;letter-spacing:.04em;margin:1mm 0 1.5mm}.p{font-size:7.5pt;font-weight:600;margin-bottom:1.5mm}
      .b{font-size:7pt;line-height:1.35}.u{font:6pt monospace;color:#777;margin-top:1.5mm;word-break:break-all}
      @media print{.bar{display:none}.grid{padding:0}}
    </style></head><body><div class="bar"><b>${list.length} tarjetas</b> · Tamaño real 9 × 5 cm (reverso). Imprime en carta al 100% o guarda como PDF.<button onclick="print()">Imprimir / PDF</button></div><div class="grid">${list.map(one).join('')}</div></body></html>`);
    w.document.close();
  }

  function openBuy(o) {
    o = o || {};
    const m = openModal(`<h3 class="m-title">Registrar compra</h3><p class="m-sub">Suma la compra a la tarjeta del cliente y calcula su descuento.</p>
      <form id="buy-f" class="fgrid">
        <div class="full"><label class="l">Código de tarjeta</label><input name="code" list="dl-cards" value="${esc(o.code || '')}" required autocomplete="off" style="text-transform:uppercase;font-family:var(--mono)"><datalist id="dl-cards">${cards.map(c => `<option value="${esc(c.id)}">${esc(c.name || 'Sin activar')}${c.phone ? ' · ' + esc(c.phone) : ''}</option>`).join('')}</datalist></div>
        <div class="full buy-new" hidden><div class="fgrid"><div><label class="l">Nombre del cliente</label><input name="name" maxlength="80" value="${esc(o.name || '')}"></div><div><label class="l">WhatsApp</label><input name="phone" type="tel" maxlength="20" value="${esc(o.phone || '')}"></div></div><small>Esta tarjeta no está activada: se activará con estos datos.</small></div>
        <div><label class="l">Total de la compra (antes de descuento)</label><input type="number" step="any" min="0" name="total" value="${o.total != null ? o.total : ''}" required></div>
        <div><label class="l">Piezas</label><input type="number" min="0" name="pieces" value="${o.pieces || ''}"></div>
        <div class="full"><label class="l">Nota (opcional)</label><input name="note" maxlength="140" value="${esc(o.note || '')}"></div>
        <div class="full buy-prev" id="buy-prev"></div>
        <div class="f-actions"><button type="button" class="btn ghost" id="buy-c">Cancelar</button><button class="btn" id="buy-ok">Registrar compra</button></div>
      </form>`, { wide: true });
    const f = $('#buy-f', m), prev = $('#buy-prev', m), ok = $('#buy-ok', m), box = $('.buy-new', m);
    const calc = () => {
      const card = findCard(f.code.value), total = +f.total.value || 0;
      box.hidden = !(card && card.status !== 'activa');
      if (!card) { prev.innerHTML = f.code.value.trim() ? '<span class="err">No existe esa tarjeta.</span>' : ''; ok.disabled = true; return null; }
      const st = L.status(card, S.settings), disc = st.nextHasDiscount, amount = disc ? Math.round(total * st.pct) / 100 : 0;
      const low = st.min && total < st.min;
      prev.innerHTML = `<div class="note" style="margin:0">Compra <b>#${st.next}</b> de <b>${esc(card.name || f.name.value || 'cliente nuevo')}</b>.`
        + (low ? `<br><span class="err">No cuenta para la tarjeta: el mínimo es ${money(st.min)}.</span>` : '')
        + (disc && !low ? `<br>🎉 <b>Lleva ${st.pct}% de descuento:</b> −${money(amount)} → cobrar <b>${money(total - amount)}</b>.` : '')
        + (st.nextIsFirst && !low ? `<br>🎟️ Entra al sorteo de <b>${L.monthName(L.monthKey(Date.now()))}</b>.` : '')
        + (!disc && st.pct && !low ? (st.left - 1 <= 0 ? `<br>Su siguiente compra tendrá ${st.pct}% de descuento.` : `<br>Después de esta le faltarán ${st.left - 1} compras para que la siguiente tenga ${st.pct}%.`) : '') + '</div>';
      ok.disabled = !!low || !total;
      return { card, st, disc, amount, total };
    };
    f.addEventListener('input', calc); calc();
    $('#buy-c', m).onclick = closeModal;
    f.onsubmit = async e => {
      e.preventDefault(); const r = calc(); if (!r) return;
      const { card, st, disc, amount, total } = r, now = Date.now();
      let name = card.name, phone = card.phone;
      if (card.status !== 'activa') {
        name = f.name.value.trim(); phone = f.phone.value.replace(/\D/g, '');
        if (!name || phone.length < 10) { toast('Escribe nombre y WhatsApp para activar la tarjeta.', true); return; }
      }
      ok.disabled = true;
      try {
        const pid = await DB.save('purchases', { cardCode: card.id, name, phone, total, pieces: +f.pieces.value || 0, note: f.note.value.trim(), number: st.next, discountPct: disc ? st.pct : 0, discountAmount: amount, charged: total - amount, raffleMonth: st.nextIsFirst ? L.monthKey(now) : '', quoteId: (o.quote && o.quote.id) || '', folio: (o.quote && o.quote.folio) || '', createdAt: now });
        await DB.save('cards', Object.assign({}, card, { status: 'activa', name, phone, activatedAt: card.activatedAt || now, purchases: st.next, rewardsUsed: (card.rewardsUsed || 0) + (disc ? 1 : 0), lastPurchaseAt: now, firstPurchaseAt: card.firstPurchaseAt || (st.nextIsFirst ? now : null) }));
        if (o.quote) await DB.save('quotes', Object.assign({}, o.quote, { purchaseId: pid, cardCode: card.id }));
        closeModal(); toast(`Compra #${st.next} registrada${disc ? ` con ${st.pct}% de descuento` : ''}`);
        await loadLoyalty(); paint();
      } catch (er) { toast(DB.friendlyError(er), true); ok.disabled = false; }
    };
  }

  function openHistory(code) {
    const card = findCard(code); if (!card) return;
    const list = purchases.filter(p => p.cardCode === card.id).sort((a, b) => (b.number || 0) - (a.number || 0));
    const m = openModal(`<h3 class="m-title">Historial · ${esc(card.id)}</h3><p class="m-sub">${esc(card.name || 'Sin activar')}${card.phone ? ' · ' + esc(card.phone) : ''}</p>
      <div class="tblwrap"><table class="tbl"><thead><tr><th>#</th><th>Fecha</th><th>Total</th><th>Descuento</th><th>Folio</th><th></th></tr></thead><tbody>
      ${list.length ? list.map((p, i) => `<tr><td><b>${p.number}</b></td><td>${fmtDate(p.createdAt)}</td><td>${money(p.total)}</td><td>${p.discountPct ? `${p.discountPct}% (−${money(p.discountAmount)})` : '—'}${p.raffleMonth ? '<br><span class="tag">Sorteo ' + L.monthName(p.raffleMonth) + '</span>' : ''}</td><td>${esc(p.folio || '—')}</td>
        <td>${i === 0 && p.number === card.purchases ? `<button class="btn danger sm" data-undo="${p.id}">Deshacer</button>` : ''}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--mute);padding:28px">Sin compras todavía.</td></tr>'}
      </tbody></table></div><p class="tag" style="margin-top:12px;text-transform:none;letter-spacing:.02em">Solo se puede deshacer la compra más reciente.</p>`, { wide: true });
    m.onclick = async e => {
      const b = e.target.closest('[data-undo]'); if (!b || !confirm('¿Deshacer esta compra? Se restará de la tarjeta.')) return;
      const p = list.find(x => x.id === b.dataset.undo);
      try {
        await DB.remove('purchases', p.id);
        await DB.save('cards', Object.assign({}, card, { purchases: Math.max(0, (card.purchases || 1) - 1), rewardsUsed: Math.max(0, (card.rewardsUsed || 0) - (p.discountPct ? 1 : 0)), firstPurchaseAt: p.number === 1 ? null : card.firstPurchaseAt, lastPurchaseAt: (list[1] && list[1].createdAt) || null }));
        if (p.quoteId) { const q = quotes.find(x => x.id === p.quoteId); if (q) await DB.save('quotes', Object.assign({}, q, { purchaseId: '' })); }
        closeModal(); toast('Compra deshecha'); await loadLoyalty(); paint();
      } catch (er) { toast(DB.friendlyError(er), true); }
    };
  }

  async function drawRaffle() {
    const part = purchases.filter(p => p.raffleMonth === rMonth); if (!part.length) return;
    if (raffles.find(r => r.id === rMonth) && !confirm('Ya hay ganador este mes. ¿Volver a sortear?')) return;
    const w = part[pickRandom(part.length)];
    try {
      await DB.save('raffles', { id: rMonth, month: rMonth, winnerCode: w.cardCode, winnerName: w.name || '', winnerPhone: w.phone || '', participants: part.length, drawnAt: Date.now() });
      toast('🏆 Ganador: ' + (w.name || w.cardCode)); await loadLoyalty(); paint();
    } catch (er) { toast(DB.friendlyError(er), true); }
  }

  /* ───────────── INVENTARIO DE PRENDAS LISAS ───────────── */
  let blanks = [], blankQ = '';
  async function loadBlanks() { blanks = await DB.list('blanks'); }
  const low = s => String(s || '').trim().toLowerCase();
  const prodOf = id => S.catalog.find(p => p.id === id);
  const blankKey = (pid, cut, color, size) => [pid, low(cut), low(color), low(size)].join('|');
  const blankLabel = b => [(prodOf(b.productId) || {}).name || '(producto borrado)', b.cut, b.color, b.size ? 'talla ' + b.size : ''].filter(Boolean).join(' · ');
  const sizeIdx = b => { const p = prodOf(b.productId); const i = p && p.sizes ? p.sizes.indexOf(b.size) : -1; return i < 0 ? 99 : i; };

  function blanksHTML() {
    const q = low(blankQ);
    const rows = blanks.filter(b => !q || low(blankLabel(b)).includes(q)).sort((a, b) =>
      String((prodOf(a.productId) || {}).name).localeCompare(String((prodOf(b.productId) || {}).name)) || String(a.cut).localeCompare(String(b.cut)) || String(a.color).localeCompare(String(b.color)) || sizeIdx(a) - sizeIdx(b));
    const total = blanks.reduce((s, b) => s + (+b.qty || 0), 0);
    return `<div class="adm-h"><h2>Inventario de prendas lisas</h2><button class="btn sm" id="bl-add">+ Entrada de mercancía</button></div>
      <div class="stats"><div class="stat"><b>${total}</b><span>Piezas lisas en total</span></div><div class="stat"><b>${blanks.length}</b><span>Combinaciones</span></div><div class="stat hot"><b>${blanks.filter(b => (+b.qty || 0) <= 3).length}</b><span>Con 3 o menos</span></div></div>
      <div class="note">Cuando pasas una cotización a <b>En proceso</b>, se descuentan solas las piezas del mismo <b>producto, corte, color y talla</b>, pero <b>solo si alcanzan todas</b>; si falta algo te avisa qué falta. Si luego la cancelas, las piezas regresan. Los productos que no tengan nada registrado aquí (tazas, stickers…) no se controlan.</div>
      <input id="bl-q" placeholder="Buscar (producto, color, talla…)" value="${esc(blankQ)}" style="max-width:420px;margin-bottom:14px">
      <div class="tblwrap"><table class="tbl"><thead><tr><th>Producto</th><th>Corte</th><th>Color</th><th>Talla</th><th>Piezas</th><th></th></tr></thead><tbody>
      ${rows.length ? rows.map(b => { const n = +b.qty || 0; return `<tr><td><b>${esc((prodOf(b.productId) || {}).name || '(producto borrado)')}</b></td><td>${esc(b.cut || '—')}</td><td>${esc(b.color || '—')}</td><td>${esc(b.size || '—')}</td>
        <td>${n <= 0 ? `<span class="st nueva">${n}</span>` : n <= 3 ? `<span class="st proceso">${n}</span>` : `<b>${n}</b>`}</td>
        <td><div class="acts"><button class="btn ghost sm" data-bin="${b.id}">+ Entrada</button><button class="btn ghost sm" data-bout="${b.id}">− Salida</button><button class="btn danger sm" data-bdel="${b.id}">Borrar</button></div></td></tr>`; }).join('')
        : `<tr><td colspan="6" style="text-align:center;color:var(--mute);padding:36px">${blanks.length ? 'Sin resultados.' : 'Aún no registras prendas lisas. Pulsa “Entrada de mercancía”.'}</td></tr>`}
      </tbody></table></div>`;
  }

  function openBlankForm() {
    const prods = S.catalog.slice().sort((a, b) => String(a.name).localeCompare(b.name));
    if (!prods.length) { toast('Primero crea productos en “Catálogo personalizable”.', true); return; }
    const m = openModal(`<h3 class="m-title">Entrada de mercancía</h3><p class="m-sub">Suma prendas lisas a tu inventario. Si la combinación ya existe, se agregan a lo que tienes.</p>
      <form id="bl-f" class="fgrid"><div class="full"><label class="l">Producto</label><select name="pid">${prods.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div><div class="full" id="bl-dyn"></div>
      <div class="f-actions"><button type="button" class="btn ghost" id="bl-c">Cancelar</button><button class="btn">Guardar entrada</button></div></form>`, { wide: true });
    const f = $('#bl-f', m), dyn = $('#bl-dyn', m);
    const draw = () => {
      const p = prodOf(f.pid.value) || {};
      const cuts = p.cuts || [], colors = (p.colors || []).map(c => c.name), sizes = p.sizes || [];
      dyn.innerHTML = `<div class="fgrid">
        <div><label class="l">Corte</label>${cuts.length ? `<select name="cut">${cuts.map(c => `<option>${esc(c)}</option>`).join('')}</select>` : '<input name="cut" value="" placeholder="Sin corte" disabled><small>Agrega cortes al producto en el catálogo si los manejas.</small>'}</div>
        <div><label class="l">Color</label>${colors.length ? `<select name="color">${colors.map(c => `<option>${esc(c)}</option>`).join('')}</select>` : '<input name="color" placeholder="Color">'}</div></div>
        <label class="l" style="margin-top:14px">${sizes.length ? 'Piezas por talla' : 'Piezas'}</label>
        <div class="sizes">${sizes.length ? sizes.map(s => `<label class="size"><span>${esc(s)}</span><input type="number" min="0" data-bsize="${esc(s)}" placeholder="0"></label>`).join('') : '<label class="size"><span>Piezas</span><input type="number" min="0" data-bsize="" placeholder="0"></label>'}</div>`;
    };
    f.pid.onchange = draw; draw();
    $('#bl-c', m).onclick = closeModal;
    f.onsubmit = async e => {
      e.preventDefault();
      const pid = f.pid.value, cut = f.cut && !f.cut.disabled ? f.cut.value : '', color = f.color ? f.color.value.trim() : '';
      const items = $$('[data-bsize]', m).map(i => ({ size: i.dataset.bsize, qty: parseInt(i.value, 10) || 0 })).filter(x => x.qty > 0);
      if (!items.length) { toast('Escribe cuántas piezas entran.', true); return; }
      try {
        await loadBlanks();
        for (const it of items) {
          const ex = blanks.find(b => blankKey(b.productId, b.cut, b.color, b.size) === blankKey(pid, cut, color, it.size));
          if (ex) await DB.save('blanks', Object.assign({}, ex, { qty: (+ex.qty || 0) + it.qty, updatedAt: Date.now() }));
          else await DB.save('blanks', { productId: pid, cut, color, size: it.size, qty: it.qty, updatedAt: Date.now() });
        }
        closeModal(); toast('Entrada guardada: ' + items.reduce((a, x) => a + x.qty, 0) + ' piezas'); await loadBlanks(); paint();
      } catch (er) { toast(DB.friendlyError(er), true); }
    };
  }
  async function adjustBlank(id, sign) {
    const b = blanks.find(x => x.id === id); if (!b) return;
    const n = parseInt(prompt(`${sign > 0 ? 'Entrada' : 'Salida'} de piezas · ${blankLabel(b)}\nTienes ${+b.qty || 0}. ¿Cuántas?`, '1'), 10);
    if (!n || n < 1) return;
    try { await DB.save('blanks', Object.assign({}, b, { qty: Math.max(0, (+b.qty || 0) + sign * n), updatedAt: Date.now() })); toast('Inventario actualizado'); await loadBlanks(); paint(); }
    catch (er) { toast(DB.friendlyError(er), true); }
  }

  // Qué prendas lisas necesita una cotización (solo de productos que tienen inventario registrado)
  function needsOf(q) {
    const out = [];
    (q.lines || []).forEach(l => {
      const pid = l.productId || (S.catalog.find(p => p.name === l.name) || {}).id;
      if (!pid || !blanks.some(b => b.productId === pid)) return;
      const add = (size, qty) => {
        const key = blankKey(pid, l.cut, l.color, size), e = out.find(x => x.key === key);
        if (e) e.qty += qty; else out.push({ key, productId: pid, cut: l.cut || '', color: l.color || '', size, qty, name: l.name });
      };
      const sizes = Object.entries(l.sizes || {}).filter(([, n]) => +n > 0);
      if (sizes.length) sizes.forEach(([s, n]) => add(s, +n)); else add('', +l.qty || 0);
    });
    return out;
  }
  function checkStock(q) {
    const needs = needsOf(q), short = [], use = [];
    needs.forEach(n => {
      const b = blanks.find(x => blankKey(x.productId, x.cut, x.color, x.size) === n.key), have = b ? +b.qty || 0 : 0;
      if (have < n.qty) short.push(Object.assign({}, n, { have })); else use.push({ id: b.id, qty: n.qty });
    });
    return { tracked: needs.length > 0, ok: !short.length, short, use };
  }
  const needLabel = n => [n.name, n.cut, n.color, n.size ? 'talla ' + n.size : ''].filter(Boolean).join(' · ');

  const PRE = ['nueva', 'cotizada', 'cancelada'], POST = ['proceso', 'cerrada'];
  async function changeStatus(q, to, sel) {
    const from = q.status; if (from === to) return;
    const upd = Object.assign({}, q, { status: to }), msgs = [];
    try {
      await loadBlanks();
      // Al empezar producción: descontar lisas, solo si alcanzan todas
      if (POST.includes(to) && !POST.includes(from) && !(q.stockUsed && q.stockUsed.length)) {
        const r = checkStock(q);
        if (r.tracked && !r.ok) {
          const go = confirm('No alcanzan las prendas lisas para este pedido:\n\n' + r.short.map(s => `• ${needLabel(s)}: necesitas ${s.qty}, tienes ${s.have}`).join('\n') + `\n\n¿Cambiarlo a "${STATUS[to]}" de todos modos, SIN descontar inventario?`);
          if (!go) { sel.value = from; return; }
          msgs.push('Sin descontar inventario');
        } else if (r.tracked) {
          for (const u of r.use) { const b = blanks.find(x => x.id === u.id); b.qty = (+b.qty || 0) - u.qty; await DB.save('blanks', b); }
          upd.stockUsed = r.use; msgs.push(`Se descontaron ${r.use.reduce((a, u) => a + u.qty, 0)} piezas lisas`);
        }
      }
      // Si regresa o se cancela: devolver lo que se había descontado
      if (PRE.includes(to) && q.stockUsed && q.stockUsed.length) {
        for (const u of q.stockUsed) { const b = blanks.find(x => x.id === u.id); if (b) { b.qty = (+b.qty || 0) + u.qty; await DB.save('blanks', b); } }
        msgs.push(`Regresaron ${q.stockUsed.reduce((a, u) => a + u.qty, 0)} piezas al inventario`); upd.stockUsed = [];
      }
      await DB.save('quotes', upd); Object.assign(q, upd);
      toast(['Estado actualizado'].concat(msgs).join(' · '));
      // Al cerrar la venta: ofrecer sumarla a la tarjeta del cliente
      if (to === 'cerrada' && !q.purchaseId) {
        await loadLoyalty();
        const code = L.normCode(q.cardCode) || ((cardByPhone(q.customer && q.customer.phone)) || {}).id;
        if (code && findCard(code)) { await paint(); return openBuy({ code, total: q.total, pieces: (q.lines || []).reduce((a, l) => a + (+l.qty || 0), 0), quote: q, name: q.name || (q.customer && q.customer.name) || '', phone: (q.customer && q.customer.phone) || '' }); }
      }
      await paint();
    } catch (er) { toast(DB.friendlyError(er), true); sel.value = from; }
  }

  const hasDesign = q => (q.lines || []).some(l => l.mockup) || Object.keys(q.designs || {}).length > 0;
  function openDesign(q) {
    const lines = (q.lines || []).filter(l => l.mockup || l.designId);
    const m = openModal(`<h3 class="m-title">Diseño · ${esc(q.folio)}</h3><p class="m-sub">${esc(q.name || (q.customer && q.customer.name) || '')}</p>
      <div class="dz-designs">${lines.map((l, i) => `<figure>${l.mockup ? `<img src="${l.mockup}" alt="Vista previa">` : ''}<figcaption><b>${esc(l.name)}</b>${[l.cut, l.color].filter(Boolean).map(esc).join(' · ')}${l.notes ? '<br><span class="tag">' + esc(l.notes) + '</span>' : ''}</figcaption>
        <div class="acts">${l.mockup ? `<a class="btn ghost sm" download="${esc(q.folio)}-vista-${i + 1}.jpg" href="${l.mockup}">Descargar vista</a>` : ''}${l.designId && (q.designs || {})[l.designId] ? `<a class="btn sm" download="${esc(q.folio)}-diseno-${i + 1}.png" href="${q.designs[l.designId]}">Descargar diseño original</a>` : ''}</div></figure>`).join('')}</div>
      <p class="tag" style="margin-top:12px;text-transform:none;letter-spacing:.02em">El diseño original viene en PNG (reducido para caber en la cotización). Para imprimir en grande pide al cliente el archivo en alta resolución.</p>`, { wide: true });
    return m;
  }
  function stockBadge(q) {
    if (q.stockUsed && q.stockUsed.length) return '<br><span class="tag">Lisas descontadas</span>';
    if (!['nueva', 'cotizada'].includes(q.status)) return '';
    const r = checkStock(q); if (!r.tracked) return '';
    return r.ok ? '<br><span class="st cerrada">✔ Hay lisas</span>' : `<br><span class="st nueva" title="${esc(r.short.map(x => needLabel(x) + ': faltan ' + (x.qty - x.have)).join(' | '))}">✖ Faltan lisas</span>`;
  }
  function cardBadge(q) {
    const code = L.normCode(q.cardCode); if (!code) return '';
    if (q.purchaseId) return `<br><span class="tag" style="white-space:nowrap">🎟 ${code} · compra registrada</span>`;
    const c = findCard(code); if (!c) return `<br><span class="tag" style="white-space:nowrap">🎟 ${code} (no existe)</span>`;
    const st = L.status(c, S.settings);
    return `<br><span class="tag" style="white-space:nowrap">🎟 ${code}</span>${st.nextHasDiscount ? `<br><span class="st nueva">${st.pct}% de descuento</span>` : ''}`;
  }

  async function refresh() { await reload(); await paint(); }
  async function paint() {
    const body = $('#adm-body'); if (!body) return;
    $$('.adm-nav [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    if (tab === 'resumen') body.innerHTML = await summaryHTML();
    else if (tab === 'stock') body.innerHTML = tableHTML('stock');
    else if (tab === 'catalogo') body.innerHTML = tableHTML('catalog');
    else if (tab === 'extras') body.innerHTML = tableHTML('extras');
    else if (tab === 'contenido') body.innerHTML = contentHTML();
    else if (tab === 'cotizaciones') body.innerHTML = await quotesHTML();
    else if (tab === 'tarjetas') { try { await loadLoyalty(); body.innerHTML = cardsHTML(); } catch (e) { body.innerHTML = '<div class="note">' + esc(DB.friendlyError(e)) + '</div>'; } }
    else if (tab === 'lisas') { try { await loadBlanks(); body.innerHTML = blanksHTML(); } catch (e) { body.innerHTML = '<div class="note">' + esc(DB.friendlyError(e)) + '</div>'; } }
    else body.innerHTML = settingsHTML();
  }

  function render() {
    const root = $('#view-admin');
    root.innerHTML = `<span class="kicker" style="margin-bottom:6px"><i class="slash"></i>Administración</span><h1>Panel admin</h1><div class="adm"><aside class="adm-nav">${TABS.map(([k, l]) => `<button data-tab="${k}">${l}</button>`).join('')}<a href="#/">‹ Ver tienda</a></aside><section id="adm-body"></section></div>`;
    root.onclick = async e => {
      const t = e.target.closest('button, [data-tab]'); if (!t) return;
      if (t.dataset.tab) { tab = t.dataset.tab; return paint(); }
      if (t.dataset.add) { const d = DEFS[t.dataset.add]; return form({ title: d.add, fields: d.fields(), values: d.blank(), onSave: o => DB.save(t.dataset.add, o) }); }
      if (t.dataset.edit) { const [c, id] = t.dataset.edit.split(':'), d = DEFS[c], it = S[c].find(x => x.id === id); return form({ title: 'Editar: ' + it.name, fields: d.fields(), values: it, onSave: o => DB.save(c, o) }); }
      if (t.dataset.del) { const [c, id] = t.dataset.del.split(':'); if (!confirm('¿Borrar este elemento?')) return; try { await DB.remove(c, id); toast('Borrado'); await refresh(); } catch (er) { toast(DB.friendlyError(er), true); } return; }
      if (t.dataset.ticket) return showTicket(quotes.find(q => q.id === t.dataset.ticket));
      if (t.dataset.design) return openDesign(quotes.find(q => q.id === t.dataset.design));
      if (t.id === 'lc-buy') return openBuy({});
      if (t.dataset.buy) return openBuy({ code: t.dataset.buy });
      if (t.dataset.hist) return openHistory(t.dataset.hist);
      if (t.id === 'lc-gen') return generateCards();
      if (t.id === 'lc-csv') return downloadCSV();
      if (t.id === 'lc-sheet') return printSheet();
      if (t.id === 'lc-draw') return drawRaffle();
      if (t.id === 'bl-add') return openBlankForm();
      if (t.id === 'ct-seed') { const cols = [S.testimonialsSeeded && 'testimonials', S.faqsSeeded && 'faqs'].filter(Boolean); try { await DB.seed(cols); toast('Ejemplos guardados: ya puedes editarlos'); await refresh(); } catch (er) { toast(DB.friendlyError(er), true); } return; }
      if (t.dataset.bin) return adjustBlank(t.dataset.bin, 1);
      if (t.dataset.bout) return adjustBlank(t.dataset.bout, -1);
      if (t.dataset.bdel) { if (!confirm('¿Borrar esta combinación del inventario?')) return; try { await DB.remove('blanks', t.dataset.bdel); toast('Borrado'); await loadBlanks(); paint(); } catch (er) { toast(DB.friendlyError(er), true); } return; }
      if (t.dataset.delq) { if (!confirm('¿Borrar esta cotización?')) return; try { await DB.remove('quotes', t.dataset.delq); toast('Borrada'); await paint(); } catch (er) { toast(DB.friendlyError(er), true); } return; }
      if (t.id === 'd-seed') { if (!confirm('¿Cargar los datos de ejemplo?')) return; try { await DB.seed(); toast('Datos de ejemplo cargados'); await refresh(); } catch (er) { toast(DB.friendlyError(er), true); } return; }
      if (t.id === 'd-exp') { const blob = new Blob([JSON.stringify({ catalog: S.catalog, extras: S.extras, stock: S.stock, settings: S.settings }, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'draguz-catalogo.json'; a.click(); return; }
      if (t.id === 'd-imp') return $('#d-file').click();
      if (t.id === 'd-reset') { if (!confirm('Se borrarán los datos demo de este navegador.')) return; await DB.reset(); location.hash = '#/'; location.reload(); }
    };
    root.onchange = async e => {
      if (e.target.dataset.st) { const q = quotes.find(x => x.id === e.target.dataset.st); return changeStatus(q, e.target.value, e.target); }
      if (e.target.id === 'lc-month') { rMonth = e.target.value; return paint(); }
      if (e.target.id === 'd-file') {
        try {
          const j = JSON.parse(await e.target.files[0].text());
          for (const c of ['catalog', 'extras', 'stock']) for (const it of (j[c] || [])) await DB.save(c, it);
          if (j.settings) await DB.saveSettings(j.settings);
          toast('Importado'); await refresh();
        } catch (er) { toast('Archivo inválido: ' + er.message, true); }
      }
    };
    let qt;
    root.oninput = e => {
      if (e.target.id !== 'lc-q' && e.target.id !== 'bl-q') return;
      const id = e.target.id; if (id === 'lc-q') cardQ = e.target.value; else blankQ = e.target.value;
      clearTimeout(qt); qt = setTimeout(async () => { await paint(); const i = $('#' + id); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250);
    };
    root.onsubmit = async e => {
      if (e.target.id !== 'set-f') return; e.preventDefault(); const f = new FormData(e.target);
      try { await DB.saveSettings(Object.assign({}, S.settings, { whatsapp: String(f.get('whatsapp') || '').replace(/\D/g, ''), anticipoPct: +f.get('anticipoPct') || 0, validityDays: +f.get('validityDays') || 7, loyaltyEvery: Math.max(2, parseInt(f.get('loyaltyEvery'), 10) || 8), loyaltyPct: Math.min(100, Math.max(0, +f.get('loyaltyPct') || 0)), loyaltyMin: Math.max(0, +f.get('loyaltyMin') || 0), rafflePrize: String(f.get('rafflePrize') || '').trim() })); toast('Ajustes guardados'); await refresh(); } catch (er) { toast(DB.friendlyError(er), true); }
    };
    paint();
  }
  return { render };
})();

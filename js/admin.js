/* Panel de administración */
window.Admin = (function () {
  'use strict';
  const { S, DB, $, $$, money, esc, toast, openModal, closeModal, reload, resizeImage, showTicket } = window.DZ;
  const clone = o => JSON.parse(JSON.stringify(o));
  const TABS = [['resumen', 'Resumen'], ['stock', 'Stock'], ['catalogo', 'Catálogo personalizable'], ['extras', 'Extras y estampados'], ['cotizaciones', 'Cotizaciones'], ['ajustes', 'Ajustes']];
  const STATUS = { nueva: 'Nueva', proceso: 'En proceso', cotizada: 'Cotizada', cerrada: 'Cerrada', cancelada: 'Cancelada' };
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
      title: 'Catálogo personalizable', add: 'Nuevo producto personalizable', blank: () => ({ name: '', category: '', kind: 'tee', description: '', priceMenudeo: 0, priceMayoreo: 0, mayoreoMin: 12, sizes: [], sizeExtra: {}, colors: [], images: [], active: true, order: 99 }),
      fields: () => [{ key: 'name', label: 'Nombre', req: 1 }, { key: 'category', label: 'Categoría', list: cats() }, { key: 'priceMenudeo', label: 'Precio menudeo (por pieza)', type: 'number', req: 1 }, { key: 'priceMayoreo', label: 'Precio mayoreo (por pieza)', type: 'number', req: 1 },
        { key: 'mayoreoMin', label: 'Mayoreo desde (piezas)', type: 'number' }, { key: 'kind', label: 'Ícono si no hay foto', type: 'select', opts: KINDS },
        { key: 'sizes', label: 'Tallas', type: 'list', ph: 'S, M, L, XL, XXL', hint: 'Vacío = se cotiza por cantidad total (gorras, tazas…).' }, { key: 'sizeExtra', label: 'Recargo por talla (por pieza)', type: 'pairs', ph: 'XXL:20, 3XL:35' },
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

  function tableHTML(col) {
    const d = DEFS[col], rows = S[col === 'catalog' ? 'catalog' : col];
    return `<div class="adm-h"><h2>${d.title}</h2><button class="btn sm" data-add="${col}">+ ${d.add}</button></div>
      <div class="tblwrap"><table class="tbl"><thead><tr>${d.cols.map(c => `<th>${c[0]}</th>`).join('')}<th></th></tr></thead><tbody>
      ${rows.length ? rows.map(r => `<tr>${d.cols.map(c => `<td>${c[1](r)}</td>`).join('')}<td><div class="acts"><button class="btn ghost sm" data-edit="${col}:${r.id}">Editar</button><button class="btn danger sm" data-del="${col}:${r.id}">Borrar</button></div></td></tr>`).join('') : `<tr><td colspan="${d.cols.length + 1}" style="text-align:center;color:var(--mute);padding:36px">Nada por aquí todavía.</td></tr>`}
      </tbody></table></div>`;
  }

  async function quotesHTML() {
    try { quotes = (await DB.list('quotes')).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); } catch (e) { return '<div class="note">' + esc(DB.friendlyError(e)) + '</div>'; }
    return `<div class="adm-h"><h2>Cotizaciones</h2></div><div class="tblwrap"><table class="tbl"><thead><tr><th>Folio</th><th>Fecha</th><th>Cliente</th><th>Piezas</th><th>Total</th><th>Estado</th><th></th></tr></thead><tbody>
      ${quotes.length ? quotes.map(q => `<tr><td><b>${esc(q.folio)}</b></td><td>${new Date(q.createdAt || q.date).toLocaleDateString('es-MX')}</td><td>${esc(q.name || q.customer.name || '—')}<br><span class="tag">${esc(q.email || '')}${q.customer && q.customer.phone ? ' · ' + esc(q.customer.phone) : ''}</span></td><td>${q.lines.reduce((a, l) => a + l.qty, 0)}</td><td><b>${money(q.total)}</b></td>
      <td><select data-st="${q.id}">${Object.entries(STATUS).map(([k, l]) => `<option value="${k}" ${q.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
      <td><div class="acts"><button class="btn ghost sm" data-ticket="${q.id}">Ticket</button><button class="btn danger sm" data-delq="${q.id}">Borrar</button></div></td></tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--mute);padding:36px">Aún no llegan solicitudes.</td></tr>'}
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
      <button class="btn" style="justify-self:start">Guardar ajustes</button></form>
      <h3 class="lbl" style="margin-top:38px">Datos</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn ghost sm" id="d-seed">Cargar datos de ejemplo</button><button class="btn ghost sm" id="d-exp">Exportar catálogo (JSON)</button><button class="btn ghost sm" id="d-imp">Importar catálogo (JSON)</button>${DB.mode === 'demo' ? '<button class="btn danger sm" id="d-reset">Restablecer demo</button>' : ''}<input type="file" id="d-file" accept="application/json" hidden></div>
      <p class="tag" style="margin-top:14px;max-width:560px;text-transform:none;letter-spacing:.02em">“Cargar datos de ejemplo” agrega o reemplaza los productos de muestra (mismos ids), sin tocar los que tú creaste.</p>`;
  }

  async function refresh() { await reload(); await paint(); }
  async function paint() {
    const body = $('#adm-body'); if (!body) return;
    $$('.adm-nav [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    if (tab === 'resumen') body.innerHTML = await summaryHTML();
    else if (tab === 'stock') body.innerHTML = tableHTML('stock');
    else if (tab === 'catalogo') body.innerHTML = tableHTML('catalog');
    else if (tab === 'extras') body.innerHTML = tableHTML('extras');
    else if (tab === 'cotizaciones') body.innerHTML = await quotesHTML();
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
      if (t.dataset.delq) { if (!confirm('¿Borrar esta cotización?')) return; try { await DB.remove('quotes', t.dataset.delq); toast('Borrada'); await paint(); } catch (er) { toast(DB.friendlyError(er), true); } return; }
      if (t.id === 'd-seed') { if (!confirm('¿Cargar los datos de ejemplo?')) return; try { await DB.seed(); toast('Datos de ejemplo cargados'); await refresh(); } catch (er) { toast(DB.friendlyError(er), true); } return; }
      if (t.id === 'd-exp') { const blob = new Blob([JSON.stringify({ catalog: S.catalog, extras: S.extras, stock: S.stock, settings: S.settings }, null, 1)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'draguz-catalogo.json'; a.click(); return; }
      if (t.id === 'd-imp') return $('#d-file').click();
      if (t.id === 'd-reset') { if (!confirm('Se borrarán los datos demo de este navegador.')) return; await DB.reset(); location.hash = '#/'; location.reload(); }
    };
    root.onchange = async e => {
      if (e.target.dataset.st) { const q = quotes.find(x => x.id === e.target.dataset.st); try { await DB.save('quotes', Object.assign({}, q, { status: e.target.value })); toast('Estado actualizado'); } catch (er) { toast(DB.friendlyError(er), true); } }
      if (e.target.id === 'd-file') {
        try {
          const j = JSON.parse(await e.target.files[0].text());
          for (const c of ['catalog', 'extras', 'stock']) for (const it of (j[c] || [])) await DB.save(c, it);
          if (j.settings) await DB.saveSettings(j.settings);
          toast('Importado'); await refresh();
        } catch (er) { toast('Archivo inválido: ' + er.message, true); }
      }
    };
    root.onsubmit = async e => {
      if (e.target.id !== 'set-f') return; e.preventDefault(); const f = new FormData(e.target);
      try { await DB.saveSettings(Object.assign({}, S.settings, { whatsapp: String(f.get('whatsapp') || '').replace(/\D/g, ''), anticipoPct: +f.get('anticipoPct') || 0, validityDays: +f.get('validityDays') || 7 })); toast('Ajustes guardados'); await refresh(); } catch (er) { toast(DB.friendlyError(er), true); }
    };
    paint();
  }
  return { render };
})();

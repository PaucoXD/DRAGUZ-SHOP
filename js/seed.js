/* Datos de ejemplo. Los PRECIOS son de muestra (excepto el polo Dri-Fit): edítalos en Admin. */
(function () {
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join('');
  }
  // Imagen de reemplazo cuando un producto no tiene foto: prenda con volumen, del color del
  // producto, con el logo real de Draguz Shop, sobre fondo oscuro de estudio. Sube una foto
  // real desde Admin para reemplazarla.
  const G = {
    tee: { body: 'M130 60 L78 82 L28 142 L74 184 L110 152 L110 350 Q200 362 290 350 L290 152 L326 184 L372 142 L322 82 L270 60 Q200 102 130 60 Z', detail: ['M130 60 Q200 102 270 60 Q200 84 130 60 Z'], lines: ['M110 152 L110 190', 'M290 152 L290 190'], logo: [134, 130, 132] },
    polo: { body: 'M132 62 L80 84 L30 142 L74 184 L110 152 L110 350 Q200 362 290 350 L290 152 L326 184 L372 142 L320 84 L268 62 L232 70 L200 112 L168 70 Z', detail: ['M168 70 L200 112 L186 124 L148 74 Z', 'M232 70 L200 112 L214 124 L252 74 Z'], lines: ['M200 112 L200 190'], logo: [214, 150, 62] },
    hoodie: { body: 'M140 58 Q200 22 260 58 L320 82 L374 196 L336 210 L300 154 L300 356 Q200 368 100 356 L100 154 L64 210 L26 196 L80 82 Z', detail: ['M158 64 Q200 124 242 64 Q200 84 158 64 Z', 'M130 272 L270 272 L286 332 L114 332 Z'], lines: ['M186 108 L182 170', 'M214 108 L218 170', 'M146 64 Q156 30 200 26 Q244 30 254 64'], logo: [142, 168, 116] },
    cap: { body: 'M92 244 Q92 108 200 102 Q308 108 308 244 Z', detail: ['M66 240 Q200 280 334 240 Q312 304 200 306 Q88 304 66 240 Z'], lines: ['M200 104 L200 140', 'M140 118 Q120 180 124 244', 'M260 118 Q280 180 276 244'], dots: [[200, 104, 7]], logo: [140, 140, 120] },
    mug: { body: 'M112 110 L288 110 L288 316 Q288 330 274 330 L126 330 Q112 330 112 316 Z', handle: 1, rim: 1, detail: [], lines: [], logo: [130, 180, 140] },
    bag: { body: 'M98 150 L302 150 L310 362 L90 362 Z', handles: 1, detail: [], lines: [], logo: [130, 222, 140] },
    sticker: { body: 'M96 120 Q96 96 120 96 L280 96 Q304 96 304 120 L304 250 L250 304 L120 304 Q96 304 96 280 Z', detail: ['M304 250 L250 304 L262 262 Z'], lines: [], sticker: 1, logo: [112, 160, 176] }
  };
  const lum = hex => { const n = parseInt(String(hex).slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const cache = {};
  window.ph = function (kind, color) {
    color = /^#[0-9a-f]{6}$/i.test(color || '') ? color : '#141418';
    const key = kind + color; if (cache[key]) return cache[key];
    const g = G[kind] || G.tee, light = lum(color) > 0.6;
    const base = g.sticker ? '#f4f4f4' : color, det = shade(base, light ? 0.86 : 0.68);
    const lh = Math.round(g.logo[2] * 0.43), cx = g.logo[0] + g.logo[2] / 2, cy = g.logo[1] + lh / 2;
    // en prendas oscuras, un brillo suave detrás del logo para que destaque como estampado
    const glow = !light && !g.sticker ? `<ellipse cx="${cx}" cy="${cy}" rx="${g.logo[2] * 0.62}" ry="${lh * 0.9}" fill="url(#lg)"/>` : '';
    const logo = window.LOGO_DATA ? glow + `<image href="${window.LOGO_DATA}" xlink:href="${window.LOGO_DATA}" x="${g.logo[0]}" y="${g.logo[1]}" width="${g.logo[2]}" height="${lh}" preserveAspectRatio="xMidYMid meet" opacity=".96"/>` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 400 400">
      <defs>
        <radialGradient id="bg" cx="50%" cy="44%" r="70%"><stop offset="0" stop-color="#2d2542"/><stop offset=".55" stop-color="#15121d"/><stop offset="1" stop-color="#0a0a0e"/></radialGradient>
        <linearGradient id="sx" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".34"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>
        <radialGradient id="hl" cx="42%" cy="34%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity="${light ? 0.32 : 0.14}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <linearGradient id="sy" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>
        <radialGradient id="lg"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <clipPath id="cp"><path d="${g.body}"/></clipPath>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000" flood-opacity=".6"/></filter>
      </defs>
      <rect width="400" height="400" fill="url(#bg)"/>
      <ellipse cx="200" cy="372" rx="150" ry="16" fill="#000" opacity=".45"/>
      ${g.handle ? `<path d="M288 150 C356 150 356 280 288 280" fill="none" stroke="${shade(base, 0.9)}" stroke-width="22"/>` : ''}
      ${g.handles ? `<path d="M145 152 C145 62 255 62 255 152" fill="none" stroke="${shade(base, 0.78)}" stroke-width="12"/>` : ''}
      <path d="${g.body}" fill="${base}" filter="url(#sh)"/>
      <g clip-path="url(#cp)"><rect width="400" height="400" fill="url(#sx)"/><rect width="400" height="400" fill="url(#hl)"/><rect width="400" height="400" fill="url(#sy)"/></g>
      ${g.detail.map(d => `<path d="${d}" fill="${det}"/>`).join('')}
      ${g.rim ? `<ellipse cx="200" cy="110" rx="88" ry="12" fill="${shade(base, 0.78)}"/>` : ''}
      <g fill="none" stroke="${light ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.1)'}" stroke-width="2">${g.lines.map(d => `<path d="${d}"/>`).join('')}</g>
      ${(g.dots || []).map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${det}"/>`).join('')}
      <path d="${g.body}" fill="none" stroke="${light ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.14)'}" stroke-width="1.5"/>
      ${logo}
    </svg>`;
    return (cache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\n\s*/g, '')));
  };

  const C = {
    negro: { name: 'Negro', hex: '#0d0d10' }, blanco: { name: 'Blanco', hex: '#f4f4f4' }, rojo: { name: 'Rojo', hex: '#E3000F' },
    gris: { name: 'Gris', hex: '#6d6d78' }, indigo: { name: 'Índigo', hex: '#2C275F' }, marino: { name: 'Marino', hex: '#16213e' }
  };
  const S_STD = ['S', 'M', 'L', 'XL', 'XXL'];

  window.SEED = {
    settings: { id: 'main', whatsapp: '', anticipoPct: 50, validityDays: 7, tagline: 'Define your different', loyaltyEvery: 8, loyaltyPct: 15, loyaltyMin: 0, rafflePrize: 'Una prenda personalizada' },
    catalog: [
      { id: 'seed-playera', order: 1, kind: 'tee', name: 'Playera algodón', category: 'Playeras', description: 'Playera de algodón cuello redondo lista para personalizar.', priceMenudeo: 149, priceMayoreo: 119, mayoreoMin: 12, sizes: S_STD, sizeExtra: { XXL: 20 }, colors: [C.negro, C.blanco, C.rojo, C.gris, C.indigo], images: [], active: true },
      { id: 'seed-polo', order: 2, kind: 'polo', name: 'Polo Dri-Fit', category: 'Playeras', description: 'Polo Dri-Fit 100% poliéster, ideal para uniformes y corporativo.', priceMenudeo: 196, priceMayoreo: 141, mayoreoMin: 12, sizes: S_STD, sizeExtra: { XXL: 20 }, colors: [C.negro, C.blanco, C.marino, C.rojo], images: [], active: true },
      { id: 'seed-hoodie', order: 3, kind: 'hoodie', name: 'Hoodie canguro', category: 'Hoodies', description: 'Hoodie de felpa con bolsillo canguro.', priceMenudeo: 429, priceMayoreo: 369, mayoreoMin: 6, sizes: S_STD, sizeExtra: { XXL: 30 }, colors: [C.negro, C.gris, C.indigo], images: [], active: true },
      { id: 'seed-gorra', order: 4, kind: 'cap', name: 'Gorra snapback', category: 'Gorras', description: 'Gorra snapback ajustable, frente estructurado.', priceMenudeo: 129, priceMayoreo: 99, mayoreoMin: 12, sizes: [], sizeExtra: {}, colors: [C.negro, C.marino, C.blanco], images: [], active: true },
      { id: 'seed-taza', order: 5, kind: 'mug', name: 'Taza personalizada', category: 'Accesorios', description: 'Taza cerámica 11 oz con tu diseño.', priceMenudeo: 99, priceMayoreo: 79, mayoreoMin: 12, sizes: [], sizeExtra: {}, colors: [C.blanco, C.negro], images: [], active: true },
      { id: 'seed-tote', order: 6, kind: 'bag', name: 'Bolsa tote', category: 'Accesorios', description: 'Bolsa de tela resistente para uso diario.', priceMenudeo: 89, priceMayoreo: 69, mayoreoMin: 12, sizes: [], sizeExtra: {}, colors: [C.negro, C.blanco], images: [], active: true },
      { id: 'seed-sticker', order: 7, kind: 'sticker', name: 'Sticker troquelado', category: 'Stickers', description: 'Sticker de vinil troquelado a la forma de tu diseño, resistente al agua.', priceMenudeo: 25, priceMayoreo: 15, mayoreoMin: 25, sizes: [], sizeExtra: {}, colors: [], images: [], active: true }
    ],
    extras: [
      { id: 'seed-ex-frente', name: 'Estampado DTF frente (tamaño carta)', price: 45, scope: 'pieza', hint: 'Por pieza', active: true },
      { id: 'seed-ex-espalda', name: 'Estampado DTF espalda', price: 55, scope: 'pieza', hint: 'Por pieza', active: true },
      { id: 'seed-ex-logo', name: 'Logo chico (pecho / manga)', price: 25, scope: 'pieza', hint: 'Por pieza', active: true },
      { id: 'seed-ex-empaque', name: 'Empaque premium (caja negra mate)', price: 30, scope: 'pieza', hint: 'Por pieza', active: true },
      { id: 'seed-ex-diseno', name: 'Diseño / vectorizado de logo', price: 150, scope: 'unico', hint: 'Cargo único', active: true }
    ],
    // Opiniones: conversaciones reales resumidas, solo con iniciales (sin fotos, teléfonos ni datos de pago).
    // Formato del chat: una línea por mensaje; "C:" = cliente, "D:" = Draguz.
    testimonials: [
      { id: 'seed-op-1', order: 1, name: 'F.', product: 'Termo y playeras', source: 'WhatsApp', active: true,
        chat: 'D: Hola, buenas noches. ¿Le tapamos estas letras?\nC: Sí puede, sí\nD: Ya quedaron. Que tenga muy buen viaje, gracias por su compra 🙋\nC: Un placer' },
      { id: 'seed-op-2', order: 2, name: 'M.', product: 'Regalo personalizado', source: 'Instagram', active: true,
        chat: 'D: Listo amiga. ¿Nos etiquetas? 🤪\nD: Cualquier cosa estamos al pendiente\nC: Muchas gracias 🥰🥰\nD: Esperamos sea de su agrado y le guste a tu novio 😁' },
      { id: 'seed-op-3', order: 3, name: 'K.', product: 'Entrega a domicilio', source: 'WhatsApp', active: true,
        chat: 'C: ¿Podemos pasar por ellas?\nD: Si quieres al ratito se las llevo\nC: Me avisas si lo dejas en la casa y yo te transfiero\nD: ¡Gracias! Espero les gusten 👍' },
      { id: 'seed-op-4', order: 4, name: '', product: 'Playeras lisas', source: 'WhatsApp', active: true,
        chat: 'C: Esas solas, sin diseño, ¿en cuánto las tienes?\nD: $145 las tenemos\nD: Ya quedaron las playeras\nC: Ahí voy por ellas' },
      { id: 'seed-op-5', order: 5, name: 'K. L.', product: 'Entrega en punto de encuentro', source: 'WhatsApp', active: true,
        chat: 'C: Te miro en el Oxxo a la 1:45\nD: Va que va, ya voy para allá\nC: Gracias 😊\nD: A ti, esperamos les guste. ¡Nos mandan foto! 😊' }
    ],
    // Preguntas frecuentes. {anticipo} se reemplaza por el % de Ajustes.
    faqs: [
      { id: 'seed-faq-1', order: 1, active: true, q: '¿Cuánto tarda mi pedido?', a: 'Depende de la cantidad y del diseño. Te confirmamos la fecha al cotizar; si lo necesitas para un día en especial, dínoslo desde el principio y lo planeamos.' },
      { id: 'seed-faq-2', order: 2, active: true, q: '¿Hay pedido mínimo?', a: 'No: puedes pedir desde una pieza con precio de menudeo. A partir de cierta cantidad aplica precio de mayoreo; el cotizador te lo calcula al instante.' },
      { id: 'seed-faq-3', order: 3, active: true, q: '¿Cómo pago?', a: 'Por transferencia o en efectivo. Para arrancar tu pedido pedimos un anticipo del {anticipo} % y el resto al entregar.' },
      { id: 'seed-faq-4', order: 4, active: true, q: '¿Hacen entregas?', a: 'Sí. Nos vemos en un punto de entrega o te lo llevamos a domicilio. Pregúntanos por envíos a otras ciudades.' },
      { id: 'seed-faq-5', order: 5, active: true, q: '¿Cómo les mando mi diseño?', a: 'Mándalo por WhatsApp junto con tu folio de cotización. Lo ideal es PNG con fondo transparente, PDF o SVG. Si solo tienes una foto o un boceto, lo podemos vectorizar.' },
      { id: 'seed-faq-6', order: 6, active: true, q: '¿Venden playeras sin diseño?', a: 'Sí, también vendemos prendas lisas. Pregúntanos por colores y tallas disponibles.' },
      { id: 'seed-faq-7', order: 7, active: true, q: '¿Cómo cuido mi prenda estampada?', a: 'Lávala al revés con agua fría, sin cloro ni suavizante fuerte, y no planches directo sobre el estampado.' },
      { id: 'seed-faq-8', order: 8, active: true, q: '¿Qué es la tarjeta Draguz?', a: 'Es tu tarjeta de cliente: escanea su QR, regístrala y acumula tus compras. Con tu primera compra entras al sorteo del mes y cada cierto número de compras te toca un descuento.' }
    ],
    gallery: [],
    stock: [
      { id: 'seed-st-1', name: 'Playera Draguz Classic', category: 'Playeras', price: 249, qty: 12, sizes: ['S', 'M', 'L', 'XL'], description: 'Playera negra con logo Draguz. Pieza de stock lista para entrega.', images: [ph('tee', '#0d0d10')], active: true },
      { id: 'seed-st-2', name: 'Playera Draguz Blanca', category: 'Playeras', price: 249, qty: 8, sizes: ['M', 'L', 'XL'], description: 'Playera blanca con logo Draguz.', images: [ph('tee', '#f4f4f4')], active: true },
      { id: 'seed-st-3', name: 'Hoodie Draguz Negro', category: 'Hoodies', price: 599, qty: 5, sizes: ['M', 'L', 'XL'], description: 'Hoodie de felpa con logo Draguz.', images: [ph('hoodie', '#16161b')], active: true },
      { id: 'seed-st-4', name: 'Hoodie Draguz Gris', category: 'Hoodies', price: 599, qty: 2, sizes: ['L', 'XL'], description: 'Hoodie gris con logo Draguz.', images: [ph('hoodie', '#6d6d78')], active: true },
      { id: 'seed-st-5', name: 'Gorra Snapback Draguz', category: 'Gorras', price: 279, qty: 10, sizes: [], description: 'Gorra snapback negra con logo frontal.', images: [ph('cap', '#0d0d10')], active: true },
      { id: 'seed-st-6', name: 'Polo Dri-Fit Marino', category: 'Playeras', price: 329, qty: 6, sizes: ['M', 'L'], description: 'Polo Dri-Fit color marino.', images: [ph('polo', '#16213e')], active: true },
      { id: 'seed-st-7', name: 'Taza Draguz', category: 'Accesorios', price: 149, qty: 15, sizes: [], description: 'Taza cerámica 11 oz con logo.', images: [ph('mug', '#f4f4f4')], active: true },
      { id: 'seed-st-8', name: 'Tote Draguz', category: 'Accesorios', price: 159, qty: 0, sizes: [], description: 'Bolsa de tela negra.', images: [ph('bag', '#0d0d10')], active: true }
    ]
  };
})();

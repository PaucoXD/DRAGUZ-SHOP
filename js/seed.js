/* Datos de ejemplo. Los PRECIOS son de muestra (excepto el polo Dri-Fit): edítalos en Admin. */
(function () {
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join('');
  }
  window.ph = function (kind, color, accent, opts) {
    color = color || '#1a1a1f'; accent = accent || '#E3000F';
    const real = window.PRENDAS && window.PRENDAS[kind];
    if (real) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 460 460"><defs><filter id="t" color-interpolation-filters="sRGB"><feFlood flood-color="${color}"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs>`
        + `<g style="isolation:isolate"><image width="460" height="460" xlink:href="${real[0]}" filter="url(#t)"/>`
        + `<image width="460" height="460" xlink:href="${real[0]}" style="mix-blend-mode:multiply"/>`
        + `<image width="460" height="460" xlink:href="${real[1]}" style="mix-blend-mode:screen"/></g>`
        + (opts && opts.logo && window.LOGO_DATA ? (kind === 'polo' ? `<image x="250" y="150" width="80" height="80" xlink:href="${window.LOGO_DATA}" preserveAspectRatio="xMidYMid meet"/>` : `<image x="160" y="${kind === 'oversize' ? 120 : 125}" width="140" height="110" xlink:href="${window.LOGO_DATA}" preserveAspectRatio="xMidYMid meet"/>`) : '')
        + `</svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
    const d = shade(color, .7), st = 'stroke="rgba(0,0,0,.28)" stroke-width="1.5"';
    const ds = `<text x="100" y="122" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-style="italic" font-size="24" fill="${accent}">DS</text>`;
    const TEE = 'M70 28 C80 34 120 34 130 28 L162 40 Q176 46 182 60 L170 92 L146 84 L146 170 Q100 176 54 170 L54 84 L30 92 L18 60 Q24 46 38 40 Z';
    const OVER = 'M68 26 C80 32 120 32 132 26 L170 40 Q184 48 190 70 L178 112 L152 106 L152 182 Q100 188 48 182 L48 106 L22 112 L10 70 Q16 48 30 40 Z';
    const garment = (body, seams, hems, hem, neck, folds) => `<defs><clipPath id="c"><path d="${body}"/></clipPath>`
      + `<linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".1"/><stop offset=".8" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>`
      + `<linearGradient id="sv" y1="0" y2="1" x1="0" x2="0"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>`
      + `<filter id="b"><feGaussianBlur stdDeviation="2.2"/></filter></defs>`
      + `<ellipse cx="100" cy="190" rx="70" ry="5" fill="#000" opacity=".35" filter="url(#b)"/>`
      + `<path d="${body}" fill="${color}"/><g clip-path="url(#c)"><rect width="200" height="200" fill="url(#sh)"/><rect width="200" height="200" fill="url(#sv)"/>`
      + `<path d="${(folds || 'M74 110 Q82 140 76 168 M128 106 Q120 136 126 166')}" fill="none" stroke="#000" stroke-opacity=".13" stroke-width="4" filter="url(#b)"/>`
      + `<path d="${(folds || 'M74 110 Q82 140 76 168 M128 106 Q120 136 126 166')}" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="2" transform="translate(4 0)" filter="url(#b)"/>`
      + `<path d="${seams}" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="1.2"/><path d="${hems} ${hem}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1" stroke-dasharray="2 2"/></g>`
      + (neck ? `<path d="M78 30 Q100 40 122 30 Q100 46 78 30Z" fill="${d}"/><path d="${neck}" fill="none" stroke="${d}" stroke-width="5" stroke-linecap="round"/><path d="${neck}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="1" transform="translate(0 2.6)"/>` : '')
      + `<path d="${body}" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.2" stroke-linejoin="round"/>`;
    const shapes = {
      tee: garment(TEE, 'M54 84 Q52 58 64 32 M146 84 Q148 58 136 32', 'M23 58 L35 90 M177 58 L165 90', 'M55 164 Q100 170 145 164', 'M80 30 Q100 50 120 30') + ds,
      oversize: garment(OVER, 'M48 108 Q44 74 40 44 M152 108 Q156 74 160 44', 'M14 66 L26 110 M186 66 L174 110', 'M49 175 Q100 182 151 175', 'M80 28 Q100 50 120 28', 'M78 120 Q86 150 80 178 M124 118 Q116 146 122 176') + ds.replace('y="122"', 'y="124"'),
      polo: garment(TEE, 'M54 84 Q52 58 64 32 M146 84 Q148 58 136 32', 'M23 58 L35 90 M177 58 L165 90', 'M55 164 Q100 170 145 164', '')
        + `<rect x="95" y="44" width="10" height="38" rx="1.5" fill="${color}" stroke="rgba(0,0,0,.35)" stroke-width="1"/><g fill="${d}" stroke="rgba(255,255,255,.18)" stroke-width=".6"><circle cx="100" cy="54" r="2"/><circle cx="100" cy="64" r="2"/><circle cx="100" cy="74" r="2"/></g>`
        + `<path d="M78 29 Q100 22 122 29 L121 34 Q100 28 79 34Z" fill="${d}"/><g fill="${color}" stroke="rgba(0,0,0,.4)" stroke-width="1.2" stroke-linejoin="round"><path d="M79 30 L100 44 L92 60 L68 44Z"/><path d="M121 30 L100 44 L108 60 L132 44Z"/></g><path d="M79 30 L100 44 L92 60 L68 44Z M121 30 L100 44 L108 60 L132 44Z" fill="url(#sh)" opacity=".5"/>`
        + `<text x="122" y="84" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-style="italic" font-size="11" fill="${accent}">DS</text>`,
      hoodie: `<path d="M62 34 L22 62 L34 128 L58 120 L58 176 L142 176 L142 120 L166 128 L178 62 L138 34 Q100 60 62 34Z" fill="${color}" ${st}/><path d="M72 34 Q100 80 128 34" fill="none" stroke="${d}" stroke-width="6"/><rect x="76" y="140" width="48" height="26" rx="6" fill="none" stroke="${d}" stroke-width="3"/>${ds.replace('y="122"', 'y="122"')}`,
      cap: `<path d="M40 124 Q40 60 100 56 Q160 60 160 124 Z" fill="${color}" ${st}/><path d="M34 124 Q100 138 178 118 Q152 150 60 146 Z" fill="${d}" ${st}/><text x="100" y="106" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-style="italic" font-size="20" fill="${accent}">DS</text>`,
      mug: `<rect x="56" y="60" width="80" height="94" rx="8" fill="${color}" ${st}/><path d="M136 78 h18 a16 16 0 0 1 0 44 h-18" fill="none" stroke="${color}" stroke-width="10"/>${ds.replace('x="100" y="122"', 'x="96" y="116"')}`,
      bag: `<path d="M64 84 Q64 44 100 44 Q136 44 136 84" fill="none" stroke="${d}" stroke-width="8"/><rect x="48" y="80" width="104" height="100" rx="6" fill="${color}" ${st}/>${ds.replace('y="122"', 'y="140"')}`,
      sticker: `<path d="M46 46 h108 v76 l-30 32 H46 Z" fill="${color}" ${st}/><path d="M124 122 v30 l30 -30 Z" fill="${d}"/>${ds.replace('y="122"', 'y="92"')}`
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${shapes[kind] || shapes.tee}</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
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
      { id: 'seed-oversize', order: 2, kind: 'oversize', name: 'Playera oversize', category: 'Playeras', description: 'Playera oversize 100% algodón, hombro caído y corte holgado, lista para personalizar.', priceMenudeo: 179, priceMayoreo: 149, mayoreoMin: 8, sizes: S_STD, sizeExtra: { XXL: 20 }, colors: [C.negro, C.blanco, C.gris], images: [], active: true },
      { id: 'seed-polo', order: 3, kind: 'polo', name: 'Polo Dri-Fit', category: 'Playeras', description: 'Polo Dri-Fit 100% poliéster, ideal para uniformes y corporativo.', priceMenudeo: 196, priceMayoreo: 141, mayoreoMin: 12, sizes: S_STD, sizeExtra: { XXL: 20 }, colors: [C.negro, C.blanco, C.marino, C.rojo], images: [], active: true },
      { id: 'seed-hoodie', order: 4, kind: 'hoodie', name: 'Hoodie canguro', category: 'Hoodies', description: 'Hoodie de felpa con bolsillo canguro.', priceMenudeo: 429, priceMayoreo: 369, mayoreoMin: 6, sizes: S_STD, sizeExtra: { XXL: 30 }, colors: [C.negro, C.gris, C.indigo], images: [], active: true },
      { id: 'seed-gorra', order: 5, kind: 'cap', name: 'Gorra snapback', category: 'Gorras', description: 'Gorra snapback ajustable, frente estructurado.', priceMenudeo: 129, priceMayoreo: 99, mayoreoMin: 12, sizes: [], sizeExtra: {}, colors: [C.negro, C.marino, C.blanco], images: [], active: true },
      { id: 'seed-taza', order: 6, kind: 'mug', name: 'Taza personalizada', category: 'Accesorios', description: 'Taza cerámica 11 oz con tu diseño.', priceMenudeo: 99, priceMayoreo: 79, mayoreoMin: 12, sizes: [], sizeExtra: {}, colors: [C.blanco, C.negro], images: [], active: true },
      { id: 'seed-tote', order: 7, kind: 'bag', name: 'Bolsa tote', category: 'Accesorios', description: 'Bolsa de tela resistente para uso diario.', priceMenudeo: 89, priceMayoreo: 69, mayoreoMin: 12, sizes: [], sizeExtra: {}, colors: [C.negro, C.blanco], images: [], active: true },
      { id: 'seed-sticker', order: 8, kind: 'sticker', name: 'Sticker troquelado', category: 'Stickers', description: 'Sticker de vinil troquelado a la forma de tu diseño, resistente al agua.', priceMenudeo: 25, priceMayoreo: 15, mayoreoMin: 25, sizes: [], sizeExtra: {}, colors: [], images: [], active: true }
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

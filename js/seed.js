/* Datos de ejemplo. Los PRECIOS son de muestra (excepto el polo Dri-Fit): edítalos en Admin. */
(function () {
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(v * k)));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join('');
  }
  window.ph = function (kind, color, accent) {
    color = color || '#1a1a1f'; accent = accent || '#E3000F';
    const d = shade(color, .7), st = 'stroke="rgba(0,0,0,.28)" stroke-width="1.5"';
    const ds = `<text x="100" y="122" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-style="italic" font-size="24" fill="${accent}">DS</text>`;
    const shapes = {
      tee: `<path d="M60 30 L20 55 L38 90 L58 78 L58 172 L142 172 L142 78 L162 90 L180 55 L140 30 Q100 52 60 30Z" fill="${color}" ${st}/>${ds}`,
      polo: `<path d="M60 30 L20 55 L38 90 L58 78 L58 172 L142 172 L142 78 L162 90 L180 55 L140 30 L118 44 L100 66 L82 44Z" fill="${color}" ${st}/><path d="M82 44 L100 66 L118 44" fill="none" stroke="${d}" stroke-width="5"/>${ds.replace('y="122"', 'y="128"')}`,
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

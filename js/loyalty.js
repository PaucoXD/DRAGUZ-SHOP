/* Programa de lealtad: lógica compartida por la página de la tarjeta y el panel admin. */
window.Loyalty = (function () {
  'use strict';
  // Sin 0/O ni 1/I para que el código no se confunda al teclearlo
  const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  const conf = s => ({
    every: Math.max(2, parseInt(s && s.loyaltyEvery, 10) || 8),
    pct: Math.min(100, Math.max(0, +(s && s.loyaltyPct) || 0)),
    min: Math.max(0, +(s && s.loyaltyMin) || 0),
    prize: (s && s.rafflePrize) || ''
  });

  // DZ-0147-K7Q: consecutivo legible + 3 caracteres al azar para que no se puedan adivinar
  function genCode(seq) {
    let r = ''; const a = new Uint32Array(3); crypto.getRandomValues(a);
    a.forEach(n => { r += ABC[n % ABC.length]; });
    return 'DZ-' + String(seq).padStart(4, '0') + '-' + r;
  }
  function normCode(t) {
    const c = String(t || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const m = c.match(/^DZ(\d{4,})([A-Z0-9]{3})$/);
    return m ? 'DZ-' + m[1] + '-' + m[2] : '';
  }

  // Estado de la tarjeta: cuántos sellos lleva en el ciclo actual y qué le toca a la siguiente compra
  function status(card, settings) {
    const c = conf(settings), done = +(card && card.purchases) || 0;
    const filled = done % c.every, next = done + 1;
    return {
      every: c.every, pct: c.pct, min: c.min, prize: c.prize, done, filled, next,
      nextHasDiscount: c.pct > 0 && next % c.every === 0,
      left: c.every - filled - 1, // compras que faltan antes de la que trae descuento
      nextIsFirst: done === 0
    };
  }

  const monthKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const monthName = key => { const [y, m] = String(key).split('-'); return (MESES[+m - 1] || '') + ' ' + y; };
  const cardUrl = code => location.origin + location.pathname.replace(/index\.html$/, '') + '#/tarjeta/' + code;

  return { conf, genCode, normCode, status, monthKey, monthName, cardUrl };
})();

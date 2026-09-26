import { listarProductos, modoLocal } from "./firebase-init.js";

const els = {
  producto: document.getElementById("producto"),
  tallaWrap: document.getElementById("tallaWrap"),
  colorWrap: document.getElementById("colorWrap"),
  cantidad: document.getElementById("cantidad"),
  qtyMinus: document.getElementById("qtyMinus"),
  qtyPlus: document.getElementById("qtyPlus"),
  tierNote: document.getElementById("tierNote"),
  cliente: document.getElementById("cliente"),
  ticket: document.getElementById("ticket"),
  ticketBody: document.getElementById("ticketBody"),
  emptyHint: document.getElementById("emptyHint"),
  btnDescargar: document.getElementById("btnDescargar"),
  btnCopiar: document.getElementById("btnCopiar"),
  btnNuevo: document.getElementById("btnNuevo"),
  toast: document.getElementById("toast"),
};

let catalogo = [];
let state = { productoId: null, talla: null, color: null, cantidad: 1 };

function money(n) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 2200);
}

async function cargarCatalogo() {
  els.producto.innerHTML = `<option value="">Cargando catálogo…</option>`;
  try {
    catalogo = (await listarProductos())
      .filter((p) => p.activo !== false)
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  } catch (err) {
    console.error("Error cargando catálogo:", err);
    catalogo = [];
  }

  if (catalogo.length === 0) {
    els.producto.innerHTML = `<option value="">Sin productos — revisa el panel admin</option>`;
    return;
  }

  els.producto.innerHTML =
    `<option value="">Selecciona un producto…</option>` +
    catalogo.map((p) => `<option value="${esc(p.id)}">${esc(p.nombre)}</option>`).join("");
}

function renderOpciones(producto) {
  els.tallaWrap.innerHTML = "";
  els.colorWrap.innerHTML = "";
  state.talla = null;
  state.color = null;

  if (!producto) return;

  (producto.tallas || []).forEach((t) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.textContent = t;
    b.addEventListener("click", () => {
      state.talla = t;
      [...els.tallaWrap.children].forEach((c) => c.classList.remove("active"));
      b.classList.add("active");
      actualizar();
    });
    els.tallaWrap.appendChild(b);
  });

  (producto.colores || []).forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.textContent = c;
    b.addEventListener("click", () => {
      state.color = c;
      [...els.colorWrap.children].forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      actualizar();
    });
    els.colorWrap.appendChild(b);
  });

  // auto-select first option if only one
  if ((producto.tallas || []).length === 1) els.tallaWrap.children[0]?.click();
  if ((producto.colores || []).length === 1) els.colorWrap.children[0]?.click();
}

function getProductoActual() {
  return catalogo.find((p) => p.id === state.productoId) || null;
}

function calcular(producto, cantidad) {
  const umbral = producto.umbralMayoreo ?? Infinity;
  const esMayoreo = cantidad >= umbral;
  const precioUnitario = esMayoreo ? producto.precioMayoreo : producto.precioMenudeo;
  return {
    esMayoreo,
    precioUnitario,
    subtotal: precioUnitario * cantidad,
  };
}

function actualizar() {
  const producto = getProductoActual();
  const cantidad = Math.max(1, parseInt(els.cantidad.value || "1", 10));
  state.cantidad = cantidad;

  if (!producto) {
    els.tierNote.classList.remove("active");
    els.tierNote.textContent = "Selecciona un producto para ver precios por volumen.";
    renderTicketVacio();
    return;
  }

  const umbral = producto.umbralMayoreo;
  if (umbral) {
    const faltan = umbral - cantidad;
    els.tierNote.classList.toggle("active", cantidad >= umbral);
    els.tierNote.textContent =
      cantidad >= umbral
        ? `Precio mayoreo aplicado ($${money(producto.precioMayoreo)} c/u)`
        : `A partir de ${umbral} piezas: $${money(producto.precioMayoreo)} c/u (faltan ${faltan})`;
  } else {
    els.tierNote.classList.remove("active");
    els.tierNote.textContent = `Precio único: $${money(producto.precioMenudeo)} c/u`;
  }

  const faltaTalla = (producto.tallas || []).length > 0 && !state.talla;
  const faltaColor = (producto.colores || []).length > 0 && !state.color;
  if (faltaTalla || faltaColor) {
    renderTicketVacio();
    return;
  }

  const { esMayoreo, precioUnitario, subtotal } = calcular(producto, cantidad);
  renderTicket(producto, cantidad, precioUnitario, subtotal, esMayoreo);
}

function renderTicketVacio() {
  els.emptyHint.style.display = "block";
  els.ticketBody.style.display = "none";
  els.btnDescargar.disabled = true;
  els.btnCopiar.disabled = true;
}

function folio() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
}

function detalleVariante(sep) {
  return [state.talla && `Talla ${state.talla}`, state.color && `Color ${state.color}`]
    .filter(Boolean).join(sep);
}

function renderTicket(producto, cantidad, precioUnitario, subtotal, esMayoreo) {
  els.emptyHint.style.display = "none";
  els.ticketBody.style.display = "block";
  els.btnDescargar.disabled = false;
  els.btnCopiar.disabled = false;

  const cliente = els.cliente.value.trim();
  const detalle = detalleVariante(" · ");

  els.ticketBody.innerHTML = `
    ${cliente ? `<div class="ticket-row"><span class="label">Cliente</span><span>${esc(cliente)}</span></div>` : ""}
    <div class="ticket-row"><span class="label">Folio</span><span>#${folio()}</span></div>
    <div class="ticket-divider"></div>
    <div class="ticket-row"><span>${esc(producto.nombre)}</span></div>
    ${detalle ? `<div class="ticket-row label"><span>${esc(detalle)}</span></div>` : ""}
    <div class="ticket-row"><span class="label">Cantidad</span><span>${cantidad} pza${cantidad > 1 ? "s" : ""}</span></div>
    <div class="ticket-row"><span class="label">Precio unitario</span><span>$${money(precioUnitario)}</span></div>
    ${esMayoreo ? `<div class="ticket-tier-tag">PRECIO MAYOREO</div>` : ""}
    <div class="ticket-divider"></div>
    <div class="ticket-total"><span>Total</span><span><span class="cur">MXN</span> $${money(subtotal)}</span></div>
    <div class="barcode"></div>
    <div class="ticket-foot">DRAGUZ SHOP · COTIZACIÓN NO ES FACTURA<br>VÁLIDA POR TIEMPO LIMITADO</div>
  `;
}

async function descargarTicket() {
  const canvas = await html2canvas(els.ticket, { backgroundColor: "#ffffff", scale: 2 });
  const link = document.createElement("a");
  link.download = `cotizacion-draguz-${folio()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function copiarTexto() {
  const producto = getProductoActual();
  if (!producto) return;
  const cantidad = state.cantidad;
  const { esMayoreo, precioUnitario, subtotal } = calcular(producto, cantidad);
  const cliente = els.cliente.value.trim();
  const texto =
    `*DRAGUZ SHOP — COTIZACIÓN*\n` +
    (cliente ? `Cliente: ${cliente}\n` : "") +
    `Producto: ${producto.nombre}\n` +
    (detalleVariante(" · ") ? `${detalleVariante(" · ")}\n` : "") +
    `Cantidad: ${cantidad}\n` +
    `Precio unitario: $${money(precioUnitario)}${esMayoreo ? " (mayoreo)" : ""}\n` +
    `*Total: $${money(subtotal)} MXN*`;

  navigator.clipboard.writeText(texto).then(() => showToast("Copiado — listo para pegar en WhatsApp"));
}

function nuevaCotizacion() {
  state = { productoId: null, talla: null, color: null, cantidad: 1 };
  els.producto.value = "";
  els.cantidad.value = 1;
  els.cliente.value = "";
  renderOpciones(null);
  renderTicketVacio();
}

els.producto.addEventListener("change", (e) => {
  state.productoId = e.target.value || null;
  const producto = getProductoActual();
  renderOpciones(producto);
  actualizar();
});

els.cantidad.addEventListener("input", actualizar);
els.cliente.addEventListener("input", actualizar);
els.qtyMinus.addEventListener("click", () => {
  els.cantidad.value = Math.max(1, parseInt(els.cantidad.value || "1", 10) - 1);
  actualizar();
});
els.qtyPlus.addEventListener("click", () => {
  els.cantidad.value = Math.max(1, parseInt(els.cantidad.value || "1", 10) + 1);
  actualizar();
});
els.btnDescargar.addEventListener("click", descargarTicket);
els.btnCopiar.addEventListener("click", copiarTexto);
els.btnNuevo.addEventListener("click", nuevaCotizacion);

if (modoLocal) {
  const aviso = document.createElement("div");
  aviso.className = "modo-local";
  aviso.textContent = "Modo local: el catálogo se guarda solo en este navegador. Configura Firebase para compartirlo.";
  document.body.prepend(aviso);
}

cargarCatalogo();
renderTicketVacio();

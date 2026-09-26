import {
  modoLocal, listarProductos, guardarProducto, agregarProducto, eliminarProducto,
  iniciarSesion, cerrarSesion, alCambiarSesion
} from "./firebase-init.js";

const els = {
  loginBox: document.getElementById("loginBox"),
  shell: document.getElementById("adminShell"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPass: document.getElementById("loginPass"),
  loginError: document.getElementById("loginError"),
  btnLogout: document.getElementById("btnLogout"),
  listaProductos: document.getElementById("listaProductos"),
  btnNuevoProducto: document.getElementById("btnNuevoProducto"),
  toast: document.getElementById("toast"),
};

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  setTimeout(() => els.toast.classList.remove("show"), 2200);
}

els.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.loginError.textContent = "";
  try {
    await iniciarSesion(els.loginEmail.value.trim(), els.loginPass.value);
  } catch (err) {
    els.loginError.textContent = "Correo o contraseña incorrectos.";
  }
});

if (modoLocal) {
  els.btnLogout.style.display = "none";
  const aviso = document.createElement("div");
  aviso.className = "modo-local";
  aviso.textContent = "Modo local: sin login y los cambios se guardan solo en este navegador. Configura Firebase (ver README) para usar la nube.";
  document.body.prepend(aviso);
}

els.btnLogout.addEventListener("click", () => cerrarSesion());

alCambiarSesion((user) => {
  if (user) {
    els.loginBox.style.display = "none";
    els.shell.style.display = "block";
    cargarProductos();
  } else {
    els.loginBox.style.display = "block";
    els.shell.style.display = "none";
  }
});

function parseTags(str) {
  return str.split(",").map((s) => s.trim()).filter(Boolean);
}

function productoRowTemplate(p) {
  const id = p.id || "";
  return `
  <div class="product-row" data-id="${esc(id)}">
    <div class="product-row-head">
      <span class="name">${esc(p.nombre || "(sin nombre)")}</span>
      <span>${p.activo === false ? "○ inactivo" : "● activo"} — editar</span>
    </div>
    <div class="product-row-body">
      <div class="field">
        <label>Nombre del producto</label>
        <input type="text" class="f-nombre" value="${esc(p.nombre)}" />
      </div>
      <div class="grid-2">
        <div class="field">
          <label>Precio menudeo (MXN)</label>
          <input type="number" class="f-menudeo" value="${p.precioMenudeo ?? ""}" step="0.01" />
        </div>
        <div class="field">
          <label>Precio mayoreo (MXN)</label>
          <input type="number" class="f-mayoreo" value="${p.precioMayoreo ?? ""}" step="0.01" />
        </div>
      </div>
      <div class="field">
        <label>Cantidad mínima para mayoreo</label>
        <input type="number" class="f-umbral" value="${p.umbralMayoreo ?? ""}" step="1" />
      </div>
      <div class="field">
        <label>Tallas</label>
        <input type="text" class="f-tallas" value="${esc((p.tallas || []).join(", "))}" />
        <div class="tag-input-hint">Sepáralas con comas — ej: CH, M, G, XG, XXG</div>
      </div>
      <div class="field">
        <label>Colores</label>
        <input type="text" class="f-colores" value="${esc((p.colores || []).join(", "))}" />
        <div class="tag-input-hint">Sepáralos con comas — ej: Blanco, Negro, Arena</div>
      </div>
      <div class="field">
        <label><input type="checkbox" class="f-activo" ${p.activo === false ? "" : "checked"} /> Visible en el cotizador</label>
      </div>
      <div class="row-actions">
        <button class="primary f-guardar" type="button" style="flex:none; padding:10px 18px;">Guardar</button>
        <button class="danger f-eliminar" type="button">Eliminar</button>
      </div>
    </div>
  </div>`;
}

async function cargarProductos() {
  els.listaProductos.innerHTML = `<p>Cargando…</p>`;
  let productos;
  try {
    productos = await listarProductos();
  } catch (err) {
    console.error(err);
    els.listaProductos.innerHTML = `<p>No se pudo cargar el catálogo. Revisa la configuración y las reglas de Firebase.</p>`;
    return;
  }
  productos.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

  if (productos.length === 0) {
    els.listaProductos.innerHTML = `<p>Sin productos todavía. Agrega el primero.</p>`;
    return;
  }

  els.listaProductos.innerHTML = productos.map(productoRowTemplate).join("");
  attachRowHandlers();
}

function attachRowHandlers() {
  document.querySelectorAll(".product-row").forEach((row) => {
    const head = row.querySelector(".product-row-head");
    head.addEventListener("click", () => row.classList.toggle("open"));

    row.querySelector(".f-guardar").addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = row.dataset.id;
      const data = {
        nombre: row.querySelector(".f-nombre").value.trim(),
        precioMenudeo: parseFloat(row.querySelector(".f-menudeo").value) || 0,
        precioMayoreo: parseFloat(row.querySelector(".f-mayoreo").value) || 0,
        umbralMayoreo: row.querySelector(".f-umbral").value
          ? parseInt(row.querySelector(".f-umbral").value, 10)
          : null,
        tallas: parseTags(row.querySelector(".f-tallas").value),
        colores: parseTags(row.querySelector(".f-colores").value),
        activo: row.querySelector(".f-activo").checked,
      };
      try {
        await guardarProducto(id, data);
        showToast("Producto guardado");
      } catch (err) {
        console.error(err);
        showToast("Error al guardar");
        return;
      }
      cargarProductos();
    });

    row.querySelector(".f-eliminar").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm("¿Eliminar este producto del catálogo?")) return;
      await eliminarProducto(row.dataset.id);
      showToast("Producto eliminado");
      cargarProductos();
    });
  });
}

els.btnNuevoProducto.addEventListener("click", async () => {
  const id = await agregarProducto({
    nombre: "Nuevo producto",
    precioMenudeo: 0,
    precioMayoreo: 0,
    umbralMayoreo: null,
    tallas: [],
    colores: [],
    activo: true,
  });
  await cargarProductos();
  const row = document.querySelector(`.product-row[data-id="${id}"]`);
  row?.classList.add("open");
  row?.scrollIntoView({ behavior: "smooth", block: "center" });
});

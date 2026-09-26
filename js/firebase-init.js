// Capa de datos del catálogo.
// - Si js/firebase-config.js tiene tus datos reales → usa Firebase (Firestore + Auth).
// - Si todavía tiene los valores de ejemplo → "modo local": el catálogo se guarda
//   en el navegador (localStorage), sin login. Sirve para probar/usar de inmediato.
import { firebaseConfig } from "./firebase-config.js";

export const modoLocal =
  !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("TU_");

const LS_KEY = "draguz_catalogo";

const productosEjemplo = [
  {
    id: "playera-dtf",
    nombre: "Playera DTF",
    precioMenudeo: 250,
    precioMayoreo: 180,
    umbralMayoreo: 12,
    tallas: ["CH", "M", "G", "XG", "XXG"],
    colores: ["Blanco", "Negro", "Arena"],
    activo: true,
  },
  {
    id: "sudadera-dtf",
    nombre: "Sudadera DTF",
    precioMenudeo: 550,
    precioMayoreo: 450,
    umbralMayoreo: 10,
    tallas: ["CH", "M", "G", "XG"],
    colores: ["Negro", "Gris"],
    activo: true,
  },
];

function leerLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* localStorage no disponible */ }
  return productosEjemplo.map((p) => ({ ...p }));
}

function escribirLocal(lista) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(lista)); } catch (e) { /* ignore */ }
}

let fb = null;
async function firebase() {
  if (fb) return fb;
  const base = "https://www.gstatic.com/firebasejs/10.13.0";
  const [{ initializeApp }, fs, au] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-firestore.js`),
    import(`${base}/firebase-auth.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  fb = { fs, au, db: fs.getFirestore(app), auth: au.getAuth(app) };
  return fb;
}

// ---------- Catálogo ----------

export async function listarProductos() {
  if (modoLocal) return leerLocal();
  const { fs, db } = await firebase();
  const snap = await fs.getDocs(fs.collection(db, "productos"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function guardarProducto(id, data) {
  if (modoLocal) {
    const lista = leerLocal();
    const i = lista.findIndex((p) => p.id === id);
    if (i >= 0) lista[i] = { ...lista[i], ...data };
    else lista.push({ id, ...data });
    escribirLocal(lista);
    return;
  }
  const { fs, db } = await firebase();
  await fs.setDoc(fs.doc(db, "productos", id), data, { merge: true });
}

export async function agregarProducto(data) {
  if (modoLocal) {
    const id = "p-" + Date.now().toString(36);
    const lista = leerLocal();
    lista.push({ id, ...data });
    escribirLocal(lista);
    return id;
  }
  const { fs, db } = await firebase();
  const ref = await fs.addDoc(fs.collection(db, "productos"), data);
  return ref.id;
}

export async function eliminarProducto(id) {
  if (modoLocal) {
    escribirLocal(leerLocal().filter((p) => p.id !== id));
    return;
  }
  const { fs, db } = await firebase();
  await fs.deleteDoc(fs.doc(db, "productos", id));
}

// ---------- Sesión (solo aplica con Firebase) ----------

export async function iniciarSesion(email, pass) {
  const { au, auth } = await firebase();
  await au.signInWithEmailAndPassword(auth, email, pass);
}

export async function cerrarSesion() {
  const { au, auth } = await firebase();
  await au.signOut(auth);
}

export async function alCambiarSesion(cb) {
  if (modoLocal) { cb({ local: true }); return; }
  const { au, auth } = await firebase();
  au.onAuthStateChanged(auth, cb);
}

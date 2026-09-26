/* ─────────────────────────────────────────────────────────────
   CONFIGURACIÓN DE DRAGUZ SHOP
   1) Pega aquí los datos de tu app web de Firebase (Configuración del proyecto > Tus apps).
   2) Mientras "apiKey" esté vacío, el sitio corre en MODO DEMO
      (datos de ejemplo guardados solo en tu navegador).
   ───────────────────────────────────────────────────────────── */
window.DRAGUZ_CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  // WhatsApp con lada país, sin + ni espacios. Ej: 5218112345678
  // (también se puede cambiar después desde Admin > Ajustes)
  whatsapp: "",
  facebook: ""
};

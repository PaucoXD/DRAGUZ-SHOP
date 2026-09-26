/* ─────────────────────────────────────────────────────────────
   CONFIGURACIÓN DE DRAGUZ SHOP
   1) Pega aquí los datos de tu app web de Firebase (Configuración del proyecto > Tus apps).
   2) Mientras "apiKey" esté vacío, el sitio corre en MODO DEMO
      (datos de ejemplo guardados solo en tu navegador).
   ───────────────────────────────────────────────────────────── */
window.DRAGUZ_CONFIG = {
  firebase: {
    apiKey: "AIzaSyA8GYn9qZVfjWrSE0eJfhsk7LScdaiKfyU",
    authDomain: "draguz-shop-web.firebaseapp.com",
    projectId: "draguz-shop-web",
    storageBucket: "draguz-shop-web.firebasestorage.app",
    messagingSenderId: "935025684574",
    appId: "1:935025684574:web:694d7102813476579044cf"
  },
  // WhatsApp con lada país, sin + ni espacios. Ej: 5218112345678
  // (también se puede cambiar después desde Admin > Ajustes)
  whatsapp: "",
  facebook: ""
};

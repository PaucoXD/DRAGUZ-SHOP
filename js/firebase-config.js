// ============================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto (o usa uno existente)
// 3. Agrega una "Web App" (ícono </>) dentro del proyecto
// 4. Copia el objeto firebaseConfig que te da Firebase y pégalo abajo
// 5. Activa Firestore Database (modo producción) y Authentication
//    (método Correo/Contraseña) desde el panel de Firebase
// ============================================================

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

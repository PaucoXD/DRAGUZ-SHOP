# Cotizador Draguz Shop

Herramienta web para generar cotizaciones rápidas (imagen tipo ticket) a partir
de un catálogo editable desde un panel admin conectado a Firebase.

- `index.html` — el cotizador (lo usas tú, y después se puede enlazar desde tu página de venta)
- `admin.html` — panel para editar el catálogo (protegido con login)
- No requiere build ni npm — son archivos estáticos, listos para GitHub Pages.

## 0. Modo local (funciona sin configurar nada)

Mientras `js/firebase-config.js` tenga los valores de ejemplo (`TU_API_KEY`…),
la app arranca en **modo local**: trae dos productos de ejemplo, el panel admin
no pide login y el catálogo se guarda en el navegador (localStorage). Sirve
para usarlo ya mismo, pero cada navegador/dispositivo tiene su propio catálogo.
En cuanto pegues tu configuración real de Firebase, cambia solo a la nube.

## 1. Crear el proyecto en Firebase

1. Ve a https://console.firebase.google.com → **Crear proyecto**.
2. Dentro del proyecto, click en el ícono `</>` para agregar una **Web App**.
   Copia el objeto `firebaseConfig` que te muestra.
3. Pega esos valores en `js/firebase-config.js`.

## 2. Activar Firestore

1. En el menú lateral → **Firestore Database** → **Crear base de datos**
   (modo producción, la región más cercana, ej. `us-central1`).
2. Ve a la pestaña **Reglas** y pega esto (permite leer el catálogo a
   cualquiera, pero solo tú —autenticado— puedes escribir):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{productoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Publica las reglas.

## 3. Activar Authentication (para el panel admin)

1. Menú lateral → **Authentication** → **Sign-in method** → activa
   **Correo/contraseña**.
2. Pestaña **Users** → **Add user** → crea tu usuario (el correo y
   contraseña con los que vas a entrar a `admin.html`).

## 4. Cargar tu primer producto

1. Abre `admin.html` en el navegador (local o ya publicado), inicia
   sesión con el usuario que creaste.
2. Click en **+ Agregar producto** y llena:
   - Nombre (ej. "Playera DTF")
   - Precio menudeo / mayoreo
   - Cantidad mínima para mayoreo (déjalo vacío si no aplica)
   - Tallas y colores, separados por comas
3. Guarda. Ya aparece disponible en el cotizador (`index.html`).

## 5. Publicar en GitHub Pages

1. Crea un repositorio nuevo (o usa uno existente) y sube esta carpeta.
2. En el repo: **Settings → Pages → Branch: main → carpeta `/root`** → Save.
3. En unos minutos tu cotizador queda en
   `https://tu-usuario.github.io/tu-repo/`.

⚠️ Nota: la `apiKey` de Firebase queda visible en el código del navegador —
esto es normal y esperado en apps web de Firebase; la seguridad real la dan
las **reglas de Firestore** (paso 2) y el login de Authentication (paso 3),
no el ocultar la apiKey.

## Cómo funciona el precio

- Si la cantidad seleccionada es **menor** al umbral de mayoreo del
  producto → se cobra el precio de menudeo.
- Si es **igual o mayor** → se cobra el precio de mayoreo automáticamente,
  y el ticket lo marca como "PRECIO MAYOREO".
- Si un producto no tiene umbral de mayoreo, siempre usa el precio de
  menudeo.

## Próximos pasos sugeridos

- Cuando quieras enlazarlo desde tu página de venta, basta con poner un
  link o botón a `index.html` (o incrustarlo en un iframe).
- Si luego quieres que el cliente mismo lo use públicamente, se puede
  agregar validaciones extra y quitar el link visible al panel admin.

# Draguz Shop — sitio web

Sitio estático (HTML + CSS + JS, sin compilar) para publicar en **GitHub Pages**, con **Firebase** (Authentication + Firestore) como base de datos.

## Qué incluye
- **Tienda "En stock"**: productos que tú subes desde el panel (fotos, precio, tallas, piezas).
- **Personaliza + Cotizador**: el cliente elige producto, color, tallas y extras; el precio de **menudeo/mayoreo** se calcula solo. Genera un **ticket en imagen (PNG)**, lo manda por **WhatsApp** o lo envía como **solicitud** a tu panel (requiere cuenta).
- **Cuentas de usuario**: correo/contraseña o Google. Cada usuario ve su historial de cotizaciones.
- **Panel Admin** (`#/admin`): stock, catálogo personalizable (precios, tallas, colores), extras/estampados, cotizaciones (con estado), ajustes (WhatsApp, anticipo, vigencia) e importar/exportar JSON.

## 0. Probarlo ya (modo demo)
Abre `index.html` con doble clic. Mientras `js/config.js` no tenga `apiKey`, corre en **modo demo** con datos de ejemplo guardados en tu navegador.
Admin demo: entra con `admin@draguz.demo` (cualquier contraseña) → aparece el botón **Admin**.

## 1. Crear el proyecto Firebase (plan gratuito Spark)
1. En https://console.firebase.google.com crea un proyecto.
2. **Authentication → Método de acceso**: activa *Correo/contraseña* y *Google*.
3. **Firestore Database → Crear base de datos** (modo producción, región cercana).
4. Pestaña **Reglas** de Firestore: pega el contenido de `firestore.rules` y publica.
5. **Configuración del proyecto → Tus apps → Web (`</>`)**: registra la app y copia el objeto `firebaseConfig` dentro de `js/config.js`.
   (La `apiKey` de Firebase web es pública por diseño; lo que protege tus datos son las reglas.)

## 2. Crear tu usuario administrador
1. Publica el sitio (paso 3) o ábrelo en local, y **crea tu cuenta** normal (Crear cuenta).
2. En Firebase → Authentication → Usuarios, copia tu **UID**.
3. En Firestore crea la colección `admins` y un documento cuyo **ID sea tu UID** (con cualquier campo, p. ej. `rol: "admin"`).
4. Recarga el sitio: aparece el botón **Admin** en el encabezado.
5. En **Admin → Ajustes**: guarda tu WhatsApp y pulsa **Cargar datos de ejemplo** si quieres partir del catálogo de muestra (los precios son de ejemplo; edítalos).

## 3. Publicar en GitHub Pages
1. Crea un repositorio y sube **todo el contenido de esta carpeta** (incluye `.nojekyll`).
2. Repositorio → **Settings → Pages** → *Deploy from a branch* → `main` / `(root)`.
3. Tu sitio queda en `https://TU-USUARIO.github.io/TU-REPO/`.
4. Firebase → Authentication → Configuración → **Dominios autorizados**: agrega `TU-USUARIO.github.io` (necesario para Google y el login).

## Notas
- **Fotos**: se comprimen en el navegador (≈700 px) y se guardan dentro del documento en Firestore para no requerir Firebase Storage (que hoy pide plan de pago). Recomendado: máx. 3 fotos por producto. Si el catálogo crece mucho, conviene migrar a Storage o Cloudinary.
- **Precios**: `Catálogo personalizable` (menudeo, mayoreo, piezas mínimas de mayoreo, recargo por talla) y `Extras` (por pieza o cargo único).
- **Cambiar textos del inicio / banners**: `js/app.js` (`SLIDES`, `renderPromos`) e `index.html`.
- **Colores y tipografías**: variables al inicio de `css/styles.css` (siguen el manual de identidad: rojo #E3000F, morado #2A1B3D, índigo #2C275F, Montserrat).
- Si cambias el logo, reemplaza `assets/img/logo.png` y regenera `js/logo-data.js` (versión base64 usada para el ticket).

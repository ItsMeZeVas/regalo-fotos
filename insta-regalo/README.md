# Nosotros ❤️ — galería de fotos tipo Instagram

Frontend Vue + GitHub como "base de datos" (fotos.json + carpeta /fotos) + una función
serverless en Vercel que hace los commits. $0 de costo fijo, nada corriendo 24/7.

## Paso 1 — Crea el repo de fotos
1. En GitHub, crea un repo nuevo (puede ser **privado**), por ejemplo `insta-regalo-fotos`.
2. Dentro, crea un archivo `fotos.json` con contenido `[]` (un array vacío) y una carpeta `fotos/` (puedes subir un `.gitkeep` para que no quede vacía).

## Paso 2 — Crea un token de GitHub
1. Ve a GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**.
2. Dale permiso solo sobre ESE repo, con acceso de lectura/escritura a "Contents".
3. Copia el token (solo lo verás una vez).

## Paso 3 — Edita src/config.js
Cambia `GITHUB_OWNER` y `GITHUB_REPO` por los tuyos.

## Paso 4 — Despliega en Vercel (gratis)
1. Sube esta carpeta a un repo de GitHub (el del código, puede ser el mismo o separado del de fotos).
2. Ve a vercel.com → New Project → importa ese repo.
3. En Settings → Environment Variables agrega:
   - `GITHUB_TOKEN` (el que creaste)
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
   - `GITHUB_BRANCH` = `main`
   - `UPLOAD_PASSCODE` = una clave que solo tú y tu amigo conozcan
4. Deploy. Vercel construye el frontend y publica la función `/api/upload` automáticamente.

## Cómo funciona
- Subir foto → el navegador llama a `/api/upload` (función serverless) → esa función usa tu
  `GITHUB_TOKEN` para hacer un commit con la imagen y actualizar `fotos.json`. El token nunca
  toca el navegador.
- Ver fotos → el frontend lee `fotos.json` directo desde `raw.githubusercontent.com`, sin
  backend ni base de datos corriendo.
- Todo queda guardado como historial de commits en GitHub — para siempre, gratis.

## Desarrollo local
```bash
npm install
npm run dev
```
(Para probar `/api/upload` localmente necesitas `vercel dev` en vez de `vite` solo, o
desplegar directo a Vercel y probar ahí.)

## Ideas para pulir el regalo
- Cambiar el emoji/título del header en `App.vue`.
- Agregar una portada o mensaje especial arriba de la galería.
- Cambiar la fuente/colores en `style.css`.

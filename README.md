# ♡ Mi little space — red social personal

Una mini red social privada con estética pastel inspirada en la imagen de referencia: lavanda, crema, rosa, amarillo y azul, con tarjetas redondeadas, stickers y detalles cute.

## Qué incluye

- Login con correo + contraseña.
- Perfil con:
  - nombre
  - @usuario
  - bio
  - foto de perfil
  - foto de portada
- Publicaciones sin límite de caracteres impuesto por esta interfaz.
- Subida de fotos.
- Subida de GIFs.
- Vista previa antes de publicar.
- Borrar publicaciones.
- Datos y archivos guardados en Supabase.
- RLS para que cada usuario solo pueda acceder a sus propios datos.
- Bucket privado para imágenes/GIFs.
- Responsive para celular y PC.
- Se puede alojar en GitHub Pages.

## IMPORTANTE: GitHub no guarda las fotos de tu red social

GitHub Pages sirve los archivos de la página, pero no es una base de datos ni un almacenamiento de imágenes. Por eso este proyecto usa Supabase para:

1. Autenticación.
2. Base de datos.
3. Almacenamiento de fotos y GIFs.

El repositorio de GitHub puede ser público sin que tengas que poner una contraseña de Supabase ahí. Usa solamente la Publishable key en el frontend y mantén las políticas RLS activadas. Nunca pongas una `service_role` key en este proyecto.

## 1. Crear Supabase

Crea un proyecto en Supabase.

Luego abre:

**SQL Editor → New query**

Copia todo el contenido de `supabase.sql` y ejecútalo.

## 2. Crear tu cuenta

Al abrir la página por primera vez, usa "Crear mi cuenta".

Cuando ya puedas entrar, ve al panel de Supabase:

**Authentication → Settings**

y desactiva los registros de nuevos usuarios.

Así el sitio queda pensado para una sola cuenta.

## 3. Poner las claves

En `app.js`, cambia:

```js
const SUPABASE_URL = "PEGA_AQUI_TU_PROJECT_URL";
const SUPABASE_PUBLISHABLE_KEY = "PEGA_AQUI_TU_PUBLISHABLE_KEY";
```

Por los datos de:

**Supabase → Project Settings → API**

Usa la **Publishable key**. NO uses la `service_role` key.

## 4. Probar localmente

No abras `index.html` directamente con doble clic si el navegador te da problemas.

Puedes usar VS Code + Live Server.

O desde la carpeta:

```bash
python -m http.server 5500
```

Después abre:

http://localhost:5500

## 5. Subir a GitHub

Crea un repositorio nuevo.

Sube:

- index.html
- styles.css
- app.js
- supabase.sql
- README.md

En GitHub:

**Settings → Pages → Deploy from branch → main → / (root)**

Guarda.

Tu sitio quedará disponible en la URL de GitHub Pages que GitHub te indique.

## 6. Configuración de Supabase para GitHub Pages

En Supabase revisa:

**Authentication → URL Configuration**

Añade como Site URL la URL de tu GitHub Pages.

Ejemplo:

`https://TU-USUARIO.github.io/TU-REPOSITORIO/`

Si tu repositorio es `TU-USUARIO.github.io`, la URL normalmente será:

`https://TU-USUARIO.github.io/`

## Personalización rápida

En `styles.css` puedes cambiar:

```css
--lavender: #e9e4ff;
--cream: #fff9df;
--pink: #f08ac1;
--pink-2: #f7b0d4;
--yellow: #ffe66b;
--blue: #8ed7ed;
```

para hacer la estética todavía más tuya.

## Nota sobre "sin límite de caracteres"

El campo de publicación no tiene `maxlength`, así que esta interfaz no impone un límite de caracteres.

La base de datos usa `text`, por lo que no se añadió un límite artificial al contenido.

El límite práctico dependerá del almacenamiento y del tamaño de la solicitud del servicio.

## Nota sobre GIFs

Los GIFs se suben como archivos a Supabase Storage y se muestran como imágenes. Un GIF animado conserva su animación.

No necesitas una API de Giphy/Tenor para subir tus propios GIFs.

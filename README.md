# Tomas Lobato

Presentación personal oscura, en español e inglés. Columna de hasta 520 px, enlaces sociales centrados, iconos de 24 px alineados y último video largo de YouTube.

## Ejecutar

Requiere Node.js 22 o posterior, sin dependencias externas:

```sh
npm start
```

Abre http://127.0.0.1:4173. Se puede configurar PORT y HOST con variables de entorno.

## Último video al abrir la página

En cada carga, el navegador llama una vez a `/api/latest-video` con `cache: no-store`. El servicio consulta en ese momento el feed público de videos largos de YouTube (`UULF3lO1gKJOenjFyp-3OytN3Q`), valida que los videos sean del canal `UC3lO1gKJOenjFyp-3OytN3Q` y selecciona el más reciente por fecha de publicación. No usa tareas programadas, sondeos periódicos, claves de API ni un ID de video fijo.

El enlace, la miniatura y el reproductor usan el resultado fresco. Si el reproductor falla, el enlace sigue apuntando al video recién consultado. Si falla la consulta, se muestra un mensaje y un enlace al canal; no se presenta un video antiguo como si fuera el último.

YouTube puede demorar en reflejar una publicación en su feed. La lista UULF excluye Shorts, pero es un comportamiento de YouTube sin garantía pública de estabilidad. La reproducción integrada depende de YouTube y de los permisos de cada video.

## Alojamiento

Los archivos de la interfaz están en `dist/`, pero la consulta requiere también el servicio `server.mjs` y `lib/latest-video.mjs`. Publicar solamente `dist/` en un alojamiento estático no habilita `/api/latest-video`. Se debe ejecutar el servicio Node o adaptar esa ruta a una función del alojamiento. La configuración de Sites existente corresponde a la primera versión estática y deberá adaptarse antes de publicar esta versión; no se ha publicado.

## Verificación

```sh
npm test
```

Se verificaron consulta real al feed, detección de un video nuevo al recargar, manejo de errores, idiomas, centrado del texto, tamaños y alineación de iconos y comportamiento adaptable.

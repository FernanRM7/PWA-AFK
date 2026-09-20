# Estrategia de caché

El service worker usa cachés con versión (`afk-precache-v1` y `afk-runtime-v1`). El cambio de versión se hace modificando `CACHE_VERSION` en `public/sw.js`.

## Ciclo de vida

- `install` precachea únicamente la shell y el manifiesto. Si una descarga falla, la instalación falla y las cachés de la versión anterior no se tocan.
- `activate` solo elimina cachés `afk-*` antiguas después de comprobar que existe el precache actual. La limpieza está limitada a nombres propios de esta aplicación.
- Los errores de instalación, activación, lectura, escritura y red se registran con el prefijo `[sw]`.

## Runtime y offline

Las solicitudes `GET` del mismo origen usan red primero para documentos y caché primero para otros recursos. Las respuestas exitosas se guardan en `afk-runtime-v1`. Si una navegación falla, se intenta la respuesta previamente guardada y después la shell `/`; si no existe ninguna, se devuelve una respuesta `503` explícita.

## Privacidad y actualización segura

No se guardan solicitudes que no sean `GET`, de otro origen, con `Authorization`, `Cookie` o `Cache-Control: no-store`, ni rutas sensibles como `/api`, `/auth`, `/profile`, `/users`, `/session` o `/token`. El precache contiene solo recursos públicos y datos sintéticos.

Una actualización nunca borra cachés durante `install`. Por eso un fallo al descargar un recurso no puede destruir una versión válida; la eliminación de versiones anteriores queda reservada para un `activate` exitoso.

## Límites y supuestos

- El precache se limita a `/` y `/manifest.webmanifest`; se supone que la shell publicada en la raíz es el punto de entrada estable.
- La estrategia solo conserva respuestas `GET` públicas del mismo origen. No implementa persistencia de formularios, cola de cambios, Background Sync ni sincronización con un servidor.
- El fallback devuelve `503` cuando no hay una respuesta guardada. Esto permite que la aplicación o el navegador distingan una falta de contenido offline de una respuesta válida.
- La actualización depende de que el navegador complete el ciclo `install` y `activate`; cambiar `CACHE_VERSION` sin publicar todos los recursos requeridos hace fallar la instalación, pero conserva la versión anterior.

## Fallos conocidos y recuperación

Una caída de red durante `install` o un error al descargar el manifiesto deja la versión anterior intacta, aunque el nuevo worker no se active. Si falla la apertura o escritura del runtime cache, se registra el error y la solicitud continúa por red. Si la red falla durante una navegación, se devuelve primero la respuesta cacheada, después la shell precacheada y finalmente `503`.

Los mensajes de error se escriben en la consola con el prefijo `[sw]`. La estrategia no incluye reintentos automáticos ni sincronización diferida, porque esas capacidades pertenecen a una etapa posterior y podrían conservar datos de formularios que aquí están explícitamente fuera de alcance.
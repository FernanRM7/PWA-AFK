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
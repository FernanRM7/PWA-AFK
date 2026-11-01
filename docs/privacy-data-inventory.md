# Inventario de datos y privacidad — PWA de inspecciones de laboratorio

Fecha: 1 de noviembre de 2026 · Rama `feat/week-09-security-privacy` · Revisión sobre `01be630` más cambios locales W09.

## Alcance y método

Este inventario describe qué datos toca la aplicación hoy, dónde viven, para qué se usan y cuánto tiempo permanecen. Lo armamos leyendo el código y ejecutando `grep`, `npm ls` y comprobaciones manuales en DevTools. No es una evaluación de cumplimiento de ninguna ley y no afirma que la aplicación cumpla alguna. Los datos de la aplicación son sintéticos. Este documento no contiene datos personales reales ni credenciales.

## Qué no se verificó

- Qué recibe el servicio de imágenes de terceros más allá de lo que implica cualquier petición HTTP.
- Si la petición de la imagen de avatar ocurre antes de abrir el menú de notificaciones. Solo la vimos al abrirlo.
- Si el alojamiento conserva o reemplaza las cabeceras definidas en `src/middleware.ts`; debe comprobarse en el entorno desplegado.
- El comportamiento en navegadores y dispositivos reales: las pruebas usan APIs simuladas.
- Que la cookie `sidebar_state` aparezca en un navegador tras abrir o cerrar la barra lateral: leímos el código, pero no vimos la cookie.
- El contenido de los artefactos que sube el CI.

## Datos tratados

| ID | Dato | Finalidad | Dónde vive | Retención | ¿Sale del dispositivo? | Evidencia |
|---|---|---|---|---|---|---|
| D1 | Inspección sintética: laboratorio, fecha, inspector, estado, hallazgos, resumen | Registrar y consultar inspecciones, también sin conexión | IndexedDB, base `afk-inspections-db`, almacén `inspections` | Sin caducidad definida. No hay función de borrado en la aplicación: los datos se quedan hasta que alguien borre los datos del sitio desde el navegador. No se solicita almacenamiento persistente, así que el navegador podría expulsarlos | No: el transporte es sintético y ningún archivo de `src/` llama a `fetch` | `tests/storage.spec.ts`, `tests/integration/persistencia-offline.spec.ts`; `grep` de `delete` y `clear(` en `inspection-store.ts` sin resultados; `grep` de `storage.persist` sin resultados |
| D2 | Metadatos de cola: clave `inspection:<id>`, estado, intentos y error genérico | Reintentar sin crear duplicados | Dentro del mismo registro en IndexedDB | Igual que D1 | No (transporte sintético) | `src/lib/sync/queue.ts` evita persistir mensajes externos sin filtrar; `tests/queue.spec.ts` |
| D3 | Respuestas HTTP guardadas: `/`, `/manifest.webmanifest` y respuestas GET del mismo origen | Funcionar sin conexión | Cache Storage: `afk-precache-v1` y `afk-runtime-v1` | La precache se reemplaza al cambiar `CACHE_VERSION` (`activate` borra las cachés `afk-*` antiguas). La caché runtime no tiene límite de tamaño ni de antigüedad en el código | No | `public/sw.js`, `tests/service-worker.spec.ts`, `tests/offline.spec.ts` |
| D4 | Foto de evidencia (`Blob`) y URL de vista previa | Adjuntar evidencia visual opcional durante la captura | Solo memoria del componente | Mientras dura la captura. Se descarta al descartar, cancelar, guardar o desmontar | No. No entra a IndexedDB ni a la cola | `src/lib/device/camera.ts` no importa `storage/` ni `sync/`; `tests/camera.spec.ts`; la ausencia de imagen y de URL `blob:` en IndexedDB se comprobó a mano en W06 |
| D5 | Coordenadas de ubicación | Mostrar la ubicación de forma temporal y opcional | Estado temporal de la interfaz | Hasta omitir, cancelar, guardar o desmontar | No | `tests/geolocation.spec.ts`: la validación descarta latitud y longitud |
| D6 | Permiso de notificaciones | Mostrar una confirmación local | Lo gestiona el navegador (`Notification.permission`); la aplicación no lo guarda | La define el navegador | No | `src/lib/notifications/client.ts`: el texto es fijo ("Se guardó una inspección sintética.") y no incluye datos del registro; el permiso se pide desde el `onClick` de un botón (`page.tsx`) |
| D7 | IP y navegador de quien carga la imagen de avatar | Avatar decorativo del menú de notificaciones (valor de plantilla) | Servidor de terceros `i.pravatar.cc` | No la controla el equipo | Sí: petición a un tercero, observada en DevTools al abrir el menú de notificaciones de `/`. Pasa por el Service Worker y toma la rama de `fetch` directo (`public/sw.js`, línea 56), la que no guarda en caché | `dashboard-header.tsx`, línea 196. Sin telemetría ni otros orígenes en `src/` y `public/` (`grep`). No comprobamos si la petición ocurre antes de abrir el menú |
| D8 | Valores de ejemplo de la plantilla del panel: `equipo@inspecciones.local`, nombres de espacios de trabajo del selector y un enlace `mailto:` de plantilla (dominio `lumenlabs.io`) | Ninguna funcional (maquetación) | Código fuente y estado de React. No se usa `localStorage` ni `sessionStorage` | Lo que dure la página | El `mailto:` solo abre el cliente de correo si se hace clic: no hace petición de red | `dashboard-header.tsx`, línea 267; `dashboard-sidebar.tsx`, línea 265; `grep` de `localStorage` y `sessionStorage` sin resultados. No verificamos a quién pertenece `lumenlabs.io` |
| D9 | Mensajes de error en consola | Diagnóstico | Consola del navegador | Mientras esté abierta | No | `console.error` con el objeto de error en `register-service-worker.ts` y `sw.js`; no registran campos de inspecciones |
| D10 | Reportes de pruebas y cobertura del CI | Revisar los resultados de las pruebas | Artefactos de GitHub Actions | 14 días (`retention-days: 14`) | Sí, al servicio de CI | `.github/workflows/week-09-security-privacy.yml`. No verificamos su contenido |
| D11 | Cookie `sidebar_state` con el estado abierto o cerrado de la barra lateral | Recordar la preferencia de interfaz | Cookie del navegador, escrita por `src/components/ui/sidebar.tsx` (línea 87) | 7 días (`SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7`) | No la lee ningún código de `src/` (`grep` del nombre: solo definición y escritura). El navegador la incluye en las peticiones al mismo origen | `grep` de `document.cookie` y de `sidebar_state`. No guarda datos de inspecciones. Se escribe sin `Secure` ni `SameSite` explícitos |

No encontramos código de autenticación ni de manejo de credenciales en los módulos revisados. La única cookie que escribe la aplicación es la de la barra lateral (D11).

## Límites

- Los datos son sintéticos por convención, no por mecanismo. Los campos `inspector` y `resumen` aceptan texto libre, y el aviso de "sintético" aparece solo en encabezados (`src/app/inspecciones/page.tsx`, líneas 294 y 357), no junto a esos campos.
- La validación normaliza texto y limita `location` a 120, `inspector` a 80 y `summary` a 1.000 caracteres; `findings` se limita al intervalo entero 0–100.000. Esto no detecta de forma fiable secretos escritos dentro de esos campos: no se deben introducir datos reales ni credenciales.
- No hay cifrado en reposo ni inicio de sesión: quien tenga acceso al navegador del dispositivo puede leer IndexedDB y las cachés.
- La aplicación no ofrece forma de borrar registros.
- La retención no tiene garantía de permanencia: el almacenamiento no es persistente.
- `lastError` persiste un mensaje genérico (`SAFE_SYNC_ERROR_MESSAGE`), no el texto del error del transporte; `tests/queue.spec.ts` comprueba que un secreto sintético incluido en el error no se conserva.
- `src/middleware.ts` genera un nonce para cada respuesta HTML y construye la CSP; `script-src` no permite scripts inline sin nonce. La CSP permite `i.pravatar.cc` en imágenes y `'unsafe-inline'` en estilos para los gráficos actuales. Estas excepciones se deben revisar si cambia el framework o la implementación.
- Si los datos fueran reales, este inventario no bastaría: habría que definir finalidades, retención y borrado, y revisar el transporte.

## Fallos y hallazgos

1. El Service Worker guarda en caché respuestas con `Cache-Control: no-store` (ver T4 en `docs/threat-model.md`).
2. Hay una petición a un tercero para una imagen de avatar de plantilla (D7).
3. No existe borrado de registros desde la aplicación (D1).
4. La aplicación escribe una cookie de preferencia, sin atributos de seguridad explícitos, que ningún código lee (D11).
5. `npm audit --omit=dev` del 31 de octubre de 2026 reporta 19 vulnerabilidades (1 baja, 8 moderadas, 8 altas y 2 críticas). Las cifras de semanas anteriores ya no son vigentes.
6. `npm run lint` pasa con una advertencia por usar `<img>` en `src/app/inspecciones/page.tsx`, línea 558.

## Supuestos y decisiones

- La validación, los límites de entrada y la exclusión de mensajes externos de error del almacenamiento se implementan en `src/lib/security/input-validation.ts`, `src/lib/storage/schema.ts` y `src/lib/sync/queue.ts`. Los riesgos de retención, almacenamiento local y uso de datos sintéticos siguen abiertos.
- `src/middleware.ts` entrega CSP y headers defensivos en rutas de aplicación; no verificamos que el alojamiento los conserve ni asumimos que `robots.txt` controle acceso. Se asume HTTPS en despliegue, pero no se verificó.
- Una petición HTTP a un tercero implica que este recibe al menos la IP y el navegador. Es una consecuencia del protocolo, no una medición.
- Las cookies que aparezcan en `localhost` pueden venir de otros proyectos locales, porque el navegador las comparte entre puertos. Solo inventariamos las que escribe el código de este repositorio.

## Cómo repetir las comprobaciones

```bash
grep -rn "fetch(" src public
grep -rn "https\?://" src public --include=*.ts --include=*.tsx --include=*.js
grep -rn "localStorage\|sessionStorage" src public
grep -rn "document.cookie" src public
grep -n "delete\|clear(" src/lib/storage/inspection-store.ts
npm audit --omit=dev
npm run lint
npm test
```

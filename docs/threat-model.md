# Modelo de amenazas — PWA de inspecciones de laboratorio

Fecha: 1 de noviembre de 2026 · Rama `feat/week-09-security-privacy` · Revisión sobre `01be630` más cambios locales W09.

## Alcance y método

Este análisis describe el comportamiento observado en el repositorio. Se revisaron `public/sw.js`, `src/lib/storage/`, `src/lib/sync/`, `src/lib/device/`, `src/lib/notifications/`, `src/app/inspecciones/page.tsx`, `src/components/`, `next.config.mjs` y los workflows; también se ejecutaron búsquedas de código, `npm ls`, `npm run lint`, `npm audit --omit=dev` y pruebas locales. Una comprobación temporal del Service Worker no forma parte del repositorio.

Todos los datos son sintéticos.

## Qué no se verificó

- Si el alojamiento conserva o reemplaza las cabeceras definidas en `src/middleware.ts`; el comportamiento del entorno desplegado requiere verificación aparte.
- El comportamiento en navegadores y dispositivos reales, las pruebas usan APIs simuladas.
- Un servidor de sincronización real, el transporte es sintético (`syntheticSyncTransport` en `src/lib/sync/queue.ts`).
- Si un Service Worker de un navegador real recibe el encabezado `Cookie` en `request.headers`. Las pruebas usan solicitudes simuladas con ese encabezado, y es posible que los navegadores no lo expongan, lo que dejaría sin efecto esa exclusión de `isCacheable`.
- Si la petición de la imagen de avatar (T2b) ocurre antes de abrir el menú de notificaciones. Solo la vimos al abrirlo.

## Activos

| ID | Activo | Dónde vive |
|---|---|---|
| A1 | Inspecciones sintéticas guardadas (laboratorio, fecha, inspector, estado, hallazgos, resumen, estado de sincronización) | IndexedDB, base `afk-inspections-db` |
| A2 | Respuestas HTTP guardadas para usar sin conexión | Cachés `afk-precache-v1` y `afk-runtime-v1` |
| A3 | Foto de evidencia y coordenadas de la captura en curso | Solo memoria del componente |
| A4 | Código de la aplicación y del Service Worker | Repositorio, build y `public/sw.js` |
| A5 | Dependencias de terceros | `package.json`, `package-lock.json`, `node_modules` |

## Límites de confianza

1. **Persona ↔ interfaz.** Todo lo que se escribe en el formulario es entrada no confiable hasta que `validarBorradorInspeccion` la valida.
2. **Página ↔ Service Worker.** `public/sw.js` intercepta las solicitudes del mismo origen y decide qué se guarda.
3. **Aplicación ↔ almacenamiento del navegador.** IndexedDB y las cachés son del mismo origen: cualquier script del origen, o cualquier persona con acceso al dispositivo, puede leerlas. No hay inicio de sesión ni cifrado en reposo.
4. **Aplicación ↔ capacidades del dispositivo.** Cámara, ubicación y notificaciones pasan por el aviso de permiso del navegador.
5. **Cliente ↔ servidor de sincronización.** Hoy no existe: ningún archivo de `src/` llama a `fetch`, solo `sw.js`. El límite está definido, pero sin tráfico real de inspecciones. Además, el panel referencia una imagen de un tercero (ver T2b).
6. **Cadena de suministro.** Los paquetes npm y el CI entran al producto sin revisión manual.

## Amenazas, ordenadas por prioridad

| # | Amenaza | Prob. | Impacto | Controles existentes y evidencia | Brecha / riesgo residual |
|---|---|---|---|---|---|
| T1 | Dependencias con vulnerabilidades conocidas, entre ellas `next@14.2.35` (crítica) | Alta | Alto | `package-lock.json` y `npm ci` fijan versiones. Medición del 31/10/2026: `npm audit --omit=dev` reporta 19 vulnerabilidades (1 baja, 8 moderadas, 8 altas, 2 críticas). | La corrección que propone npm sube Next a la versión 16, un cambio mayor que queda fuera del alcance de este issue. Además, `npm ls` muestra que `@modelcontextprotocol/sdk`, `hono`, `express` y `proxy-addr` cuelgan de `shadcn`, y ningún archivo de `src/` importa `shadcn` (`grep`): es una herramienta de línea de comandos declarada en `dependencies`. Pendiente: planificar la actualización de Next y evaluar mover `shadcn` a `devDependencies`. Riesgo residual aceptado temporalmente. |
| T2 | Script inyectado (XSS) que lee IndexedDB o las cachés | Baja | Alto | `src/middleware.ts` genera un nonce criptográfico por respuesta y lo incluye en la CSP de la solicitud y la respuesta; `script-src` no usa `unsafe-inline` ni comodines. Se limitan `object-src`, `base-uri` y el encuadre. Los estilos inline se permiten para los gráficos de `src/components/ui/chart.tsx`; el avatar conserva una excepción de imagen para `i.pravatar.cc`. | `'unsafe-inline'` en estilos reduce la protección frente a inyección de estilos. La app aún contacta a un tercero para el avatar. Validar las cabeceras en el alojamiento y revisar compatibilidad ante cambios de Next.js. |
| T2b | Petición a un tercero para la imagen de avatar `https://i.pravatar.cc/96?img=47`, dentro del menú de notificaciones del encabezado del panel (`src/components/dashboard-01/dashboard-header.tsx`) | Baja | Bajo | `img-src` permite exclusivamente ese origen externo además del mismo origen y datos; `Referrer-Policy` limita el referrer de origen cruzado. La URL es fija y no lleva datos de inspecciones. | El servicio externo recibe al menos IP y datos básicos de navegador. Pendiente: sustituir la imagen por un recurso local si se elimina el tercero. |
| T3 | Datos reales capturados en campos de texto libre (`inspector`, `summary`) y guardados sin límite de tiempo | Media | Medio | `validarBorradorInspeccion` normaliza texto, limita laboratorio (120), inspector (80), resumen (1.000) y hallazgos (0–100.000), valida fechas de calendario y descarta campos ajenos; `tests/security.spec.ts` cubre límites, formatos y datos extra. | Los límites no detectan secretos ni impiden escribir datos reales en texto permitido. No hay función de borrado en `inspection-store.ts`, así que los datos se quedan hasta que alguien borre los datos del sitio desde el navegador. |
| T4 | Respuestas con `Cache-Control: no-store` guardadas en caché por el Service Worker | Media | Medio | `isCacheable` en `public/sw.js` excluye métodos no GET, otros orígenes, rutas sensibles y solicitudes con `Authorization`, `Cookie` o `no-store` (`tests/offline.spec.ts`). | **Fallo encontrado:** `no-store` se revisa en la solicitud, no en la respuesta. Una prueba temporal (no incluida en el commit) mostró que una respuesta con `no-store` sí se guarda en caché. Hoy solo afecta contenido público y sintético. Pendiente: revisar también el encabezado de la respuesta. |
| T4b | Lectura de los datos guardados por otra persona con acceso al dispositivo | Media | Medio | Ninguno técnico: no hay inicio de sesión ni cifrado en reposo. | Riesgo aceptado mientras los datos sean sintéticos. Si se usaran datos reales, esto bloquearía su uso. |
| T5 | Duplicado, repetición o alteración en la sincronización | Baja | Medio | Clave `inspection:<id>`, reintentos acotados (`MAX_SYNC_ATTEMPTS`), rechazo de un acuse con clave distinta y persistencia de errores genéricos en lugar de mensajes externos (`tests/queue.spec.ts`). Reintento sin duplicado con un servidor simulado (`tests/integration/reintento-sin-duplicados.spec.ts`). | Esto es lo que pasa con un servidor simulado: no hay autenticación ni transporte real. La deduplicación es por clave, no por contenido. |
| T6 | Uso indebido de cámara, ubicación o notificaciones, o fuga de la foto o las coordenadas | Baja | Medio | La cámara solo se abre desde un clic, y la foto vive en memoria y se descarta al guardar, cancelar o desmontar (`tests/camera.spec.ts`). Las coordenadas no entran al borrador (`tests/geolocation.spec.ts`). El permiso de notificaciones se pide desde el `onClick` de un botón, y el texto de la notificación es fijo (`src/lib/notifications/client.ts`). | Las pruebas usan APIs simuladas. La comprobación en navegador fue manual y la hizo una sola persona. |
| T7 | Service Worker publicado con contenido indebido | Baja | Alto | `public/sw.js` es del mismo origen. El CI ejecuta lint, tipos, pruebas y build (`.github/workflows/week-09-security-privacy.yml`). | No verificamos si el repositorio exige revisión de cambios sobre `public/sw.js` ni si hay ramas protegidas. Pendiente: comprobarlo en la configuración de GitHub. |
| T8 | Cookie `sidebar_state` escrita desde JavaScript sin `Secure` ni `SameSite` explícitos (`src/components/ui/sidebar.tsx`, línea 87) | Baja | Bajo | Solo guarda el estado de la barra lateral: no incluye datos de inspecciones ni identificadores de sesión. Dura 7 días y ningún código de `src/` la lee. No hay inicio de sesión. | Cualquier script del origen puede leerla. El riesgo es bajo mientras solo guarde una preferencia. Pendiente: decidir si se deja o se elimina, ya que nadie la usa. |

## Fallos encontrados

1. El Service Worker guarda en caché respuestas con `Cache-Control: no-store` (T4).
2. Hay una petición a un tercero para una imagen de avatar de plantilla (T2b).
3. No existe borrado de registros desde la aplicación (T3).
4. La CSP permite estilos inline para los gráficos y el avatar externo; `script-src` usa nonce dinámico sin `unsafe-inline`.
5. `npm audit --omit=dev` reporta 19 vulnerabilidades, incluida una crítica en `next` (T1).
6. La aplicación escribe una cookie de preferencia que nadie lee (T8).
7. `npm run lint` pasa con una advertencia por usar `<img>` en `src/app/inspecciones/page.tsx`, línea 558.

## Decisiones y supuestos

- Priorizamos por impacto y probabilidad estimados. Si los datos pasaran a ser reales, T3 y T4b subirían a prioridad alta.
- En W09 se añadieron validación/normalización acotadas y un error de sincronización no sensible. No se modificó el ciclo de permisos: cámara, ubicación y notificaciones siguen siendo opcionales y requieren una acción del usuario; fotos y coordenadas siguen siendo temporales.
- Asumimos que el alojamiento sirve la aplicación por HTTPS. No lo verificamos.
- Las cookies que aparezcan en `localhost` pueden venir de otros proyectos locales, porque el navegador las comparte entre puertos. Solo documentamos las que escribe el código de este repositorio.

## Riesgos residuales aceptados por ahora

T1 (actualizar Next), la excepción de estilos inline de T2 y T4b (sin cifrado ni sesión) quedan abiertos hasta que haya un plan de actualización y se decida si la aplicación va a tratar datos reales. T2b y T8 son de impacto bajo y quedan pendientes de sustituir o eliminar.

## Cómo repetir las comprobaciones

```bash
npm ci
npm audit --omit=dev
npm run lint
npm test
grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(" src public
grep -rn "fetch(" src public
grep -rn "document.cookie" src public
grep -rn "https\?://" src public --include=*.ts --include=*.tsx --include=*.js
npm ls shadcn --omit=dev
```

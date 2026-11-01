# Modelo de amenazas — PWA de inspecciones de laboratorio

Fecha : 31 de octubre de 2026 · Rama `feat/week-09-security-privacy` · Commit base `9bc8802`.

## Alcance y método

Este análisis describe lo que el repositorio hace hoy. Lo armamos leyendo el código (`public/sw.js`, `src/lib/storage/`, `src/lib/sync/`, `src/lib/device/`, `src/lib/notifications/`, `src/app/inspecciones/page.tsx`, `src/components/`) y ejecutando `grep`, `npm ls`, `npm run lint`, `npm audit --omit=dev` y una prueba temporal sobre el Service Worker ,no está en el commit

Todos los datos son sintéticos.

## Qué no se verificó

- Las cabeceras que agregue el servicio de alojamiento. El repositorio no define ninguna (`next.config.mjs` solo tiene `reactStrictMode`, y no hay middleware ni archivos como `vercel.json`, `netlify.toml` o `public/_headers`), pero el despliegue podría añadirlas.
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
| T2 | Script inyectado (XSS) que lee IndexedDB o las cachés | Baja | Alto | En `src/` y `public/` el único `dangerouslySetInnerHTML` está en `src/components/ui/chart.tsx`, y sus colores son constantes del código (`var(--chart-1)`, `var(--chart-2)` en `dashboard-charts.tsx`). No encontramos otro uso de `innerHTML`, `eval`, `new Function` ni `document.write`. `validarBorradorInspeccion` descarta propiedades ajenas (`tests/unit/captura.spec.ts`). | El repositorio no define Content-Security-Policy, y sin CSP un fallo de inyección tendría efecto completo. Pendiente: definir una CSP y comprobarla. |
| T2b | Petición a un tercero para la imagen de avatar `https://i.pravatar.cc/96?img=47`, dentro del menú de notificaciones del encabezado del panel (`src/components/dashboard-01/dashboard-header.tsx`, línea 196). El encabezado aparece en `/` y `/reportes`, no en `/inspecciones` | Baja | Bajo | `isCacheable` descarta otros orígenes: en DevTools la petición tomó la rama de `fetch` directo de `sw.js` (línea 56) y no se guardó. El componente tiene `AvatarFallback` ("PR") si la imagen no carga. La URL es fija y no lleva datos de inspecciones. | Es una conexión a un tercero fuera del control del equipo, y el navegador le revela al menos la IP y el navegador. No verificamos qué política de referrer se aplica (el repositorio no define ninguna). Una CSP futura tendría que permitir ese origen o quitar la imagen. Pendiente: sustituirla por un recurso local. No se corrige en este issue. |
| T3 | Datos reales capturados en campos de texto libre (`inspector`, `summary`) y guardados sin límite de tiempo | Media | Medio | La interfaz se presenta como sintética, pero solo en encabezados (`src/app/inspecciones/page.tsx`, líneas 294 y 357); no hay advertencia junto a los campos de texto libre. | Nada impide técnicamente escribir datos reales. Tampoco hay función de borrado en `inspection-store.ts` (`grep` de `delete` y `clear(` sin resultados), así que los datos se quedan hasta que alguien borre los datos del sitio desde el navegador. |
| T4 | Respuestas con `Cache-Control: no-store` guardadas en caché por el Service Worker | Media | Medio | `isCacheable` en `public/sw.js` excluye métodos no GET, otros orígenes, rutas sensibles y solicitudes con `Authorization`, `Cookie` o `no-store` (`tests/offline.spec.ts`). | **Fallo encontrado:** `no-store` se revisa en la solicitud, no en la respuesta. Una prueba temporal (no incluida en el commit) mostró que una respuesta con `no-store` sí se guarda en caché. Hoy solo afecta contenido público y sintético. Pendiente: revisar también el encabezado de la respuesta. |
| T4b | Lectura de los datos guardados por otra persona con acceso al dispositivo | Media | Medio | Ninguno técnico: no hay inicio de sesión ni cifrado en reposo. | Riesgo aceptado mientras los datos sean sintéticos. Si se usaran datos reales, esto bloquearía su uso. |
| T5 | Duplicado, repetición o alteración en la sincronización | Baja | Medio | Clave `inspection:<id>`, reintentos acotados (`MAX_SYNC_ATTEMPTS`) y rechazo de un acuse con clave distinta (`tests/queue.spec.ts`). Reintento sin duplicado con un servidor simulado (`tests/integration/reintento-sin-duplicados.spec.ts`). | Esto es lo que pasa con un servidor simulado: no hay autenticación ni transporte real. La deduplicación es por clave, no por contenido. |
| T6 | Uso indebido de cámara, ubicación o notificaciones, o fuga de la foto o las coordenadas | Baja | Medio | La cámara solo se abre desde un clic, y la foto vive en memoria y se descarta al guardar, cancelar o desmontar (`tests/camera.spec.ts`). Las coordenadas no entran al borrador (`tests/geolocation.spec.ts`). El permiso de notificaciones se pide desde el `onClick` de un botón, y el texto de la notificación es fijo (`src/lib/notifications/client.ts`). | Las pruebas usan APIs simuladas. La comprobación en navegador fue manual y la hizo una sola persona. |
| T7 | Service Worker publicado con contenido indebido | Baja | Alto | `public/sw.js` es del mismo origen. El CI ejecuta lint, tipos, pruebas y build (`.github/workflows/week-09-security-privacy.yml`). | No verificamos si el repositorio exige revisión de cambios sobre `public/sw.js` ni si hay ramas protegidas. Pendiente: comprobarlo en la configuración de GitHub. |
| T8 | Cookie `sidebar_state` escrita desde JavaScript sin `Secure` ni `SameSite` explícitos (`src/components/ui/sidebar.tsx`, línea 87) | Baja | Bajo | Solo guarda el estado de la barra lateral: no incluye datos de inspecciones ni identificadores de sesión. Dura 7 días y ningún código de `src/` la lee. No hay inicio de sesión. | Cualquier script del origen puede leerla. El riesgo es bajo mientras solo guarde una preferencia. Pendiente: decidir si se deja o se elimina, ya que nadie la usa. |

## Fallos encontrados

1. El Service Worker guarda en caché respuestas con `Cache-Control: no-store` (T4).
2. Hay una petición a un tercero para una imagen de avatar de plantilla (T2b).
3. No existe borrado de registros desde la aplicación (T3).
4. El repositorio no define Content-Security-Policy (T2).
5. `npm audit --omit=dev` reporta 19 vulnerabilidades, incluida una crítica en `next` (T1).
6. La aplicación escribe una cookie de preferencia que nadie lee (T8).
7. `npm run lint` pasa con una advertencia por usar `<img>` en `src/app/inspecciones/page.tsx`, línea 558.

## Decisiones y supuestos

- Priorizamos por impacto y probabilidad estimados. Si los datos pasaran a ser reales, T3 y T4b subirían a prioridad alta.
- No corregimos ningún fallo en este issue, solo los documentamos: el alcance es de documentación.
- Asumimos que el alojamiento sirve la aplicación por HTTPS. No lo verificamos.
- Las cookies que aparezcan en `localhost` pueden venir de otros proyectos locales, porque el navegador las comparte entre puertos. Solo documentamos las que escribe el código de este repositorio.

## Riesgos residuales aceptados por ahora

T1 (actualizar Next), T2 (sin CSP) y T4b (sin cifrado ni sesión) quedan abiertos hasta que haya un plan de actualización y se decida si la aplicación va a tratar datos reales. T2b y T8 son de impacto bajo y quedan pendientes de sustituir o eliminar.

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

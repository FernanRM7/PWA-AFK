# PWA de inspecciones de laboratorio — proyecto del equipo
**Verificación agregada:** `npm test` conserva las pruebas existentes y ejecuta las pruebas TypeScript con Vitest. `npm run verify` sigue funcionando igual.

Comiencen por `START_HERE.md` y lean `ACTIVIDAD-01.md`. Este es un proyecto acumulativo: un repositorio privado por equipo durante el curso. La Semana 1 consiste en arrancar, documentar y explicar la verificación; no en implementar toda la PWA.

## Semana 04 — listado CSR y detalle SSR

El incremento actual agrega `/inspecciones` como listado con renderizado en cliente y `/inspecciones/[id]` como detalle renderizado dinámicamente en servidor. Ambas rutas usan solamente los tres registros sintéticos de `src/lib/data/inspections.ts`. No hay backend, persistencia ni datos de laboratorios reales.

Para ejecutar la actividad desde un checkout limpio:

```bash
npm ci
npm run dev
```

Abre `http://localhost:3000/inspecciones` y entra al detalle desde un registro. Para revisar estados repetibles, usa `/inspecciones?estado=cargando`, `/inspecciones?estado=error` y `/inspecciones/inspection-001?estado=cargando` o `?estado=error`. El error del listado se recupera con el botón; el detalle vuelve a intentar mediante su frontera de error. Un id inexistente presenta el 404 de la ruta.

La prueba de Semana 04 corre como parte de `npm test`. La verificación que se ejecuta antes de entregar es:

```bash
npm ci
make verify
npm run build
```

`make verify` equivale a `npm run verify`; comprueba la estructura existente, pruebas y build, y genera `reports/verification.json`. En Actions, el workflow `Academic Evaluation Feedback — Semana 04 CSR/SSR` publica ese reporte como artefacto. La tabla de [docs/rendering-decision.md](docs/rendering-decision.md) describe cómo repetir la medición local de TTFB y sus límites.

**Verificación local registrada:** Node `v24.21.0`, npm `11.19.0`; `npm ci` terminó correctamente y `make verify` terminó con PASS (7 archivos de prueba, 38 pruebas y build exitoso). El build identifica `/inspecciones/[id]` como dinámico. La medición TTFB local de cinco respuestas tiene mediana de `9.244 ms`, con sus muestras y alcance descritos en la decisión técnica. La ejecución de GitHub Actions debe vincularse aquí al SHA final una vez que el workflow corra en el remoto.

Cada integrante completa su propia sección en `evidence/individual.md` con su SHA, decisión, prueba y resultado observados, limitación y uso de IA declarado. El SHA final y el enlace a Actions se copian después del último commit; no se inventan resultados que no hayan sido ejecutados. La prueba de estructura de `bash public-tests/check.sh` sigue siendo la del starter previo; no es el evaluador de comportamiento de CSR/SSR.

## Entorno

Node.js 20.19 o posterior compatible, npm 10 o posterior, Git y cuenta de GitHub. No se requiere Make. Registren aquí las versiones usadas (`node --version`, `npm --version`) y cualquier dificultad de entorno que encuentren.

## Ejecución

```bash
npm ci
npm run dev
```

Abran `http://localhost:3000` y comprueben las tres inspecciones sintéticas. Detengan el servidor con Ctrl+C.

## Shell de la aplicación

La interfaz separa el shell (`src/components/app-shell.tsx`) del contenido de inspecciones. El shell proporciona los landmarks globales, la superficie de estados y el loader `DotmSquare3`; la página conserva la navegación shadcn, las métricas y los datos sintéticos.

La vista normal muestra el estado de éxito. Para revisar manualmente los cuatro estados:

- `http://localhost:3000/?estado=cargando`
- `http://localhost:3000/?estado=error`
- `http://localhost:3000/?estado=vacio`
- `http://localhost:3000/?estado=exito`

El estado de error ofrece reintento; los estados no implementan persistencia, API ni sincronización. El loader respeta `prefers-reduced-motion`.

### Pruebas manuales del shell

Realizadas en los siguientes entornos:

- **Responsive:** vista de iPhone 13 y iPad de 13 pulgadas; se verificó que no hubiera desbordamiento y que la sidebar pudiera abrirse y cerrarse.
- **Teclado:** recorrido con `Tab`; se verificaron el enlace para saltar al contenido, los controles operables y el foco visible.
- **Landmarks:** se verificó la presencia de `header`, `nav`, un único `main` y `footer`.
- **Estados:** se revisaron las cuatro URLs; cada estado se anuncia correctamente y éxito conserva las inspecciones sintéticas.

La animación del loader se desactiva cuando el usuario indica `prefers-reduced-motion`. El shell mantiene la separación entre navegación futura y funcionalidades todavía no implementadas.

## Verificación

```bash
npm test
npm run verify
npm run build
```

Ejecuta comprobación de archivos, prueba proporcionada y build; genera `reports/verification.json`. El reporte contiene resultados técnicos y documentos para revisión, no una calificación automática. `make verify` es equivalente. `bash public-tests/check.sh` es un check opcional de estructura.

GitHub Actions ejecuta la verificación de Semana 3 y permite descargar el artefacto `academic-evidence-w03-service-worker-offline`. El reporte local se excluye de Git: adjúntenlo en Classroom o descarguen el del SHA entregado desde Actions.

## Service Worker y verificación offline

El Service Worker se encuentra en `public/sw.js` y se registra desde el cliente cuando se incorpora al shell. Usa cachés versionadas para el precache (`/` y `/manifest.webmanifest`) y para recursos `GET` públicos del mismo origen. Las solicitudes sensibles, autenticadas, con cookies o con `Cache-Control: no-store` no se guardan.

La estrategia de navegación intenta red, respuesta runtime previamente guardada y finalmente la shell `/`. Si no existe ningún recurso disponible, devuelve `503`. Las versiones antiguas se eliminan únicamente en `activate`, después de comprobar que existe el precache actual; por eso un fallo de actualización no destruye una caché válida. Los detalles y límites están en `docs/cache-strategy.md`.

Para verificar esta parte del proyecto:

```bash
npm run test:vitest -- tests/service-worker.spec.ts
npm run test:vitest
npm run verify
make verify
bash public-tests/check.sh
```

La prueba del Service Worker usa `Request`, `Response`, Cache API y red simuladas con datos sintéticos. Comprueba instalación, activación, limpieza controlada, runtime cache, fallback offline, exclusión de solicitudes sensibles, registro de errores y conservación de la caché anterior ante una actualización fallida. `npm run verify`, `make verify` y `bash public-tests/check.sh` cubren verificaciones más amplias del repositorio; no sustituyen una prueba manual en DevTools con el modo Offline.

### Pruebas de comportamiento offline (`tests/offline.spec.ts`)

Además de `tests/service-worker.spec.ts`, `tests/offline.spec.ts` cubre específicamente los siete casos mínimos de comportamiento offline y recuperación exigidos para esta semana:

- Fallback cuando falla la red (navegación con caché runtime previa).
- Respuesta servida desde caché sin ir a red.
- Manejo de un recurso que no estaba precacheado (va a red y lo guarda).
- Recuperación de datos frescos al regresar la conexión.
- Conservación de una versión válida cuando una actualización falla.
- Ausencia de datos sensibles en la caché (rutas `/api`, `/auth`, `/account`, cookies).
- Idempotencia: instalar y activar el Service Worker varias veces no duplica ni corrompe el estado.

Se ejecuta junto con el resto de la suite mediante `npm test` (Vitest recoge automáticamente cualquier archivo bajo `tests/**/*.spec.ts`). Usa el mismo patrón de simulación del Service Worker con `Request`/`Response`/Cache API en memoria, sin red real, sin servicios privados y sin pruebas no deterministas.     

### Evidencia de CI

La evidencia de CI debe conservarse desde la ejecución del workflow correspondiente: SHA probado, nombre del workflow, resultado de cada job y enlace al artefacto o a la ejecución. El reporte local `reports/verification.json` es temporal y permanece excluido de Git; no se debe inventar un resultado de CI ni confundirlo con la prueba local.

**Ejemplo de evidencia registrada (Semana 3 — pruebas offline):**

- SHA probado: `0c6356a`
- Workflows ejecutados: `Academic Evaluation Feedback / evaluate` y `Starter Semana 1 — feedback / verify`, ambos en eventos `push` y `pull_request` (6/6 checks exitosos)
- Resultado: todos los jobs en verde
- Enlace a la ejecución: https://github.com/FernanRM7/PWA-AFK/actions/runs/35480354096/job/105996918955

## Trabajo y entrega en equipo

Inviten a los integrantes y al docente al mismo repositorio privado. Cada persona registra su evidencia en una sección de `evidence/individual.md`. Todos entregan en Classroom el mismo SHA final y enlaces, identificando su sección. El formato exacto está en `ACTIVIDAD-01.md`; no se requiere un pull request adicional ni una copia por alumno.

## Estructura y límites

- `src/app/`: pantalla Next.js.
- `src/lib/data/`: inspecciones sintéticas.
- `docs/`: requisitos y decisión del equipo.
- `evidence/`: evidencia propia de cada integrante.
- `tests/`: prueba inicial proporcionada; no es una suite completa de comportamiento.

Registren aquí sus supuestos y limitaciones de ejecución. La PWA ya cuenta con registro de Service Worker, caché offline de la shell y pruebas deterministas; la sincronización con backend aún no está implementada. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.

## Manifest e identidad instalable 

**Decisiones:**
- `start_url` y `scope` quedaron ambos en /, porque toda la aplicación vive en la raíz por ahora.
- `display: "standalone"` para que, al instalarse, la app se vea sin la barra del navegador.
- `theme_color` se definió como un azul oscuro (`#0f172a`) de forma provisional, puede ajustarse cuando el equipo defina una paleta de color final.
- El favicon de la pestaña usa `public/icon.svg` (vectorial), referenciado desde `metadata.icons` en `src/app/layout.tsx`. Es un archivo distinto de los iconos instalables.
- Los iconos instalables (`public/icons/icon-192.png` y `icon-512.png`) son PNG rasterizados reales, generados a partir de `icon.svg` con `sharp-cli`, porque el manifest necesita formatos rasterizados y no acepta el SVG directamente en todos los navegadores.

**Supuestos:**
- No se definió aún una identidad visual (colores, logo) oficial del equipo; los colores actuales son un placeholder razonable, sujeto a cambio.
- Se asume que la app seguirá viviendo en la raíz del dominio (`scope: "/"`), si más adelante se despliega bajo una subruta, habría que ajustar `scope` y `start_url`.

**Límites:**
- El manifest, los iconos y el Service Worker permiten que el navegador ofrezca instalar la app y que la shell pueda funcionar offline después de una visita exitosa. La instalación y el comportamiento exacto pueden variar entre navegadores.
- La prueba (`tests/manifest.spec.ts`, con Vitest) valida estructura, campos y existencia de archivos — no valida que el ícono se vea bien en cada plataforma, ni el comportamiento real de instalación en un dispositivo.

**Verificación agregada:** `npm test` conserva `tests/starter.spec.mjs` y las pruebas JavaScript del shell, y después ejecuta las pruebas TypeScript con Vitest. `npm run verify` sigue funcionando igual.

## Vitest y pruebas TypeScript

Vitest se ejecuta como tarea independiente mediante `npm run test:vitest`. La prueba proporcionada `tests/starter.spec.mjs` no fue modificada ni migrada.

```bash
npm ci
npm test
npm run test --if-present -- --run
npm run test:vitest
```

La suite TypeScript valida el manifest, sus iconos, la metadata del layout y la forma de los tres registros sintéticos. Las aserciones fallan si falta un campo requerido, un icono declarado o un registro/estado válido. No se usan red, servicios privados, datos reales, reloj del sistema ni aleatoriedad.

## Pruebas manuales de entrega

| Área | Pasos | Esperado | Observado |
|---|---|---|---|
| Responsive móvil | Ejecutar `npm run dev`, abrir `http://localhost:3000` con viewport móvil y recorrer la página. | El contenido cabe sin desplazamiento horizontal; la sidebar puede abrirse y cerrarse. | Cumplido en viewport de iPhone 13; no se observó desbordamiento y la sidebar respondió. |
| Responsive escritorio | Abrir la misma URL con viewport de escritorio y redimensionar. | Se conserva la navegación, las métricas y la tabla sin solapamientos. | Cumplido en escritorio; el shell se mantuvo usable y la tabla permaneció visible. |
| Estados | Visitar `?estado=cargando`, `?estado=error`, `?estado=vacio` y `?estado=exito`. | Cada estado muestra su contenido; error ofrece reintento y éxito conserva datos sintéticos. | Cumplido: se observaron carga, error, vacío y éxito; el loader respeta reduced motion. |
| Teclado y foco | Usar `Tab` desde el inicio, activar controles con `Enter` o espacio y usar el enlace de salto. | El orden es lógico, los controles son operables y el foco visible. | Cumplido: el enlace de salto y los controles recibieron foco visible. |
| Manifest | Abrir DevTools, revisar Application/Manifest y solicitar instalación cuando el navegador lo permita. | Se muestran nombre, alcance `/`, modo standalone, colores e iconos 192x192 y 512x512. | Cumplido en la inspección del manifest; instalación/offline real queda fuera porque no hay Service Worker. |
| Icono SVG | Abrir `http://localhost:3000/icon.svg` y revisar el favicon de la pestaña. | El SVG carga y `metadata.icons` lo referencia como favicon. | Cumplido: `public/icon.svg` carga y el layout referencia `/icon.svg`. |

**Supuestos y límites:** la comprobación manual usa datos sintéticos y un servidor local; no prueba instalación en todos los navegadores, lector de pantalla, persistencia, API, sincronización ni offline. `npm ci` puede informar vulnerabilidades transitivas; no se ejecuta `npm audit fix` porque cambiaría dependencias fuera del alcance.

## Captura offline y sincronización (Semana 5)

La ruta `/inspecciones` permite crear inspecciones exclusivamente sintéticas. Se guardan en IndexedDB, sobreviven a una recarga y se encolan para sincronización. Al recuperar conectividad, la cola reintenta con backoff exponencial (1, 2, 4 y 8 segundos entre un máximo de cinco intentos); los fallos agotados permanecen guardados y permiten reintento manual. Cada registro conserva una clave de idempotencia estable.

La sincronización usa un transporte sintético e inyectable: no hay API ni servidor remoto en este proyecto. La política automática compara `updatedAt`; gana la versión más reciente y, si los timestamps empatan, gana la remota. Si gana la local, se reenvía con la misma clave hasta aceptación. El reloj del dispositivo puede estar desfasado; la sincronización con un backend real queda fuera de alcance.

Para ejecutar y verificar desde un entorno limpio:

```bash
npm ci
npm test
make verify
```

Las pruebas de `tests/storage.spec.ts`, `tests/queue.spec.ts` y `tests/sync.spec.ts` usan IndexedDB/transportes sintéticos y tiempos inyectados; no dependen de red privada ni esperan los intervalos reales de reintento. El workflow `.github/workflows/week-05-w05-sync-data.yml` ejecuta instalación, build, comprobación de artefactos y tests, y publica la evidencia de GitHub Actions.

Para probar la captura manualmente, ejecuta `npm run dev`, abre `http://localhost:3000/inspecciones`, crea un registro sintético sin conexión y vuelve a conectar el navegador. La simulación confirma el flujo local, pero no demuestra entrega ni deduplicación en un servidor remoto real.

### Pruebas E2E de navegador (W08)

Instala las dependencias y el navegador Chromium una vez, y ejecuta los dos escenarios de extremo a extremo:

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

`npm run test:e2e` compila la app y arranca automáticamente el servidor de producción local (`next start`) en `http://127.0.0.1:3000`; no hace falta iniciar `npm run dev` en otra terminal. El servidor existente se reutiliza fuera de CI. Los casos usan contextos Chromium aislados, limpian IndexedDB/cachés/cookies antes de cada flujo, datos sintéticos y la emulación de conexión de Playwright. El caso de capacidad hace que la API de geolocalización no esté disponible; no requiere cámara, GPS ni permisos físicos. Las aserciones inspeccionan la UI y el contenido real de IndexedDB tras guardar, recargar y reconectar.

El transporte de sincronización sigue siendo sintético y local. Estos E2E verifican el flujo de interfaz, persistencia, transición a sincronizado y que no se duplica el registro ni se reenvía tras la recarga; no verifican entrega, idempotencia ni disponibilidad de un backend remoto, ni reemplazan pruebas en navegadores/dispositivos distintos de Chromium.

El check público del kit mostró coincidencias de texto legítimo (`js-tokens`, `resolveDmxColorTokens`, la ruta sensible `/token` y documentación de seguridad) y aun así terminó con `PUBLIC_OK` y código 0. Su búsqueda está negada con `! rg` bajo `set -e`, por lo que los hallazgos no hacen fallar el script; sirve como check mínimo de estructura, no como detector de secretos. Revisé las coincidencias mostradas y no vi credenciales reales; no borré documentación ni alteré el checker.

## Estrategia de pruebas y CI (Semana 8)

La matriz de riesgos, alcance de cada capa, comandos reproducibles y límites están en [docs/test-strategy.md](docs/test-strategy.md). El workflow `.github/workflows/academic-evaluation.yml` ejecuta instalación limpia, lint, typecheck, Vitest con cobertura/reporte JUnit, pruebas starter y build; publica reportes aunque falle una etapa. El workflow incorpora el E2E cuando existe `tests/e2e/` y entonces exige `npm run test:e2e`; esa suite la aporta el trabajo #40. Para verificar localmente: `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build`; `make verify` ejecuta la verificación agregada existente. El workflow necesitará una ejecución remota sobre el SHA final para enlazar sus artefactos; no se afirma aquí un resultado de Actions aún no observado.

## Capacidades del dispositivo (Semana 6)

En `/inspecciones`, la cámara y la geolocalización son opcionales y solo se solicitan al activar sus controles. Una foto o ubicación puede aparecer temporalmente durante la captura, pero se descarta al guardar o cancelar. No se incluye en IndexedDB, en la cola offline ni en sincronización. Los permisos denegados, APIs ausentes y errores de dispositivo no bloquean el registro sintético.

El botón **Activar notificaciones** solicita permiso de forma explícita. Al guardar una inspección, si el navegador ya tiene permiso concedido, se muestra una notificación local genérica mediante el Service Worker o la API local disponible. Sin soporte, con permiso denegado o si falla la entrega, la app conserva una confirmación accesible en pantalla. No hay Push remoto ni backend.

Para preparar y verificar el proyecto desde un entorno limpio:

```bash
npm ci
npm test
make verify
```

El kit académico se distribuye aparte del repositorio. Cuando esté disponible junto a la copia local, ejecuta también `bash PWA-w06-kit-estudiante/public-tests/check.sh`; su resultado se documenta en [docs/capabilities.md](docs/capabilities.md). Las pruebas W06 usan proveedores simulados y datos sintéticos; no requieren cámara, GPS, servicios privados ni permiso real. El detalle de permisos, retención, fallbacks, límites y pruebas está en [docs/capabilities.md](docs/capabilities.md). Cada integrante registra su SHA, decisión técnica, prueba observada, limitación y uso de IA en `evidence/individual.md`; no se debe afirmar una prueba manual que no se haya realizado.

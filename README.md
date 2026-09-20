# PWA de inspecciones de laboratorio — proyecto del equipo
**Verificación agregada:** `npm test` conserva las pruebas existentes y ejecuta las pruebas TypeScript con Vitest. `npm run verify` sigue funcionando igual.

Comiencen por `START_HERE.md` y lean `ACTIVIDAD-01.md`. Este es un proyecto acumulativo: un repositorio privado por equipo durante el curso. La Semana 1 consiste en arrancar, documentar y explicar la verificación; no en implementar toda la PWA.

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

GitHub Actions ejecuta la misma verificación y permite descargar el artefacto `starter-week-01-evidence`. El reporte local se excluye de Git: adjúntenlo en Classroom o descarguen el del SHA entregado desde Actions.

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

Registren aquí sus supuestos y limitaciones de ejecución. El starter todavía no implementa instalación PWA, offline ni sincronización. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.

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
- El manifest y los iconos hacen que el navegador pueda ofrecer instalar la app, pero esta semana no se implementa el Service Worker; sin él, la instalación real y el funcionamiento offline todavía no están garantizados.
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
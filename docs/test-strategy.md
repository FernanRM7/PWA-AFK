# Estrategia de pruebas — Semana 08

## Alcance y diagnóstico inicial

La aplicación contiene almacenamiento local, cola de sincronización y capacidades opcionales; el backend de sincronización sigue siendo sintético. En el diagnóstico inicial de Semana 8 estaban las pruebas existentes en `tests/*.spec.ts` y las de shell en `tests/*.spec.mjs`, pero faltaban `tests/unit/`, `tests/integration/` y `tests/e2e/`. Esta entrega agrega esas tres capas; sus límites se describen en cada riesgo y en `evidence/individual.md`.

## Matriz riesgo–capa

| Riesgo | Capa elegida | Evidencia/aserción requerida | Justificación y límite |
|---|---|---|---|
| Captura inválida aceptada | Unitaria (`tests/unit/`) | Validación rechaza campos ausentes/mal formados y acepta una captura válida. | Aísla reglas de dominio, rápida y determinista; no prueba el formulario renderizado. |
| Pérdida de inspección offline tras recargar | Integración (`tests/integration/`) | Guardar mediante almacenamiento realista (IndexedDB simulado) y recuperar tras recrear contexto. | Cruza persistencia y dominio sin navegador; no prueba ciclo de vida completo de la PWA. |
| Reintento duplica operación | Unitaria e integración | Misma clave idempotente en reintentos; fixture de transporte controla aceptación y confirma un solo registro lógico. | Aísla la regla y verifica colaboración cola/transporte; no demuestra idempotencia de un backend real. |
| Permiso/API de dispositivo denegado o ausente bloquea captura | E2E (`tests/e2e/`) | Denegar/simular API ausente en el navegador y completar/guardar captura desde UI. | Comprueba integración observable; no usa hardware ni permiso físico, y no acredita compatibilidad de todos los navegadores. |
| Desconexión, recarga y reconexión pierden o duplican datos | E2E (`tests/e2e/`) | Crear, pasar offline, guardar, recargar sin conexión, volver online y afirmar persistencia y una sola sincronización. | Es el flujo crítico entre UI, almacenamiento y conectividad; requiere servidor local determinista y limpieza por caso. |

Todos los datos, imágenes, ubicaciones y respuestas remotas de prueba deben ser sintéticos. Aislar almacenamiento, cola y fixtures por caso; no usar servicios privados, red real, cámara, GPS ni permisos físicos.

## Comandos y reproducibilidad

Requisitos declarados en `package.json`: Node.js `>=20.19.0`, npm `>=10.0.0`.

- Instalación limpia: `npm ci`.
- Lint: `npm run lint` (`next lint`, configuración `next/core-web-vitals`).
- Pruebas starter, shell y Vitest: `npm test` (`npm run test:starter` seguido de Vitest).
- Vitest con cobertura V8 y reporte JUnit: `npm run test:vitest` (filtrar con `npm run test:vitest -- tests/ruta.spec.ts`). Descubre `tests/**/*.spec.ts`, incluidas las capas `unit` e `integration`.
- E2E en Chromium y reporte JUnit: `npm run test:e2e`; compila y arranca automáticamente el servidor de producción definido en `playwright.config.ts`.
- Tipos: `npx tsc --noEmit`.
- Build: `npm run build`.
- Verificación agregada actual: `make verify` (alias de `npm run verify`, ejecuta pruebas y build y guarda `reports/verification.json`).
- Arranque para E2E: lo administra Playwright con `npm run build && npm run start -- --hostname 127.0.0.1`, en `http://127.0.0.1:3000`; ejecuta `npx playwright install chromium` una vez por entorno local.
- Lint, tipos y build por separado: `npm run lint`, `npx tsc --noEmit` y `npm run build`.

En el checkout inicial no había comando de lint ni cobertura; esta entrega agrega ESLint, cobertura V8 y reportes JUnit. `make verify` sigue siendo el alias de `npm run verify` y ejecuta `npm test` más `npm run build`; lint, tipos y E2E se ejecutan mediante sus comandos explícitos y son etapas obligatorias en Actions. La cobertura es diagnóstica, no una meta porcentual.

## Defecto controlado y resultados

La detección de duplicados se verificó en la rama local temporal `codex/w08-regression-proof`, creada desde `fd6979099ae99a1ae2bdd24381c9ee37818b2540` y eliminada después de la comprobación. Se cambió temporalmente la guarda de `syncPending` para que omitiera solo `failed`, reenviando por error registros `synced`.

- Fallo esperado: `npx vitest run tests/unit/cola.spec.ts -t 'ya synced no se vuelve a enviar' --reporter=verbose` terminó con código 1; el transporte fue llamado una vez y falló `expect(transporte).not.toHaveBeenCalled()`. La salida completa está en [failure.txt](../evidence/w08-regression/failure.txt).
- Recuperación: se restauró la guarda `synced || failed`; el mismo comando terminó con código 0 (1 prueba aprobada). La salida completa está en [recovery.txt](../evidence/w08-regression/recovery.txt).
- La mutación no se confirmó ni se subió; el código productivo conserva la protección.

## Resultados reproducibles de cierre

En esta sesión, sobre la rama del PR antes de publicarse el ajuste de reportes: `npm ci` terminó correctamente (15 vulnerabilidades transitivas reportadas: 3 moderadas, 10 altas y 2 críticas); `npm run lint` pasó con la advertencia ya existente por `<img>` en `src/app/inspecciones/page.tsx:558`; `npx tsc --noEmit` pasó; `npm run test:vitest` aprobó 18 archivos y 124 pruebas y generó JUnit (63.38% statements, 57.5% branches, 53.9% functions, 65.85% lines); `npm run test:starter` pasó; `npm run test:e2e` aprobó 2 escenarios; `make verify` pasó con 18 archivos, 124 pruebas y build de seis rutas. El primer intento E2E local fue impedido por la política de red del sandbox (`listen EPERM` en `127.0.0.1:3000`); al repetir con acceso local ampliado, ambos escenarios pasaron.

La ejecución remota previa en el SHA base `fd6979099ae99a1ae2bdd24381c9ee37818b2540` está [en Actions](https://github.com/FernanRM7/PWA-AFK/actions/runs/40147238925). El ajuste de reportes de Playwright se valida con el siguiente run del SHA actualizado; el cierre del issue #42 conserva ese SHA, su enlace de Actions y sus artefactos.

## Límites conocidos

La implementación no usa backend remoto; una respuesta sintética solo demuestra el comportamiento local. E2E se ejecuta en Chromium y no cubre otros navegadores, permisos físicos ni dispositivos reales. Actions publica, aun cuando falle una etapa, `reports/vitest-junit.xml`, `reports/playwright-junit.xml`, `coverage/` y `test-results/` (incluidas trazas de fallos disponibles). Las ejecuciones y artefactos W08 están en [GitHub Actions](https://github.com/FernanRM7/PWA-AFK/actions/workflows/academic-evaluation.yml); el issue [#42](https://github.com/FernanRM7/PWA-AFK/issues/42) registra el SHA y enlace exactos de la ejecución final después del push. Un estado verde verifica los comandos del workflow; no equivale a calificación académica.

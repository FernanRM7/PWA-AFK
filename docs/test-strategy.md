# Estrategia de pruebas — Semana 08

## Alcance y diagnóstico inicial

La aplicación ya contiene almacenamiento local, cola de sincronización y capacidades opcionales; el backend sigue siendo sintético. El inventario del checkout al iniciar este trabajo contiene pruebas en `tests/*.spec.ts` (Vitest) y pruebas de shell en `tests/*.spec.mjs`, pero aún no contiene `tests/unit/`, `tests/integration/` ni `tests/e2e/`. Por tanto, los casos descritos a continuación son la estrategia y el contrato de trabajo; no se afirma que esos escenarios estén cubiertos hasta que existan pruebas y se ejecuten. La suite actual se ejecuta con `npm test` y compila con `npm run build`.

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
- Suite existente (pruebas starter y Vitest): `npm test`.
- Vitest con cobertura V8 y reporte JUnit: `npm run test:vitest` (filtrar con `npm run test:vitest -- tests/ruta.spec.ts`). Los archivos bajo `tests/**/*.spec.ts` se descubren automáticamente, incluidas las futuras carpetas `tests/unit/` y `tests/integration/`.
- Tipos: `npx tsc --noEmit`.
- Build: `npm run build`.
- Verificación agregada actual: `make verify` (alias de `npm run verify`, ejecuta pruebas y build y guarda `reports/verification.json`).
- Arranque para E2E: `npm run build && npm run start`; el servidor local queda en `http://localhost:3000` y se detiene con Ctrl+C. Los E2E deben esperar disponibilidad del servidor y limpiar almacenamiento antes/después. Al integrarse `tests/e2e/`, el workflow espera un script `npm run test:e2e` y lo hará obligatorio.

En el checkout inicial no había comando de lint ni cobertura; este cambio configura ESLint y cobertura V8/JUnit. La automatización E2E aún depende del aporte #40: el workflow no inventa una prueba ni la ejecuta antes de que exista `tests/e2e/`; al aparecer esa suite, la etapa invoca `test:e2e` y falla si falta el script o una prueba falla. La cobertura es diagnóstico, no una meta porcentual.

## Defecto controlado y resultados

No se ha ejecutado una mutación controlada en esta contribución. Cuando exista una prueba ejecutable de deduplicación, demostrarlo en una rama temporal: quitar la protección de duplicados, ejecutar el caso enfocado y conservar salida/código de fallo; restaurar el código, repetir y conservar el resultado exitoso. Enlazar ambos reportes en esta sección y en `evidence/individual.md`. Nunca integrar la mutación. No declarar recuperación hasta observarla.

## Límites conocidos

La implementación no usa backend remoto; una respuesta sintética solo demuestra el comportamiento local. Un estado verde de Actions verifica únicamente los comandos que el workflow realmente ejecuta y no equivale a calificación académica. Los artefactos de CI dependen de la ejecución remota del SHA final; los enlaces se añadirán tras esa ejecución.

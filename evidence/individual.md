# Evidencia individual del equipo

> Un solo archivo compartido. Cada integrante conservará su propia sección y añadirá evidencia verificable de su contribución. El SHA final se entrega en Classroom después del último commit.

- Grupo y equipo: "B" 9B-E11
- Repositorio del equipo: https://github.com/FernanRM7/PWA-AFK

## Integrante: Fernando Spencer Rodriguez Mendoza

- **Mi contribución concreta y enlace:** redacté el problema, los usuarios, los escenarios y los requisitos funcionales en [`docs/requirements.md`](../blob/semana-1-equipo/docs/requirements.md). La contribución está en el commit [`2adeb1e`](https://github.com/FernanRM7/PWA-AFK/commit/2adeb1e) y se integra mediante el [PR #7](https://github.com/FernanRM7/PWA-AFK/pull/7).
- **Decisión que puedo explicar y por qué:** definí que el problema central es el seguimiento de hallazgos de mantenimiento. Propuse como usuarios al docente o encargado de laboratorio y a la persona inspectora. También distinguí el listado sintético actual de las funciones futuras de consulta, registro, almacenamiento local y sincronización, para no afirmar que el starter ya implementa capacidades PWA.
- **Comando o prueba proporcionada que ejecuté:** `/opt/homebrew/bin/npm ci`, `/opt/homebrew/bin/npm test` y `/opt/homebrew/bin/npm run verify`.
- **Resultado real que observé:** la instalación terminó correctamente; `npm test` mostró `starter.spec.mjs: PASS`; `npm run verify` terminó con `Verificación técnica: pass`, ejecutó la prueba y el build de Next.js terminó correctamente. Se generó `reports/verification.json` localmente.
- **Qué verifica esa prueba y qué no verifica:** comprueba la estructura requerida, la prueba proporcionada y que el proyecto puede compilarse. La prueba proporcionada comprueba la existencia del script de build y textos básicos de la pantalla inicial. No comprueba la calidad del análisis de requisitos, la experiencia visual completa, la autenticación, el funcionamiento offline, el almacenamiento local ni la sincronización futura.
- **Limitación, dificultad o riesgo que identifiqué:** en mi máquina `npm` está configurado como un alias de Bun y no había `node_modules`; por eso utilicé el ejecutable real `/opt/homebrew/bin/npm` para reproducir los comandos solicitados. Además, `npm ci` reportó dos vulnerabilidades de severidad alta; no ejecuté `npm audit fix` porque podría modificar dependencias fuera del alcance de esta actividad. La verificación técnica no sustituye la revisión académica de los documentos.
- **Uso de IA:** utilicé un asistente de IA conversacional para organizar preguntas, proponer una estructura inicial y revisar la trazabilidad entre escenarios y requisitos. Las partes influenciadas fueron la redacción y organización de `docs/requirements.md` y esta descripción de evidencia. Revisé personalmente el starter, elegí los usuarios, escenarios y alcance, comprobé los archivos y ejecuté los comandos de verificación; no acepté resultados no ejecutados como evidencia.

## Integrante: Jaime Arian Pablo Rosales

- **Mi contribución concreta y enlace:** redacté el ADR-001 completo en [`docs/decision-record.md`](../blob/semana-1-equipo/docs/decision-record.md): comparación de las cuatro alternativas (PWA, web tradicional, app nativa, multiplataforma), la decisión de usar PWA con su justificación, consecuencias/riesgos con mitigaciones, y la validación futura propuesta. La contribución está en el commit [`f7ed161`](https://github.com/FernanRM7/PWA-AFK/commit/f7ed16131db6e044ad7b76bf0548be5b594601f3).
- **Decisión que puedo explicar y por qué:** justifiqué la elección de PWA a partir de las restricciones reales del proyecto (usuarios móviles, conectividad intermitente descrita en el escenario E-02 de `docs/requirements.md`, y el stack Next.js fijado por el curso). Dejé claro que la operación offline no aparece sola por usar React/Next.js, sino que hay que diseñar el almacenamiento local y la sincronización, y señalé en qué casos convendría más una app nativa o multiplataforma.
- **Comando o prueba proporcionada que ejecuté:** `npm run verify` sobre la raíz del proyecto, con mi commit ya aplicado.
- **Resultado real que observé:** `starter.spec.mjs: PASS`; el build de Next.js compiló correctamente ("Compiled successfully", generó las 4 páginas estáticas); el script terminó con `Verificación técnica: pass. Revisión académica: pendiente.` y generó `reports/verification.json`.
- **Qué verifica esa prueba y qué no verifica:** confirma que el proyecto sigue instalando, compilando y pasando la prueba proporcionada después de mi cambio.
- **Limitación, dificultad o riesgo que identifiqué:** mi mayor riesgo no es técnico sino de contenido la comparación de alternativas y la validación futura son un análisis argumentado, no algo que un script pueda verificar si el equipo o el docente ve que falta profundidad en algún tema, habría que ajustar el documento.
- **Uso de IA:** usé un asistente de IA conversacional para estructurar y redactar un primer borrador de cada sección del ADR , a partir del contexto real del proyecto yo decidí qué contexto compartir,la conecté con los escenarios y requisitos que ya había definido el equipo, corregí la redacción del documento final y elegí qué mantener. No acepté nada sin revisarlo ni afirmé validaciones que todavía no se han hecho.

## Integrante: Kevin Rojas Marinez — RNF, datos/límites, criterios de aceptación y ejecución local

- **Mi contribución concreta y enlace:** redacción completa de secciones 4 (RNF medibles: reproducibilidad, accesibilidad, seguridad, privacidad, rendimiento, operación offline futura), 5 (Datos sintéticos y límites: 8 campos ficticios en tabla + exclusiones estrictas) y 6 (Criterios de aceptación Semana 1: 7 criterios trazables a comandos con resultados reales) en `docs/requirements.md`. Commit: [`7b7331f`](https://github.com/FernanRM7/PWA-AFK/commit/7b7331f). Ejecución y documentación de comandos de verificación técnica en Windows.
- **Decisión que puedo explicar y por qué:** separar mediciones actuales (Semana 1) de metas futuras (Semanas 2–4) en cada RNF; declarar honestamente el fallo de build por EBUSY en Windows como incidencia de entorno, no de código; documentar explícitamente que `verify` no califica análisis documental ni prueba funcionalidades PWA futuras.
- **Comando o prueba proporcionada que ejecuté:** `npm ci`, `npm test`, `npm run build`, `npm run verify`, `node scripts/verify.mjs --structure` (equivalente a `bash public-tests/check.sh`).
- **Resultado real que observé:**
  - `npm ci`: PASS (28 paquetes instalados, 2 high vulns transitivas en Next.js 14.2.35)
  - `npm test`: PASS (`starter.spec.mjs: PASS` — valida script build + textos "Inspecciones de laboratorio" y "sintéticos")
  - `npm run build`: FAIL (exit 1) — Error `EBUSY: resource busy or locked` copiando `.next/server/app/_not-found.html` → `.next/server/pages/404.html` (bug conocido Next.js 14 en Windows con antivirus/editores abiertos)
  - `npm run verify`: FAIL (exit 1) — Estructura ✓, Test ✓, Build ✗; genera `reports/verification.json` (schemaVersion 2, commit `7b7331f`, node v24.19.0, workingTreeClean: true)
  - `node scripts/verify.mjs --structure`: PASS ("Estructura presente. No valida contenido, pruebas, build ni secretos.")
- **Qué verifica esa prueba y qué no verifica:**
  - `npm test`: Solo smoke test (existencia de script build + strings en página); NO valida RNF, accesibilidad, offline, PWA, ni lógica de negocio.
  - `npm run build`: Compila TypeScript y genera assets estáticos correctamente; fallo es de filesystem locking (Windows), no de código.
  - `npm run verify`: Check de estructura + test + build + recopilación de docs para revisión académica; NO califica calidad de redacción ni implementa PWA.
- **Limitación, dificultad o riesgo que identifiqué:** Build flaky en Windows por EBUSY; riesgo de falso negativo en CI si no se limpia entorno. Mitigación: documentar workaround (cerrar VS Code/antivirus, reintentar) y no bloquear entrega por este fallo conocido. Datos sintéticos limitados a 3 registros inmutables; escalabilidad no probada. `reports/verification.json` está en `.gitignore` y no debe subirse.
- **Uso de IA:** usé un asistente de IA conversacional para estructurar y redactar las secciones 4, 5 y 6 de `docs/requirements.md`, conectándolas con el starter real y los comandos ejecutados. Revisé personalmente cada comando, verifiqué las salidas y ajusté los umbrales a lo medido; no acepté nada sin validarlo.

> No necesitan inventar un error ni escribir pruebas nuevas. Cada integrante debe reemplazar su sección, documentar resultados reales y explicar los límites de la prueba ejecutada.

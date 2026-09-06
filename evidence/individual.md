# Evidencia individual del equipo

> Un solo archivo compartido. Cada integrante conservará su propia sección y añadirá evidencia verificable de su contribución. El SHA final se entrega en Classroom después del último commit.

- Grupo y equipo: por completar
- Repositorio del equipo: https://github.com/FernanRM7/PWA-AFK

## Integrante: Fernando Spencer Rodriguez Mendoza

- **Mi contribución concreta y enlace:** redacté el problema, los usuarios, los escenarios y los requisitos funcionales en [`docs/requirements.md`](../blob/semana-1-equipo/docs/requirements.md). La contribución está en el commit [`2adeb1e`](https://github.com/FernanRM7/PWA-AFK/commit/2adeb1e) y se integra mediante el [PR #7](https://github.com/FernanRM7/PWA-AFK/pull/7).
- **Decisión que puedo explicar y por qué:** definí que el problema central es el seguimiento de hallazgos de mantenimiento. Propuse como usuarios al docente o encargado de laboratorio y a la persona inspectora. También distinguí el listado sintético actual de las funciones futuras de consulta, registro, almacenamiento local y sincronización, para no afirmar que el starter ya implementa capacidades PWA.
- **Comando o prueba proporcionada que ejecuté:** `/opt/homebrew/bin/npm ci`, `/opt/homebrew/bin/npm test` y `/opt/homebrew/bin/npm run verify`.
- **Resultado real que observé:** la instalación terminó correctamente; `npm test` mostró `starter.spec.mjs: PASS`; `npm run verify` terminó con `Verificación técnica: pass`, ejecutó la prueba y el build de Next.js terminó correctamente. Se generó `reports/verification.json` localmente.
- **Qué verifica esa prueba y qué no verifica:** comprueba la estructura requerida, la prueba proporcionada y que el proyecto puede compilarse. La prueba proporcionada comprueba la existencia del script de build y textos básicos de la pantalla inicial. No comprueba la calidad del análisis de requisitos, la experiencia visual completa, la autenticación, el funcionamiento offline, el almacenamiento local ni la sincronización futura.
- **Limitación, dificultad o riesgo que identifiqué:** en mi máquina `npm` está configurado como un alias de Bun y no había `node_modules`; por eso utilicé el ejecutable real `/opt/homebrew/bin/npm` para reproducir los comandos solicitados. Además, `npm ci` reportó dos vulnerabilidades de severidad alta; no ejecuté `npm audit fix` porque podría modificar dependencias fuera del alcance de esta actividad. La verificación técnica no sustituye la revisión académica de los documentos.
- **Uso de IA:** utilicé un asistente de IA conversacional para organizar preguntas, proponer una estructura inicial y revisar la trazabilidad entre escenarios y requisitos. Las partes influenciadas fueron la redacción y organización de `docs/requirements.md` y esta descripción de evidencia. Revisé personalmente el starter, elegí los usuarios, escenarios y alcance, comprobé los archivos y ejecuté los comandos de verificación; no acepté resultados no ejecutados como evidencia.

## Integrante: por completar

- Mi contribución concreta y enlace a archivo, commit anterior o revisión:
- Decisión que puedo explicar y por qué:
- Comando o prueba proporcionada que ejecuté:
- Resultado real que observé:
- Qué verifica esa prueba y qué no verifica:
- Limitación, dificultad o riesgo que identifiqué:
- Uso de IA: herramienta, propósito, partes influenciadas y validación propia:

## Integrante: por completar

- Mi contribución concreta y enlace a archivo, commit anterior o revisión:
- Decisión que puedo explicar y por qué:
- Comando o prueba proporcionada que ejecuté:
- Resultado real que observé:
- Qué verifica esa prueba y qué no verifica:
- Limitación, dificultad o riesgo que identifiqué:
- Uso de IA: herramienta, propósito, partes influenciadas y validación propia:

> No necesitan inventar un error ni escribir pruebas nuevas. Cada integrante debe reemplazar su sección, documentar resultados reales y explicar los límites de la prueba ejecutada.

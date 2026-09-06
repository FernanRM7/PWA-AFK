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

## Integrante: Jaime Arian Pablo Rosales

- **Mi contribución concreta y enlace:** redacté el ADR-001 completo en [`docs/decision-record.md`](../blob/semana-1-equipo/docs/decision-record.md): comparación de las cuatro alternativas (PWA, web tradicional, app nativa, multiplataforma), la decisión de usar PWA con su justificación, consecuencias/riesgos con mitigaciones, y la validación futura propuesta. La contribución está en el commit [`f7ed161`](https://github.com/FernanRM7/PWA-AFK/commit/f7ed16131db6e044ad7b76bf0548be5b594601f3).
- **Decisión que puedo explicar y por qué:** justifiqué la elección de PWA a partir de las restricciones reales del proyecto (usuarios móviles, conectividad intermitente descrita en el escenario E-02 de `docs/requirements.md`, y el stack Next.js fijado por el curso). Dejé claro que la operación offline no aparece sola por usar React/Next.js, sino que hay que diseñar el almacenamiento local y la sincronización, y señalé en qué casos convendría más una app nativa o multiplataforma.
- **Comando o prueba proporcionada que ejecuté:** `npm run verify` sobre la raíz del proyecto, con mi commit ya aplicado.
- **Resultado real que observé:** `starter.spec.mjs: PASS`; el build de Next.js compiló correctamente ("Compiled successfully", generó las 4 páginas estáticas); el script terminó con `Verificación técnica: pass. Revisión académica: pendiente.` y generó `reports/verification.json`.
- **Qué verifica esa prueba y qué no verifica:** confirma que el proyecto sigue instalando, compilando y pasando la prueba proporcionada después de mi cambio.
- **Limitación, dificultad o riesgo que identifiqué:** mi mayor riesgo no es técnico sino de contenido la comparación de alternativas y la validación futura son un análisis argumentado, no algo que un script pueda verificar si el equipo o el docente ve que falta profundidad en algún tema, habría que ajustar el documento.
- **Uso de IA:** usé un asistente de IA conversacional para estructurar y redactar un primer borrador de cada sección del ADR , a partir del contexto real del proyecto yo decidí qué contexto compartir,la conecté con los escenarios y requisitos que ya había definido el equipo, corregí la redacción del documento final y elegí qué mantener. No acepté nada sin revisarlo ni afirmé validaciones que todavía no se han hecho.

## Integrante: por completar

- Mi contribución concreta y enlace a archivo, commit anterior o revisión:
- Decisión que puedo explicar y por qué:
- Comando o prueba proporcionada que ejecuté:
- Resultado real que observé:
- Qué verifica esa prueba y qué no verifica:
- Limitación, dificultad o riesgo que identifiqué:
- Uso de IA: herramienta, propósito, partes influenciadas y validación propia:

> No necesitan inventar un error ni escribir pruebas nuevas. Cada integrante debe reemplazar su sección, documentar resultados reales y explicar los límites de la prueba ejecutada.

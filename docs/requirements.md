# Requisitos del producto — documento del equipo

> Sustituyan las orientaciones por su análisis. Los ejemplos muestran el formato; pueden usar otros equivalentes. Los requisitos del producto futuro se documentan ahora y se implementarán en las semanas correspondientes. No hay una cantidad nueva obligatoria de requisitos.

## 1. Problema y contexto

El seguimiento de hallazgos de mantenimiento en laboratorios puede perder continuidad cuando la información se registra en medios separados o no está disponible en el momento de revisar un espacio. Esto dificulta saber qué observaciones siguen pendientes, cuáles requieren atención y qué inspección las originó. La conectividad intermitente es relevante porque una persona puede realizar una inspección dentro de un laboratorio sin conexión estable; si el registro depende exclusivamente de la red, la captura puede retrasarse o perderse.

El producto futuro será una aplicación para consultar inspecciones, registrar nuevos hallazgos y dar seguimiento a su estado. En esta actividad el alcance se limita a conservar y verificar el starter de Next.js, cuya pantalla muestra tres inspecciones sintéticas. No se implementan todavía el registro, filtros, almacenamiento local, sincronización, instalación PWA, autenticación, notificaciones ni integración con sistemas institucionales. El caso no pretende describir un diagnóstico real de la UTT; se utilizarán únicamente datos ficticios.

## 2. Usuarios y escenarios

### Usuarios

- **Usuario principal: docente o encargado de laboratorio.** Consulta inspecciones recientes, identifica hallazgos pendientes y revisa su estado para coordinar acciones de mantenimiento.
- **Usuario secundario: persona encargada de realizar inspecciones.** Captura los datos de una revisión y reporta hallazgos desde el laboratorio, incluso cuando la conexión es intermitente.

### Escenario E-01 — Consulta con conectividad disponible

- **Situación inicial:** el encargado de laboratorio necesita revisar las inspecciones recientes de distintos laboratorios y localizar cuáles tienen hallazgos que requieren atención.
- **Acción:** abre la aplicación, consulta el listado y filtra o identifica los registros por laboratorio, fecha o estado.
- **Resultado esperado:** observa la información correspondiente y puede distinguir las inspecciones sin incidencias de aquellas con hallazgos pendientes.
- **Alcance:** la visualización de los tres registros sintéticos pertenece a Semana 1; los filtros y la consulta de datos registrados son requisitos futuros.

### Escenario E-02 — Registro con conectividad intermitente

- **Situación inicial:** la persona inspectora encuentra un hallazgo durante una revisión y la conexión de red se interrumpe.
- **Acción:** captura laboratorio, fecha, estado y hallazgos; la aplicación conserva el registro localmente y lo prepara para sincronizarlo cuando vuelva la conexión.
- **Resultado esperado:** el registro no se pierde, queda identificado como pendiente de sincronización y posteriormente se envía al sistema central sin duplicarse.
- **Alcance:** es un escenario y requisito futuro; esta semana no se implementan almacenamiento local ni sincronización.

## 3. Requisitos funcionales

Los requisitos siguientes se vinculan con los escenarios anteriores y distinguen el starter actual de las capacidades futuras. Una condición de aceptación describe un resultado observable, no una intención general.

| ID | Escenario relacionado | Acción del producto | Condición observable de aceptación | Ahora o futuro |
|---|---|---|---|---|
| RF-01 | E-01 | Mostrar el listado de inspecciones sintéticas proporcionadas por el starter | Al abrir la página se observan tres inspecciones con laboratorio, fecha, responsable, estado y hallazgos | Semana 1 |
| RF-02 | E-01 | Consultar inspecciones por laboratorio, fecha o estado | Al seleccionar un criterio válido, el listado muestra únicamente los registros que cumplen ese criterio y conserva sus datos | Futuro |
| RF-03 | E-01 | Identificar inspecciones con hallazgos pendientes | Cada inspección con hallazgos o estado de atención se distingue visualmente de una inspección sin incidencias | Futuro |
| RF-04 | E-02 | Registrar una inspección | Al guardar datos válidos de laboratorio, fecha, estado y hallazgos, aparece un registro con esos mismos valores | Futuro |
| RF-05 | E-02 | Conservar un registro cuando la conexión es intermitente | Si la conexión se pierde durante el registro, la información permanece disponible en el dispositivo y se marca como pendiente de sincronización | Futuro |
| RF-06 | E-02 | Sincronizar registros pendientes al recuperar la conexión | Cuando vuelve la conexión, el registro local se envía una sola vez y cambia a estado sincronizado sin crear duplicados | Futuro |
| RF-07 | E-01, E-02 | Actualizar el estado de un hallazgo | Al cambiar el estado a una opción válida, el registro muestra el nuevo estado y este permanece al volver a consultarlo | Futuro |

Los requisitos RF-02 a RF-07 describen el producto futuro y no deben presentarse como funcionalidades implementadas en Semana 1.

## 4. Requisitos no funcionales

Describan reproducibilidad, accesibilidad, seguridad, privacidad, rendimiento y operación offline futura. Para cada uno indiquen condición, método de comprobación y momento de validación. Declaren los supuestos de cualquier umbral propuesto.

Ejemplo: «En una copia limpia, con las versiones declaradas de Node y npm, `npm ci` y `npm run verify` terminan con código 0» (reproducibilidad actual).

Ejemplo de meta futura: «Con 100 registros sintéticos en el dispositivo de prueba declarado, el listado aparece en menos de 2 segundos; se medirá en cinco ejecuciones bajo la conexión definida». Esa cifra es ilustrativa, no un umbral impuesto ni un resultado ya medido.

## 5. Datos sintéticos y límites

Indiquen qué campos ficticios usa la aplicación y qué información real excluyen. No incluyan datos reales de estudiantes ni credenciales. La identificación académica de los integrantes se registra solo en la evidencia del repositorio privado y Classroom.

## 6. Criterios de aceptación de la Semana 1

Relacionen cada entrega actual con una inspección o comando. Distingan la comprobación técnica del juicio sobre contenido.

Ejemplos: prueba del starter → `npm test`; build → `npm run build`; requisitos verificables → revisión del documento; comparación de alternativas → revisión de `docs/decision-record.md`. No afirmen que `npm run verify` valida la calidad del análisis.

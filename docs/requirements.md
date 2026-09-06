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

### 4.1 Reproducibilidad
**Actual (medido):** En una copia limpia del repositorio, con Node.js v24.19.0 y npm 11.17.0 declarados, `npm ci` instala dependencias sin errores y `npm test` termina con código 0. El build falla en Windows por bloqueo de archivo (EBUSY) al copiar `.next/server/app/_not-found.html` a `.next/server/pages/404.html`; `npm run verify` reporta estado `fail` por ese motivo.  
**Condición:** `npm ci` exit code 0; `npm test` exit code 0; `npm run build` exit code 0 en entorno sin bloqueos.  
**Método:** Ejecución limpia en máquina distinta o contenedor; comparar `package-lock.json`.  
**Momento:** Cada commit antes de entrega; CI en GitHub Actions.  
**Supuestos:** Node.js ≥ 20.19, npm ≥ 10; sistema de archivos sin bloqueos concurrentes (antivirus, editores).  
**Meta futura:** `npm run verify` pase consistentemente en Windows, Linux y macOS sin intervención manual.

### 4.2 Accesibilidad
**Actual (medido):** No hay auditoría automatizada ni manual documentada. El starter usa HTML semántico (`main`, `header`, `section`, `article`, `dl`, `dt`, `dd`), etiquetas `aria-labelledby` en la sección de inspecciones, y contraste visual básico en `globals.css`.  
**Condición:** Cumplir WCAG 2.1 AA en rutas críticas (listado, detalle, formulario futuro).  
**Método:** axe-core en CI + revisión manual con lector de pantalla (NVDA/VoiceOver).  
**Momento:** Semana 2 (primer formulario) y cada release.  
**Supuestos:** Navegadores evergreen; zoom 200% sin pérdida de función.  
**Meta futura:** Score axe ≥ 95/100 en página principal; foco visible y orden lógico de tabulación.

### 4.3 Seguridad
**Actual (medido):** Sin dependencias con vulnerabilidades críticas conocidas tras `npm audit` (2 high en dependencias transitivas de Next.js 14.2.35, sin explotación conocida en este contexto estático). No hay autenticación, APIs externas, ni manejo de secretos.  
**Condición:** `npm audit` sin critical/high en dependencias directas; CSP restrictiva en producción; headers de seguridad (HSTS, X-Frame-Options, Referrer-Policy).  
**Método:** `npm audit` en CI; revisión de headers con `securityheaders.com` o equivalente.  
**Momento:** Cada `npm ci` en CI; antes de deploy a preview.  
**Supuestos:** Aplicación estática servida sobre HTTPS; sin backend propio en Semana 1.  
**Meta futura:** CSP `default-src 'self'; script-src 'self' 'unsafe-inline'` (Next.js inline scripts); rotación de dependencias cada 30 días.

### 4.4 Privacidad
**Actual (medido):** La aplicación solo muestra datos sintéticos embebidos en `src/lib/data/inspections.ts` (laboratorio, fecha, responsable, estado, hallazgos, resumen). No recopila, transmite ni almacena datos personales. No hay cookies, localStorage, analytics, ni peticiones de red.  
**Condición:** Cero datos personales reales en código, build, logs, ni red. Sin identificadores persistentes.  
**Método:** Revisión de código (`grep` por patrones PII), inspección de Network tab en DevTools, verificación de `verification.json` sin secretos.  
**Momento:** Cada PR; auditoría antes de entrega final.  
**Supuestos:** Entorno académico controlado; identificación de integrantes solo en `evidence/individual.md` (repo privado + Classroom).  
**Meta futura:** Mantener cero telemetría; si se añade sincronización, pseudonimizar y cifrar en tránsito/reposo.

### 4.5 Rendimiento
**Actual (medido):** Build genera 87.4 kB First Load JS compartido; página principal 138 B HTML. Sin medición de Core Web Vitals.  
**Condición actual:** First Load JS < 100 kB gzipped; LCP < 2.5 s en 3G rápido emulado; CLS < 0.1.  
**Método:** Lighthouse CI (modo headless) en PR; Web Vitals en producción real.  
**Momento:** Semana 2 (añadir SW + caché) y cada release.  
**Supuestos:** Dispositivo de referencia: móvil medio (Snapdragon 765G / 4 GB RAM); red 3G rápido (1.6 Mbps / 150 ms RTT).  
**Meta futura:** LCP < 1.8 s offline-first (desde caché); TTI < 2.5 s; budget JS < 80 kB.

### 4.6 Operación offline futura
**Actual (medido):** No implementado. El starter es estático y no registra Service Worker, no tiene `manifest.json`, no usa Cache API ni IndexedDB.  
**Condición (meta):** Al cargar la página con conexión, los recursos críticos (HTML, CSS, JS, datos sintéticos) quedan en caché; al recargar sin red, la página muestra las tres inspecciones y permite crear un hallazgo que se guarda localmente y sincroniza al reconectar.  
**Método:** Prueba manual: DevTools → Application → Service Workers → Offline → recargar; crear hallazgo → reconectar → verificar sincronización. Automatizar con Playwright en modo offline.  
**Momento:** Semana 2 (SW + manifest), Semana 3 (IndexedDB + cola), Semana 4 (sync + conflictos).  
**Supuestos:** Navegador con Service Worker + Cache API + IndexedDB (Chrome 80+, Firefox 75+, Safari 15.4+); datos sintéticos ≤ 50 KB; conflictos resueltos por "última escritura gana" con timestamp.  
**Meta futura:** 100% funcionalidad de lectura offline; escrituras en cola ≤ 50 ítems; sincronización < 3 s tras reconexión en 4G.

---

## 5. Datos sintéticos y límites

### 5.1 Campos ficticios utilizados
La aplicación consume exclusivamente el array `inspections` definido en `src/lib/data/inspections.ts` (3 objetos). Cada registro contiene:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | string | Identificador único sintético | `"inspection-001"` |
| `location` | string | Nombre de laboratorio ficticio | `"Laboratorio de Redes"` |
| `date` | string (YYYY-MM-DD) | Fecha de inspección simulada | `"2026-08-28"` |
| `inspector` | string | Nombre de rol/técnico ficticio | `"Técnica A"` |
| `status` | `"ok" \| "attention"` | Estado normalizado para UI | `"ok"` |
| `statusLabel` | string | Etiqueta legible para badge | `"Sin incidencias"` |
| `findings` | number | Conteo entero de hallazgos simulados | `0` |
| `summary` | string | Descripción libre sintética | `"Revisión visual de cableado..."` |

### 5.2 Información excluida explícitamente
- **Datos reales de estudiantes:** No hay matrículas, nombres reales, correos, fotos, ni calificaciones.
- **Información sensible:** No hay historiales médicos, ubicaciones GPS precisas, firmas, ni evidencias fotográficas.
- **Credenciales y secretos:** No hay tokens, API keys, passwords, connection strings, ni variables de entorno (`.env` no existe ni se usa).
- **Identificación académica:** Nombres de integrantes, números de control, grupo, y repositorio del equipo solo aparecen en `evidence/individual.md` (repositorio privado) y en la entrega de Classroom. No están en el código ni en la build.

### 5.3 Límites de los datos sintéticos
- Volumen fijo: 3 registros inmutables en el starter.
- No hay generación aleatoria, ni persistencia, ni edición en Semana 1.
- Cualquier ampliación futura (semanas 2–4) mantendrá la misma política: solo datos sintéticos o pseudonimizados; cero PII real.

---

## 6. Criterios de aceptación de la Semana 1

| Entregable | Comprobación técnica (comando/inspección) | Resultado observado (2026-09-06) | Juicio sobre contenido (revisión manual) |
|------------|-------------------------------------------|----------------------------------|------------------------------------------|
| Instalación limpia | `npm ci` | **PASS** — 28 paquetes instalados, 2 high vulns en deps transitivas (Next.js) | Verificar `package-lock.json` commitado y sin `node_modules` en Git |
| Prueba proporcionada | `npm test` | **PASS** — `starter.spec.mjs: PASS` (valida script build + texto en página) | La prueba solo cubre smoke test; no valida RNF ni funcionalidad PWA |
| Build de producción | `npm run build` | **FAIL** — Error `EBUSY` en Windows al copiar `_not-found.html` → `404.html` (bug conocido Next.js 14 en Windows con antivirus/editores abiertos) | Build compila TypeScript y genera assets; fallo es de entorno, no de código |
| Verificación conjunta | `npm run verify` | **FAIL** — Estructura ✓, Test ✓, Build ✗ (exit code 1) | `verify` no califica análisis documental; solo checks técnicos + recopila docs |
| Pantalla funcional | Abrir `http://localhost:3000` tras `npm run dev` | **PASS** — Se muestran 3 tarjetas con laboratorio, fecha, responsable, badge de estado, hallazgos y resumen | Inspección visual: semántica, contraste, responsive básico |
| Calidad documental | Revisión manual de `docs/requirements.md` | **PENDIENTE** — Se completa esta sección (4–6) | Rúbrica: completitud RNF, datos sintéticos explícitos, criterios trazables a comandos |
| Check de estructura opcional | `node scripts/verify.mjs --structure` (equivalente a `bash public-tests/check.sh`) | **PASS** — "Estructura presente. No valida contenido, pruebas, build ni secretos." | Solo verifica existencia de archivos requeridos |

### 6.1 Verificación ejecutada y documentada
- **`npm test`** → exit code 0 ✓
- **`npm run build`** → exit code 1 ✗ (EBUSY en `.next/server/app/_not-found.html` → `.next/server/pages/404.html`; mitigación: cerrar editores/antivirus o reintentar)
- **`npm run verify`** → exit code 1 ✗ (falla por build); genera `reports/verification.json` (schemaVersion 2, commit `2344d03`, workingTreeClean: true, node v24.19.0)
- **`node scripts/verify.mjs --structure`** → exit code 0 ✓

> **Nota:** `reports/verification.json` **no debe subirse a Git** (está en `.gitignore`). Se adjunta en Classroom o se descarga del artefacto `starter-week-01-evidence` de GitHub Actions del SHA entregado.

### 6.2 Declaraciones de no alcance
- `npm run verify` **no valida** la calidad del análisis documental ni la profundidad de los RNF.
- La prueba proporcionada (`starter.spec.mjs`) **no cubre** funcionalidades PWA futuras (offline, instalación, sincronización, push).
- El fallo de build en Windows es una incidencia de entorno documentada honestamente; el código compila y type-check pasa.

# PWA de inspecciones de laboratorio — proyecto del equipo

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

## Trabajo y entrega en equipo

Inviten a los integrantes y al docente al mismo repositorio privado. Cada persona registra su evidencia en una sección de `evidence/individual.md`. Todos entregan en Classroom el mismo SHA final y enlaces, identificando su sección. El formato exacto está en `ACTIVIDAD-01.md`; no se requiere un pull request adicional ni una copia por alumno.

## Estructura y límites

- `src/app/`: pantalla Next.js.
- `src/lib/data/`: inspecciones sintéticas.
- `docs/`: requisitos y decisión del equipo.
- `evidence/`: evidencia propia de cada integrante.
- `tests/`: prueba inicial proporcionada; no es una suite completa de comportamiento.

Registren aquí sus supuestos y limitaciones de ejecución. El starter todavía no implementa instalación PWA, offline ni sincronización. No incluyan datos personales reales en el producto, archivos `.env` ni credenciales. La identificación de integrantes se conserva en el repositorio privado y Classroom.

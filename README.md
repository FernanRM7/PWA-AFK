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
- La prueba (`tests/manifest.spec.mjs`, con Vitest) valida estructura, campos y existencia de archivos — no valida que el ícono se vea bien en cada plataforma, ni el comportamiento real de instalación en un dispositivo.

**Verificación agregada:** `npm test` ahora corre `tests/starter.spec.mjs` y `tests/manifest.spec.mjs` (Vitest) en secuencia, sin tocar el archivo original. `npm run verify` sigue funcionando igual y ya incluye ambas pruebas.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const shell = await readFile(resolve(root, "src/components/app-shell.tsx"), "utf8");
const page = await readFile(resolve(root, "src/app/page.tsx"), "utf8");
const sidebar = await readFile(resolve(root, "src/components/dashboard-01/dashboard-sidebar.tsx"), "utf8");

for (const landmark of ["<header", "<nav", "<main", "<footer"]) {
  assert.match(shell, new RegExp(landmark), `falta el landmark ${landmark}`);
}
for (const state of ["loading", "error", "empty", "success"]) {
  assert.match(shell, new RegExp(`state === [\\\"']${state}[\\\"']`), `falta el estado ${state}`);
}
assert.match(shell, /DotmSquare3/);
assert.match(page, /<AppShell>/);
assert.match(page, /inspections/);
assert.match(sidebar, /Resumen/);
assert.match(sidebar, /Reportes/);
assert.doesNotMatch(sidebar, /Customers|Transactions|Payouts/);

// regresión 
assert.match(
  sidebar,
  /\{\s*label:\s*['"]Inspecciones['"],\s*href:\s*['"]\/inspecciones['"]/,
  'el enlace "Inspecciones" debe existir en la navegación y apuntar a /inspecciones',
);
assert.match(
  sidebar,
  /activeLabel\?:\s*'Resumen'\s*\|\s*'Reportes'\s*\|\s*'Inspecciones'/,
  'activeLabel debe aceptar "Inspecciones" como estado activo',
);
assert.match(sidebar, /aria-label=\{item\.label\}/, 'el enlace debe conservar su etiqueta accesible');
assert.match(sidebar, /href=\{item\.href\}/, 'el enlace debe usar el destino definido en la navegación');
assert.match(
  sidebar,
  /aria-current=\{item\.label === activeLabel \? "page" : undefined\}/,
  'el enlace activo debe marcarse con aria-current="page"',
);

console.log("shell.spec.mjs: PASS");

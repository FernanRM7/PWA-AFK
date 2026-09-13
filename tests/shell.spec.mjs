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

console.log("shell.spec.mjs: PASS");

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const shell = await readFile(resolve(root, "src/components/app-shell.tsx"), "utf8");
const page = await readFile(resolve(root, "src/app/page.tsx"), "utf8");
const styles = await readFile(resolve(root, "src/components/dotmatrix-loader.css"), "utf8");

assert.equal((shell.match(/<main\b/g) ?? []).length, 1, "debe existir un solo main");
assert.equal((shell.match(/<nav\b/g) ?? []).length, 1, "debe existir una navegación del shell");
assert.match(shell, /aria-label="Navegación principal"/);
assert.match(shell, /href="#overview"/);
assert.match(shell, /href="\/reportes"/);
for (const state of ["loading", "error", "empty", "success"]) {
  assert.match(shell, new RegExp(`state === [\\\"']${state}[\\\"']`), `falta el estado ${state}`);
}
assert.match(page, /<AppShell>/);
assert.match(page, /useEffect/);
assert.match(styles, /prefers-reduced-motion/);

console.log("shell-acceptance.spec.mjs: PASS");

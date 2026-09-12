import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifestPath = resolve(root, "public/manifest.webmanifest");
const layoutPath = resolve(root, "src/app/layout.tsx");

describe("manifest.webmanifest", () => {
  it("existe y es JSON válido", () => {
    expect(existsSync(manifestPath)).toBe(true);
    expect(() => JSON.parse(readFileSync(manifestPath, "utf8"))).not.toThrow();
  });

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  it("tiene los campos requeridos", () => {
    const requiredFields = [
      "name", "short_name", "description", "start_url",
      "scope", "display", "lang", "background_color", "theme_color",
    ];
    for (const field of requiredFields) {
      expect(manifest[field], `falta el campo "${field}"`).toBeTruthy();
    }
  });

  it("mantiene start_url dentro de scope", () => {
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);
  });

  it("declara iconos 192x192 y 512x512 que existen", () => {
    expect(Array.isArray(manifest.icons)).toBe(true);
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    for (const icon of manifest.icons) {
      const iconPath = resolve(root, "public", icon.src.replace(/^\//, ""));
      expect(existsSync(iconPath), `no existe el archivo ${icon.src}`).toBe(true);
    }
  });
});

describe("layout.tsx", () => {
  const layout = readFileSync(layoutPath, "utf8");

  it("conserva idioma, favicon y manifest", () => {
    expect(layout).toMatch(/lang="es-MX"/);
    expect(layout).toMatch(/icon:\s*["']\/icon\.svg["']/);
    expect(layout).toMatch(/manifest:\s*["']\/manifest\.webmanifest["']/);
  });
});
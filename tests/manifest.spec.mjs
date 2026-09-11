import { describe, it, expect } from "vitest";
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
            "scope", "display", "lang", "background_color", "theme_color"
        ];
        for (const field of requiredFields) {
            expect(manifest[field], `falta el campo "${field}"`).toBeTruthy();
        }
    });

    it("scope y start_url son coherentes (start_url dentro de scope)", () => {
        expect(manifest.start_url.startsWith(manifest.scope)).toBe(true);
    });

    it("declara al menos los iconos 192x192 y 512x512", () => {
        expect(Array.isArray(manifest.icons)).toBe(true);
        const sizes = manifest.icons.map(icon => icon.sizes);
        expect(sizes).toContain("192x192");
        expect(sizes).toContain("512x512");
    });

    it("cada icono declarado existe físicamente en public/", () => {
        for (const icon of manifest.icons) {
            const iconPath = resolve(root, "public", icon.src.replace(/^\//, ""));
            expect(existsSync(iconPath), `no existe el archivo ${icon.src}`).toBe(true);
        }
    });
});

describe("layout.tsx", () => {
    const layout = readFileSync(layoutPath, "utf8");

    it("mantiene lang=\"es-MX\"", () => {
        expect(layout).toMatch(/lang="es-MX"/);
    });

    it("referencia /icon.svg como favicon", () => {
        expect(layout).toMatch(/icon:\s*["']\/icon\.svg["']/);
    });

    it("referencia el manifest", () => {
        expect(layout).toMatch(/manifest:\s*["']\/manifest\.webmanifest["']/);
    });
});
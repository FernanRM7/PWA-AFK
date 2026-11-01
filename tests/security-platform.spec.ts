import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("controles de seguridad de plataforma", () => {
  it("define CSP restrictiva con solo las excepciones necesarias del frontend", () => {
    const config = readFileSync(`${root}/src/middleware.ts`, "utf8");

    expect(config).toContain("default-src 'self'");
    expect(config).toContain("object-src 'none'");
    expect(config).toContain("frame-ancestors 'none'");
    expect(config).toContain("script-src 'self' 'nonce-${nonce}' 'strict-dynamic'");
    expect(config).toContain("btoa(crypto.randomUUID())");
    expect(config).toContain("style-src 'self' 'unsafe-inline'");
    expect(config).toContain("img-src 'self' data: https://i.pravatar.cc");
    expect(config).toContain("connect-src 'self'");
    expect(config).not.toMatch(/(?:default|script|style|img|connect)-src[^\n]*\*/);
  });

  it("publica headers defensivos y restricciones explícitas de capacidades", () => {
    const config = readFileSync(`${root}/src/middleware.ts`, "utf8");

    expect(config).toContain("X-Content-Type-Options");
    expect(config).toContain("nosniff");
    expect(config).toContain("Referrer-Policy");
    expect(config).toContain("strict-origin-when-cross-origin");
    expect(config).toContain("X-Frame-Options");
    expect(config).toContain("DENY");
    expect(config).toContain("camera=(self), geolocation=(self), notifications=(self)");
  });

  it("habilita render dinámico para que Next aplique el nonce a los scripts HTML", () => {
    const layout = readFileSync(`${root}/src/app/layout.tsx`, "utf8");

    expect(layout).toContain('export const dynamic = "force-dynamic"');
  });

  it("declara una política de rastreo sin presentarla como control de acceso", () => {
    const robots = readFileSync(`${root}/public/robots.txt`, "utf8");

    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain("does not restrict access");
  });
});

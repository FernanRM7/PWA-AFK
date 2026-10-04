import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { validarBorradorInspeccion } from "../src/lib/storage/schema";
import { guardarInspeccion, obtenerTodasLasInspecciones } from "../src/lib/storage/inspection-store";

const borradorValido = {
    location: "Laboratorio de Química",
    date: "2026-10-01",
    inspector: "Técnico D",
    status: "ok" as const,
    findings: 0,
    summary: "Revisión sintética de prueba.",
};

beforeEach(() => {
    return new Promise<void>((resolve) => {
        const solicitud = indexedDB.deleteDatabase("afk-inspections-db");
        solicitud.onsuccess = () => resolve();
        solicitud.onerror = () => resolve();
        solicitud.onblocked = () => resolve();
    });
});

describe("validarBorradorInspeccion", () => {
    it("acepta un borrador con todos los campos válidos", () => {
        const resultado = validarBorradorInspeccion(borradorValido);
        expect(resultado.valido).toBe(true);
    });

    it("rechaza un borrador sin laboratorio", () => {
        const resultado = validarBorradorInspeccion({ ...borradorValido, location: "" });
        expect(resultado.valido).toBe(false);
        if (!resultado.valido) {
            expect(resultado.errores).toContain("El laboratorio es obligatorio.");
        }
    });

    it("rechaza una fecha con formato incorrecto", () => {
        const resultado = validarBorradorInspeccion({ ...borradorValido, date: "01/10/2026" });
        expect(resultado.valido).toBe(false);
        if (!resultado.valido) {
            expect(resultado.errores).toContain("La fecha debe tener el formato AAAA-MM-DD.");
        }
    });

    it("rechaza un estado que no sea ok o attention", () => {
        const resultado = validarBorradorInspeccion({ ...borradorValido, status: "urgente" });
        expect(resultado.valido).toBe(false);
    });

    it("rechaza hallazgos negativos o no enteros", () => {
        const negativo = validarBorradorInspeccion({ ...borradorValido, findings: -1 });
        const decimal = validarBorradorInspeccion({ ...borradorValido, findings: 1.5 });
        expect(negativo.valido).toBe(false);
        expect(decimal.valido).toBe(false);
    });

    it("rechaza datos que no son un objeto", () => {
        const resultado = validarBorradorInspeccion("no es un objeto");
        expect(resultado.valido).toBe(false);
    });
});

describe("guardarInspeccion y obtenerTodasLasInspecciones", () => {
    it("guarda una inspección válida y la puede leer de vuelta", async () => {
        const resultado = await guardarInspeccion(borradorValido);
        expect(resultado.ok).toBe(true);

        const todas = await obtenerTodasLasInspecciones();
        expect(todas).toHaveLength(1);
        expect(todas[0].location).toBe("Laboratorio de Química");
        expect(todas[0].id).toBeTruthy();
        expect(todas[0].schemaVersion).toBe(2);
    });

    it("no guarda una inspección inválida y devuelve los errores", async () => {
        const resultado = await guardarInspeccion({ ...borradorValido, location: "" });
        expect(resultado.ok).toBe(false);
        if (!resultado.ok) {
            expect(resultado.errors.length).toBeGreaterThan(0);
        }

        const todas = await obtenerTodasLasInspecciones();
        expect(todas).toHaveLength(0);
    });

    it("conserva varias inspecciones guardadas, de la más reciente a la más antigua", async () => {
        await guardarInspeccion({ ...borradorValido, location: "Laboratorio A" });
        await guardarInspeccion({ ...borradorValido, location: "Laboratorio B" });

        const todas = await obtenerTodasLasInspecciones();
        expect(todas).toHaveLength(2);
        expect(todas[0].location).toBe("Laboratorio B");
        expect(todas[1].location).toBe("Laboratorio A");
    });

    it("recupera los datos guardados como si la aplicación se hubiera reabierto", async () => {
        await guardarInspeccion(borradorValido);

        // Simula reabrir la aplicación: una nueva lectura, sin mantener
        // ninguna referencia en memoria del guardado anterior.
        const despuesDeReabrir = await obtenerTodasLasInspecciones();
        expect(despuesDeReabrir).toHaveLength(1);
        expect(despuesDeReabrir[0].location).toBe(borradorValido.location);
    });
});

import { describe, expect, it } from "vitest";
import { validarBorradorInspeccion } from "../../src/lib/storage/schema";

const borradorValido = {
    location: "Laboratorio sintético",
    date: "2026-10-24",
    inspector: "Técnica sintética A",
    status: "ok" as const,
    findings: 0,
    summary: "Registro sintético de prueba.",
};

describe("captura válida", () => {
    it("acepta un borrador completo y devuelve exactamente los seis campos", () => {
        const resultado = validarBorradorInspeccion(borradorValido);

        expect(resultado).toEqual({ valido: true, valor: borradorValido });
    });

    it("acepta el estado attention y hallazgos mayores a cero", () => {
        const resultado = validarBorradorInspeccion({ ...borradorValido, status: "attention", findings: 3 });

        expect(resultado.valido).toBe(true);
    });

    it("descarta propiedades ajenas no se puede colar un id, un sync ni una foto", () => {
        const resultado = validarBorradorInspeccion({
            ...borradorValido,
            id: "id-inyectado",
            createdAt: "2000-01-01T00:00:00.000Z",
            sync: { idempotencyKey: "clave-falsa", status: "synced", attempts: 0 },
            photo: "blob:sintetico",
        });

        expect(resultado.valido).toBe(true);
        if (resultado.valido) {
            expect(Object.keys(resultado.valor).sort()).toEqual(
                ["date", "findings", "inspector", "location", "status", "summary"],
            );
        }
    });
});

describe("captura inválida", () => {
    it.each([
        ["laboratorio vacío o solo espacios", { location: "   " }, "El laboratorio es obligatorio."],
        ["inspector vacío", { inspector: "" }, "El inspector es obligatorio."],
        ["resumen vacío", { summary: "" }, "El resumen es obligatorio."],
        ["fecha con otro formato", { date: "24/10/2026" }, "La fecha debe tener el formato AAAA-MM-DD."],
        ["estado desconocido", { status: "urgente" }, 'El estado debe ser "ok" o "attention".'],
        ["hallazgos negativos", { findings: -1 }, "Los hallazgos deben ser un número entero igual o mayor a 0."],
        ["hallazgos decimales", { findings: 1.5 }, "Los hallazgos deben ser un número entero igual o mayor a 0."],
        ["hallazgos NaN", { findings: Number.NaN }, "Los hallazgos deben ser un número entero igual o mayor a 0."],
        ["hallazgos como texto", { findings: "2" }, "Los hallazgos deben ser un número entero igual o mayor a 0."],
    ])("rechaza %s con un único error claro", (_nombre, cambio, mensaje) => {
        const resultado = validarBorradorInspeccion({ ...borradorValido, ...cambio });

        expect(resultado.valido).toBe(false);
        if (!resultado.valido) expect(resultado.errores).toEqual([mensaje]);
    });

    it("reporta todos los errores a la vez cuando fallan varios campos", () => {
        const resultado = validarBorradorInspeccion({});

        expect(resultado.valido).toBe(false);
        if (!resultado.valido) expect(resultado.errores).toHaveLength(6);
    });

    it.each([null, undefined, "texto", 42])("rechaza una entrada que no es un objeto (%s)", (entrada) => {
        expect(validarBorradorInspeccion(entrada)).toEqual({
            valido: false,
            errores: ["Los datos de la inspección no son válidos."],
        });
    });
});

describe("límites conocidos de la validación", () => {
    it("LÍMITE: acepta fechas con la forma correcta pero imposibles, como 2026-13-45", () => {
        
        const resultado = validarBorradorInspeccion({ ...borradorValido, date: "2026-13-45" });

        expect(resultado.valido).toBe(true);
    });
});
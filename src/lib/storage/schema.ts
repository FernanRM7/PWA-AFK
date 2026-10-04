export const VERSION_ESQUEMA = 2;
export const NOMBRE_ALMACEN = "inspections";
export const NOMBRE_BASE_DE_DATOS = "afk-inspections-db";

export type EstadoInspeccionGuardada = "ok" | "attention";

export type EstadoSincronizacion = "pending" | "syncing" | "failed" | "synced";

export type EstadoColaSincronizacion = {
    idempotencyKey: string;
    status: EstadoSincronizacion;
    attempts: number;
    lastError?: string;
};

export type InspeccionGuardada = {
    id: string;
    location: string;
    date: string;
    inspector: string;
    status: EstadoInspeccionGuardada;
    findings: number;
    summary: string;
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
    sync: EstadoColaSincronizacion;
};

export type BorradorInspeccion = {
    location: string;
    date: string;
    inspector: string;
    status: EstadoInspeccionGuardada;
    findings: number;
    summary: string;
};

export type ResultadoValidacion =
    | { valido: true; valor: BorradorInspeccion }
    | { valido: false; errores: string[] };

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ESTADOS_VALIDOS: EstadoInspeccionGuardada[] = ["ok", "attention"];

export function validarBorradorInspeccion(entrada: unknown): ResultadoValidacion {
    const errores: string[] = [];

    if (typeof entrada !== "object" || entrada === null) {
        return { valido: false, errores: ["Los datos de la inspección no son válidos."] };
    }

    const borrador = entrada as Partial<BorradorInspeccion>;

    if (typeof borrador.location !== "string" || borrador.location.trim().length === 0) {
        errores.push("El laboratorio es obligatorio.");
    }

    if (typeof borrador.date !== "string" || !PATRON_FECHA.test(borrador.date)) {
        errores.push("La fecha debe tener el formato AAAA-MM-DD.");
    }

    if (typeof borrador.inspector !== "string" || borrador.inspector.trim().length === 0) {
        errores.push("El inspector es obligatorio.");
    }

    if (typeof borrador.status !== "string" || !ESTADOS_VALIDOS.includes(borrador.status as EstadoInspeccionGuardada)) {
        errores.push('El estado debe ser "ok" o "attention".');
    }

    if (typeof borrador.findings !== "number" || !Number.isInteger(borrador.findings) || borrador.findings < 0) {
        errores.push("Los hallazgos deben ser un número entero igual o mayor a 0.");
    }

    if (typeof borrador.summary !== "string" || borrador.summary.trim().length === 0) {
        errores.push("El resumen es obligatorio.");
    }

    if (errores.length > 0) {
        return { valido: false, errores };
    }

    return {
        valido: true,
        valor: {
            location: borrador.location as string,
            date: borrador.date as string,
            inspector: borrador.inspector as string,
            status: borrador.status as EstadoInspeccionGuardada,
            findings: borrador.findings as number,
            summary: borrador.summary as string,
        },
    };
}

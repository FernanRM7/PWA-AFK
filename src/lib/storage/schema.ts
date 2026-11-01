import {
    esEnteroNoNegativoLimitado,
    esFechaIsoCalendarioValida,
    MAX_INSPECTION_FINDINGS,
    MAX_INSPECTION_INSPECTOR_LENGTH,
    MAX_INSPECTION_LOCATION_LENGTH,
    MAX_INSPECTION_SUMMARY_LENGTH,
    normalizarTextoLimitado,
} from "../security/input-validation";

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

const ESTADOS_VALIDOS: EstadoInspeccionGuardada[] = ["ok", "attention"];

export function validarBorradorInspeccion(entrada: unknown): ResultadoValidacion {
    const errores: string[] = [];

    if (typeof entrada !== "object" || entrada === null || Array.isArray(entrada)) {
        return { valido: false, errores: ["Los datos de la inspección no son válidos."] };
    }

    let borrador: Record<string, unknown>;
    try {
        const leerPropiedad = (nombre: keyof BorradorInspeccion) => {
            const descriptor = Object.getOwnPropertyDescriptor(entrada, nombre);
            return descriptor && "value" in descriptor ? descriptor.value : undefined;
        };
        borrador = {
            location: leerPropiedad("location"),
            date: leerPropiedad("date"),
            inspector: leerPropiedad("inspector"),
            status: leerPropiedad("status"),
            findings: leerPropiedad("findings"),
            summary: leerPropiedad("summary"),
        };
    } catch {
        return { valido: false, errores: ["Los datos de la inspección no son válidos."] };
    }

    const location = normalizarTextoLimitado(borrador.location, MAX_INSPECTION_LOCATION_LENGTH);
    const inspector = normalizarTextoLimitado(borrador.inspector, MAX_INSPECTION_INSPECTOR_LENGTH);
    const summary = normalizarTextoLimitado(borrador.summary, MAX_INSPECTION_SUMMARY_LENGTH, true);

    if (location === null) {
        errores.push(
            typeof borrador.location === "string" && borrador.location.trim().length > 0
                ? `El laboratorio no debe exceder ${MAX_INSPECTION_LOCATION_LENGTH} caracteres ni contener controles.`
                : "El laboratorio es obligatorio.",
        );
    }

    if (!esFechaIsoCalendarioValida(borrador.date)) {
        errores.push("La fecha debe tener el formato AAAA-MM-DD.");
    }

    if (inspector === null) {
        errores.push(
            typeof borrador.inspector === "string" && borrador.inspector.trim().length > 0
                ? `El inspector no debe exceder ${MAX_INSPECTION_INSPECTOR_LENGTH} caracteres ni contener controles.`
                : "El inspector es obligatorio.",
        );
    }

    if (typeof borrador.status !== "string" || !ESTADOS_VALIDOS.includes(borrador.status as EstadoInspeccionGuardada)) {
        errores.push('El estado debe ser "ok" o "attention".');
    }

    if (!esEnteroNoNegativoLimitado(borrador.findings, MAX_INSPECTION_FINDINGS)) {
        errores.push(`Los hallazgos deben ser un entero entre 0 y ${MAX_INSPECTION_FINDINGS}.`);
    }

    if (summary === null) {
        errores.push(
            typeof borrador.summary === "string" && borrador.summary.trim().length > 0
                ? `El resumen no debe exceder ${MAX_INSPECTION_SUMMARY_LENGTH} caracteres ni contener controles.`
                : "El resumen es obligatorio.",
        );
    }

    if (errores.length > 0) {
        return { valido: false, errores };
    }
    if (location === null || inspector === null || summary === null) {
        return { valido: false, errores: ["Los datos de la inspección no son válidos."] };
    }

    return {
        valido: true,
        valor: {
            location,
            date: borrador.date as string,
            inspector,
            status: borrador.status as EstadoInspeccionGuardada,
            findings: borrador.findings as number,
            summary,
        },
    };
}

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOMBRE_BASE_DE_DATOS } from "../../src/lib/storage/schema";
import type { InspeccionGuardada } from "../../src/lib/storage/schema";

const borradorValido = {
    location: "Laboratorio sintético",
    date: "2026-10-24",
    inspector: "Técnica sintética A",
    status: "ok" as const,
    findings: 0,
    summary: "Captura sintética para probar reintentos.",
};

function borrarBaseDeDatos() {
    return new Promise<void>((resolve) => {
        const solicitud = indexedDB.deleteDatabase(NOMBRE_BASE_DE_DATOS);
        solicitud.onsuccess = () => resolve();
        solicitud.onerror = () => resolve();
        solicitud.onblocked = () => resolve();
    });
}

async function iniciarAplicacion() {
    vi.resetModules();
    const almacen = await import("../../src/lib/storage/inspection-store");
    const cola = await import("../../src/lib/sync/queue");
    return { ...almacen, ...cola };
}

function crearServidorSimulado() {
    const registros = new Map<string, InspeccionGuardada>();
    const clavesRecibidas: string[] = [];
    return {
        registros,
        clavesRecibidas,
        recibir(inspeccion: InspeccionGuardada, clave: string) {
            clavesRecibidas.push(clave);
            if (!registros.has(clave)) registros.set(clave, structuredClone(inspeccion));
            return { idempotencyKey: clave };
        },
    };
}

beforeEach(borrarBaseDeDatos);

describe("reintentos sin duplicados", () => {
    it("si la respuesta se pierde, el reintento usa la misma clave y el servidor no crea un duplicado", async () => {
        const app = await iniciarAplicacion();
        const guardado = await app.guardarInspeccion(borradorValido);
        if (!guardado.ok) throw new Error("La captura sintética debía guardarse.");
        const clave = `inspection:${guardado.inspection.id}`;

        const servidor = crearServidorSimulado();
        let llamadas = 0;

        const transporte = vi.fn(async (inspeccion: InspeccionGuardada, claveEnviada: string) => {
            llamadas += 1;
            const acuse = servidor.recibir(inspeccion, claveEnviada);
            if (llamadas === 1) throw new Error("synthetic response lost");
            return acuse;
        });
        const espera = vi.fn(async () => undefined);

        const cola = app.createSyncQueue({ transport: transporte, wait: espera });
        const resumen = await cola.syncPending();

        expect(transporte).toHaveBeenCalledTimes(2);
        expect(espera).toHaveBeenCalledTimes(1);
        expect(espera).toHaveBeenCalledWith(1_000);
        expect(servidor.clavesRecibidas).toEqual([clave, clave]);
        expect(servidor.registros.size).toBe(1);
        expect(resumen).toEqual({ pending: 0, syncing: 0, failed: 0, synced: 1 });

        const locales = await app.obtenerTodasLasInspecciones();
        expect(locales).toHaveLength(1);
        expect(locales[0].sync).toMatchObject({ status: "synced", attempts: 2, idempotencyKey: clave });
    });

    it("tras agotar los intentos sin red, el reintento manual conserva la misma clave y deja un solo registro remoto", async () => {
        const app = await iniciarAplicacion();
        const guardado = await app.guardarInspeccion(borradorValido);
        if (!guardado.ok) throw new Error("La captura sintética debía guardarse.");
        const clave = `inspection:${guardado.inspection.id}`;

        const servidor = crearServidorSimulado();
        let hayRed = false;
        const transporte = vi.fn(async (inspeccion: InspeccionGuardada, claveEnviada: string) => {
            if (!hayRed) throw new Error("synthetic offline");
            return servidor.recibir(inspeccion, claveEnviada);
        });
        const cola = app.createSyncQueue({ transport: transporte, wait: async () => undefined });

        const sinRed = await cola.syncPending();
        expect(sinRed).toEqual({ pending: 0, syncing: 0, failed: 1, synced: 0 });
        expect(servidor.registros.size).toBe(0);

        hayRed = true;
        const conRed = await cola.retryFailed();

        expect(conRed).toEqual({ pending: 0, syncing: 0, failed: 0, synced: 1 });
        expect(servidor.registros.size).toBe(1);
        expect(servidor.clavesRecibidas).toEqual([clave]);
        expect((await app.obtenerTodasLasInspecciones())).toHaveLength(1);
    });

    it("sincronizar de nuevo algo ya sincronizado no vuelve a llamar al servidor", async () => {
        const app = await iniciarAplicacion();
        const guardado = await app.guardarInspeccion(borradorValido);
        if (!guardado.ok) throw new Error("La captura sintética debía guardarse.");

        const servidor = crearServidorSimulado();
        const transporte = vi.fn(async (inspeccion: InspeccionGuardada, clave: string) => servidor.recibir(inspeccion, clave));
        const cola = app.createSyncQueue({ transport: transporte, wait: async () => undefined });

        await cola.syncPending();
        await cola.syncPending();

        const recargada = await iniciarAplicacion();
        const colaRecargada = recargada.createSyncQueue({ transport: transporte, wait: async () => undefined });
        await colaRecargada.syncPending();

        expect(transporte).toHaveBeenCalledTimes(1);
        expect(servidor.registros.size).toBe(1);
    });
});

describe("límites conocidos de la idempotencia", () => {
    it("LÍMITE: dos capturas con el mismo contenido son dos inspecciones distintas y llegan como dos registros", async () => {
    
        const app = await iniciarAplicacion();
        const primera = await app.guardarInspeccion(borradorValido);
        const segunda = await app.guardarInspeccion(borradorValido);
        if (!primera.ok || !segunda.ok) throw new Error("Las capturas sintéticas debían guardarse.");

        const servidor = crearServidorSimulado();
        const transporte = vi.fn(async (inspeccion: InspeccionGuardada, clave: string) => servidor.recibir(inspeccion, clave));
        const cola = app.createSyncQueue({ transport: transporte, wait: async () => undefined });
        await cola.syncPending();

        expect(primera.inspection.sync.idempotencyKey).not.toBe(segunda.inspection.sync.idempotencyKey);
        expect(servidor.registros.size).toBe(2);
    });
});
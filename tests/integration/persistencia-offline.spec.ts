import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NOMBRE_BASE_DE_DATOS } from "../../src/lib/storage/schema";

const borradorValido = {
    location: "Laboratorio sintético",
    date: "2026-10-24",
    inspector: "Técnica sintética A",
    status: "attention" as const,
    findings: 2,
    summary: "Captura sintética hecha sin conexión.",
};

const esperaInmediata = async () => undefined;

// Aísla cada caso: empieza con la base de datos vacía.
function borrarBaseDeDatos() {
    return new Promise<void>((resolve) => {
        const solicitud = indexedDB.deleteDatabase(NOMBRE_BASE_DE_DATOS);
        solicitud.onsuccess = () => resolve();
        solicitud.onerror = () => resolve();
        solicitud.onblocked = () => resolve();
    });
}

// Simula cerrar y reabrir la aplicación: se descartan los módulos (y su estado en
// memoria) y solo sobrevive lo que quedó guardado en IndexedDB.
async function iniciarAplicacion() {
    vi.resetModules();
    const almacen = await import("../../src/lib/storage/inspection-store");
    const cola = await import("../../src/lib/sync/queue");
    return { ...almacen, ...cola };
}

beforeEach(borrarBaseDeDatos);

describe("captura sin conexión que persiste al recargar", () => {
    it("una inspección guardada sigue ahí, con su estado de cola, tras recargar", async () => {
        const app = await iniciarAplicacion();
        const guardado = await app.guardarInspeccion(borradorValido);
        if (!guardado.ok) throw new Error("La captura sintética debía guardarse.");

        const recargada = await iniciarAplicacion();
        const todas = await recargada.obtenerTodasLasInspecciones();

        expect(todas).toHaveLength(1);
        expect(todas[0]).toMatchObject({
            ...borradorValido,
            id: guardado.inspection.id,
            sync: {
                idempotencyKey: `inspection:${guardado.inspection.id}`,
                status: "pending",
                attempts: 0,
            },
        });
    });

    it("una captura inválida no deja nada guardado, ni siquiera tras recargar", async () => {
        const app = await iniciarAplicacion();
        const resultado = await app.guardarInspeccion({ ...borradorValido, location: "" });

        expect(resultado.ok).toBe(false);

        const recargada = await iniciarAplicacion();
        expect(await recargada.obtenerTodasLasInspecciones()).toHaveLength(0);
    });

    it("sin conexión la sincronización falla, el registro sobrevive a la recarga y se recupera al volver la red", async () => {
        const app = await iniciarAplicacion();
        const guardado = await app.guardarInspeccion(borradorValido);
        if (!guardado.ok) throw new Error("La captura sintética debía guardarse.");

        const sinConexion = vi.fn().mockRejectedValue(new Error("synthetic offline"));
        const colaSinRed = app.createSyncQueue({ transport: sinConexion, wait: esperaInmediata });
        const resumen = await colaSinRed.syncPending();

        expect(sinConexion).toHaveBeenCalledTimes(app.MAX_SYNC_ATTEMPTS);
        expect(resumen).toEqual({ pending: 0, syncing: 0, failed: 1, synced: 0 });

        const recargada = await iniciarAplicacion();
        const [persistida] = await recargada.obtenerTodasLasInspecciones();
        expect(persistida.id).toBe(guardado.inspection.id);
        expect(persistida.sync).toMatchObject({
            status: "failed",
            attempts: recargada.MAX_SYNC_ATTEMPTS,
            lastError: "synthetic offline",
        });

        const conRed = vi.fn(async (_inspeccion: unknown, clave: string) => ({ idempotencyKey: clave }));
        const colaConRed = recargada.createSyncQueue({ transport: conRed, wait: esperaInmediata });
        const final = await colaConRed.retryFailed();

        expect(conRed).toHaveBeenCalledTimes(1);
        expect(final).toEqual({ pending: 0, syncing: 0, failed: 0, synced: 1 });

        const ultima = await iniciarAplicacion();
        const todas = await ultima.obtenerTodasLasInspecciones();
        expect(todas).toHaveLength(1);
        expect(todas[0].sync.status).toBe("synced");
    });
});
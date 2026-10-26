import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSyncQueue } from "../../src/lib/sync/queue";
import type { EstadoColaSincronizacion, InspeccionGuardada } from "../../src/lib/storage/schema";

function inspeccionSintetica(
    id = "inspection-unit-001",
    sync: Partial<EstadoColaSincronizacion> = {},
): InspeccionGuardada {
    return {
        id,
        location: "Laboratorio sintético",
        date: "2026-10-24",
        inspector: "Técnica sintética A",
        status: "ok",
        findings: 0,
        summary: "Registro sintético para reglas de cola.",
        createdAt: "2026-10-24T10:00:00.000Z#000001",
        updatedAt: "2026-10-24T10:00:00.000Z",
        schemaVersion: 2,
        sync: { idempotencyKey: `inspection:${id}`, status: "pending", attempts: 0, ...sync },
    };
}

function crearAlmacenEnMemoria(inicial: InspeccionGuardada[] = []) {
    const registros = new Map(inicial.map((item) => [item.id, structuredClone(item)]));
    return {
        registros,
        list: vi.fn(async () => [...registros.values()].map((item) => structuredClone(item))),
        update: vi.fn(async (id: string, sync: EstadoColaSincronizacion) => {
            const actual = registros.get(id);
            if (!actual) throw new Error(`Falta la inspección sintética: ${id}`);
            registros.set(id, { ...actual, sync: structuredClone(sync) });
        }),
        replace: vi.fn(async (item: InspeccionGuardada) => {
            registros.set(item.id, structuredClone(item));
        }),
    };
}

const esperaInmediata = async () => undefined;
const transporteExitoso = () =>
    vi.fn(async (_inspeccion: InspeccionGuardada, clave: string) => ({ idempotencyKey: clave }));

describe("regla: solo se envía lo que corresponde", () => {
    beforeEach(() => vi.clearAllMocks());

    it("POSITIVO: una inspección pending se envía una vez y queda synced", async () => {
        const almacen = crearAlmacenEnMemoria([inspeccionSintetica()]);
        const transporte = transporteExitoso();
        const cola = createSyncQueue({ storage: almacen, transport: transporte, wait: esperaInmediata });

        const resumen = await cola.syncPending();

        expect(transporte).toHaveBeenCalledTimes(1);
        expect(almacen.registros.get("inspection-unit-001")?.sync.status).toBe("synced");
        expect(resumen).toEqual({ pending: 0, syncing: 0, failed: 0, synced: 1 });
    });

    it("NEGATIVO: una inspección ya synced no se vuelve a enviar", async () => {
        const almacen = crearAlmacenEnMemoria([inspeccionSintetica("inspection-unit-001", { status: "synced", attempts: 1 })]);
        const transporte = transporteExitoso();
        const cola = createSyncQueue({ storage: almacen, transport: transporte, wait: esperaInmediata });

        const resumen = await cola.syncPending();

        expect(transporte).not.toHaveBeenCalled();
        expect(resumen.synced).toBe(1);
    });

    it("NEGATIVO: una inspección failed no se reenvía sola al sincronizar", async () => {
        const almacen = crearAlmacenEnMemoria([inspeccionSintetica("inspection-unit-001", { status: "failed", attempts: 5 })]);
        const transporte = transporteExitoso();
        const cola = createSyncQueue({ storage: almacen, transport: transporte, wait: esperaInmediata });

        const resumen = await cola.syncPending();

        expect(transporte).not.toHaveBeenCalled();
        expect(resumen.failed).toBe(1);
    });

    it("POSITIVO: el reintento manual reinicia los intentos, limpia el error y reenvía", async () => {
        const almacen = crearAlmacenEnMemoria([
            inspeccionSintetica("inspection-unit-001", { status: "failed", attempts: 5, lastError: "synthetic offline" }),
        ]);
        const transporte = transporteExitoso();
        const cola = createSyncQueue({ storage: almacen, transport: transporte, wait: esperaInmediata });

        const resumen = await cola.retryFailed();

        const sync = almacen.registros.get("inspection-unit-001")!.sync;
        expect(transporte).toHaveBeenCalledTimes(1);
        expect(sync.status).toBe("synced");
        expect(sync.attempts).toBe(1);
        expect(sync.lastError).toBeUndefined();
        expect(resumen.synced).toBe(1);
    });

    it("POSITIVO: una inspección que quedó en syncing (app cerrada a medias) se recupera y se envía", async () => {
        const almacen = crearAlmacenEnMemoria([inspeccionSintetica("inspection-unit-001", { status: "syncing", attempts: 1 })]);
        const transporte = transporteExitoso();
        const cola = createSyncQueue({ storage: almacen, transport: transporte, wait: esperaInmediata });

        await cola.syncPending();

        const sync = almacen.registros.get("inspection-unit-001")!.sync;
        expect(transporte).toHaveBeenCalledTimes(1);
        expect(sync.status).toBe("synced");
        expect(sync.attempts).toBe(2);
    });
});

describe("regla: encolar es idempotente y exige guardado previo", () => {
    beforeEach(() => vi.clearAllMocks());

    it("NEGATIVO: no encola una inspección que no está guardada localmente", async () => {
        const almacen = crearAlmacenEnMemoria();
        const cola = createSyncQueue({ storage: almacen, wait: esperaInmediata });

        await expect(cola.enqueue(inspeccionSintetica("no-guardada"))).rejects.toThrow(
            "Guarda la inspección localmente",
        );
        expect(almacen.registros.size).toBe(0);
    });

    it("POSITIVO: un registro heredado sin metadatos recibe una clave estable y se escribe una sola vez", async () => {
        const heredado = { ...inspeccionSintetica(), sync: undefined } as unknown as InspeccionGuardada;
        const almacen = crearAlmacenEnMemoria([heredado]);
        const cola = createSyncQueue({ storage: almacen, wait: esperaInmediata });

        const primera = await cola.enqueue(heredado);
        const segunda = await cola.enqueue(heredado);

        expect(primera.sync).toEqual({ idempotencyKey: "inspection:inspection-unit-001", status: "pending", attempts: 0 });
        expect(segunda.sync.idempotencyKey).toBe(primera.sync.idempotencyKey);
        expect(almacen.update).toHaveBeenCalledTimes(1);
        expect(almacen.registros.size).toBe(1);
    });
});

describe("regla: una sola corrida a la vez", () => {
    it("dos sincronizaciones simultáneas comparten la misma corrida y no duplican el envío", async () => {
        const almacen = crearAlmacenEnMemoria([inspeccionSintetica()]);
        const transporte = transporteExitoso();
        const cola = createSyncQueue({ storage: almacen, transport: transporte, wait: esperaInmediata });

        const primera = cola.syncPending();
        const segunda = cola.syncPending();

        expect(segunda).toBe(primera);
        await Promise.all([primera, segunda]);
        expect(transporte).toHaveBeenCalledTimes(1);
    });
});
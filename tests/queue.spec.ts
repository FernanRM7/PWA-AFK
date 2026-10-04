import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSyncQueue, MAX_SYNC_ATTEMPTS, resumeQueueOnOnline } from "../src/lib/sync/queue";
import type { EstadoColaSincronizacion, InspeccionGuardada } from "../src/lib/storage/schema";

function syntheticInspection(id = "inspection-synthetic-001"): InspeccionGuardada {
    return {
        id,
        location: "Laboratorio sintético",
        date: "2026-10-02",
        inspector: "Técnica sintética A",
        status: "ok",
        findings: 0,
        summary: "Registro sintético para probar sincronización.",
        createdAt: "2026-10-02T10:00:00.000Z#000001",
        updatedAt: "2026-10-02T10:00:00.000Z",
        schemaVersion: 2,
        sync: { idempotencyKey: `inspection:${id}`, status: "pending", attempts: 0 },
    };
}

function createMemoryStorage(initial: InspeccionGuardada[] = []) {
    const records = new Map(initial.map((inspection) => [inspection.id, structuredClone(inspection)]));
    return {
        records,
        list: vi.fn(async () => [...records.values()].map((inspection) => structuredClone(inspection))),
        update: vi.fn(async (id: string, sync: EstadoColaSincronizacion) => {
            const inspection = records.get(id);
            if (!inspection) throw new Error(`Missing synthetic inspection: ${id}`);
            records.set(id, { ...inspection, sync: structuredClone(sync) });
        }),
        replace: vi.fn(async (inspection: InspeccionGuardada) => {
            records.set(inspection.id, structuredClone(inspection));
        }),
    };
}

describe("cola de sincronización offline", () => {
    beforeEach(() => vi.clearAllMocks());

    it("mantiene una clave estable y no duplica la misma inspección en la cola", async () => {
        const inspection = syntheticInspection();
        const storage = createMemoryStorage([inspection]);
        const queue = createSyncQueue({ storage, wait: async () => undefined });

        const first = await queue.enqueue(inspection);
        const duplicate = await queue.enqueue(inspection);

        expect(first.sync.idempotencyKey).toBe(`inspection:${inspection.id}`);
        expect(duplicate.sync.idempotencyKey).toBe(first.sync.idempotencyKey);
        expect(storage.records.size).toBe(1);
    });

    it("reintenta cinco veces con backoff acotado y conserva el registro para reintento manual", async () => {
        const inspection = syntheticInspection();
        const storage = createMemoryStorage([inspection]);
        const wait = vi.fn(async (_milliseconds: number) => undefined);
        const transport = vi.fn()
            .mockRejectedValueOnce(new Error("synthetic offline"))
            .mockRejectedValueOnce(new Error("synthetic offline"))
            .mockRejectedValueOnce(new Error("synthetic offline"))
            .mockRejectedValueOnce(new Error("synthetic offline"))
            .mockRejectedValueOnce(new Error("synthetic offline"))
            .mockResolvedValue({ idempotencyKey: `inspection:${inspection.id}` });
        const queue = createSyncQueue({ storage, transport, wait });

        const exhausted = await queue.syncPending();
        expect(exhausted.failed).toBe(1);
        expect(storage.records.get(inspection.id)?.sync.attempts).toBe(MAX_SYNC_ATTEMPTS);
        expect(wait.mock.calls.map(([milliseconds]) => milliseconds)).toEqual([1_000, 2_000, 4_000, 8_000]);
        expect(storage.records.has(inspection.id)).toBe(true);

        const recovered = await queue.retryFailed();
        expect(recovered.synced).toBe(1);
        expect(storage.records.get(inspection.id)?.sync.attempts).toBe(1);
        expect(storage.records.get(inspection.id)?.sync.status).toBe("synced");
    });

    it("reanuda tras reiniciar la cola conservando intentos y clave", async () => {
        const inspection = syntheticInspection();
        const storage = createMemoryStorage([inspection]);
        const firstQueue = createSyncQueue({
            storage,
            transport: vi.fn().mockRejectedValue(new Error("synthetic offline")),
            wait: async () => undefined,
        });
        await firstQueue.syncPending();
        const persisted = storage.records.get(inspection.id)!;
        expect(persisted.sync.attempts).toBe(MAX_SYNC_ATTEMPTS);

        const transport = vi.fn().mockResolvedValue({ idempotencyKey: persisted.sync.idempotencyKey });
        const restartedQueue = createSyncQueue({ storage, transport, wait: async () => undefined });
        const result = await restartedQueue.retryFailed();

        expect(result.synced).toBe(1);
        expect(transport).toHaveBeenCalledWith(expect.objectContaining({ id: inspection.id }), persisted.sync.idempotencyKey);
        expect(storage.records.get(inspection.id)?.sync.status).toBe("synced");
    });

    it("acepta un acuse repetido sin volver a enviar una inspección ya sincronizada", async () => {
        const inspection = syntheticInspection();
        const storage = createMemoryStorage([inspection]);
        const transport = vi.fn().mockResolvedValue({ idempotencyKey: `inspection:${inspection.id}` });
        const queue = createSyncQueue({ storage, transport, wait: async () => undefined });

        await queue.syncPending();
        await queue.enqueue(inspection);
        await queue.syncPending();

        expect(transport).toHaveBeenCalledOnce();
        expect(storage.records.size).toBe(1);
        expect((await queue.getSummary()).synced).toBe(1);
    });

    it("reanuda la cola al recibir el evento online", async () => {
        const target = new EventTarget();
        const resume = vi.fn().mockResolvedValue(undefined);
        const detach = resumeQueueOnOnline(target as unknown as Pick<Window, "addEventListener" | "removeEventListener">, resume);

        target.dispatchEvent(new Event("online"));
        await Promise.resolve();
        detach();
        target.dispatchEvent(new Event("online"));

        expect(resume).toHaveBeenCalledOnce();
    });

    it("no marca como sincronizado un acuse con otra clave", async () => {
        const inspection = syntheticInspection();
        const storage = createMemoryStorage([inspection]);
        const queue = createSyncQueue({
            storage,
            transport: vi.fn().mockResolvedValue({ idempotencyKey: "wrong-synthetic-key" }),
            wait: async () => undefined,
        });

        const result = await queue.syncPending();

        expect(result.failed).toBe(1);
        expect(storage.records.get(inspection.id)?.sync.lastError).toContain("no coincide");
    });
});

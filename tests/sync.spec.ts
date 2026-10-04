import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    guardarInspeccion,
    obtenerTodasLasInspecciones,
    reemplazarInspeccion,
} from "../src/lib/storage/inspection-store";
import { createSyncQueue } from "../src/lib/sync/queue";
import type { InspeccionGuardada } from "../src/lib/storage/schema";
import { resolveInspectionConflict } from "../src/lib/sync/conflict-policy";

const DATABASE_NAME = "afk-inspections-db";

async function resetDatabase() {
    await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase(DATABASE_NAME);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
    });
}

async function seedVersionOneRecord() {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore("inspections", { keyPath: "id" });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("inspections", "readwrite");
        transaction.objectStore("inspections").put({
            id: "inspection-legacy-001",
            location: "Laboratorio sintético legado",
            date: "2026-10-01",
            inspector: "Técnica sintética B",
            status: "ok",
            findings: 0,
            summary: "Registro legado de prueba.",
            createdAt: "2026-10-01T10:00:00.000Z#000001",
            schemaVersion: 1,
            sync: { idempotencyKey: "inspection:inspection-legacy-001", status: "pending", attempts: 0 },
        });
        transaction.oncomplete = () => {
            db.close();
            resolve();
        };
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}

async function createLocalInspection(): Promise<InspeccionGuardada> {
    const result = await guardarInspeccion({
        location: "Laboratorio sintético local",
        date: "2026-10-04",
        inspector: "Técnica sintética A",
        status: "attention",
        findings: 1,
        summary: "Hallazgo local sintético.",
    });

    if (!result.ok) throw new Error(result.errors.join(" "));
    return result.inspection;
}

function remoteVersion(
    local: InspeccionGuardada,
    updatedAt: string,
    overrides: Partial<InspeccionGuardada> = {},
): InspeccionGuardada {
    return {
        ...local,
        location: "Laboratorio sintético remoto",
        summary: "Versión remota sintética.",
        updatedAt,
        ...overrides,
    };
}

describe("integración de persistencia, sincronización y conflictos W05", () => {
    beforeEach(resetDatabase);

    it("migra registros existentes a updatedAt sin descartarlos", async () => {
        await seedVersionOneRecord();

        const [migrated] = await obtenerTodasLasInspecciones();

        expect(migrated.id).toBe("inspection-legacy-001");
        expect(migrated.updatedAt).toBe("2026-10-01T10:00:00.000Z");
        expect(migrated.schemaVersion).toBe(2);
    });

    it("persiste la versión remota cuando updatedAt es más reciente", async () => {
        const local = await createLocalInspection();
        const remote = remoteVersion(local, "2999-01-01T00:00:00.000Z");
        const transport = vi.fn().mockResolvedValue({
            idempotencyKey: local.sync.idempotencyKey,
            outcome: "conflict",
            remoteInspection: remote,
        });
        const queue = createSyncQueue({ transport, wait: async () => undefined });

        const result = await queue.syncPending();
        const [stored] = await obtenerTodasLasInspecciones();

        expect(result.synced).toBe(1);
        expect(stored.summary).toBe(remote.summary);
        expect(stored.updatedAt).toBe(remote.updatedAt);
        expect(stored.sync.status).toBe("synced");
        expect(stored.sync.idempotencyKey).toBe(local.sync.idempotencyKey);
        expect(transport).toHaveBeenCalledOnce();
    });

    it("reenvía la versión local ganadora con la misma clave hasta recibir aceptación", async () => {
        const created = await createLocalInspection();
        const local = { ...created, updatedAt: "2999-01-01T00:00:00.000Z", summary: "Versión local más reciente." };
        await reemplazarInspeccion(local);
        const remote = remoteVersion(local, "2000-01-01T00:00:00.000Z");
        const transport = vi.fn()
            .mockResolvedValueOnce({
                idempotencyKey: local.sync.idempotencyKey,
                outcome: "conflict",
                remoteInspection: remote,
            })
            .mockResolvedValueOnce({ idempotencyKey: local.sync.idempotencyKey, outcome: "accepted" });
        const queue = createSyncQueue({ transport, wait: async () => undefined });

        const result = await queue.syncPending();
        const [stored] = await obtenerTodasLasInspecciones();

        expect(result.synced).toBe(1);
        expect(transport).toHaveBeenCalledTimes(2);
        expect(transport.mock.calls[0][1]).toBe(transport.mock.calls[1][1]);
        expect(transport.mock.calls[1][0].summary).toBe(local.summary);
        expect(stored.summary).toBe(local.summary);
        expect(stored.sync.status).toBe("synced");
        expect(stored.sync.attempts).toBe(2);
    });

    it("elige la versión remota cuando las marcas updatedAt empatan", async () => {
        const created = await createLocalInspection();
        const local = { ...created, updatedAt: "2026-10-04T12:00:00.000Z" };
        await reemplazarInspeccion(local);
        const remote = remoteVersion(local, local.updatedAt);

        const result = resolveInspectionConflict(local, remote);

        expect(result.source).toBe("remote");
        expect(result.winner).toBe(remote);
    });

    it("agota cinco intentos ante un conflicto persistente y conserva la versión local para reintento manual", async () => {
        const created = await createLocalInspection();
        const local = { ...created, updatedAt: "2999-01-01T00:00:00.000Z" };
        await reemplazarInspeccion(local);
        const remote = remoteVersion(local, "2000-01-01T00:00:00.000Z");
        const transport = vi.fn().mockResolvedValue({
            idempotencyKey: local.sync.idempotencyKey,
            outcome: "conflict",
            remoteInspection: remote,
        });
        const queue = createSyncQueue({ transport, wait: async () => undefined });

        const result = await queue.syncPending();
        const [stored] = await obtenerTodasLasInspecciones();

        expect(result.failed).toBe(1);
        expect(transport).toHaveBeenCalledTimes(5);
        expect(stored.updatedAt).toBe(local.updatedAt);
        expect(stored.sync.status).toBe("failed");
        expect(stored.sync.attempts).toBe(5);
        expect(stored.sync.idempotencyKey).toBe(local.sync.idempotencyKey);
    });
});

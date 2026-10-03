import {
    actualizarEstadoSincronizacion,
    obtenerTodasLasInspecciones,
} from "@/lib/storage/inspection-store";
import type {
    EstadoColaSincronizacion,
    InspeccionGuardada,
} from "@/lib/storage/schema";

export const MAX_SYNC_ATTEMPTS = 5;
const BACKOFF_DELAYS_MS = [1_000, 2_000, 4_000, 8_000];

export type SyncAcknowledgement = { idempotencyKey: string };
export type SyncTransport = (
    inspection: InspeccionGuardada,
    idempotencyKey: string,
) => Promise<SyncAcknowledgement>;

export type SyncQueueStorage = {
    list: () => Promise<InspeccionGuardada[]>;
    update: (id: string, state: EstadoColaSincronizacion) => Promise<void>;
};

export type SyncQueueSummary = {
    pending: number;
    syncing: number;
    failed: number;
    synced: number;
};

type SyncQueueOptions = {
    storage?: SyncQueueStorage;
    transport?: SyncTransport;
    wait?: (milliseconds: number) => Promise<void>;
};

const storageAdapter: SyncQueueStorage = {
    list: obtenerTodasLasInspecciones,
    update: actualizarEstadoSincronizacion,
};

export const syntheticSyncTransport: SyncTransport = async (_inspection, idempotencyKey) => ({
    idempotencyKey,
});

function defaultWait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function createSyncQueue({
    storage = storageAdapter,
    transport = syntheticSyncTransport,
    wait = defaultWait,
}: SyncQueueOptions = {}) {
    let activeRun: Promise<SyncQueueSummary> | undefined;

    function metadataFor(inspection: InspeccionGuardada): EstadoColaSincronizacion {
        return inspection.sync ?? {
            idempotencyKey: `inspection:${inspection.id}`,
            status: "pending",
            attempts: 0,
        };
    }

    async function getSummary(): Promise<SyncQueueSummary> {
        const inspections = await storage.list();
        return inspections.reduce<SyncQueueSummary>((summary, inspection) => {
            const state = metadataFor(inspection).status;
            summary[state] += 1;
            return summary;
        }, { pending: 0, syncing: 0, failed: 0, synced: 0 });
    }

    async function enqueue(inspection: InspeccionGuardada): Promise<InspeccionGuardada> {
        const stored = (await storage.list()).find((item) => item.id === inspection.id);
        if (!stored) throw new Error("Guarda la inspección localmente antes de añadirla a sincronización.");

        const current = metadataFor(stored);
        if (!stored.sync) await storage.update(stored.id, current);
        return { ...stored, sync: current };
    }

    async function processPending(): Promise<SyncQueueSummary> {
        const inspections = await storage.list();

        for (const inspection of inspections) {
            let state = metadataFor(inspection);
            if (state.status === "synced" || state.status === "failed") continue;

            if (state.status === "syncing") {
                state = { ...state, status: "pending" };
                await storage.update(inspection.id, state);
            } else if (!inspection.sync) {
                await storage.update(inspection.id, state);
            }

            if (state.attempts >= MAX_SYNC_ATTEMPTS) {
                await storage.update(inspection.id, { ...state, status: "failed" });
                continue;
            }

            while (state.attempts < MAX_SYNC_ATTEMPTS) {
                state = { ...state, attempts: state.attempts + 1, status: "syncing" };
                await storage.update(inspection.id, state);

                try {
                    const acknowledgement = await transport(inspection, state.idempotencyKey);
                    if (acknowledgement.idempotencyKey !== state.idempotencyKey) {
                        throw new Error("El acuse no coincide con la clave de idempotencia.");
                    }
                    state = { ...state, status: "synced", lastError: undefined };
                    await storage.update(inspection.id, state);
                    break;
                } catch (error) {
                    const lastError = error instanceof Error ? error.message : "Error de sincronización desconocido.";
                    const exhausted = state.attempts >= MAX_SYNC_ATTEMPTS;
                    state = {
                        ...state,
                        status: exhausted ? "failed" : "pending",
                        lastError,
                    };
                    await storage.update(inspection.id, state);
                    if (exhausted) break;
                    await wait(BACKOFF_DELAYS_MS[state.attempts - 1]);
                }
            }
        }

        return getSummary();
    }

    function syncPending(): Promise<SyncQueueSummary> {
        if (!activeRun) {
            activeRun = processPending().finally(() => {
                activeRun = undefined;
            });
        }
        return activeRun;
    }

    async function retryFailed(): Promise<SyncQueueSummary> {
        if (activeRun) await activeRun;
        const inspections = await storage.list();

        for (const inspection of inspections) {
            const state = metadataFor(inspection);
            if (state.status === "failed") {
                await storage.update(inspection.id, {
                    ...state,
                    status: "pending",
                    attempts: 0,
                    lastError: undefined,
                });
            }
        }

        return syncPending();
    }

    return { enqueue, getSummary, retryFailed, syncPending };
}

const applicationQueue = createSyncQueue();

export const enqueueInspectionForSync = applicationQueue.enqueue;
export const getSyncQueueSummary = applicationQueue.getSummary;
export const retryFailedSync = applicationQueue.retryFailed;
export const syncPendingInspections = applicationQueue.syncPending;

export function resumeQueueOnOnline(
    target: Pick<Window, "addEventListener" | "removeEventListener">,
    resume: () => Promise<unknown> = syncPendingInspections,
): () => void {
    const handleOnline = () => {
        void resume().catch(() => undefined);
    };
    target.addEventListener("online", handleOnline);
    return () => target.removeEventListener("online", handleOnline);
}
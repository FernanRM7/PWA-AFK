import type { InspeccionGuardada } from "@/lib/storage/schema";

export type OrigenVersionGanadora = "local" | "remote";

export type ResolucionConflicto = {
    winner: InspeccionGuardada;
    source: OrigenVersionGanadora;
};

/**
 * Gana la versión con updatedAt más reciente. En empate gana la versión remota
 * para que todas las réplicas resuelvan el mismo caso de forma determinista.
 * Se esperan marcas ISO-8601; el desfase de reloj entre dispositivos es un límite.
 */
export function resolveInspectionConflict(
    local: InspeccionGuardada,
    remote: InspeccionGuardada,
): ResolucionConflicto {
    if (local.updatedAt > remote.updatedAt) {
        return { winner: local, source: "local" };
    }

    return { winner: remote, source: "remote" };
}

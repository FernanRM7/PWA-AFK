import { NOMBRE_BASE_DE_DATOS, VERSION_ESQUEMA, NOMBRE_ALMACEN, EstadoColaSincronizacion, InspeccionGuardada, validarBorradorInspeccion } from "./schema";

function abrirBaseDeDatos(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open(NOMBRE_BASE_DE_DATOS, VERSION_ESQUEMA);

        solicitud.onupgradeneeded = (event) => {
            const db = solicitud.result;
            if (!db.objectStoreNames.contains(NOMBRE_ALMACEN)) {
                db.createObjectStore(NOMBRE_ALMACEN, { keyPath: "id" });
            }

            if ((event as IDBVersionChangeEvent).oldVersion < 2) {
                const almacen = solicitud.transaction?.objectStore(NOMBRE_ALMACEN);
                const cursorSolicitud = almacen?.openCursor();
                if (cursorSolicitud) {
                    cursorSolicitud.onsuccess = () => {
                        const cursor = cursorSolicitud.result;
                        if (!cursor) return;

                        const registro = cursor.value as Partial<InspeccionGuardada>;
                        const marcaLegacy = registro.createdAt?.split("#", 1)[0];
                        const updatedAt = registro.updatedAt ?? (
                            marcaLegacy && Number.isFinite(Date.parse(marcaLegacy))
                                ? new Date(marcaLegacy).toISOString()
                                : new Date(0).toISOString()
                        );

                        cursor.update({
                            ...registro,
                            updatedAt,
                            schemaVersion: VERSION_ESQUEMA,
                        });
                        cursor.continue();
                    };
                }
            }
        };

        solicitud.onsuccess = () => resolve(solicitud.result);
        solicitud.onerror = () => reject(solicitud.error ?? new Error("No se pudo abrir la base de datos local."));
    });
}

export type ResultadoGuardado =
    | { ok: true; inspection: InspeccionGuardada }
    | { ok: false; errors: string[] };

let contadorDeOrden = 0;

function generarMarcaDeTiempo(): string {
    contadorDeOrden += 1;
    return `${new Date().toISOString()}#${contadorDeOrden.toString().padStart(6, "0")}`;
}

export async function guardarInspeccion(borrador: unknown): Promise<ResultadoGuardado> {
    const validacion = validarBorradorInspeccion(borrador);
    if (!validacion.valido) {
        return { ok: false, errors: validacion.errores };
    }

    const id = crypto.randomUUID();
    const inspeccion: InspeccionGuardada = {
        ...validacion.valor,
        id,
        createdAt: generarMarcaDeTiempo(),
        updatedAt: new Date().toISOString(),
        schemaVersion: VERSION_ESQUEMA,
        sync: {
            idempotencyKey: `inspection:${id}`,
            status: "pending",
            attempts: 0,
        },
    };

    let db: IDBDatabase;
    try {
        db = await abrirBaseDeDatos();
    } catch {
        return { ok: false, errors: ["No se pudo acceder al almacenamiento local del dispositivo."] };
    }

    return new Promise((resolve) => {
        const transaccion = db.transaction(NOMBRE_ALMACEN, "readwrite");
        const almacen = transaccion.objectStore(NOMBRE_ALMACEN);
        const solicitud = almacen.add(inspeccion);

        solicitud.onsuccess = () => {
            db.close();
            resolve({ ok: true, inspection: inspeccion });
        };
        solicitud.onerror = () => {
            db.close();
            resolve({ ok: false, errors: ["No se pudo guardar la inspección en el dispositivo."] });
        };
    });
}

export async function obtenerTodasLasInspecciones(): Promise<InspeccionGuardada[]> {
    let db: IDBDatabase;
    try {
        db = await abrirBaseDeDatos();
    } catch {
        return [];
    }

    return new Promise((resolve) => {
        const transaccion = db.transaction(NOMBRE_ALMACEN, "readonly");
        const almacen = transaccion.objectStore(NOMBRE_ALMACEN);
        const solicitud = almacen.getAll();

        solicitud.onsuccess = () => {
            const resultados = (solicitud.result as InspeccionGuardada[]) ?? [];
            resultados.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            db.close();
            resolve(resultados);
        };
        solicitud.onerror = () => {
            db.close();
            resolve([]);
        };
    });
}

export async function actualizarEstadoSincronizacion(
    id: string,
    sync: EstadoColaSincronizacion,
): Promise<void> {
    const db = await abrirBaseDeDatos();

    return new Promise((resolve, reject) => {
        const transaccion = db.transaction(NOMBRE_ALMACEN, "readwrite");
        const almacen = transaccion.objectStore(NOMBRE_ALMACEN);
        const lectura = almacen.get(id);

        lectura.onsuccess = () => {
            const inspeccion = lectura.result as InspeccionGuardada | undefined;
            if (!inspeccion) {
                db.close();
                reject(new Error(`No existe la inspección ${id}.`));
                return;
            }

            const escritura = almacen.put({ ...inspeccion, sync });
            escritura.onsuccess = () => {
                db.close();
                resolve();
            };
            escritura.onerror = () => {
                db.close();
                reject(escritura.error ?? new Error("No se pudo actualizar el estado de sincronización."));
            };
        };
        lectura.onerror = () => {
            db.close();
            reject(lectura.error ?? new Error("No se pudo leer la inspección para sincronizar."));
        };
    });
}

/** Reemplaza el registro local con la versión elegida por la política de conflicto. */
export async function reemplazarInspeccion(inspeccion: InspeccionGuardada): Promise<void> {
    const db = await abrirBaseDeDatos();

    return new Promise((resolve, reject) => {
        const transaccion = db.transaction(NOMBRE_ALMACEN, "readwrite");
        transaccion.oncomplete = () => {
            db.close();
            resolve();
        };
        transaccion.onerror = () => {
            db.close();
            reject(transaccion.error ?? new Error("No se pudo guardar la versión resuelta."));
        };
        transaccion.onabort = () => {
            db.close();
            reject(transaccion.error ?? new Error("Se canceló el guardado de la versión resuelta."));
        };

        transaccion.objectStore(NOMBRE_ALMACEN).put(inspeccion);
    });
}

import { NOMBRE_BASE_DE_DATOS, VERSION_ESQUEMA, NOMBRE_ALMACEN, InspeccionGuardada, validarBorradorInspeccion } from "./schema";

function abrirBaseDeDatos(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open(NOMBRE_BASE_DE_DATOS, VERSION_ESQUEMA);

        solicitud.onupgradeneeded = () => {
            const db = solicitud.result;
            if (!db.objectStoreNames.contains(NOMBRE_ALMACEN)) {
                db.createObjectStore(NOMBRE_ALMACEN, { keyPath: "id" });
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

    const inspeccion: InspeccionGuardada = {
        ...validacion.valor,
        id: crypto.randomUUID(),
        createdAt: generarMarcaDeTiempo(),
        schemaVersion: VERSION_ESQUEMA,
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
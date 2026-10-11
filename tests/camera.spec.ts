import { describe, expect, it, vi } from "vitest";
import { abrirCamara, capturarFotograma, liberarCamara, type ProveedorCamara } from "../src/lib/device/camera";

function crearPista() {
    return { stop: vi.fn() };
}

function crearStreamSimulado(pistas = [crearPista(), crearPista()]) {
    return {
        stream: { getTracks: () => pistas } as unknown as MediaStream,
        pistas,
    };
}

function proveedorQueResuelve(stream: MediaStream): ProveedorCamara {
    return { getUserMedia: vi.fn().mockResolvedValue(stream) } as unknown as ProveedorCamara;
}

function proveedorQueFalla(nombre: string): ProveedorCamara {
    return {
        getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error("synthetic"), { name: nombre })),
    } as unknown as ProveedorCamara;
}

describe("acceso opcional a la cámara", () => {
    it("devuelve el stream cuando la cámara está disponible y no pide audio", async () => {
        const { stream } = crearStreamSimulado();
        const proveedor = proveedorQueResuelve(stream);

        await expect(abrirCamara(proveedor)).resolves.toEqual({ status: "available", stream });
        expect(proveedor.getUserMedia).toHaveBeenCalledWith({
            video: { facingMode: "environment" },
            audio: false,
        });
    });

    it.each(["NotAllowedError", "SecurityError", "PermissionDeniedError"])(
        "clasifica %s como permiso denegado",
        async (nombre) => {
            await expect(abrirCamara(proveedorQueFalla(nombre))).resolves.toEqual({ status: "denied" });
        },
    );

    it.each(["NotFoundError", "OverconstrainedError"])(
        "clasifica %s como cámara no disponible",
        async (nombre) => {
            await expect(abrirCamara(proveedorQueFalla(nombre))).resolves.toEqual({ status: "unavailable" });
        },
    );

    it("clasifica un fallo desconocido como error recuperable", async () => {
        await expect(abrirCamara(proveedorQueFalla("AbortError"))).resolves.toEqual({ status: "error" });
    });

    it("indica que no está disponible cuando no existe la API", async () => {
        await expect(abrirCamara(null)).resolves.toEqual({ status: "unavailable" });
    });
});

describe("liberación de pistas", () => {
    it("detiene todas las pistas del stream", () => {
        const { stream, pistas } = crearStreamSimulado();

        liberarCamara(stream);

        for (const pista of pistas) expect(pista.stop).toHaveBeenCalledOnce();
    });

    it("acepta null o undefined sin lanzar error", () => {
        expect(() => liberarCamara(null)).not.toThrow();
        expect(() => liberarCamara(undefined)).not.toThrow();
    });
});

describe("captura de fotograma en memoria", () => {
    function videoSimulado(ancho: number, alto: number) {
        return { videoWidth: ancho, videoHeight: alto } as HTMLVideoElement;
    }

    function lienzoSimulado(blob: Blob | null, contexto: unknown = { drawImage: vi.fn() }) {
        return () =>
            ({
                width: 0,
                height: 0,
                getContext: vi.fn(() => contexto),
                toBlob: (callback: BlobCallback) => callback(blob),
            }) as unknown as HTMLCanvasElement;
    }

    it("crea una vista previa en memoria y la revoca una sola vez al descartar", async () => {
        const crear = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:sintetico");
        const revocar = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

        const resultado = await capturarFotograma(
            videoSimulado(640, 480),
            lienzoSimulado(new Blob(["sintetico"], { type: "image/jpeg" })),
        );

        expect(resultado.status).toBe("captured");
        if (resultado.status === "captured") {
            expect(resultado.captura.previewUrl).toBe("blob:sintetico");
            resultado.captura.descartar();
            resultado.captura.descartar();
        }
        expect(crear).toHaveBeenCalledOnce();
        expect(revocar).toHaveBeenCalledOnce();
        expect(revocar).toHaveBeenCalledWith("blob:sintetico");

        crear.mockRestore();
        revocar.mockRestore();
    });

    it("devuelve error si el video aún no tiene fotograma", async () => {
        const resultado = await capturarFotograma(videoSimulado(0, 0), lienzoSimulado(null));
        expect(resultado).toEqual({ status: "error" });
    });

    it("devuelve error si el lienzo no entrega un blob", async () => {
        const resultado = await capturarFotograma(videoSimulado(640, 480), lienzoSimulado(null));
        expect(resultado).toEqual({ status: "error" });
    });

    it("devuelve error si no hay contexto 2D", async () => {
        const resultado = await capturarFotograma(videoSimulado(640, 480), lienzoSimulado(null, null));
        expect(resultado).toEqual({ status: "error" });
    });
});
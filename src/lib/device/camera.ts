export type ProveedorCamara = Pick<MediaDevices, "getUserMedia">;

export type ResultadoCamara =
    | { status: "available"; stream: MediaStream }
    | { status: "denied" | "unavailable" | "error" };

export type CapturaCamara = {
    blob: Blob;
    previewUrl: string;
    descartar: () => void;
};

export type ResultadoCaptura =
    | { status: "captured"; captura: CapturaCamara }
    | { status: "error" };

function obtenerCamaraDelNavegador(): ProveedorCamara | null {
    if (typeof navigator === "undefined") return null;
    const dispositivos = navigator.mediaDevices;
    if (!dispositivos || typeof dispositivos.getUserMedia !== "function") return null;
    return dispositivos;
}

export async function abrirCamara(
    proveedor: ProveedorCamara | null = obtenerCamaraDelNavegador(),
): Promise<ResultadoCamara> {
    if (!proveedor) return { status: "unavailable" };

    try {
        const stream = await proveedor.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
        });
        return { status: "available", stream };
    } catch (error) {
        const nombre = (error as { name?: string } | null)?.name;
        if (nombre === "NotAllowedError" || nombre === "SecurityError" || nombre === "PermissionDeniedError") {
            return { status: "denied" };
        }
        if (nombre === "NotFoundError" || nombre === "OverconstrainedError") {
            return { status: "unavailable" };
        }
        return { status: "error" };
    }
}

export function liberarCamara(stream: MediaStream | null | undefined): void {
    stream?.getTracks().forEach((pista) => pista.stop());
}


export function capturarFotograma(
    video: HTMLVideoElement,
    crearLienzo: () => HTMLCanvasElement = () => document.createElement("canvas"),
): Promise<ResultadoCaptura> {
    return new Promise((resolve) => {
        try {
            if (!video.videoWidth || !video.videoHeight) {
                resolve({ status: "error" });
                return;
            }

            const lienzo = crearLienzo();
            lienzo.width = video.videoWidth;
            lienzo.height = video.videoHeight;
            const contexto = lienzo.getContext("2d");
            if (!contexto) {
                resolve({ status: "error" });
                return;
            }

            contexto.drawImage(video, 0, 0);
            lienzo.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve({ status: "error" });
                        return;
                    }
                    const previewUrl = URL.createObjectURL(blob);
                    let descartada = false;
                    resolve({
                        status: "captured",
                        captura: {
                            blob,
                            previewUrl,
                            descartar: () => {
                                if (descartada) return;
                                descartada = true;
                                URL.revokeObjectURL(previewUrl);
                            },
                        },
                    });
                },
                "image/jpeg",
                0.8,
            );
        } catch {
            resolve({ status: "error" });
        }
    });
}
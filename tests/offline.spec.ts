import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

function createWorker() {
    const cachesByName = new Map<string, Map<string, Response>>();
    const listeners = new Map<string, (event: any) => void>();
    const fetchMock = vi.fn();
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const cacheApi = {
        open: vi.fn(async (name: string) => {
            if (!cachesByName.has(name)) cachesByName.set(name, new Map());
            const entries = cachesByName.get(name)!;
            return {
                addAll: async (urls: string[]) => {
                    for (const url of urls) {
                        const response = await fetchMock(new Request(`https://afk.test${url}`));
                        if (!response.ok) throw new Error(`precache failed: ${url}`);
                        entries.set(url, response.clone());
                    }
                },
                match: async (request: Request | string) =>
                    entries.get(typeof request === "string" ? request : new URL(request.url).pathname),
                put: async (request: Request, response: Response) =>
                    entries.set(new URL(request.url).pathname, response),
            };
        }),
        match: async (url: string) => cachesByName.get("afk-precache-v1")?.get(url),
        keys: async () => [...cachesByName.keys()],
        has: async (name: string) => cachesByName.has(name),
        delete: vi.fn(async (name: string) => cachesByName.delete(name)),
    };

    const self = {
        location: { origin: "https://afk.test" },
        clients: { claim: vi.fn(async () => undefined) },
        skipWaiting: vi.fn(async () => undefined),
        addEventListener: (type: string, listener: (event: any) => void) => listeners.set(type, listener),
    };

    const source = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    runInNewContext(source, { self, caches: cacheApi, fetch: fetchMock, Request, Response, URL, console });

    return { cachesByName, listeners, fetchMock, cacheApi, self, errors };
}

async function dispatch(worker: ReturnType<typeof createWorker>, type: string, request?: Request) {
    let pending: Promise<unknown> | undefined;
    const event = {
        request,
        waitUntil: (promise: Promise<unknown>) => { pending = promise; },
        respondWith: (promise: Promise<Response>) => { pending = promise; },
    };
    worker.listeners.get(type)!(event);
    return pending;
}

function navigationRequest(path = "/") {
    const request = new Request(`https://afk.test${path}`);
    Object.defineProperty(request, "mode", { value: "navigate" });
    return request;
}

describe("offline: comportamiento y recuperación", () => {
    it("responde desde caché cuando el recurso ya fue precacheado sin ir a red", async () => {
        const worker = createWorker();
        worker.cachesByName.set("afk-runtime-v1", new Map([["/manifest.webmanifest", new Response("cached manifest")]]));
        const request = new Request("https://afk.test/manifest.webmanifest");

        const response = await dispatch(worker, "fetch", request);

        expect(await (response as Response).text()).toBe("cached manifest");
        expect(worker.fetchMock).not.toHaveBeenCalled();
    });

    it("va a red cuando el recurso no está precacheado y lo guarda para la próxima vez", async () => {
        const worker = createWorker();
        worker.fetchMock.mockResolvedValue(new Response("fresh data", { status: 200 }));
        const request = new Request("https://afk.test/inspecciones/5");

        const response = await dispatch(worker, "fetch", request);

        expect(await (response as Response).text()).toBe("fresh data");
        expect(worker.fetchMock).toHaveBeenCalledWith(request);
        const runtimeCache = worker.cachesByName.get("afk-runtime-v1");
        expect(await runtimeCache?.get("/inspecciones/5")?.text()).toBe("fresh data");
    });

    it("cae a la caché cuando falla la red en una solicitud de navegación con caché runtime previa", async () => {
        const worker = createWorker();
        worker.cachesByName.set("afk-runtime-v1", new Map([["/", new Response("stale shell")]]));
        const request = navigationRequest("/");
        worker.fetchMock.mockRejectedValue(new Error("network down"));

        const response = await dispatch(worker, "fetch", request);

        expect(await (response as Response).text()).toBe("stale shell");
        expect(worker.errors).toHaveBeenCalled();
    });

    it("recupera datos frescos de red una vez que la conexión regresa", async () => {
        const worker = createWorker();
        worker.cachesByName.set("afk-runtime-v1", new Map([["/inspecciones/5", new Response("stale data")]]));
        const request = new Request("https://afk.test/inspecciones/5");
        Object.defineProperty(request, "mode", { value: "navigate" });

        worker.fetchMock.mockResolvedValue(new Response("fresh data after reconnect", { status: 200 }));
        const response = await dispatch(worker, "fetch", request);

        expect(await (response as Response).text()).toBe("fresh data after reconnect");
        const runtimeCache = worker.cachesByName.get("afk-runtime-v1");
        expect(await runtimeCache?.get("/inspecciones/5")?.text()).toBe("fresh data after reconnect");
    });

    it("conserva la versión anterior utilizable si la actualización a una nueva versión falla", async () => {
        const worker = createWorker();
        worker.cachesByName.set("afk-precache-v1", new Map([["/", new Response("shell v1")]]));
        worker.fetchMock.mockRejectedValue(new Error("no se pudo descargar la nueva versión"));

        await expect(dispatch(worker, "install")).rejects.toThrow("no se pudo descargar la nueva versión");

        expect(worker.cachesByName.has("afk-precache-v1")).toBe(true);

        const navRequest = navigationRequest("/");
        const response = await dispatch(worker, "fetch", navRequest);
        expect(await (response as Response).text()).toBe("shell v1");
    });

    it("nunca guarda en caché rutas sensibles ni solicitudes con credenciales", async () => {
        const worker = createWorker();
        worker.fetchMock.mockResolvedValue(new Response("respuesta sensible", { status: 200 }));

        const sensitiveRoutes = [
            "https://afk.test/api/inspecciones",
            "https://afk.test/auth/login",
            "https://afk.test/account",
        ];

        for (const url of sensitiveRoutes) {
            await dispatch(worker, "fetch", new Request(url));
        }

        const requestWithCookie = new Request("https://afk.test/perfil", {
            headers: { Cookie: "session=synthetic" },
        });
        await dispatch(worker, "fetch", requestWithCookie);

        const runtimeCache = worker.cachesByName.get("afk-runtime-v1");
        expect(runtimeCache?.size ?? 0).toBe(0);
    });

    it("instalar y activar varias veces no duplica ni corrompe el estado", async () => {
        const worker = createWorker();
        worker.fetchMock.mockResolvedValue(new Response("synthetic shell", { status: 200 }));

        await dispatch(worker, "install");
        await dispatch(worker, "install");

        const precache = worker.cachesByName.get("afk-precache-v1");
        expect(precache?.size).toBe(2);
        expect(await precache?.get("/")?.text()).toBe("synthetic shell");

        worker.errors.mockClear();

        await dispatch(worker, "activate");
        await dispatch(worker, "activate");

        expect(worker.cachesByName.has("afk-precache-v1")).toBe(true);
        expect(worker.self.clients.claim).toHaveBeenCalledTimes(2);
        expect(worker.errors).not.toHaveBeenCalled();
    });
});
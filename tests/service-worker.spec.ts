import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

type StoredResponse = Response;

function createWorker() {
  const cachesByName = new Map<string, Map<string, StoredResponse>>();
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
        match: async (request: Request | string) => entries.get(typeof request === "string" ? request : new URL(request.url).pathname),
        put: async (request: Request, response: StoredResponse) => entries.set(new URL(request.url).pathname, response),
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

describe("service worker", () => {
  it("instala el precache versionado y activa el worker", async () => {
    const worker = createWorker();
    worker.fetchMock.mockResolvedValue(new Response("synthetic", { status: 200 }));

    await dispatch(worker, "install");

    expect(worker.cachesByName.has("afk-precache-v1")).toBe(true);
    expect(worker.self.skipWaiting).toHaveBeenCalledOnce();
  });

  it("limpia solo versiones antiguas al activar", async () => {
    const worker = createWorker();
    worker.cachesByName.set("afk-precache-v1", new Map([["/", new Response("shell")]]));
    worker.cachesByName.set("afk-precache-v0", new Map());
    worker.cachesByName.set("foreign-cache", new Map());

    await dispatch(worker, "activate");

    expect(worker.cachesByName.has("afk-precache-v0")).toBe(false);
    expect(worker.cachesByName.has("foreign-cache")).toBe(true);
    expect(worker.self.clients.claim).toHaveBeenCalledOnce();
  });

  it("usa runtime cache y devuelve fallback offline para navegación", async () => {
    const worker = createWorker();
    worker.cachesByName.set("afk-precache-v1", new Map([["/", new Response("offline shell")]]));
    worker.fetchMock.mockRejectedValue(new Error("offline"));
    const navigationRequest = new Request("https://afk.test/");
    Object.defineProperty(navigationRequest, "mode", { value: "navigate" });

    const response = await dispatch(worker, "fetch", navigationRequest);

    expect(await (response as Response).text()).toBe("offline shell");
    expect(worker.errors).toHaveBeenCalled();
  });

  it("no guarda solicitudes sensibles ni PII potencial", async () => {
    const worker = createWorker();
    worker.fetchMock.mockResolvedValue(new Response("synthetic", { status: 200 }));
    const request = new Request("https://afk.test/api/users", {
      headers: { Authorization: "Bearer synthetic", Cookie: "session=synthetic" },
    });

    await dispatch(worker, "fetch", request);

    expect([...worker.cachesByName.values()].every((cache) => cache.size === 0)).toBe(true);
    expect(worker.fetchMock).toHaveBeenCalledWith(request);
  });

  it("conserva la caché válida si falla una actualización", async () => {
    const worker = createWorker();
    worker.cachesByName.set("afk-precache-v0", new Map([["/", new Response("previous")]]));
    worker.fetchMock
      .mockResolvedValueOnce(new Response("new shell", { status: 200 }))
      .mockRejectedValueOnce(new Error("manifest unavailable"));

    await expect(dispatch(worker, "install")).rejects.toThrow("manifest unavailable");

    expect(await worker.cachesByName.get("afk-precache-v0")?.get("/")?.text()).toBe("previous");
    expect(worker.cachesByName.has("afk-precache-v0")).toBe(true);
    expect(worker.errors).toHaveBeenCalled();
  });
});
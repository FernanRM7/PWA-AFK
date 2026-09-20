import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const root = resolve(import.meta.dirname, "..");

async function loadRegistrationModule() {
  vi.resetModules();
  return import("../src/lib/pwa/register-service-worker");
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("registerServiceWorker", () => {
  it("no accede a APIs del navegador durante SSR", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("navigator", undefined);
    const { registerServiceWorker } = await loadRegistrationModule();

    await expect(registerServiceWorker()).resolves.toBeUndefined();
  });

  it("no intenta registrar cuando el navegador no soporta service workers", async () => {
    const register = vi.fn();
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {});
    const { registerServiceWorker } = await loadRegistrationModule();

    await expect(registerServiceWorker()).resolves.toBeUndefined();
    expect(register).not.toHaveBeenCalled();
  });

  it("registra /sw.js con alcance de la aplicación", async () => {
    const registration = {} as ServiceWorkerRegistration;
    const register = vi.fn().mockResolvedValue(registration);
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    const { registerServiceWorker } = await loadRegistrationModule();

    await expect(registerServiceWorker()).resolves.toBe(registration);
    expect(register).toHaveBeenCalledOnce();
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("comparte la promesa y evita registros duplicados concurrentes", async () => {
    let resolveRegistration!: (registration: ServiceWorkerRegistration) => void;
    const registrationPromise = new Promise<ServiceWorkerRegistration>((resolve) => {
      resolveRegistration = resolve;
    });
    const register = vi.fn().mockReturnValue(registrationPromise);
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    const { registerServiceWorker } = await loadRegistrationModule();

    const firstCall = registerServiceWorker();
    const secondCall = registerServiceWorker();

    expect(firstCall).toBe(secondCall);
    expect(register).toHaveBeenCalledOnce();
    resolveRegistration({} as ServiceWorkerRegistration);
    await expect(firstCall).resolves.toBeDefined();
  });

  it("registra el error y permite un reintento explícito", async () => {
    const error = new Error("registration failed");
    const registration = {} as ServiceWorkerRegistration;
    const register = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(registration);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    const { registerServiceWorker } = await loadRegistrationModule();

    await expect(registerServiceWorker()).resolves.toBeUndefined();
    await expect(registerServiceWorker()).resolves.toBe(registration);

    expect(errorSpy).toHaveBeenCalledWith(
      "[pwa] No se pudo registrar el service worker",
      error,
    );
    expect(register).toHaveBeenCalledTimes(2);
  });
});

describe("updateServiceWorker", () => {
  it("actualiza sólo cuando se solicita mediante la registration", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const registration = { update } as unknown as ServiceWorkerRegistration;
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {});
    const { updateServiceWorker } = await loadRegistrationModule();

    await expect(updateServiceWorker(registration)).resolves.toBe(registration);
    expect(update).toHaveBeenCalledOnce();
  });

  it("captura errores de actualización sin romper la aplicación", async () => {
    const error = new Error("update failed");
    const update = vi.fn().mockRejectedValue(error);
    const registration = { update } as unknown as ServiceWorkerRegistration;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {});
    const { updateServiceWorker } = await loadRegistrationModule();

    await expect(updateServiceWorker(registration)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      "[pwa] No se pudo actualizar el service worker",
      error,
    );
  });
});

describe("integración cliente", () => {
  it("monta el registrador desde el layout sin convertirlo en Server Component", () => {
    const layout = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");
    const registrar = readFileSync(
      resolve(root, "src/components/pwa/service-worker-registrar.tsx"),
      "utf8",
    );

    expect(layout).toMatch(/ServiceWorkerRegistrar/);
    expect(registrar).toMatch(/^"use client";/);
    expect(registrar).toMatch(/registerServiceWorker\(\)/);
  });
});

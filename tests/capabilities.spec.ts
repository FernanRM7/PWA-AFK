import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalNotificationClient,
  type NotificationEnvironment,
} from "../src/lib/notifications/client";
import {
  guardarInspeccion,
  obtenerTodasLasInspecciones,
} from "../src/lib/storage/inspection-store";

const DATABASE_NAME = "afk-inspections-db";

async function resetDatabase() {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

function notificationEnvironment(
  permission: "default" | "granted" | "denied" = "default",
  overrides: Partial<NotificationEnvironment> = {},
) {
  let currentPermission = permission;
  const requestPermission = vi.fn(async () => {
    currentPermission = "granted" as const;
    return currentPermission;
  });
  const showNotification = vi.fn(async () => undefined);
  const environment: NotificationEnvironment = {
    getPermission: () => currentPermission,
    requestPermission,
    getServiceWorkerRegistration: async () => ({ showNotification }),
    showBrowserNotification: vi.fn(),
    ...overrides,
  };

  return { environment, requestPermission, showNotification };
}

describe("notificaciones locales con permiso explícito", () => {
  it("no pide permiso al crear el cliente ni al consultar el estado", async () => {
    const { environment, requestPermission } = notificationEnvironment();
    const client = createLocalNotificationClient(environment);

    expect(client.getPermission()).toBe("default");
    expect(requestPermission).not.toHaveBeenCalled();
    await expect(client.notifyInspectionSaved()).resolves.toBe("unsupported");
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("solicita permiso únicamente cuando se invoca la acción explícita", async () => {
    const { environment, requestPermission } = notificationEnvironment();
    const client = createLocalNotificationClient(environment);

    await expect(client.requestPermission()).resolves.toBe("granted");
    expect(requestPermission).toHaveBeenCalledOnce();
  });

  it("usa la notificación del Service Worker si el permiso ya está concedido", async () => {
    const { environment, showNotification, requestPermission } = notificationEnvironment("granted");
    const client = createLocalNotificationClient(environment);

    await expect(client.notifyInspectionSaved()).resolves.toBe("shown");
    expect(showNotification).toHaveBeenCalledWith("Inspección guardada", {
      body: "Se guardó una inspección sintética.",
      tag: "inspection-saved",
    });
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it("usa la API local del navegador si el Service Worker falla", async () => {
    const showBrowserNotification = vi.fn();
    const { environment } = notificationEnvironment("granted", {
      getServiceWorkerRegistration: async () => { throw new Error("synthetic service worker failure"); },
      showBrowserNotification,
    });
    const client = createLocalNotificationClient(environment);

    await expect(client.notifyInspectionSaved()).resolves.toBe("shown");
    expect(showBrowserNotification).toHaveBeenCalledOnce();
  });

  it("devuelve fallback cuando el permiso fue denegado o la API no existe", async () => {
    const denied = createLocalNotificationClient(notificationEnvironment("denied").environment);
    const unsupported = createLocalNotificationClient(null);

    await expect(denied.notifyInspectionSaved()).resolves.toBe("denied");
    await expect(unsupported.requestPermission()).resolves.toBe("unsupported");
    await expect(unsupported.notifyInspectionSaved()).resolves.toBe("unsupported");
  });

  it("convierte errores de entrega en fallback recuperable", async () => {
    const { environment } = notificationEnvironment("granted", {
      getServiceWorkerRegistration: async () => ({
        showNotification: vi.fn().mockRejectedValue(new Error("synthetic delivery failure")),
      }),
      showBrowserNotification: vi.fn(() => { throw new Error("synthetic fallback failure"); }),
    });

    await expect(createLocalNotificationClient(environment).notifyInspectionSaved()).resolves.toBe("error");
  });
});

describe("privacidad de capacidades en la inspección persistida", () => {
  beforeEach(resetDatabase);

  it("guarda sólo los campos sintéticos permitidos, excluyendo foto y coordenadas", async () => {
    const photo = new Blob(["synthetic photo"], { type: "image/jpeg" });
    const result = await guardarInspeccion({
      location: "Laboratorio sintético",
      date: "2026-10-11",
      inspector: "Técnica sintética A",
      status: "ok",
      findings: 0,
      summary: "Inspección sintética sin datos de sensores.",
      photo,
      previewUrl: "blob:synthetic-preview",
      coordinates: { latitude: 19.4326, longitude: -99.1332 },
      latitude: 19.4326,
      longitude: -99.1332,
    });

    expect(result.ok).toBe(true);
    const [stored] = await obtenerTodasLasInspecciones();
    expect(stored).toBeDefined();
    expect(stored).not.toHaveProperty("photo");
    expect(stored).not.toHaveProperty("previewUrl");
    expect(stored).not.toHaveProperty("coordinates");
    expect(stored).not.toHaveProperty("latitude");
    expect(stored).not.toHaveProperty("longitude");
  });
});

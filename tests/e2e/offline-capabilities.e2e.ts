import { expect, test, type Page } from "@playwright/test";

const databaseName = "afk-inspections-db";
const storeName = "inspections";

async function clearDatabase(page: Page) {
  await page.evaluate(
    ({ databaseName, storeName }) =>
      new Promise<void>((resolve, reject) => {
        const openRequest = indexedDB.open(databaseName, 2);
        openRequest.onupgradeneeded = () => {
          const database = openRequest.result;
          if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, { keyPath: "id" });
          }
        };
        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const transaction = database.transaction(storeName, "readwrite");
          transaction.objectStore(storeName).clear();
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
    { databaseName, storeName },
  );
}

async function readInspections(page: Page) {
  return page.evaluate(
    ({ databaseName, storeName }) =>
      new Promise<Array<{
        id: string;
        location: string;
        inspector: string;
        summary: string;
        sync: { idempotencyKey: string; status: string; attempts: number };
      }>>((resolve, reject) => {
        const request = indexedDB.open(databaseName, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(storeName, "readonly");
          const result = transaction.objectStore(storeName).getAll();
          result.onsuccess = () => {
            database.close();
            resolve(result.result);
          };
          result.onerror = () => reject(result.error);
        };
      }),
    { databaseName, storeName },
  );
}

async function prepareInspectionPage(page: Page) {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await clearDatabase(page);
  await page.context().clearCookies();
  await page.evaluate(async () => {
    await Promise.all((await caches.keys()).map((cacheName) => caches.delete(cacheName)));
  });
  await page.goto("/inspecciones");
  await expect(page.getByRole("heading", { name: "Inspecciones de laboratorio" })).toBeVisible();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Captura rápida (sintética)" })).toBeVisible();
}

async function fillSyntheticInspection(page: Page, uniqueLabel: string) {
  await page.getByLabel("Laboratorio", { exact: true }).fill(`Laboratorio E2E ${uniqueLabel}`);
  await page.getByLabel("Fecha", { exact: true }).fill("2026-10-23");
  await page.getByLabel("Inspector", { exact: true }).fill("Inspector de prueba");
  await page.getByLabel("Resumen", { exact: true }).fill(`Registro sintético ${uniqueLabel}`);
}

function syncStatus(page: Page) {
  return page.locator('div[role="status"][aria-live="polite"]');
}

test("guarda offline, sobrevive la recarga y sincroniza una sola vez", async ({ page, context }) => {
  await prepareInspectionPage(page);
  await fillSyntheticInspection(page, "offline");

  await context.setOffline(true);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false);
  await page.getByRole("button", { name: "Guardar inspección" }).click();

  await expect(page.getByTestId("stored-inspections")).toContainText("Laboratorio E2E offline");
  await expect(syncStatus(page)).toContainText("1 inspecciones pendientes");
  const savedOffline = await readInspections(page);
  expect(savedOffline).toHaveLength(1);
  expect(savedOffline[0]).toMatchObject({
    location: "Laboratorio E2E offline",
    inspector: "Inspector de prueba",
    summary: "Registro sintético offline",
    sync: { idempotencyKey: `inspection:${savedOffline[0].id}`, status: "pending", attempts: 0 },
  });

  await page.reload();
  await expect(page.getByRole("heading", { name: "Inspecciones de laboratorio" })).toBeVisible();
  await expect(page.getByTestId("stored-inspections")).toContainText("Laboratorio E2E offline");
  expect(await readInspections(page)).toHaveLength(1);

  await context.setOffline(false);
  await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(true);
  await expect(syncStatus(page)).toContainText("1 inspecciones completadas");

  const synchronized = await readInspections(page);
  expect(synchronized).toHaveLength(1);
  expect(synchronized[0].id).toBe(savedOffline[0].id);
  expect(synchronized[0].sync).toEqual({
    idempotencyKey: `inspection:${savedOffline[0].id}`,
    status: "synced",
    attempts: 1,
  });

  await page.reload();
  await expect(syncStatus(page)).toContainText("1 inspecciones completadas");
  expect(await readInspections(page)).toHaveLength(1);
});

test("completa y guarda la captura aunque la geolocalización no exista", async ({ page }) => {
  await prepareInspectionPage(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Captura rápida (sintética)" })).toBeVisible();

  await page.getByRole("button", { name: "Consultar ubicación actual" }).click();
  await expect(
    page.getByText("Este dispositivo no ofrece ubicación. Puedes guardar la inspección sin ella.", { exact: true }),
  ).toBeVisible();
  await fillSyntheticInspection(page, "sin-geolocalizacion");
  await page.getByRole("button", { name: "Guardar inspección" }).click();

  await expect(page.getByTestId("stored-inspections")).toContainText("Laboratorio E2E sin-geolocalizacion");
  const saved = await readInspections(page);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({
    location: "Laboratorio E2E sin-geolocalizacion",
    inspector: "Inspector de prueba",
    summary: "Registro sintético sin-geolocalizacion",
    sync: { status: "synced", attempts: 1 },
  });
});

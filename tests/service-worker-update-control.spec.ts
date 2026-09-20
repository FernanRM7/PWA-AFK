import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { checkForServiceWorkerUpdate } from "../src/lib/pwa/service-worker-update";

const controlPath = resolve(
  import.meta.dirname,
  "../src/components/pwa/service-worker-update-control.tsx",
);
const headerPath = resolve(
  import.meta.dirname,
  "../src/components/dashboard-01/dashboard-header.tsx",
);

const control = readFileSync(controlPath, "utf8");

describe("ServiceWorkerUpdateControl", () => {
  it("muestra la acción y el estado disponible inicialmente", () => {
    expect(control).toMatch(/useState<[^>]+>\("disponible"\)/);
    expect(control).toContain("Buscar actualización");
    expect(control).toContain("Disponible");
  });

  it("transiciona a actualizado cuando la comprobación devuelve una registration", async () => {
    const update = vi.fn().mockResolvedValue({} as ServiceWorkerRegistration);

    await expect(checkForServiceWorkerUpdate(update)).resolves.toBe("actualizado");
    expect(update).toHaveBeenCalledOnce();
  });

  it("transiciona a error cuando no hay registration disponible", async () => {
    const update = vi.fn().mockResolvedValue(undefined);

    await expect(checkForServiceWorkerUpdate(update)).resolves.toBe("error");
  });

  it("conserva el estado de error si la comprobación falla", async () => {
    const update = vi.fn().mockRejectedValue(new Error("offline"));

    await expect(checkForServiceWorkerUpdate(update)).resolves.toBe("error");
  });

  it("deshabilita el botón mientras comprueba y anuncia los estados", () => {
    expect(control).toMatch(/disabled=\{checking\}/);
    expect(control).toMatch(/aria-live="polite"/);
    for (const status of ["comprobando", "actualizado", "error"]) {
      expect(control).toContain(status[0].toUpperCase() + status.slice(1));
    }
  });

  it("usa updateServiceWorker desde el encabezado visible de AppShell", () => {
    const header = readFileSync(headerPath, "utf8");

    expect(header).toMatch(/ServiceWorkerUpdateControl/);
    expect(control).toMatch(/updateServiceWorker/);
    expect(control).not.toMatch(/location\.reload|window\.location/);
  });
});

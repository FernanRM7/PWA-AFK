import { describe, expect, it, vi } from "vitest";
import {
  getCurrentLocation,
  type GeolocationProvider,
} from "../src/lib/device/geolocation";
import { validarBorradorInspeccion } from "../src/lib/storage/schema";

const syntheticPosition = {
  coords: { latitude: 19.4326, longitude: -99.1332, accuracy: 25 },
  timestamp: 0,
} as GeolocationPosition;

function providerFor(errorCode?: number): GeolocationProvider {
  return {
    getCurrentPosition: vi.fn((success: PositionCallback, error: PositionErrorCallback) => {
      if (errorCode === undefined) success(syntheticPosition);
      else error({ code: errorCode } as GeolocationPositionError);
    }),
  } as unknown as GeolocationProvider;
}

describe("consulta opcional de geolocalización", () => {
  it("devuelve coordenadas sólo como resultado temporal y solicita baja precisión", async () => {
    const provider = providerFor();

    await expect(getCurrentLocation(provider)).resolves.toEqual({
      status: "available",
      coordinates: { latitude: 19.4326, longitude: -99.1332, accuracy: 25 },
    });
    expect(provider.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: false, maximumAge: 0, timeout: 10_000 },
    );
  });

  it.each([
    [1, "denied"],
    [3, "timeout"],
    [2, "error"],
  ] as const)("clasifica el error de proveedor %i como %s", async (code, status) => {
    await expect(getCurrentLocation(providerFor(code))).resolves.toEqual({ status });
  });

  it("indica que la API no está disponible sin invocar un proveedor", async () => {
    await expect(getCurrentLocation(null)).resolves.toEqual({ status: "unavailable" });
  });

  it("clasifica una excepción del proveedor como error recuperable", async () => {
    const provider = {
      getCurrentPosition: vi.fn(() => { throw new Error("synthetic provider failure"); }),
    } as unknown as GeolocationProvider;

    await expect(getCurrentLocation(provider)).resolves.toEqual({ status: "error" });
  });

  it("descarta coordenadas extra al validar el borrador persistible", () => {
    const result = validarBorradorInspeccion({
      location: "Laboratorio sintético",
      date: "2026-10-09",
      inspector: "Técnica sintética A",
      status: "ok",
      findings: 0,
      summary: "Captura sintética sin ubicación persistida.",
      coordinates: { latitude: 19.4326, longitude: -99.1332 },
      latitude: 19.4326,
      longitude: -99.1332,
    });

    expect(result.valido).toBe(true);
    if (result.valido) {
      expect(result.valor).not.toHaveProperty("latitude");
      expect(result.valor).not.toHaveProperty("longitude");
      expect(result.valor).not.toHaveProperty("coordinates");
    }
  });
});
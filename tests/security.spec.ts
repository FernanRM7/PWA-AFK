import { describe, expect, it } from "vitest";
import {
  esEnteroNoNegativoLimitado,
  esFechaIsoCalendarioValida,
  MAX_INSPECTION_FINDINGS,
  MAX_INSPECTION_INSPECTOR_LENGTH,
  MAX_INSPECTION_LOCATION_LENGTH,
  MAX_INSPECTION_SUMMARY_LENGTH,
  normalizarTextoLimitado,
} from "../src/lib/security/input-validation";
import { validarBorradorInspeccion } from "../src/lib/storage/schema";

const borradorSintetico = {
  location: "  Laboratorio sintético  ",
  date: "2024-02-29",
  inspector: " Técnica sintética A ",
  status: "ok",
  findings: 2,
  summary: " Revisión sintética.\r\nSin datos reales. ",
};

describe("validación de entradas de seguridad", () => {
  it("normaliza texto al recortar espacios, convertir saltos de línea y aplicar NFC", () => {
    expect(normalizarTextoLimitado("  Cafe\u0301\r\nsintético  ", 30, true))
      .toBe("Café\nsintético");
  });

  it("rechaza texto vacío, controles y texto por encima del límite", () => {
    expect(normalizarTextoLimitado(" \t ", 10)).toBeNull();
    expect(normalizarTextoLimitado("texto\u0000inválido", 30)).toBeNull();
    expect(normalizarTextoLimitado("12345", 4)).toBeNull();
  });

  it("permite saltos de línea en resúmenes, pero no otros controles", () => {
    expect(normalizarTextoLimitado("línea 1\nlínea 2", 30, true)).toBe("línea 1\nlínea 2");
    expect(normalizarTextoLimitado("línea 1\t línea 2", 30, true)).toBeNull();
  });

  it.each([
    ["2024-02-29", true],
    ["2023-02-29", false],
    ["2024-04-31", false],
    ["0000-01-01", false],
    ["2024-2-09", false],
    ["2024-13-01", false],
  ])("valida fecha calendario %s", (date, expected) => {
    expect(esFechaIsoCalendarioValida(date)).toBe(expected);
  });

  it.each([
    [0, true],
    [MAX_INSPECTION_FINDINGS, true],
    [-1, false],
    [MAX_INSPECTION_FINDINGS + 1, false],
    [1.5, false],
    [Number.MAX_SAFE_INTEGER + 1, false],
    [Number.POSITIVE_INFINITY, false],
  ])("valida el límite de hallazgos %s", (value, expected) => {
    expect(esEnteroNoNegativoLimitado(value, MAX_INSPECTION_FINDINGS)).toBe(expected);
  });

  it("normaliza sólo los campos permitidos y descarta secretos y datos de ubicación extra", () => {
    const result = validarBorradorInspeccion({
      ...borradorSintetico,
      password: "synthetic-password-never-persist",
      accessToken: "synthetic-token-never-persist",
      latitude: 19.4326,
      longitude: -99.1332,
    });

    expect(result.valido).toBe(true);
    if (result.valido) {
      expect(result.valor).toEqual({
        location: "Laboratorio sintético",
        date: "2024-02-29",
        inspector: "Técnica sintética A",
        status: "ok",
        findings: 2,
        summary: "Revisión sintética.\nSin datos reales.",
      });
      expect(result.valor).not.toHaveProperty("password");
      expect(result.valor).not.toHaveProperty("accessToken");
      expect(result.valor).not.toHaveProperty("latitude");
      expect(result.valor).not.toHaveProperty("longitude");
    }
  });

  it("rechaza fechas imposibles, tipos erróneos y campos por encima de sus límites", () => {
    const invalidCases = [
      { ...borradorSintetico, date: "2023-02-29" },
      { ...borradorSintetico, location: "x".repeat(MAX_INSPECTION_LOCATION_LENGTH + 1) },
      { ...borradorSintetico, inspector: "x".repeat(MAX_INSPECTION_INSPECTOR_LENGTH + 1) },
      { ...borradorSintetico, summary: "x".repeat(MAX_INSPECTION_SUMMARY_LENGTH + 1) },
      { ...borradorSintetico, findings: MAX_INSPECTION_FINDINGS + 1 },
    ];

    for (const input of invalidCases) {
      expect(validarBorradorInspeccion(input).valido).toBe(false);
    }
  });

  it.each([null, undefined, "texto", 42, [], new Date()])(
    "rechaza entradas que no son un objeto simple de datos: %s",
    (input) => {
      expect(validarBorradorInspeccion(input).valido).toBe(false);
    },
  );

  it("rechaza propiedades heredadas o getters sin ejecutarlos", () => {
    const inherited = Object.create(borradorSintetico);
    expect(validarBorradorInspeccion(inherited).valido).toBe(false);

    let getterInvoked = false;
    const withGetter = {
      ...borradorSintetico,
      get location() {
        getterInvoked = true;
        return "Laboratorio sintético";
      },
    };

    expect(validarBorradorInspeccion(withGetter).valido).toBe(false);
    expect(getterInvoked).toBe(false);
  });
});

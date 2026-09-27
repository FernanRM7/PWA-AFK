import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import InspectionsPage from "../src/app/inspecciones/page";
import InspectionDetailPage from "../src/app/inspecciones/[id]/page";
import InspectionNotFound from "../src/app/inspecciones/[id]/not-found";
import InspectionError from "../src/app/inspecciones/error";
import { LoadingState } from "../src/components/loading-state";
import { filterInspections, findInspectionById, inspections } from "../src/lib/data/inspections";

describe("rutas CSR y SSR de inspecciones", () => {
  it("mantiene la ruta de listado como componente cliente y presenta una carga inicial estable", () => {
    const markup = renderToStaticMarkup(createElement(InspectionsPage));
    const listSource = readFileSync(resolve(import.meta.dirname, "../src/app/inspecciones/page.tsx"), "utf8");

    expect(markup).toContain("Cargando inspecciones");
    expect(markup).toContain('aria-busy="true"');
    expect(listSource.startsWith('"use client"')).toBe(true);
  });

  it("filtra registros sintéticos sin depender de la red", () => {
    expect(filterInspections("  electrónica ")).toEqual([inspections[1]]);
    expect(filterInspections("Técnica C")).toEqual([inspections[2]]);
    expect(filterInspections("no existe")).toEqual([]);
  });

  it("resuelve el registro por id y devuelve ausencia para un id desconocido", () => {
    expect(findInspectionById("inspection-001")).toEqual(inspections[0]);
    expect(findInspectionById("missing")).toBeUndefined();
  });

  it("muestra una carga explícita del detalle cuando se solicita el estado de prueba", () => {
    const page = InspectionDetailPage({
      params: { id: "inspection-001" },
      searchParams: { estado: "cargando" },
    });

    expect(renderToStaticMarkup(page)).toContain("Cargando detalle");
  });

  it("renderiza el detalle desde el servidor con sus datos sintéticos", () => {
    const detailSource = readFileSync(resolve(import.meta.dirname, "../src/app/inspecciones/[id]/page.tsx"), "utf8");
    const page = InspectionDetailPage({ params: { id: "inspection-002" } });
    const markup = renderToStaticMarkup(page);

    expect(detailSource).not.toMatch(/^\s*"use client"/);
    expect(detailSource).toContain('dynamic = "force-dynamic"');
    expect(markup).toContain("Laboratorio de Electrónica");
    expect(markup).toContain("Técnico B");
    expect(markup).toContain("renderizado del lado del servidor");
  });

  it("envía ids inexistentes y fallos simulados a sus fallbacks verificables", () => {
    expect(() => InspectionDetailPage({ params: { id: "missing" } })).toThrow();
    expect(() => InspectionDetailPage({
      params: { id: "inspection-001" },
      searchParams: { estado: "error" },
    })).toThrow("Fallo de carga solicitado");
    expect(renderToStaticMarkup(createElement(InspectionNotFound))).toContain("Inspección no encontrada");
  });

  it("expone el fallback de error accesible y una acción de reintento", () => {
    const markup = renderToStaticMarkup(createElement(InspectionError, {
      error: new Error("fallo sintético"),
      reset: vi.fn(),
    }));

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Reintentar");
    expect(markup).toContain("No se pudo cargar el detalle");
  });

  it("mantiene el estado de error compartido accesible", () => {
    const markup = renderToStaticMarkup(createElement(LoadingState, {
      description: "Intenta de nuevo.",
      kind: "error",
      onRetry: vi.fn(),
      title: "No se pudo cargar",
    }));

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Reintentar");
  });
});

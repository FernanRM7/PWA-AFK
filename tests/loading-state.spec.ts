import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LoadingState } from "../src/components/loading-state";

describe("LoadingState", () => {
  it("expone el estado de carga y respeta movimiento reducido", () => {
    const markup = renderToStaticMarkup(createElement(LoadingState, {
      description: "Contenido sintético de prueba.",
      kind: "loading",
      title: "Cargando datos sintéticos",
    }));

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("motion-reduce:animate-none");
  });

  it("expone el estado de error y el botón para reintentar", () => {
    const markup = renderToStaticMarkup(createElement(LoadingState, {
      description: "Error sintético de prueba.",
      kind: "error",
      onRetry: vi.fn(),
      title: "No se pudieron cargar los datos sintéticos",
    }));

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("<button");
    expect(markup).toContain("Reintentar");
  });
});
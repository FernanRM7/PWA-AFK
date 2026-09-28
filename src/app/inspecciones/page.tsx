"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/components/loading-state";
import { filterInspections } from "@/lib/data/inspections";

type ListState = "loading" | "error" | "success";

export default function InspectionsPage() {
  const [state, setState] = useState<ListState>("loading");
  const [query, setQuery] = useState("");
  const visibleInspections = useMemo(() => filterInspections(query), [query]);

  useEffect(() => {
    const requestedState = new URLSearchParams(window.location.search).get("estado");
    if (requestedState === "cargando") return;

    const timeout = window.setTimeout(() => {
      setState(requestedState === "error" ? "error" : "success");
    }, 120);
    return () => window.clearTimeout(timeout);
  }, []);

  function retry() {
    setState("loading");
    window.setTimeout(() => setState("success"), 120);
  }

  return (
    <main aria-busy={state === "loading"} className="mx-auto min-h-dvh w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <header className="space-y-2">
        <a className="text-sm text-primary underline underline-offset-4" href="/">Volver al resumen</a>
        <p className="text-sm text-muted-foreground">Datos sintéticos · renderizado del lado del cliente</p>
        <h1 className="text-2xl font-semibold tracking-tight">Inspecciones de laboratorio</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">Busca y abre registros de mantenimiento de demostración.</p>
      </header>

      {state === "loading" && (
        <LoadingState
          description="Preparando el listado de inspecciones sintéticas."
          kind="loading"
          title="Cargando inspecciones"
        />
      )}
      {state === "error" && (
        <LoadingState
          description="No fue posible preparar el listado. Puedes intentarlo de nuevo."
          kind="error"
          onRetry={retry}
          title="No se pudieron cargar las inspecciones"
        />
      )}
      {state === "success" && (
        <section aria-labelledby="list-heading" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="inspection-search">Filtrar por laboratorio, inspector o estado</label>
            <input
              autoComplete="off"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="inspection-search"
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              value={query}
            />
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold" id="list-heading">Registros</h2>
            <p aria-live="polite" className="text-sm text-muted-foreground">{visibleInspections.length} de {filterInspections("").length} inspecciones</p>
          </div>
          {visibleInspections.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visibleInspections.map((inspection) => (
                <li className="rounded-xl border bg-card p-5 shadow-sm" key={inspection.id}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{inspection.location}</h3>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{inspection.statusLabel}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{inspection.summary}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">Fecha</dt><dd><time dateTime={inspection.date}>{inspection.date}</time></dd></div>
                    <div><dt className="text-muted-foreground">Hallazgos</dt><dd>{inspection.findings}</dd></div>
                  </dl>
                  <a className="mt-4 inline-flex min-h-10 items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/inspecciones/${inspection.id}`}>
                    Ver detalle de {inspection.location}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No hay inspecciones que coincidan con la búsqueda.</p>
          )}
        </section>
      )}
    </main>
  );
}

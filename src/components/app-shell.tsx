"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { DotmSquare3 } from "@/components/ui/dotm-square-3";
import { Button } from "@/components/ui/button";

export type ShellState = "loading" | "error" | "empty" | "success";

type ShellStateContextValue = {
  state: ShellState;
  setState: (state: ShellState) => void;
};

const ShellStateContext = createContext<ShellStateContextValue | null>(null);

export function useShellState() {
  const context = useContext(ShellStateContext);
  if (!context) {
    throw new Error("useShellState must be used within AppShell.");
  }
  return context;
}

export function AppShell({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<ShellState>("success");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("estado");
    const stateByQuery: Record<string, ShellState> = {
      cargando: "loading",
      error: "error",
      vacio: "empty",
      exito: "success",
    };
    if (requested && stateByQuery[requested]) {
      setState(stateByQuery[requested]);
    }
  }, []);

  return (
    <ShellStateContext.Provider value={{ state, setState }}>
      <div className="min-h-dvh bg-background text-foreground">
        <header className="sr-only">
          <h1>Inspecciones de laboratorio</h1>
          <nav aria-label="Navegación principal">
            <a href="#overview">Resumen</a>
            <a href="/reportes">Reportes</a>
          </nav>
        </header>
        <main aria-busy={state === "loading"} aria-live="polite" className="min-h-dvh">
          <div className="sr-only" aria-label="Selector de estado de la vista">
            <Button onClick={() => setState("loading")} type="button">Cargando</Button>
            <Button onClick={() => setState("error")} type="button">Error</Button>
            <Button onClick={() => setState("empty")} type="button">Vacío</Button>
            <Button onClick={() => setState("success")} type="button">Éxito</Button>
          </div>
          {state === "success" && children}
          {state === "loading" && <StatePanel title="Cargando inspecciones" description="Estamos preparando los registros sintéticos."><DotmSquare3 ariaLabel="Cargando inspecciones" colorPreset="solid-mint" size={56} /></StatePanel>}
          {state === "error" && <StatePanel title="No se pudieron cargar las inspecciones" description="Ocurrió un error al consultar los registros."><DotmSquare3 ariaLabel="Error al cargar inspecciones" color="#dc2626" size={56} /><Button onClick={() => setState("success")} type="button">Reintentar</Button></StatePanel>}
          {state === "empty" && <StatePanel title="No hay inspecciones" description="Todavía no existen registros sintéticos para mostrar."><DotmSquare3 ariaLabel="No hay inspecciones" color="#ca8a04" muted size={56} /></StatePanel>}
        </main>
        <footer className="sr-only">Datos sintéticos para demostración académica.</footer>
      </div>
    </ShellStateContext.Provider>
  );
}

function StatePanel({ title, description, children }: { readonly title: string; readonly description: string; readonly children: ReactNode }) {
  return (
    <section aria-labelledby="shell-state-title" className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
      <div>
        <h2 className="text-base font-semibold" id="shell-state-title">{title}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}

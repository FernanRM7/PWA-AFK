import { LoadingState } from "@/components/loading-state";

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl p-4 sm:p-8">
      <LoadingState description="Preparando el registro sintético en el servidor." kind="loading" title="Cargando detalle" />
    </main>
  );
}

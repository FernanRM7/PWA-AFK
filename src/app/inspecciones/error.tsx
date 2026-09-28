"use client";

import { LoadingState } from "@/components/loading-state";

export default function InspectionError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl p-4 sm:p-8">
      <LoadingState
        description="El servidor no pudo preparar este registro sintético. Vuelve a intentarlo."
        kind="error"
        onRetry={reset}
        title="No se pudo cargar el detalle"
      />
    </main>
  );
}

import { notFound } from "next/navigation";
import { LoadingState } from "@/components/loading-state";
import { findInspectionById } from "@/lib/data/inspections";

export const dynamic = "force-dynamic";

type InspectionDetailPageProps = {
  params: { id: string };
  searchParams?: { estado?: string };
};

export default function InspectionDetailPage({ params, searchParams }: InspectionDetailPageProps) {
  if (searchParams?.estado === "error") {
    throw new Error("Fallo de carga solicitado para verificar el estado de error.");
  }
  if (searchParams?.estado === "cargando") {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-3xl space-y-6 p-4 sm:p-8">
        <LoadingState description="Preparando el registro sintético en el servidor." kind="loading" title="Cargando detalle" />
      </main>
    );
  }

  const inspection = findInspectionById(params.id);
  if (!inspection) notFound();

  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl space-y-6 p-4 sm:p-8">
      <header className="space-y-2">
        <a className="text-sm text-primary underline underline-offset-4" href="/inspecciones">Volver a inspecciones</a>
        <p className="text-sm text-muted-foreground">Datos sintéticos · renderizado del lado del servidor</p>
        <h1 className="text-2xl font-semibold tracking-tight">{inspection.location}</h1>
        <p className="text-sm text-muted-foreground">Detalle de la inspección {inspection.id}</p>
      </header>
      <section aria-labelledby="detail-heading" className="space-y-4 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
        <h2 className="font-semibold" id="detail-heading">Registro de mantenimiento</h2>
        <p>{inspection.summary}</p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-muted-foreground">Fecha</dt><dd><time dateTime={inspection.date}>{inspection.date}</time></dd></div>
          <div><dt className="text-sm text-muted-foreground">Inspector</dt><dd>{inspection.inspector}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Estado</dt><dd>{inspection.statusLabel}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Hallazgos</dt><dd>{inspection.findings}</dd></div>
        </dl>
      </section>
    </main>
  );
}

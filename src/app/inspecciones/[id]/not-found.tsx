export default function InspectionNotFound() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl space-y-4 p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Inspección no encontrada</h1>
      <p className="text-sm text-muted-foreground">No existe un registro sintético con ese identificador.</p>
      <a className="inline-flex min-h-10 items-center text-primary underline underline-offset-4" href="/inspecciones">Volver a inspecciones</a>
    </main>
  );
}

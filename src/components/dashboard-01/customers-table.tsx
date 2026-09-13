'use client';

import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { inspections } from '@/lib/data/inspections';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function CustomersTable() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return inspections.filter((inspection) =>
      !term || [inspection.location, inspection.inspector, inspection.statusLabel]
        .some((value) => value.toLocaleLowerCase().includes(term))
    );
  }, [query]);

  return (
    <section aria-labelledby="inspections-heading" className="@container/customers w-full border-t" id="inspections">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-7 sm:py-6">
        <div>
          <h2 className="font-semibold text-sm leading-5 tracking-tight" id="inspections-heading">Inspecciones recientes</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">Registros sintéticos del starter para seguimiento de mantenimiento</p>
        </div>
        <label className="relative w-full sm:w-72">
          <span className="sr-only">Buscar inspecciones</span>
          <SearchIcon aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar laboratorio o responsable" value={query} />
        </label>
      </div>
      <div className="overflow-x-auto px-4 sm:px-7">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Laboratorio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Hallazgos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inspection) => (
              <TableRow key={inspection.id}>
                <TableCell className="font-medium">{inspection.location}</TableCell>
                <TableCell>{inspection.date}</TableCell>
                <TableCell>{inspection.inspector}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 font-medium text-foreground"><span aria-hidden="true" className={`size-2 rounded-full ${inspection.status === "ok" ? "bg-emerald-600" : "bg-amber-600"}`} />{inspection.statusLabel}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{inspection.findings}</TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow><TableCell className="h-28 text-center text-muted-foreground" colSpan={5}>No se encontraron inspecciones.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p aria-live="polite" className="px-4 py-4 text-[13px] text-muted-foreground sm:px-7">{filtered.length} de {inspections.length} inspecciones</p>
    </section>
  );
}

export type InspectionStatus = "ok" | "attention";

export type Inspection = {
  id: string;
  location: string;
  date: string;
  inspector: string;
  status: InspectionStatus;
  statusLabel: string;
  findings: number;
  summary: string;
};

export const inspections: Inspection[] = [
  {
    id: "inspection-001",
    location: "Laboratorio de Redes",
    date: "2026-08-28",
    inspector: "Técnica A",
    status: "ok",
    statusLabel: "Sin incidencias",
    findings: 0,
    summary: "Revisión visual de cableado, ventilación y estaciones de trabajo."
  },
  {
    id: "inspection-002",
    location: "Laboratorio de Electrónica",
    date: "2026-08-27",
    inspector: "Técnico B",
    status: "attention",
    statusLabel: "Requiere atención",
    findings: 2,
    summary: "Se registraron dos observaciones sintéticas para seguimiento de mantenimiento."
  },
  {
    id: "inspection-003",
    location: "Laboratorio de Software",
    date: "2026-08-26",
    inspector: "Técnica C",
    status: "ok",
    statusLabel: "Sin incidencias",
    findings: 0,
    summary: "Comprobación de equipo, señalización y disponibilidad del espacio."
  }
];

export function findInspectionById(id: string): Inspection | undefined {
  return inspections.find((inspection) => inspection.id === id);
}

export function filterInspections(query: string): Inspection[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("es-MX");
  if (!normalizedQuery) return inspections;

  return inspections.filter((inspection) =>
    [inspection.id, inspection.location, inspection.inspector, inspection.statusLabel]
      .some((value) => value.toLocaleLowerCase("es-MX").includes(normalizedQuery)),
  );
}

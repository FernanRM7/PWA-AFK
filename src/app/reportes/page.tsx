"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardHeader } from "@/components/dashboard-01/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-01/dashboard-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const reports = [
  { name: "Resumen semanal de mantenimiento", period: "26–30 ago 2026", inspections: 3, findings: 2, status: "Listo" },
  { name: "Incidencias por laboratorio", period: "Agosto 2026", inspections: 3, findings: 2, status: "Listo" },
  { name: "Seguimiento de hallazgos", period: "Agosto 2026", inspections: 1, findings: 2, status: "En revisión" },
];

export default function ReportsPage() {
  return (
    <AppShell>
      <SidebarProvider className="isolate min-h-dvh bg-background font-sans text-foreground antialiased [--chart-1:#3b82f6] [--chart-2:#d4d4d8] [--font-sans:system-ui,sans-serif] [--sidebar-width-icon:3.5rem]! [--sidebar-width:15.5rem]! **:data-[slot=sidebar-group-label]:transition-none **:data-[slot=sidebar-menu-button]:transition-none **:data-[slot=sidebar-container]:ease-[cubic-bezier(0.23,1,0.32,1)] **:data-[slot=sidebar-gap]:ease-[cubic-bezier(0.23,1,0.32,1)] dark:[--chart-2:#3f3f46] dark:[--sidebar-accent:#1a1a1a] dark:[--sidebar:#0d0d0d]" defaultOpen={false}>
        <a className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-background focus:p-3" href="#reports-content">Saltar a reportes</a>
        <DashboardSidebar activeLabel="Reportes" />
        <SidebarInset className="min-w-0" id="reports-content">
          <DashboardHeader title="Reportes" />
          <section aria-labelledby="reports-title" className="space-y-6 p-4 sm:p-7">
            <header>
              <p className="text-sm font-medium text-muted-foreground">Análisis sintético</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight" id="reports-title">Reportes de inspecciones</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Consulta resúmenes mockup de los registros de mantenimiento. Estos datos son únicamente demostrativos.</p>
            </header>
            <div className="grid gap-4 md:grid-cols-3">
              <Card size="sm"><CardHeader><CardTitle>Total de reportes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{reports.length}</CardContent></Card>
              <Card size="sm"><CardHeader><CardTitle>Inspecciones cubiertas</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">3</CardContent></Card>
              <Card size="sm"><CardHeader><CardTitle>Hallazgos registrados</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">2</CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Reportes recientes</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto px-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Reporte</TableHead><TableHead>Periodo</TableHead><TableHead>Inspecciones</TableHead><TableHead>Hallazgos</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                  <TableBody>{reports.map((report) => <TableRow key={report.name}><TableCell className="font-medium">{report.name}</TableCell><TableCell>{report.period}</TableCell><TableCell>{report.inspections}</TableCell><TableCell>{report.findings}</TableCell><TableCell><span className="inline-flex items-center gap-2 font-medium"><span aria-hidden="true" className={`size-2 rounded-full ${report.status === "Listo" ? "bg-emerald-600" : "bg-amber-600"}`} />{report.status}</span></TableCell></TableRow>)}</TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        </SidebarInset>
      </SidebarProvider>
    </AppShell>
  );
}

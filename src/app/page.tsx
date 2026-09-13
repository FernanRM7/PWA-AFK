"use client";

import { useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { CustomersTable } from "@/components/dashboard-01/customers-table";
import { DashboardHeader } from "@/components/dashboard-01/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-01/dashboard-sidebar";
import { AppShell } from "@/components/app-shell";
import { inspections } from "@/lib/data/inspections";

export default function Page() {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (
                event.key === "D" &&
                event.shiftKey &&
                !target.isContentEditable &&
                !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
            ) {
                document.documentElement.classList.toggle("dark");
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <AppShell>
            <SidebarProvider
                className="isolate min-h-dvh bg-background font-sans text-foreground antialiased [--chart-1:#3b82f6] [--chart-2:#d4d4d8] [--font-sans:system-ui,sans-serif] [--sidebar-width-icon:3.5rem]! [--sidebar-width:15.5rem]! **:data-[slot=sidebar-group-label]:transition-none **:data-[slot=sidebar-menu-button]:transition-none **:data-[slot=sidebar-container]:ease-[cubic-bezier(0.23,1,0.32,1)] **:data-[slot=sidebar-gap]:ease-[cubic-bezier(0.23,1,0.32,1)] dark:[--chart-2:#3f3f46] dark:[--sidebar-accent:#1a1a1a] dark:[--sidebar:#0d0d0d]"
                defaultOpen={false}
            >
                <h1 className="sr-only">Inspecciones de laboratorio</h1>
                <a
                    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-background focus:p-3"
                    href="#overview"
                >
                    Skip to dashboard
                </a>
                <DashboardSidebar />
                <SidebarInset className="min-w-0" id="overview">
                    <DashboardHeader />
                    <div className="@container/metrics border-b">
                        <dl className="grid @3xl/metrics:grid-cols-4 grid-cols-2">
                            {metrics.map((metric) => (
                                <div
                                    className="flex min-w-0 flex-col justify-center gap-2 border-b @3xl/metrics:border-b-0 @3xl/metrics:not-first:border-l @3xl/metrics:px-7 px-4 py-6 even:border-l [&:nth-last-child(-n+2)]:border-b-0"
                                    key={metric.label}
                                >
                                    <dt className="font-medium text-[color:var(--foreground)] text-sm sm:text-[0.875rem]">
                                        {metric.label}
                                    </dt>
                                    <dd className="flex flex-wrap items-baseline gap-2.5">
                                        <span className="font-semibold text-xl tabular-nums tracking-tight text-[color:var(--foreground)]">
                                            {metric.value}
                                        </span>
                                        <span
                                            className={cn(
                                                "font-medium text-[0.8125rem] tabular-nums",
                                                metric.changeClass,
                                            )}
                                        >
                                            {metric.change}
                                        </span>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                    <CustomersTable />
                </SidebarInset>
            </SidebarProvider>
        </AppShell>
    );
}

const metrics = [
    {
        label: "Inspecciones",
        value: String(inspections.length),
        change: "+8.2%",
        changeClass: "text-green-600 dark:text-green-400",
    },
    {
        label: "Sin incidencias",
        value: String(
            inspections.filter((inspection) => inspection.status === "ok")
                .length,
        ),
        change: "+0.6%",
        changeClass: "text-green-600 dark:text-green-400",
    },
    {
        label: "Requieren atención",
        value: String(
            inspections.filter(
                (inspection) => inspection.status === "attention",
            ).length,
        ),
        change: "-0.6%",
        changeClass: "text-red-600 dark:text-red-400",
    },
    {
        label: "Hallazgos",
        value: String(
            inspections.reduce(
                (total, inspection) => total + inspection.findings,
                0,
            ),
        ),
        change: "sintéticos",
        changeClass: "text-muted-foreground",
    },
];

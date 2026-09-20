"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateServiceWorker } from "@/lib/pwa/register-service-worker";
import {
  checkForServiceWorkerUpdate,
  type ServiceWorkerUpdateStatus,
} from "@/lib/pwa/service-worker-update";

const statusLabels: Record<ServiceWorkerUpdateStatus, string> = {
  disponible: "Disponible",
  comprobando: "Comprobando",
  actualizado: "Actualizado",
  error: "Error",
};

const statusVariants = {
  disponible: "outline",
  comprobando: "secondary",
  actualizado: "default",
  error: "destructive",
} as const;

export function ServiceWorkerUpdateControl() {
  const [status, setStatus] = useState<ServiceWorkerUpdateStatus>("disponible");
  const checking = status === "comprobando";

  const handleUpdate = async () => {
    if (checking) {
      return;
    }

    setStatus("comprobando");
    setStatus(await checkForServiceWorkerUpdate(updateServiceWorker));
  };

  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="flex items-center gap-2"
    >
      <Badge role="status" variant={statusVariants[status]}>
        {statusLabels[status]}
      </Badge>
      <Button
        aria-label="Buscar actualización del service worker"
        disabled={checking}
        onClick={handleUpdate}
        size="sm"
        type="button"
        variant="outline"
      >
        Buscar actualización
      </Button>
    </div>
  );
}

import { updateServiceWorker } from "./register-service-worker";

export type ServiceWorkerUpdateStatus =
  | "disponible"
  | "comprobando"
  | "actualizado"
  | "error";

type UpdateServiceWorker = typeof updateServiceWorker;

export async function checkForServiceWorkerUpdate(
  update: UpdateServiceWorker = updateServiceWorker,
): Promise<ServiceWorkerUpdateStatus> {
  try {
    const registration = await update();
    return registration ? "actualizado" : "error";
  } catch {
    return "error";
  }
}

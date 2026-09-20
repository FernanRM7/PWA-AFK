let registrationPromise: Promise<ServiceWorkerRegistration | undefined> | undefined;

function canRegisterServiceWorker() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator
  );
}

/**
 * Registers the application service worker without making SSR depend on browser APIs.
 * Concurrent calls share the same promise, so the browser receives one registration request.
 */
export function registerServiceWorker(scriptUrl = "/sw.js") {
  if (!canRegisterServiceWorker()) {
    return Promise.resolve(undefined);
  }

  if (registrationPromise) {
    return registrationPromise;
  }

  registrationPromise = navigator.serviceWorker
    .register(scriptUrl, { scope: "/" })
    .catch((error: unknown) => {
      console.error("[pwa] No se pudo registrar el service worker", error);
      registrationPromise = undefined;
      return undefined;
    });

  return registrationPromise;
}

/**
 * Checks for a new worker only when the caller explicitly requests it.
 * It never activates a waiting worker or reloads the page automatically.
 */
export async function updateServiceWorker(registration?: ServiceWorkerRegistration) {
  const currentRegistration = registration ?? (await registerServiceWorker());

  if (!currentRegistration) {
    return undefined;
  }

  try {
    await currentRegistration.update();
    return currentRegistration;
  } catch (error: unknown) {
    console.error("[pwa] No se pudo actualizar el service worker", error);
    return undefined;
  }
}

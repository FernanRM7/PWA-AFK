export type LocalNotificationPermission = "default" | "granted" | "denied";

export type NotificationCapabilityStatus =
  | LocalNotificationPermission
  | "unsupported"
  | "error";

export type NotificationDeliveryStatus = "shown" | "denied" | "unsupported" | "error";

export type ServiceWorkerNotificationTarget = Pick<ServiceWorkerRegistration, "showNotification">;

export type NotificationEnvironment = {
  getPermission: () => LocalNotificationPermission;
  requestPermission: () => Promise<LocalNotificationPermission>;
  getServiceWorkerRegistration?: () => Promise<ServiceWorkerNotificationTarget | undefined>;
  showBrowserNotification?: (title: string, options: NotificationOptions) => void;
};

function getBrowserEnvironment(): NotificationEnvironment | null {
  if (typeof window === "undefined" || typeof Notification === "undefined") return null;

  return {
    getPermission: () => Notification.permission,
    requestPermission: () => Notification.requestPermission(),
    getServiceWorkerRegistration: "serviceWorker" in navigator
      ? () => navigator.serviceWorker.getRegistration()
      : undefined,
    showBrowserNotification: (title, options) => {
      new Notification(title, options);
    },
  };
}

export function createLocalNotificationClient(
  environment: NotificationEnvironment | null = getBrowserEnvironment(),
) {
  function getPermission(): NotificationCapabilityStatus {
    if (!environment) return "unsupported";
    try {
      return environment.getPermission();
    } catch {
      return "error";
    }
  }

  async function requestPermission(): Promise<NotificationCapabilityStatus> {
    if (!environment) return "unsupported";
    try {
      return await environment.requestPermission();
    } catch {
      return "error";
    }
  }

  async function notifyInspectionSaved(): Promise<NotificationDeliveryStatus> {
    if (!environment) return "unsupported";

    let permission: LocalNotificationPermission;
    try {
      permission = environment.getPermission();
    } catch {
      return "error";
    }

    if (permission !== "granted") return permission === "denied" ? "denied" : "unsupported";

    const title = "Inspección guardada";
    const options: NotificationOptions = {
      body: "Se guardó una inspección sintética.",
      tag: "inspection-saved",
    };

    try {
      if (environment.getServiceWorkerRegistration) {
        const registration = await environment.getServiceWorkerRegistration();
        if (registration) {
          await registration.showNotification(title, options);
          return "shown";
        }
      }

      if (environment.showBrowserNotification) {
        environment.showBrowserNotification(title, options);
        return "shown";
      }

      return "unsupported";
    } catch {
      try {
        if (!environment.showBrowserNotification) return "error";
        environment.showBrowserNotification(title, options);
        return "shown";
      } catch {
        return "error";
      }
    }
  }

  return { getPermission, requestPermission, notifyInspectionSaved };
}

const localNotificationClient = createLocalNotificationClient();

export const getLocalNotificationPermission = localNotificationClient.getPermission;
export const requestLocalNotificationPermission = localNotificationClient.requestPermission;
export const notifyInspectionSaved = localNotificationClient.notifyInspectionSaved;

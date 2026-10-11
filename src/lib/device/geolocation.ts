export type GeolocationCoordinates = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type GeolocationResult =
  | { status: "available"; coordinates: GeolocationCoordinates }
  | { status: "denied" | "timeout" | "error" | "unavailable" };

export type GeolocationProvider = Pick<Geolocation, "getCurrentPosition">;

function getBrowserGeolocation(): GeolocationProvider | null {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return navigator.geolocation;
}

export function getCurrentLocation(
  provider: GeolocationProvider | null = getBrowserGeolocation(),
): Promise<GeolocationResult> {
  if (!provider) return Promise.resolve({ status: "unavailable" });

  return new Promise((resolve) => {
    const finish = (result: GeolocationResult) => resolve(result);

    try {
      provider.getCurrentPosition(
        (position) => finish({
          status: "available",
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
        }),
        (error) => finish({
          status: error.code === 1 ? "denied" : error.code === 3 ? "timeout" : "error",
        }),
        { enableHighAccuracy: false, maximumAge: 0, timeout: 10_000 },
      );
    } catch {
      finish({ status: "error" });
    }
  });
}
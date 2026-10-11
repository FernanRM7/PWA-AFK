"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoadingState } from "@/components/loading-state";
import { filterInspections } from "@/lib/data/inspections";
import { getCurrentLocation, type GeolocationResult } from "@/lib/device/geolocation";
import { abrirCamara, capturarFotograma, liberarCamara, type CapturaCamara } from "@/lib/device/camera";
import {
  getLocalNotificationPermission,
  notifyInspectionSaved,
  requestLocalNotificationPermission,
  type NotificationCapabilityStatus,
} from "@/lib/notifications/client";
import { guardarInspeccion, obtenerTodasLasInspecciones } from "@/lib/storage/inspection-store";
import {
  enqueueInspectionForSync,
  getSyncQueueSummary,
  resumeQueueOnOnline,
  retryFailedSync,
  syncPendingInspections,
} from "@/lib/sync/queue";
import type { SyncQueueSummary } from "@/lib/sync/queue";
import type { InspeccionGuardada } from "@/lib/storage/schema";

type ListState = "loading" | "error" | "success";

type EstadoCamara = "inactiva" | "abriendo" | "activa" | "capturada" | "denied" | "unavailable" | "error";

export default function InspectionsPage() {
  const [state, setState] = useState<ListState>("loading");
  const [query, setQuery] = useState("");
  const visibleInspections = useMemo(() => filterInspections(query), [query]);

  const [inspeccionesGuardadas, setInspeccionesGuardadas] = useState<InspeccionGuardada[]>([]);
  const [formulario, setFormulario] = useState({
    location: "",
    date: "",
    inspector: "",
    status: "ok" as "ok" | "attention",
    findings: "0",
    summary: "",
  });
  const [erroresFormulario, setErroresFormulario] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [resultadoUbicacion, setResultadoUbicacion] = useState<GeolocationResult | null>(null);
  const [consultandoUbicacion, setConsultandoUbicacion] = useState(false);
  const solicitudUbicacion = useRef(0);
  const [estadoCamara, setEstadoCamara] = useState<EstadoCamara>("inactiva");
  const [captura, setCaptura] = useState<CapturaCamara | null>(null);
  const solicitudCamara = useRef(0);
  const streamCamara = useRef<MediaStream | null>(null);
  const capturaRef = useRef<CapturaCamara | null>(null);
  const videoCamara = useRef<HTMLVideoElement | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncQueueSummary>({ pending: 0, syncing: 0, failed: 0, synced: 0 });
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationCapabilityStatus>("default");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [requestingNotificationPermission, setRequestingNotificationPermission] = useState(false);

  useEffect(() => {
    obtenerTodasLasInspecciones().then(setInspeccionesGuardadas);
  }, []);

  useEffect(() => () => {
    solicitudUbicacion.current += 1;
  }, []);

  useEffect(() => () => {
    solicitudCamara.current += 1;
    liberarCamara(streamCamara.current);
    streamCamara.current = null;
    capturaRef.current?.descartar();
    capturaRef.current = null;
  }, []);

  useEffect(() => {
    const video = videoCamara.current;
    if (estadoCamara !== "activa" || !video || !streamCamara.current) return;
    video.srcObject = streamCamara.current;
    void video.play().catch(() => undefined);
  }, [estadoCamara]);

  function limpiarUbicacionTemporal() {
    solicitudUbicacion.current += 1;
    setResultadoUbicacion(null);
    setConsultandoUbicacion(false);
  }

  async function manejarConsultaUbicacion() {
    const solicitudActual = ++solicitudUbicacion.current;
    setConsultandoUbicacion(true);
    try {
      const resultado = await getCurrentLocation();
      if (solicitudActual === solicitudUbicacion.current) setResultadoUbicacion(resultado);
    } finally {
      if (solicitudActual === solicitudUbicacion.current) setConsultandoUbicacion(false);
    }
  }

  function descartarCaptura() {
    capturaRef.current?.descartar();
    capturaRef.current = null;
    setCaptura(null);
  }

  function limpiarCamaraTemporal() {
    solicitudCamara.current += 1;
    liberarCamara(streamCamara.current);
    streamCamara.current = null;
    descartarCaptura();
    setEstadoCamara("inactiva");
  }

  async function manejarAperturaCamara() {
    limpiarCamaraTemporal();
    const solicitudActual = solicitudCamara.current;
    setEstadoCamara("abriendo");
    const resultado = await abrirCamara();

    if (solicitudActual !== solicitudCamara.current) {
      if (resultado.status === "available") liberarCamara(resultado.stream);
      return;
    }

    if (resultado.status === "available") {
      streamCamara.current = resultado.stream;
      setEstadoCamara("activa");
    } else {
      setEstadoCamara(resultado.status);
    }
  }

  async function manejarCapturaFoto() {
    const video = videoCamara.current;
    if (!video) return;
    const solicitudActual = solicitudCamara.current;
    const resultado = await capturarFotograma(video);

    if (solicitudActual !== solicitudCamara.current) {
      if (resultado.status === "captured") resultado.captura.descartar();
      return;
    }

    liberarCamara(streamCamara.current);
    streamCamara.current = null;

    if (resultado.status === "captured") {
      capturaRef.current = resultado.captura;
      setCaptura(resultado.captura);
      setEstadoCamara("capturada");
    } else {
      setEstadoCamara("error");
    }
  }

  function manejarCancelacionCaptura() {
    limpiarUbicacionTemporal();
    limpiarCamaraTemporal();
    setErroresFormulario([]);
    setFormulario({ location: "", date: "", inspector: "", status: "ok", findings: "0", summary: "" });
  }

  useEffect(() => {
    let mounted = true;

    async function resumeSync() {
      setSyncBusy(true);
      setSyncError("");
      try {
        setSyncSummary(await syncPendingInspections());
      } catch {
        setSyncError("No se pudo actualizar la cola de sincronización.");
      } finally {
        if (mounted) setSyncBusy(false);
      }
    }

    getSyncQueueSummary().then((summary) => {
      if (mounted) setSyncSummary(summary);
    });

    const detachOnlineListener = resumeQueueOnOnline(window, resumeSync);
    if (navigator.onLine) void resumeSync();

    return () => {
      mounted = false;
      detachOnlineListener();
    };
  }, []);

  async function manejarReintentoManual() {
    setSyncBusy(true);
    setSyncError("");
    try {
      setSyncSummary(await retryFailedSync());
    } catch {
      setSyncError("No se pudo reintentar la sincronización.");
    } finally {
      setSyncBusy(false);
    }
  }

  async function manejarActivacionNotificaciones() {
    setRequestingNotificationPermission(true);
    const permission = await requestLocalNotificationPermission();
    setNotificationPermission(permission);
    setNotificationMessage(
      permission === "granted"
        ? "Permiso concedido. Los próximos registros guardados podrán mostrar una notificación local."
        : permission === "denied"
          ? "No se concedió el permiso. La confirmación seguirá apareciendo en esta página."
          : permission === "unsupported"
            ? "Este navegador no ofrece notificaciones. La confirmación seguirá apareciendo en esta página."
            : "No se pudo solicitar el permiso. Puedes continuar y guardar inspecciones normalmente.",
    );
    setRequestingNotificationPermission(false);
  }

  async function manejarEnvioFormulario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    limpiarUbicacionTemporal();
    limpiarCamaraTemporal();
    setGuardando(true);
    setErroresFormulario([]);

    const resultado = await guardarInspeccion({
      location: formulario.location,
      date: formulario.date,
      inspector: formulario.inspector,
      status: formulario.status,
      findings: Number(formulario.findings),
      summary: formulario.summary,
    });

    setGuardando(false);

    if (!resultado.ok) {
      setErroresFormulario(resultado.errors);
      return;
    }

    setInspeccionesGuardadas((actuales) => [resultado.inspection, ...actuales]);
    setFormulario({ location: "", date: "", inspector: "", status: "ok", findings: "0", summary: "" });
    setNotificationMessage("Inspección sintética guardada localmente.");
    const permission = getLocalNotificationPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      const delivery = await notifyInspectionSaved();
      setNotificationMessage(
        delivery === "shown"
          ? "Inspección guardada. Se mostró una notificación local."
          : delivery === "denied"
            ? "Inspección guardada. El permiso de notificación está denegado; la confirmación aparece aquí."
            : delivery === "unsupported"
              ? "Inspección guardada. Este navegador no ofrece notificaciones; la confirmación aparece aquí."
              : "Inspección guardada. No se pudo mostrar la notificación; la confirmación aparece aquí.",
      );
    }
    try {
      await enqueueInspectionForSync(resultado.inspection);
      if (navigator.onLine) {
        setSyncBusy(true);
        setSyncSummary(await syncPendingInspections());
      } else {
        setSyncSummary(await getSyncQueueSummary());
      }
    } catch {
      setSyncError("La inspección quedó guardada, pero no se pudo actualizar la sincronización.");
    } finally {
      setSyncBusy(false);
    }
  }

  useEffect(() => {
    const requestedState = new URLSearchParams(window.location.search).get("estado");
    if (requestedState === "cargando") return;

    const timeout = window.setTimeout(() => {
      setState(requestedState === "error" ? "error" : "success");
    }, 120);
    return () => window.clearTimeout(timeout);
  }, []);

  function retry() {
    setState("loading");
    window.setTimeout(() => setState("success"), 120);
  }

  return (
    <main aria-busy={state === "loading"} className="mx-auto min-h-dvh w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <header className="space-y-2">
        <a className="text-sm text-primary underline underline-offset-4" href="/">Volver al resumen</a>
        <p className="text-sm text-muted-foreground">Datos sintéticos · renderizado del lado del cliente</p>
        <h1 className="text-2xl font-semibold tracking-tight">Inspecciones de laboratorio</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">Busca y abre registros de mantenimiento de demostración.</p>
      </header>

      {state === "loading" && (
        <LoadingState
          description="Preparando el listado de inspecciones sintéticas."
          kind="loading"
          title="Cargando inspecciones"
        />
      )}
      {state === "error" && (
        <LoadingState
          description="No fue posible preparar el listado. Puedes intentarlo de nuevo."
          kind="error"
          onRetry={retry}
          title="No se pudieron cargar las inspecciones"
        />
      )}
      {state === "success" && (
        <section aria-labelledby="list-heading" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="inspection-search">Filtrar por laboratorio, inspector o estado</label>
            <input
              autoComplete="off"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="inspection-search"
              onChange={(event) => setQuery(event.target.value)}
              type="search"
              value={query}
            />
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-semibold" id="list-heading">Registros</h2>
            <p aria-live="polite" className="text-sm text-muted-foreground">{visibleInspections.length} de {filterInspections("").length} inspecciones</p>
          </div>
          {visibleInspections.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visibleInspections.map((inspection) => (
                <li className="rounded-xl border bg-card p-5 shadow-sm" key={inspection.id}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">{inspection.location}</h3>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{inspection.statusLabel}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{inspection.summary}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">Fecha</dt><dd><time dateTime={inspection.date}>{inspection.date}</time></dd></div>
                    <div><dt className="text-muted-foreground">Hallazgos</dt><dd>{inspection.findings}</dd></div>
                  </dl>
                  <a className="mt-4 inline-flex min-h-10 items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/inspecciones/${inspection.id}`}>
                    Ver detalle de {inspection.location}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No hay inspecciones que coincidan con la búsqueda.</p>
          )}
        </section>
      )}
      <section aria-labelledby="capture-heading" className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold" id="capture-heading">Captura rápida (sintética)</h2>
          <p className="text-sm text-muted-foreground">Funciona sin conexión: se guarda en este dispositivo.</p>
        </div>

        <div aria-live="polite" className="space-y-2 text-sm" role="status">
          <p>
            {syncBusy
              ? "Sincronizando inspecciones guardadas…"
              : syncSummary.failed > 0
                ? `${syncSummary.failed} inspecciones agotaron los intentos automáticos.`
                : syncSummary.pending > 0
                  ? `${syncSummary.pending} inspecciones pendientes; se reanudarán al recuperar conexión.`
                  : `Estado de sincronización: ${syncSummary.synced} inspecciones completadas.`}
          </p>
          {syncSummary.failed > 0 && (
            <button
              className="min-h-10 rounded-md border px-3 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              disabled={syncBusy}
              onClick={manejarReintentoManual}
              type="button"
            >
              Reintentar sincronización
            </button>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <button
            className="min-h-10 rounded-md border px-3 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            disabled={requestingNotificationPermission || notificationPermission === "granted"}
            onClick={manejarActivacionNotificaciones}
            type="button"
          >
            {requestingNotificationPermission
              ? "Solicitando permiso…"
              : notificationPermission === "granted"
                ? "Notificaciones activadas"
                : "Activar notificaciones"}
          </button>
          <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
            {notificationMessage || "Las notificaciones son opcionales. El permiso se solicitará solo si activas esta opción."}
          </p>
        </div>
        {syncError && <p className="text-sm text-destructive" role="alert">{syncError}</p>}

        <form className="grid gap-3 sm:grid-cols-2" onSubmit={manejarEnvioFormulario}>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="capture-location">Laboratorio</label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="capture-location"
              onChange={(e) => setFormulario((f) => ({ ...f, location: e.target.value }))}
              type="text"
              value={formulario.location}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="capture-date">Fecha</label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="capture-date"
              onChange={(e) => setFormulario((f) => ({ ...f, date: e.target.value }))}
              type="date"
              value={formulario.date}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="capture-inspector">Inspector</label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="capture-inspector"
              onChange={(e) => setFormulario((f) => ({ ...f, inspector: e.target.value }))}
              type="text"
              value={formulario.inspector}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="capture-status">Estado</label>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="capture-status"
              onChange={(e) => setFormulario((f) => ({ ...f, status: e.target.value as "ok" | "attention" }))}
              value={formulario.status}
            >
              <option value="ok">Sin incidencias</option>
              <option value="attention">Requiere atención</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="capture-findings">Hallazgos</label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="capture-findings"
              min={0}
              onChange={(e) => setFormulario((f) => ({ ...f, findings: e.target.value }))}
              type="number"
              value={formulario.findings}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="capture-summary">Resumen</label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="capture-summary"
              onChange={(e) => setFormulario((f) => ({ ...f, summary: e.target.value }))}
              type="text"
              value={formulario.summary}
            />
          </div>

          <fieldset className="space-y-2 rounded-md border p-3 sm:col-span-2">
            <legend className="px-1 text-sm font-medium">Ubicación actual (opcional)</legend>
            <p className="text-sm text-muted-foreground" id="capture-geolocation-help">
              Solo se consulta cuando lo solicitas. La ubicación no se guarda ni se sincroniza.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                aria-describedby="capture-geolocation-help"
                className="min-h-10 rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                disabled={consultandoUbicacion}
                onClick={manejarConsultaUbicacion}
                type="button"
              >
                {consultandoUbicacion ? "Consultando ubicación…" : "Consultar ubicación actual"}
              </button>
              <button
                className="min-h-10 rounded-md border px-3 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={limpiarUbicacionTemporal}
                type="button"
              >
                Omitir ubicación
              </button>
            </div>
            {resultadoUbicacion && (
              <p aria-live="polite" className="text-sm" role="status">
                {resultadoUbicacion.status === "available"
                  ? `Ubicación consultada: ${resultadoUbicacion.coordinates.latitude.toFixed(5)}, ${resultadoUbicacion.coordinates.longitude.toFixed(5)} (precisión aproximada: ${Math.round(resultadoUbicacion.coordinates.accuracy)} m). Solo es temporal.`
                  : resultadoUbicacion.status === "denied"
                    ? "No se concedió permiso de ubicación. Puedes guardar la inspección sin ella."
                    : resultadoUbicacion.status === "timeout"
                      ? "La consulta de ubicación agotó el tiempo. Puedes guardar la inspección sin ella."
                      : resultadoUbicacion.status === "unavailable"
                        ? "Este dispositivo no ofrece ubicación. Puedes guardar la inspección sin ella."
                        : "No se pudo consultar la ubicación. Puedes guardar la inspección sin ella."}
              </p>
            )}
          </fieldset>

          <fieldset className="space-y-2 rounded-md border p-3 sm:col-span-2">
            <legend className="px-1 text-sm font-medium">Evidencia con cámara (opcional)</legend>
            <p className="text-sm text-muted-foreground" id="capture-camera-help">
              La cámara solo se abre cuando lo solicitas la foto no se guarda se descarta al guardar o cancelar.
            </p>

            {(estadoCamara === "inactiva" || estadoCamara === "abriendo" || estadoCamara === "denied" || estadoCamara === "unavailable" || estadoCamara === "error") && (
              <button
                aria-describedby="capture-camera-help"
                className="min-h-10 rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                disabled={estadoCamara === "abriendo"}
                onClick={manejarAperturaCamara}
                type="button"
              >
                {estadoCamara === "abriendo" ? "Abriendo cámara…" : "Abrir cámara"}
              </button>
            )}

            {estadoCamara === "activa" && (
              <div className="space-y-2">
                <video
                  aria-label="Vista previa de la cámara"
                  autoPlay
                  className="w-full max-w-sm rounded-md border bg-muted"
                  muted
                  playsInline
                  ref={videoCamara}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    className="min-h-10 rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                    onClick={manejarCapturaFoto}
                    type="button"
                  >
                    Tomar foto
                  </button>
                  <button
                    className="min-h-10 rounded-md border px-3 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                    onClick={limpiarCamaraTemporal}
                    type="button"
                  >
                    Cancelar cámara
                  </button>
                </div>
              </div>
            )}

            {estadoCamara === "capturada" && captura && (
              <div className="space-y-2">
                <img
                  alt="Vista previa de la foto capturada (temporal)"
                  className="w-full max-w-sm rounded-md border"
                  src={captura.previewUrl}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    className="min-h-10 rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                    onClick={manejarAperturaCamara}
                    type="button"
                  >
                    Repetir foto
                  </button>
                  <button
                    className="min-h-10 rounded-md border px-3 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                    onClick={limpiarCamaraTemporal}
                    type="button"
                  >
                    Descartar foto
                  </button>
                </div>
              </div>
            )}

            {estadoCamara !== "inactiva" && estadoCamara !== "abriendo" && estadoCamara !== "activa" && estadoCamara !== "capturada" && (
              <p aria-live="polite" className="text-sm" role="status">
                {estadoCamara === "denied"
                  ? "No se concedió permiso de cámara. Puedes guardar la inspección sin foto."
                  : estadoCamara === "unavailable"
                    ? "Este dispositivo no ofrece cámara puedes guardar la inspección sin foto."
                    : "No se pudo usar la cámara puedes guardar la inspección sin foto."}
              </p>
            )}
          </fieldset>

          {erroresFormulario.length > 0 && (
            <div aria-live="assertive" className="sm:col-span-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              <ul className="list-disc space-y-1 pl-4">
                {erroresFormulario.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              disabled={guardando}
              type="submit"
            >
              {guardando ? "Guardando..." : "Guardar inspección"}
            </button>
            <button
              className="h-10 rounded-md border px-4 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
              disabled={guardando}
              onClick={manejarCancelacionCaptura}
              type="button"
            >
              Cancelar captura
            </button>
          </div>
        </form>

        {inspeccionesGuardadas.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Guardadas en este dispositivo ({inspeccionesGuardadas.length})</h3>
            <ul className="grid gap-2 sm:grid-cols-2" data-testid="stored-inspections">
              {inspeccionesGuardadas.map((inspeccion) => (
                <li className="rounded-lg border bg-card p-3 text-sm" data-inspection-id={inspeccion.id} key={inspeccion.id}>
                  <p className="font-medium">{inspeccion.location}</p>
                  <p className="text-muted-foreground">{inspeccion.date} · {inspeccion.inspector}</p>
                  <p className="text-muted-foreground">{inspeccion.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}

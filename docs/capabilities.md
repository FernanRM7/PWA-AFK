# Capacidades del dispositivo

## Geolocalización (W06)

La captura de `/inspecciones` puede consultar la ubicación actual de forma opcional. La API del navegador se invoca únicamente al activar **Consultar ubicación actual**; cargar la página no solicita permiso. El resultado se muestra temporalmente en la interfaz y **Omitir ubicación** lo descarta. La acción **Cancelar captura**, guardar la inspección y desmontar/cerrar el flujo también invalidan cualquier consulta pendiente y limpian el resultado.

Las coordenadas no forman parte de `BorradorInspeccion` ni `InspeccionGuardada`. El formulario construye el borrador persistible campo por campo; la validación descarta propiedades adicionales, y la cola recibe únicamente la inspección validada. No se incluyen coordenadas en notificaciones ni en transporte de sincronización. Si se niega el permiso, vence el tiempo de espera, ocurre un error o la API no está disponible, la captura sintética se puede guardar normalmente.

### Verificación

`npm run test:vitest -- tests/geolocation.spec.ts` usa un proveedor simulado para comprobar ubicación disponible, permiso denegado, timeout, error, API ausente y excepción del proveedor. También comprueba que la validación del borrador no conserva latitud ni longitud. No utiliza GPS real, red ni servicios privados.

El permiso y el resultado son propios de la sesión de captura; no se persisten en IndexedDB, historial, cola offline, logs, notificaciones ni solicitudes de sincronización. La prueba unitaria no reemplaza una comprobación manual de la solicitud de permiso y del comportamiento del navegador en un dispositivo compatible.
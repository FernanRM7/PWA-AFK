# Capacidades del dispositivo

## Geolocalización (W06)

La captura de `/inspecciones` puede consultar la ubicación actual de forma opcional. La API del navegador se invoca únicamente al activar **Consultar ubicación actual**; cargar la página no solicita permiso. El resultado se muestra temporalmente en la interfaz y **Omitir ubicación** lo descarta. La acción **Cancelar captura**, guardar la inspección y desmontar/cerrar el flujo también invalidan cualquier consulta pendiente y limpian el resultado.

Las coordenadas no forman parte de `BorradorInspeccion` ni `InspeccionGuardada`. El formulario construye el borrador persistible campo por campo; la validación descarta propiedades adicionales, y la cola recibe únicamente la inspección validada. No se incluyen coordenadas en notificaciones ni en transporte de sincronización. Si se niega el permiso, vence el tiempo de espera, ocurre un error o la API no está disponible, la captura sintética se puede guardar normalmente.

### Verificación

`npm run test:vitest -- tests/geolocation.spec.ts` usa un proveedor simulado para comprobar ubicación disponible, permiso denegado, timeout, error, API ausente y excepción del proveedor. También comprueba que la validación del borrador no conserva latitud ni longitud. No utiliza GPS real, red ni servicios privados.

El permiso y el resultado son propios de la sesión de captura; no se persisten en IndexedDB, historial, cola offline, logs, notificaciones ni solicitudes de sincronización. La prueba unitaria no reemplaza una comprobación manual de la solicitud de permiso y del comportamiento del navegador en un dispositivo compatible.

## Cámara (W06)

La captura de `/inspecciones` puede tomar una foto de evidencia de forma opcional. La cámara se solicita únicamente al activar **Abrir cámara**; cargar la página no pide permiso ni enciende la cámara después de Tomar foto la cámara se apaga y se muestra una vista previa temporal con Repetir foto y Descartar foto

La imagen  y su URL de vista previa viven solo en memoria del componente. **Cancelar cámara**, **Descartar foto**, **Cancelar captura**, guardar la inspección y cerrar el flujo detienen todas las pistas del stream y revocan la URL de vista previa. Si la persona cancela o guarda mientras el navegador aún pregunta el permiso, la respuesta tardía se ignora y el stream se apaga de inmediato.

La foto no forma parte de `BorradorInspeccion` ni `InspeccionGuardada`. El formulario construye el borrador persistible campo por campo, y `src/lib/device/camera.ts` no importa nada de `storage/` ni de `sync/`. No se escribe foto, `Blob` ni URL de objeto en IndexedDB, y tampoco se incluye en la cola ni en el transporte de sincronización. Si el permiso se niega, no hay cámara o ocurre un error, la inspección sintética se puede guardar normalmente

### Verificación

`npm run test:vitest -- tests/camera.spec.ts` usa proveedores y un lienzo simulados para comprobar cámara disponible, permiso denegado, cámara ausente, fallo desconocido, liberación de pistas y revocación única de la vista previa. No necesita dispositivo, red ni datos reales.

La prueba manual en el navegador  comprobó que la cámara no se inicia al cargar, que la luz se apaga al tomar la foto o cancelar, que guardar descarta la foto, que con permiso denegado la inspección se guarda igual y que el registro en IndexedDB no contiene imagen ni URL `blob:`.

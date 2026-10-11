# Capacidades del dispositivo

## Geolocalización (W06)

La captura de `/inspecciones` puede consultar la ubicación actual de forma opcional. La API del navegador se invoca únicamente al activar **Consultar ubicación actual**; cargar la página no solicita permiso. El resultado se muestra temporalmente en la interfaz y **Omitir ubicación** lo descarta. La acción **Cancelar captura**, guardar la inspección y desmontar/cerrar el flujo también invalidan cualquier consulta pendiente y limpian el resultado.

Las coordenadas no forman parte de `BorradorInspeccion` ni `InspeccionGuardada`. El formulario construye el borrador persistible campo por campo; la validación descarta propiedades adicionales, y la cola recibe únicamente la inspección validada. No se incluyen coordenadas en notificaciones ni en transporte de sincronización. Si se niega el permiso, vence el tiempo de espera, ocurre un error o la API no está disponible, la captura sintética se puede guardar normalmente.

### Verificación

`npm run test:vitest -- tests/geolocation.spec.ts` usa un proveedor simulado para comprobar ubicación disponible, permiso denegado, timeout, error, API ausente y excepción del proveedor. También comprueba que la validación del borrador no conserva latitud ni longitud. No utiliza GPS real, red ni servicios privados.

El permiso y el resultado son propios de la sesión de captura; no se persisten en IndexedDB, historial, cola offline, logs, notificaciones ni solicitudes de sincronización. La prueba unitaria no reemplaza una comprobación manual de la solicitud de permiso y del comportamiento del navegador en un dispositivo compatible.

## Cámara (W06)

La captura de `/inspecciones` puede tomar una foto de evidencia de forma opcional. La cámara se solicita únicamente al activar **Abrir cámara**; cargar la página no pide permiso ni enciende la cámara. Después de **Tomar foto**, la cámara se apaga y se muestra una vista previa temporal con las opciones **Repetir foto** y **Descartar foto**.

La imagen y su URL de vista previa viven solo en memoria del componente. **Cancelar cámara**, **Descartar foto**, **Cancelar captura**, guardar la inspección y cerrar el flujo detienen todas las pistas del stream y revocan la URL de vista previa. Si la persona cancela o guarda mientras el navegador aún pregunta el permiso, la respuesta tardía se ignora y el stream se apaga de inmediato.

La foto no forma parte de `BorradorInspeccion` ni `InspeccionGuardada`. El formulario construye el borrador persistible campo por campo, y `src/lib/device/camera.ts` no importa nada de `storage/` ni de `sync/`. No se escribe foto, `Blob` ni URL de objeto en IndexedDB, y tampoco se incluye en la cola ni en el transporte de sincronización. Si el permiso se niega, no hay cámara o ocurre un error, la inspección sintética se puede guardar normalmente.

### Verificación

`npm run test:vitest -- tests/camera.spec.ts` usa proveedores y un lienzo simulados para comprobar cámara disponible, permiso denegado, cámara ausente, fallo desconocido, liberación de pistas y revocación única de la vista previa. No necesita dispositivo, red ni datos reales.

La prueba manual registrada por Jaime comprobó que la cámara no se inicia al cargar, que la luz se apaga al tomar la foto o cancelar, que guardar descarta la foto, que con permiso denegado la inspección se guarda igual y que el registro en IndexedDB no contiene imagen ni URL `blob:`. La prueba automatizada no monta el componente React; el desmontaje se verificó manualmente.

## Notificaciones locales (W06)

La acción **Activar notificaciones** es el único punto que solicita permiso. No se muestra un diálogo al cargar la página ni durante el guardado. Si el navegador ya conserva el permiso concedido, al guardar una inspección sintética se muestra una notificación local genérica mediante el Service Worker registrado; si no hay registro disponible se intenta la API local del navegador. El título y el mensaje no contienen nombres, laboratorios, fotos ni coordenadas.

Si la API no existe, el permiso está denegado o la entrega falla, el registro se guarda de todas formas y la confirmación aparece en una región `role="status"` de la página. No se persisten preferencias de permisos en la aplicación, no se crean suscripciones Push y no se envían solicitudes a un backend.

### Verificación

`npm run test:vitest -- tests/capabilities.spec.ts` cubre que la creación/consulta del cliente no pida permiso, el flujo explícito de solicitud, entrega mediante Service Worker, fallback local, falta de soporte, denegación y fallo de entrega. También guarda un borrador con propiedades extra de sensores y comprueba que foto, Blob, URL de vista previa y coordenadas no se escriban en IndexedDB. Usa APIs y datos sintéticos.

La suite no prueba el diálogo nativo del navegador ni entrega real del sistema operativo. La comprobación manual depende de un navegador compatible y permiso concedido por su usuario.

## Verificación general W06

```bash
npm ci
npm test
make verify
bash PWA-w06-kit-estudiante/public-tests/check.sh
```

El workflow `.github/workflows/week-06-w06-device-push.yml` instala dependencias, compila, verifica todos los artefactos requeridos, ejecuta las pruebas y comprueba README/evidencia.

El check público W06 terminó con `PUBLIC_OK` y código 0. Antes mostró coincidencias de texto legítimo, entre ellas `js-tokens`, la ruta de caché `/token`, documentación del modelo de amenazas y referencias del kit a secretos. Revisé esas coincidencias y no encontré credenciales reales. El script ejecuta `! rg` bajo `set -e`, por lo que las coincidencias no hacen fallar el check; es una comprobación de estructura y no un detector fiable de secretos. No se borró documentación ni se modificó el checker.

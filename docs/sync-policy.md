# Política de persistencia, sincronización y conflictos — Semana 5

## Alcance y datos

Las capturas de `/inspecciones` usan únicamente datos sintéticos y se escriben en IndexedDB (`afk-inspections-db`, almacén `inspections`). Cada registro tiene `schemaVersion`, `createdAt`, `updatedAt` y metadatos de sincronización persistentes: clave de idempotencia, estado, intentos y último error. El upgrade de esquema a la versión 2 rellena `updatedAt` desde `createdAt` en registros previos, sin descartarlos. Una captura se considera guardada localmente solo después de que IndexedDB confirma la escritura.

No hay backend conectado. `SyncTransport` es una interfaz inyectable cuyo transporte predeterminado es sintético; sirve para demostrar estados, reintentos y conflictos sin solicitudes de red ni credenciales. No demuestra entrega a un servidor real.

## Cola e idempotencia

El alta local crea una clave estable `inspection:<id>`. Los reintentos y las resoluciones de conflicto reutilizan esa clave; el mismo acuse no debe producir una segunda inspección. El transporte debe devolver la misma clave para confirmar una operación; un acuse con una clave distinta se trata como fallo.

La cola persiste `pending`, `syncing`, `failed` o `synced` junto con el contador de intentos. Al iniciar la app, los registros que quedaron en `syncing` se vuelven recuperables como pendientes. El evento `online` reanuda la cola. Los fallos usan hasta cinco intentos con esperas exponenciales de 1, 2, 4 y 8 segundos; agotados los intentos, el registro no se elimina y queda disponible para reintento manual, que reinicia el contador.

## Resolución de conflictos

Cuando el transporte sintético informa una versión remota concurrente, `resolveInspectionConflict` compara las marcas ISO-8601 `updatedAt`:

- Gana la versión cuyo `updatedAt` es posterior.
- En igualdad exacta, gana la versión remota como desempate determinista.
- Si gana la remota, esa versión reemplaza el contenido local y queda marcada como sincronizada.
- Si gana la local, se conserva y se reenvía con la misma clave idempotente. Los reenvíos cuentan dentro del límite de cinco intentos; si el conflicto persiste, queda `failed` para reintento manual.

Los relojes de dispositivos pueden estar desfasados, por lo que last-write-wins por timestamp puede elegir una versión que no refleja el orden causal real. Un backend futuro debería establecer una versión autoritativa o un protocolo de revisión, autenticar el transporte y garantizar idempotencia en el servidor.

## Fallos y límites

- Si IndexedDB no está disponible o falla la transacción local, la captura no se presenta como guardada.
- Si el transporte falla, el registro y la clave permanecen en IndexedDB para reintentar tras reconexión o de forma manual.
- El simulador no comprueba conectividad real del servidor, autenticación, consistencia entre dispositivos ni persistencia remota.
- Las pruebas usan `fake-indexeddb`, transporte sintético y esperas inyectadas; no sustituyen pruebas de navegador/dispositivo ni de backend.
- El check público incluido en el kit mostró coincidencias de texto legítimo (`js-tokens`, `resolveDmxColorTokens`, `/token` y documentación de seguridad) y terminó con `PUBLIC_OK`, código 0. Como el `rg` está negado con `!` bajo `set -e`, los hallazgos no causan fallo; es un check mínimo de estructura, no un detector de secretos. Revisé las coincidencias y no vi credenciales reales. No borré documentación ni alteré el checker.

## Verificación

```bash
npm ci
npm test
make verify
bash PWA-w05-kit-estudiante/public-tests/check.sh
```

El workflow `.github/workflows/week-05-w05-sync-data.yml` verifica instalación, build, artefactos y tests en GitHub Actions. El resultado remoto se debe asociar al SHA exacto que se entrega.

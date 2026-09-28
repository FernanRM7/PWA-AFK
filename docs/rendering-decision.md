# Decisión de renderizado — Semana 04

## Decisión

El listado de inspecciones (`/inspecciones`) es CSR: el componente cliente comienza en estado de carga, prepara la vista tras hidratarse y permite filtrar el conjunto sintético en el navegador. El detalle (`/inspecciones/[id]`) es SSR: Next.js lo fuerza a renderizar por solicitud y consulta el mismo módulo local de datos. No hay API ni datos de laboratorios reales.

## Comparación y razones

| Aspecto | Listado CSR | Detalle SSR |
|---|---|---|
| Carga | Muestra una carga inicial; búsqueda y filtros no requieren una nueva petición. | Entrega contenido del registro desde el servidor en la respuesta de la ruta. |
| Accesibilidad | La carga y los errores se anuncian; el filtro tiene etiqueta y resultados actualizados en región viva. | El HTML contiene el detalle sin esperar lógica de cliente y ofrece estructura de encabezados y datos. |
| Complejidad | Requiere estado cliente para carga, error, reintento y búsqueda. | Requiere una frontera de carga/error y resolución segura del id; al usar datos locales la consulta aún no aporta latencia real. |
| Límite | El listado no ofrece sus registros hasta que se ejecuta el código de cliente. | El render dinámico añade trabajo por solicitud; no se está consultando una base de datos. |

Esta división contrasta las técnicas con el mismo dominio. Con solo tres registros estáticos, no se afirma que una gane en rendimiento absoluto; el beneficio de SSR se volvería más relevante si se requirieran datos frescos al abrir un detalle, mientras CSR conviene para interacciones repetidas sobre el listado.

## Estados y recuperación

El listado inicia en carga y luego muestra éxito o el estado de error simulado. `?estado=cargando` mantiene la carga y `?estado=error` reproduce el error. Reintentar el listado vuelve a éxito con la fixture local. En el detalle, `loading.tsx` cubre la transición del segmento; `?estado=cargando` hace visible el estado de forma repetible. `?estado=error` lanza un error controlado que llega a `error.tsx`, cuyo botón reinicia el segmento. Un id desconocido usa el 404 específico de la ruta. Estos parámetros son herramientas académicas locales, no una API de estados.

## Métrica repetible

La comprobación estructural de SSR es que `npm run build` identifique `/inspecciones/[id]` como ruta dinámica (símbolo `ƒ`) y no como salida prerenderizada. Para comparar respuesta, tras `npm run build` y `npm start`, consultar cinco veces un id existente con `curl -s -o /dev/null -w '%{time_starttransfer}\n' http://127.0.0.1:3000/inspecciones/inspection-001`; registrar los cinco valores en milisegundos y su mediana. Repetir en la misma máquina y versión de Node para comparar cambios. Esta medición es TTFB local, no una medición de red pública ni de Core Web Vitals.

**Medición local observada (2026-09-27):** Node `v24.21.0`, Next.js `14.2.35`, servidor de producción (`npm start`), cinco consultas consecutivas: `55.154`, `10.147`, `9.244`, `7.938` y `5.319` ms. Mediana: `9.244` ms. El primer valor incluye calentamiento del proceso; se conserva en el conjunto y la mediana reduce su efecto. Es una sola máquina y una sola ejecución, por lo que sirve como línea base reproducible, no como comparación general entre CSR y SSR.

## Límites, riesgos y fallos

- El listado simula la espera del cliente con un temporizador breve; no mide descarga de red ni una API real.
- La ruta SSR fuerza ejecución por solicitud aunque su fixture sea local. La medición local incluye entorno y carga de desarrollo/servidor.
- Las pruebas renderizan componentes y validan datos y estados de manera determinista; no sustituyen navegación real en navegador, lector de pantalla ni mediciones entre dispositivos.
- El checker provisto dentro del kit W04 usa una expresión amplia de palabras `token`, `secret`, `password` y `api_key`; aplicado literalmente al repositorio heredado reporta texto legítimo de documentación y código. La revisión de secretos requiere patrones específicos y revisión del contenido detectado, no eliminar documentación válida.
- No se conoce un fallo de datos de la aplicación para esta semana; cualquier error observado en `npm ci`, pruebas, build, TTFB o Actions se anotará con comando, versión y salida real en README/evidencia antes de entregar.

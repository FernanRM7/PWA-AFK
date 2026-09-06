# ADR-001 — Decisión sobre la estrategia de aplicación

> ADR significa registro de decisión arquitectónica. Este documento explica la comparación, la elección y sus consecuencias. Es un documento del equipo; adapten los ejemplos al caso.

## Estado

Propuesta — 5 de septiembre de 2026.

## Contexto y restricciones

El producto tiene dos tipos de usuario: el docente o encargado de laboratorio, que revisa inspecciones y hallazgos pendientes para coordinar mantenimiento, y la persona inspectora, que captura datos de una revisión desde dentro del laboratorio. Esa captura suele ocurrir con conectividad intermitente, porque la señal dentro de un laboratorio no está garantizada.

Los dos escenarios de `docs/requirements.md` reflejan esto: el E-01 (consulta con conectividad disponible) pide una interfaz accesible desde distintos dispositivos, incluido móvil el E-02 (registro con conectividad intermitente) exige que la app guarde los datos capturados localmente y los sincronice cuando vuelva la conexión, sin depender de estar conectado todo el tiempo.

El curso fija Next.js como stack y PWA como estrategia de entrega. Todos los datos usados en desarrollo y pruebas son sintéticos; no se maneja información real de estudiantes, docentes ni laboratorios. Esta decisión se toma en el alcance de Semana 1, donde el starter todavía no tiene registro, almacenamiento local, sincronización, instalación ni autenticación.

## Alternativas consideradas

| Criterio | PWA | Web tradicional | App nativa | Multiplataforma (React Native/Flutter) |
|---|---|---|---|---|
| Instalación | Se puede "instalar" desde el navegador (icono, pantalla completa) sin pasar por una tienda de aplicaciones | No es instalable; siempre se abre desde el navegador | Requiere descarga desde App Store o Google Play, con proceso de revisión | Requiere descarga desde tienda, pero un solo código genera ambos binarios (iOS/Android) |
| Conexión intermitente / offline | Puede funcionar sin conexión si se diseñan Service Worker, caché y sincronización; no es automático | No funciona sin conexión; cada acción depende de la red | Soporte offline nativo y maduro, con acceso directo a almacenamiento del dispositivo | Soporte offline posible, con librerías específicas por framework |
| Distribución | Se comparte por URL actualizaciones inmediatas sin aprobación de tienda | Igual que PWA: por URL, sin fricción de instalación | Depende de aprobación y tiempos de revisión de cada tienda | También depende de tiendas, con doble proceso de publicación (una por plataforma) |
| Costo y velocidad de desarrollo | Un solo código base (Next.js) para todos los dispositivos; curva de aprendizaje menor para el equipo, que ya conoce el stack | Similar a PWA en costo, pero sin capacidades adicionales | Requiere dos bases de código (Swift/Kotlin) o una por plataforma; mayor costo y tiempo | Un código base, pero con complejidad extra de puentes nativos y dependencias |
| Mantenimiento | Un solo repositorio y despliegue continuo | Un solo repositorio, pero sin evolución hacia capacidades de dispositivo | Dos bases de código que mantener en paralelo | Un código base, pero dependiente de actualizaciones de librerías multiplataforma |
| Capacidades del dispositivo | Acceso limitado pero creciente (notificaciones push, cámara, almacenamiento) vía APIs web | Sin acceso a APIs de dispositivo | Acceso completo y directo a hardware y APIs del sistema operativo | Acceso amplio mediante módulos nativos, aunque con capas intermedias |
| Riesgos y mitigaciones | Soporte de APIs varía entre navegadores; mitigación: verificar compatibilidad y degradar con elegancia si falta una API | Sin camino de evolución hacia offline o instalación sin reescribir la aplicación | Costo y tiempo elevados para un equipo estudiantil con un solo semestre; mitigación: fuera de alcance del curso | Riesgo de bugs específicos de plataforma en los puentes nativos; mitigación: pruebas en ambos sistemas operativos |

La operación offline no aparece solo por usar React o Next.js: hay que diseñar explícitamente el almacenamiento local (por ejemplo, IndexedDB) y una estrategia de sincronización para reconciliar lo capturado sin conexión con el servidor, como pide el escenario E-02.

## Decisión

El equipo adopta PWA como estrategia para este producto, dentro del stack Next.js fijado por el curso. La decisión responde directamente a las restricciones identificadas: los usuarios necesitan consultar y capturar información desde distintos dispositivos, incluido el uso móvil dentro de un laboratorio donde la conectividad no está garantizada (escenario E-02). Una PWA permite avanzar hacia una experiencia instalable y con capacidad offline sin necesitar dos bases de código separadas ni pasar por el proceso de aprobación de una tienda de aplicaciones, algo relevante para un equipo estudiantil con recursos y tiempo limitados a un semestre.

Frente a una web tradicional, la PWA ofrece una ruta hacia instalación y funcionamiento sin conexión, capacidades que el escenario E-02 requiere y que una web tradicional no puede lograr sin rediseñarse por completo. Frente a una app nativa o multiplataforma, la PWA reduce el costo de desarrollo y mantenimiento al usar un solo código base y evita depender de tiendas de aplicaciones, a cambio de un acceso más limitado a las capacidades del dispositivo.

Una app nativa sería mejor opción si el producto necesitara acceso profundo y constante a hardware específico (por ejemplo, sensores especializados de laboratorio) o si la organización tuviera presupuesto y tiempo para mantener dos bases de código. Una solución multiplataforma tendría sentido si se necesitara publicar en tiendas desde el inicio del proyecto, manteniendo un solo código base.

## Consecuencias y riesgos

Adoptar PWA implica que el equipo tendrá que diseñar explícitamente el almacenamiento local y la lógica de sincronización para cumplir el escenario E-02 esta capacidad no llega gratis por usar Next.js y representa trabajo adicional en semanas , como beneficio mantener un solo código base reduce el esfuerzo de mantenimiento frente a duplicar la app para distintas plataformas, y permite iterar rápido porque el equipo ya conoce el stack.

Un riesgo es la variación en el soporte de APIs web (Service Worker, notificaciones push, almacenamiento) entre navegadores y sistemas operativos, sobre todo en iOS. La mitigación es verificar compatibilidad antes de depender de una API específica y diseñar una degradación aceptable cuando no esté disponible (por ejemplo, que la app siga siendo usable sin push aunque no lleguen notificaciones).

Otro riesgo es que la sincronización de registros capturados sin conexión genere conflictos o duplicados si dos dispositivos registran datos relacionados antes de reconectarse. La mitigación es diseñar un identificador único por registro capturado localmente, para que el proceso de sincronización pueda reconocer y descartar duplicados (relacionado con RF-06 en `requirements.md`).

Por último, existe el riesgo de subestimar el esfuerzo de implementar offline en las semanas siguientes, ya que todavía no se ha probado. Se aliviana documentando desde ahora los requisitos no funcionales de rendimiento y offline que habrá que validar más adelante.

## Validación

Esta decisión todavía no se ha validado las capacidades offline, de instalación y de sincronización no están implementadas en Semana 1, así que no se afirma haberlas probado. La validación futura se propone así:

- **Instalación:** verificar en semanas posteriores que la app cumple los criterios de instalabilidad (manifest válido, Service Worker registrado) y que el navegador ofrece la opción de instalar en al menos un dispositivo móvil y uno de escritorio.
- **Offline:** Simular pérdida de conexión (por ejemplo, con las herramientas de desarrollador del navegador) y comprobar que un registro capturado en ese estado se conserva localmente y aparece marcado como pendiente de sincronización, según RF-05.
- **Sincronización:** al restablecer la conexión, comprobar que el registro pendiente se envía una sola vez y no genera duplicados en el listado, según RF-06.
- **Rendimiento:** medir el tiempo de carga del listado con una cantidad de registros sintéticos definida, bajo condiciones de red declaradas, según los requisitos no funcionales del equipo.
- **Dispositivo:** confirmar en al menos dos navegadores/sistemas operativos distintos (por ejemplo, Chrome en Android y Safari en iOS) que las funciones críticas se comportan de forma consistente o que la degradación es aceptable donde no haya soporte completo.

Estas mediciones se harán cuando se implementen las funciones correspondientes en semanas posteriores del curso, no en esta entrega.

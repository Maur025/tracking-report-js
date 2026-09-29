# Diagnóstico y hoja de ruta de `tracking-report-js`

**Fecha:** 2026-09-29  
**Base revisada:** rama [`develop`](https://github.com/Maur025/tracking-report-js/tree/develop), árbol `49f78b99d7840435be48dfb9249b9b978d74a09f`.  
**Alcance:** inspección estática del código publicado. No ejecuté el proyecto ni medí carga; las consecuencias en producción indicadas como riesgos deben verificarse con pruebas.

## Resumen ejecutivo

El servicio ya se organiza por tipos de reporte (`event`, `progress`, `registry-progress`, `rules`), usa Awilix como punto de composición, Zod en la entrada, funciones pequeñas para transformar datos y generadores asíncronos para consultar páginas. Es una base aprovechable. El principal límite para la evolución que buscas es que **generar un archivo implica recibir un `Response` de Express**. Además, las rutinas de PDF y Excel se suscriben a eventos de un `Readable` sin devolver una promesa que represente el fin o el fallo de la generación. Una cola no corrige por sí sola ese problema.

**Recomendación:** arquitectura modular ligera, con casos de uso independientes de HTTP, adaptadores para consultas/renderizado/almacenamiento, y Awilix solo en el arranque. Mantener las clases que tienen sentido como objetos con ciclo de vida; usar funciones para reglas, mapeos y casos de uso. Introducir la cola después de aislar y probar el renderizado. No emprender una mudanza completa de carpetas ni una migración simultánea a TypeScript.

## 1. Mapa del sistema observado

| Parte              | Estado actual                                                                                                                                                                                                                                     | Evidencia                                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Arranque           | [`src/index.js`](https://github.com/Maur025/tracking-report-js/blob/develop/src/index.js) crea la DB local, ejecuta migraciones, inicia scheduler, conexiones WebSocket y HTTP en un proceso.                                                     | `bootstrap()`                                                                                                                                                                                                                                          |
| Composición        | [`ioc-container.js`](https://github.com/Maur025/tracking-report-js/blob/develop/src/config/ioc/ioc-container.js) registra Express, Axios, repositorios, controladores y funciones; resuelve controladores mediante nombres derivados de archivos. | Awilix `PROXY`, `strict`, `listModules`                                                                                                                                                                                                                |
| Entrada            | Cuatro controladores manejan `GET /api/reports/...`, validación, filtros, configuración de empresa, consulta JSON y selección PDF/Excel.                                                                                                          | [Eventos](https://github.com/Maur025/tracking-report-js/blob/develop/src/modules/event/event-report.controller.js), [progreso](https://github.com/Maur025/tracking-report-js/blob/develop/src/modules/progress/progress.controller.js)                 |
| Datos              | `*-get-data.js` usa Axios hacia otro servicio; `*-stream.js` itera páginas de 100 filas.                                                                                                                                                          | [Consulta de eventos](https://github.com/Maur025/tracking-report-js/blob/develop/src/modules/event/event-report-get-data.js), [stream de eventos](https://github.com/Maur025/tracking-report-js/blob/develop/src/modules/event/event-report-stream.js) |
| Salida             | `initDocument({res})` conecta PDFKit a HTTP; `generateExcel({res})` conecta ExcelJS a HTTP.                                                                                                                                                       | [PDF](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/pdf/generate-pdf.js), [Excel](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/excel/generate-excel.js)                                                   |
| Persistencia local | Drizzle/libSQL guarda configuración de empresas; el valor predeterminado es `./database/tracking-report.db`.                                                                                                                                      | [Proveedor](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/database/db-provider.js), [entorno](https://github.com/Maur025/tracking-report-js/blob/develop/src/config/environment.js)                                              |
| Integración común  | `tracking-common` se importa para cliente y servidor de conexión con gateway; se declara como `file:../tracking-common`.                                                                                                                          | [Socket](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/socket-client/socket-client-handler.js), [package.json](https://github.com/Maur025/tracking-report-js/blob/develop/package.json)                                          |

No inspeccioné el repositorio `tracking-common` ni el despliegue. Su uso como biblioteca compartida no invalida el carácter de microservicio, pero `file:../tracking-common` requiere que exista esa ruta al instalar o construir: hay que documentar y hacer reproducible ese contexto.

## 2. Hallazgos, por prioridad

### P0 — Fin y fallo de la generación no se propagan al controlador

En [`core/pdf/report-table.js`](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/pdf/report-table.js) se crea `Readable.from(dataSource())`, se escuchan `data`, `end` y `error`, y se devuelve inmediatamente el documento. En [`core/excel/report-table.js`](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/excel/report-table.js) la función `async` instala escuchas y termina sin esperar el `commit()` del workbook. El `error` registra el problema y cierra la salida sin propagar el fallo. Los controladores hacen `await`, pero ese `await` no representa la terminación real del archivo. **Riesgo:** descarga truncada o aparentemente exitosa tras un fallo tardío. Verificar con un origen que falle después de la primera página.

**Acción:** consumo controlado con `for await...of`, finalización esperada (`finished()`/`pipeline()` según el adaptador), propagación de errores y cancelación del origen si la salida se cierra. Un fallo después de enviar cabeceras HTTP no puede convertirse en JSON de error; cerrar la conexión y registrar el contexto. Más adelante, el worker podrá marcar `FAILED` sin entregar un artefacto parcial.

### P0 — El renderizado depende de HTTP

[`initDocument`](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/pdf/generate-pdf.js) y [`generateExcel`](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/excel/generate-excel.js) exigen `res`. Los cuatro `*-pdf-report.js` y `*-excel-report.js` transmiten ese objeto. Un worker necesitaría fabricar una respuesta falsa o duplicar lógica.

**Acción:** renderizar a un `Writable` o a un destino de archivo/objeto abstracto; reservar cabeceras y descarga para el adaptador HTTP. Evitar acumular PDFs grandes en `Buffer` como solución general.

### P1 — Pruebas actuales no protegen la migración

[`test/modules/report.controller.test.js`](https://github.com/Maur025/tracking-report-js/blob/develop/test/modules/report.controller.test.js) importa un archivo inexistente y contiene `expect.fail("Not implemented yet")`. [`test/core/pdf/generate-pdf.test.js`](https://github.com/Maur025/tracking-report-js/blob/develop/test/core/pdf/generate-pdf.test.js) importa `createPdfTemplate` y `generatePdf`, exportaciones que no aparecen en el archivo actual. `jsconfig.json` tiene `checkJs: false`. No ejecuté Vitest; estos casos son fallos o desajustes directamente visibles en el código. Los tests de `ServerApp` son útiles para el ensamblaje, pero no ejercitan una generación completa.

**Acción:** reparar/retirar pruebas obsoletas y añadir pruebas de integración focalizadas en archivo válido, finalización, fallo de consulta a mitad de stream y cancelación. Después proteger un caso de uso sin Express.

### P1 — Controladores con demasiadas decisiones

Por ejemplo, [`EventReportController`](https://github.com/Maur025/tracking-report-js/blob/develop/src/modules/event/event-report.controller.js) interpreta parámetros, crea filtros, obtiene configuración de DB, consulta datos, selecciona formato y construye PDFs/Excel. El patrón se repite en los otros controladores. Una nueva entrada por cola obligaría a repetir esas decisiones.

**Acción:** dejar en HTTP la validación de la petición y su traducción a comandos, estado y cabeceras. Mover la orquestación a `requestReport` y `generateReport`; reutilizar los mapeos específicos de cada tipo.

### P1 — Validación de entrada y contratos heterogéneos

`event-report-query-param.js` acepta `format` como `string` y valida después en el controlador; progreso y registro de progreso usan enum. `page` y `size` convierten con `parseInt` sin límites explícitos; `descending` convierte cualquier valor distinto de `"true"` a `false`. Esto permite parámetros ambiguos y dificulta una firma de trabajo estable.

**Acción:** un esquema compartido para parámetros comunes con `format`, rangos de paginación, formato de nombre, zona horaria y límites de fechas; conservar filtros particulares en cada módulo. Validar otra vez el mensaje que llega al worker: la cola también es una frontera de entrada.

### P1 — Persistencia y despliegue del futuro worker

[`db-provider.js`](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/database/db-provider.js) usa `file:` local. Si API y worker viven en contenedores o máquinas diferentes, no deben asumir que esa ruta representa la misma DB. Además, la cola y la DB de estados serán sistemas separados; crear el registro y encolar no es automáticamente una operación atómica.

**Acción:** definir una base de datos accesible desde ambos procesos para estado/metadata y un almacenamiento compartido para archivos. Elegir semántica de aceptación e idempotencia antes de responder `202`. Una transacción con outbox o un mecanismo de reconciliación son opciones si se exige no perder solicitudes entre DB y cola.

### P2 — Acoplamientos de infraestructura que conviene limitar

`getDatabaseConfig` está en `core/common/action` pero importa un repositorio de `enterprise`; debería pertenecer a una aplicación/integración concreta. El registro de controladores mezcla declaraciones explícitas con `listModules` y nombres calculados. [`db-repository.js`](https://github.com/Maur025/tracking-report-js/blob/develop/src/core/database/db-repository.js) ejecuta `findByIdThrow` sobre `dbClient` antes de actualizar/borrar con la transacción recibida; conviene revisar esa consistencia si esos métodos se usan en flujos transaccionales. No haría un refactor general de repositorios como requisito de la cola.

### Lo que conservaría

- Los módulos actuales por tipo de reporte; no es necesario un nuevo `modules/reports` que los esconda.
- Los mapeos y reglas de presentación como funciones, incluidos `getEventValues` y cálculos de fecha, con pruebas de casos reales.
- Awilix como punto de composición. Una clase como `ServerApp` puede expresar ciclo de vida; no hay beneficio automático en convertirla a función.
- Los generadores asíncronos para recorrer páginas, añadiendo cancelación, límites y detección de errores.
- Zod en entradas y Drizzle detrás de repositorios concretos.

## 3. Reglas de arquitectura para cambios nuevos

1. **Cada tipo de reporte es dueño de sus filtros, consulta, columnas y mapeo.** Compartir únicamente un mecanismo repetido y estable; evitar un framework genérico de reportes prematuro.
2. **Los casos de uso reciben datos y dependencias, nunca `req`, `res` ni un contenedor Awilix.** La selección de PDF/Excel y la política de generación pertenecen a la aplicación; cabeceras y códigos HTTP pertenecen al adaptador HTTP.
3. **`domain` solo si aparecen reglas independientes de tecnologías.** No mover PDFKit ni helpers de dibujo a `domain`: renderizar sigue siendo un efecto de infraestructura aunque use funciones.
4. **Toda tarea tiene una terminación observable:** `generateReport(command)` resuelve cuando el artefacto quedó guardado y su estado actualizado, o rechaza con causa. No silenciar errores de streams.
5. **Dependencias externas entran por puertos pequeños y concretos:** `reportDataSource`, `reportRenderer`, `reportStorage`, `reportJobQueue`, `reportJobRepository`; no crear interfaz por cada función si no existe cambio o prueba que la justifique.
6. **Awilix solo se resuelve en entradas/composición.** Registrar explícitamente componentes críticos de API y worker; evitar que módulos de negocio hagan `container.resolve()`.
7. **Las entradas se validan en su frontera y el trabajo en cola tiene versión.** Persistir filtros normalizados, identidad/tenant autorizado y versión del contrato; no enviar `Response`, tokens ni datos de empresa no verificados como verdad permanente.
8. **Un trabajo puede repetirse.** El worker debe tolerar entregas duplicadas, reintentos y reinicios: `jobId` estable, transición de estado controlada y escritura de artefacto atómica o idempotente.
9. **La configuración local y el almacenamiento de artefactos no son estado compartido por defecto.** En desarrollo pueden existir en disco; en despliegue distribuido deben definirse explícitamente.
10. **Pruebas en límites de fallo, no solo mocks de llamadas.** Probar archivo válido y legible, consulta fallida, render fallido, encolado fallido, reintento y acceso autorizado a estado/descarga.
11. **`tracking-common` queda circunscrito a integración de gateway.** Versionarlo y documentar cómo instalarlo; evitar importar allí reglas de generación de reportes.
12. **Cambios incrementales con contrato observable.** Mantener endpoints actuales durante la transición y añadir el flujo asíncrono con versión de API o nuevas rutas antes de retirar descargas síncronas.

## 4. Estructura objetivo orientativa

Una posible evolución, solo al tocar los archivos correspondientes:

```text
src/
  entrypoints/
    api.js                 # servidor Express y composición HTTP
    worker.js              # consumidor de trabajos; proceso distinto
  reports/
    application/
      request-report.js    # valida la política, persiste y encola
      generate-report.js   # datos -> render -> storage -> estado
      get-report-status.js
    jobs/
      report-job-schema.js # contrato versionado
    infrastructure/
      queue/
      storage/
      persistence/
      pdf/
      excel/
  modules/
    event/                 # filtros, datos y descripción del reporte
    progress/
    registry-progress/
    rules/
  integrations/
    gateway/               # tracking-common y sincronización de empresas
  config/
    ioc/
```

No son nombres obligatorios. El límite importante es que `entrypoints/api.js` y `entrypoints/worker.js` llamen al mismo `generateReport` sin introducir Express dentro de él. Las funciones de PDFKit/ExcelJS pueden seguir siendo funciones dentro de sus adaptadores.

## 5. Secuencia de tareas propuestas

### Fase A — Red de seguridad y comportamiento actual (antes de cola)

- [ ] **A1. Hacer reproducible el arranque.** Documentar Node/pnpm, `tracking-common`, variables y DB, comandos de instalación, pruebas y desarrollo; añadir comandos de CI para lint/test. **Hecho cuando:** un compañero puede instalar y ejecutar en un entorno limpio con pasos escritos.
- [ ] **A2. Corregir suite obsoleta.** Sustituir imports/exportaciones y el test deliberadamente fallido por casos sobre APIs actuales. **Hecho cuando:** `pnpm test --run` termina correctamente y no hay tests vacíos.
- [ ] **A3. Caracterizar contrato HTTP.** Probar JSON, PDF y Excel para un tipo (eventos): formato, cabeceras, filtros, contenido mínimo y errores. Repetir solo variantes significativas de los otros tipos. **Hecho cuando:** un cambio de adaptador no altera resultados públicos involuntariamente.
- [ ] **A4. Fijar límites de entrada.** Unificar `format`, paginación, fechas y zona horaria en Zod; acordar límite de filas/periodo. **Hecho cuando:** entradas inválidas reciben 400 verificable y las válidas preservan la consulta esperada.

### Fase B — Separar y robustecer generación

- [ ] **B1. Arreglar finalización PDF y Excel.** Sustituir listeners sin espera por consumo secuencial del async iterable y esperar commit/cierre; propagar fallo y manejar desconexión. **Hecho cuando:** error a mitad de datos rechaza la operación y no declara archivo correcto.
- [ ] **B2. Separar destino del render.** PDFKit y ExcelJS reciben un destino `Writable`/almacenamiento, no `res`; HTTP adapta su respuesta a ese destino para el flujo sincrónico existente. **Hecho cuando:** se genera un archivo válido desde una prueba sin Express.
- [ ] **B3. Extraer `generateReport`.** Recibe `{type, format, filters, requester, ...}` normalizados, consulta datos mediante el módulo correspondiente y produce un artefacto. **Hecho cuando:** una prueba invoca el caso de uso con adaptadores de prueba, sin `Response` ni Awilix.
- [ ] **B4. Reducir controladores.** Solo transforman petición a comando y resultado a HTTP. **Hecho cuando:** los cuatro controladores no importan constructores PDF/Excel ni consultas Axios directamente.

### Fase C — Diseño del contrato asíncrono

- [ ] **C1. Decidir con el equipo:** cola (BullMQ si Redis ya es una dependencia operativa, otra opción si infraestructura lo exige), DB compartida para estados, storage compartido, retención, autorización y límites. **Hecho cuando:** existe decisión registrada con responsables y estrategia de despliegue. `file:` local no se presupone compartido.
- [ ] **C2. Definir API y modelo.** `POST /api/report-jobs` devuelve `202` con `{id,status,statusUrl}` una vez aceptado de forma durable; `GET /api/report-jobs/:id` devuelve estado; descarga autenticada al completar. Estados sugeridos: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, con timestamps, tipo, formato, solicitante, ubicación y error seguro. **Hecho cuando:** frontend y backend acuerdan payloads y permisos.
- [ ] **C3. Definir identidad/idempotencia.** Especificar qué ocurre si el cliente reintenta `POST`, si el worker recibe dos veces un trabajo y si un archivo se escribió pero falló el cambio de estado. **Hecho cuando:** esos tres escenarios tienen pruebas y resultados deterministas.
- [ ] **C4. Resolver DB + cola.** Elegir: encolar y reconciliar estados `PENDING` sin job, o outbox transaccional en DB con publicador. **Hecho cuando:** un fallo entre persistencia y encolado no deja solicitudes perdidas sin recuperación.

### Fase D — Implementación y despliegue

- [ ] **D1. Añadir adaptadores** de repositorio de jobs, cola y almacenamiento con pruebas de integración. **Hecho cuando:** la API ve estados/archivos del worker en procesos separados.
- [ ] **D2. Crear `worker.js`** como proceso separado, con composición propia, límite de concurrencia inicial bajo (por ejemplo, 1), reintentos acotados, cierre limpio y límites de tiempo/tamaño. **Hecho cuando:** la generación pesada no afecta la latencia del proceso API en prueba de carga representativa.
- [ ] **D3. Registrar progreso y fallos.** Correlación `jobId` en logs, duración, tamaño de archivo, reintentos, profundidad de cola; notificar al gateway solo tras `COMPLETED`. `GET status` sigue siendo la fuente de verdad. **Hecho cuando:** se diagnostica un job fallido sin buscar por usuario o archivo.
- [ ] **D4. Desplegar gradualmente.** Activar la nueva ruta para un tipo de reporte, medir, extender a los demás, actualizar frontend y retirar descargas síncronas según uso real. **Hecho cuando:** los cuatro tipos funcionan y existe rollback documentado.

### Fase E — TypeScript, decisión separada

- [ ] **E1. Propuesta al equipo.** Comparar coste de migración (build, despliegue, imports, `tracking-common`) con `checkJs`/JSDoc; acordar alcance. **Hecho cuando:** la decisión y convenciones están documentadas.
- [ ] **E2. Si se aprueba, migrar por frontera.** Empezar por contratos de jobs y casos de uso nuevos, después adaptadores tocados; activar chequeo estricto gradualmente. **Hecho cuando:** tipos capturan errores de payload y dependencias sin exigir reescribir todo el servicio de una vez.

## 6. Primer incremento recomendado

Escoger **eventos PDF y Excel** como recorrido vertical. Hacer A2–A4 y B1–B3; mantener el endpoint actual operativo. Una prueba debe inyectar dos páginas de datos y otra hacer fallar la segunda página. Si ambas salidas terminan, son legibles y el fallo se propaga, ya existe una base técnica verificable para usar el mismo caso de uso desde un worker. Solo entonces empezar C/D.

## 7. Decisiones pendientes que afectan la implementación

| Pregunta                                                              | Por qué importa                                      | Valor inicial sugerido                                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| ¿Dónde correrán API, worker y Redis/cola?                             | Define si disco y DB locales son compartidos.        | Procesos separados; estado y artefactos compartidos explícitamente.          |
| ¿Cuánto tiempo conservar archivos y quién puede descargarlos?         | Coste, privacidad y autorización.                    | Plazo corto configurable; verificar solicitante/tenant en estado y descarga. |
| ¿Qué volumen y tamaño máximo de reporte se espera?                    | Concurrencia, memoria, almacenamiento, timeouts.     | Medir casos reales; límites conservadores iniciales.                         |
| ¿`tracking-common` tiene versión publicable o workspace reproducible? | El `file:../tracking-common` condiciona CI e imagen. | Pin de versión o workspace documentado.                                      |
| ¿El equipo autoriza TypeScript?                                       | Cambia toolchain y normas de contribución.           | Decisión independiente del trabajo de cola.                                  |

Esta hoja de ruta es una guía de implementación, no una afirmación de que esos fallos ya se hayan observado en producción. Conviene empezar con pruebas de comportamiento antes de cambiar la ejecución en vivo.

## 8. Test necesarios a implementar

| Tipo                     | En tu proyecto probaría                                                                                                          | Aislamiento                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Unitaria                 | `getEventValues`, filtros de fecha, mapeos, paginación del generador, decisiones de un caso de uso                               | Sin red, DB ni archivos reales. Sustituir solo sus dependencias externas.         |
| Integración de adaptador | PDFKit/ExcelJS produciendo un archivo; repositorio Drizzle con DB temporal; cliente de datos frente a un servidor HTTP de prueba | Usar la tecnología real que se quiere verificar y sustituir los servicios ajenos. |
| Integración de flujo     | Petición HTTP → caso de uso → generación → archivo, o más adelante API → cola → worker → estado                                  | Procesos/componentes reales necesarios para ese flujo; datos aislados por prueba. |

No aislaría tanto una prueba de integración que termine simulando PDFKit o Drizzle. Si pruebas el PDF, genera uno real y comprueba al menos que finaliza y contiene lo esperado. Si pruebas el repositorio, usa una base temporal. En cambio, no conectaría la suite habitual al gateway o a la base de otro microservicio: controla esa frontera con un servidor de prueba y respuestas conocidas. Cuando llegue la cola, añade unas pocas pruebas con el backend de cola real y una prueba completa entre procesos; deja el resto en unitarias rápidas.
Tu vitest.config.js actual basta para empezar. Puedes separar la ejecución por ruta con scripts como vitest run test/unit y vitest run test/integration; si después necesitan configuración o recursos distintos, Vitest admite proyectos unit e integration con patrones independientes. Vitest
Yo comenzaría por una integración de eventos PDF y otra de Excel, cada una con dos casos: generación completa con varias páginas de datos y error en una página posterior. Son las pruebas que más valor aportan antes de mover la generación al worker: comprobarán que la operación espera el cierre real del archivo y propaga un fallo tardío.

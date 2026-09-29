# AGENTS.md

Microservicio Express 5 (ESM, Node >= 24) que genera reportes de tracking en JSON/Excel/PDF
contra la API de cada tenant. Ver `README.md` para endpoints y variables de entorno.

## Comandos

| Comando                                              | Nota                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm dev`                                           | `node --watch src/index`. **Debe correr desde la raíz del repo** (ver migraciones).  |
| `pnpm vitest run`                                    | Usa este, no `pnpm test`: el script `test` es `vitest` pelado y cae en watch en TTY. |
| `pnpm vitest run test/ioc/container-adapter.test.js` | Un archivo. `-t "nombre"` filtra por nombre de test.                                 |
| `pnpm lint`                                          | `eslint . --ext .js`.                                                                |
| `pnpm generate:migrate`                              | Tras tocar un `*.schema.js`. Lee `DB_URL` de `.env` (`drizzle.config.js`).           |

No existe script de `typecheck`: `jsconfig.json` tiene `checkJs: false`, los JSDoc son solo pistas
de editor. No hay CI (`.github/`), ni hooks, ni `lint-staged`.

## Baseline rojo (no lo rompiste tú)

- `pnpm vitest run` falla: 4 de 6 archivos de test. `test/modules/report.controller.test.js`
  importa `src/modules/report.controller.js`, que no existe; `error-handler`, `server-response` y
  `generate-pdf` tienen `expect.fail("Not implemented yet")` o imports obsoletos
  (`generate-pdf.js` exporta `initDocument`/`getFont`, no `createPdfTemplate`/`generatePdf`).
  Solo pasan `test/core/server-app.test.js` y `test/ioc/container-adapter.test.js`.
- `pnpm lint` falla con 3 `no-unused-vars` preexistentes, todos en `test/`.

Compara contra ese estado antes de asumir que un cambio rompió algo.

## Prettier no está instalado

`.prettierrc` existe pero no hay binario de prettier en devDependencies — el formateo solo ocurre
en el editor. Igual hay que escribir código con su estilo: **tabs, tabWidth 4, printWidth 100,
comillas dobles, trailing commas, punto y coma**.

## Setup

- `tracking-common` es dependencia `file:../tracking-common`. Sin el paquete hermano en esa ruta
  , `pnpm install` y `pnpm dev` fallan.
- `pnpm-workspace.yaml` solo contiene `allowBuilds` con todo en `false` (no corre builds nativos).
- `.env` es necesario; `.env.example` gana sobre el default de `src/config/environment.js`
  (`APP_PORT` 10801 vs 7769).

## Arquitectura: lo que no se deduce de los nombres

### Bootstrap y orden obligatorio (`src/index.js`)

1. `dbProvider()` + `containerAdapter.registerValue("dbClient", dbClient)`
2. migraciones → `serverApp.initialize()` → scheduler → cliente WS gateway → servidor WS salida → `listen()`

Cualquier fallo → `process.exit(1)`. **Paso 1 es obligatorio:** el contenedor usa
`injectionMode: PROXY` + `strict: true`, así que los repositorios no se pueden resolver
(`getDatabaseConfig`, `enterprise*Repository`) hasta que `dbClient` esté registrado. Por eso los
tests construyen los repositorios a mano y no importan el contenedor.

### Controllers: auto-descubrimiento + registro manual

`src/config/ioc/ioc-container.js` hace `listModules("**/*.controller.js")` y deriva el nombre de
Awilix del path del archivo (`event-report.controller.js` → `eventReportController`).

Al agregar un controller nuevo hay **dos** pasos, no uno:

1. crear `src/modules/<x>/<x>.controller.js` con `registerRoutes(app, basePath)`,
2. registrarlo a mano en `iocContainer.register({...})` con `asClass(...).singleton()`.

Sin el paso 2, la resolución de `controllers` explota en `serverApp` y el bootstrap muere. El
nombre derivado del archivo debe coincidir exactamente con el nombre del registro.

`server-app.js` monta el middleware 404 catch-all **antes** del error handler; ese orden es
intencional, no lo inviertas.

### Multi-tenant: nada está hardcodeado por cliente

`databaseName` (query param) → `getDatabaseConfig.getConfig()` → `findByDatabase` sobre la tabla
`enterprise_config_dbs` → `{ host: "http://<host>:<port>", enterprise }`. Esa tabla solo se llena
con el evento `enterprises` que emite el gateway por WebSocket. **Sin gateway conectado el
catálogo queda vacío y todos los requests fallan** — no esperes poder probar endpoints sin el
gateway en `WS_GATEWAY_HOST_PROCESSOR:WS_GATEWAY_PORT_PROCESSOR`.

Los datos se piden por axios a la API del tenant: `${dbHost}/${dbName}/<recurso>`. La traducción
de nombres de filtros a la sintaxis del backend (`vehicleId` → `[vehicle_id][equal]`,
`fromDate` → `[date][between][from]`) vive en el `transformFilters` local de cada `*-get-data.js`,
no en un lugar compartido.

### Fechas (Temporal)

- El DTO (`core/common/dto/date-filter-request-schema.js`) parsea los query params ISO a
  `Temporal.ZonedDateTime` en **UTC**; cada módulo lo extiende con sus filtros.
- `dateFilterProcess` usa `zoneId` solo para expandir el rango a día/mes/año completo. Default
  `UTC`.
- `dateFilterProcess` lanza `Error` plano (no `ZodError`) si `fromDate > toDate` → responde **500**,
  no 400. Solo los errores de Zod se traducen a 400 (`core/error-handler.js`).

### Streaming

`*-stream.js` son async generators con `size` fijo en 100 que cortan cuando la página viene corta
o vacía. Excel y PDF escriben directo al `res`; el reporte completo nunca se materializa. No los
conviertas a `Promise.all` sobre páginas ni los devuelvas como array.

## Agregar un módulo de reporte

Convención observada en `event`, `rules`, `progress`, `registry-progress` — un directorio por
módulo con: `<x>.controller.js`, `dto/<x>-query-param.js`, `<x>-get-data.js`, `<x>-stream.js`,
`map-response-to-report-<x>.js`, `<x>-excel-report.js`, `<x>-pdf-report.js`,
`common/<x>-report-common.js`. Cada controller declara su segmento de ruta en un campo privado
`#resource` y los headers de Excel/PDF salen de `core/excel|excel/report-table.js` y
`core/pdf/report-table.js`.

## Base de datos

- `src/core/database/schema.js` solo re-exporta los `*.schema.js` de los módulos; el `relations`
  de Drizzle vive en `src/core/database/relation.js`.
- `dbRepository()` (`core/database/db-repository.js`) es una CRUD genérica con upsert; los
  repos de módulo agregan sus queries encima y sparsan lo que retorna.
- Las migraciones de `drizzle/` se aplican en cada arranque, con
  `migrationsFolder: path.resolve(process.cwd(), "./drizzle")`. Arrancar desde otro cwd rompe el
  deploy de migraciones silenciosamente.
- `*.db` está gitignored; el catálogo se reconstruye del gateway.

## Tests

- `vitest.config.js` tiene `globals: false` → **importá siempre de `vitest` explícitamente**
  (`eslint.config.js` reactiva `no-unused-vars` implícito vía `no-undef` justo para eso).
- `test/` espeja `src/`. Convención: comentarios `// GIVEN` / `// WHEN` / `// THEN`, instanciar en
  `beforeEach`, `afterEach(() => vi.resetAllMocks())`.
- No hay fixtures, mocks compartidos ni servicios de test: la suite es pura unidad con dobles a
  mano. No introduzcas dependencias de red/gateway/DB.
- Los handlers de Express con parámetros sin usar disparan `no-unused-vars`; el repo lo resuelve
  con `// eslint-disable-next-line no-unused-vars` (ver `error-handler.js`, `server-app.js`).
  Seguí ese patrón.

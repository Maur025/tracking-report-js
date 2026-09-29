# Tracking Report

Microservicio que genera **reportes de tracking** en JSON, Excel y PDF. Es _multi-tenant_: cada
request indica contra qué base de datos consultar, y el servicio se encarga de resolver el host,
puerto y datos de la empresa a partir de un catálogo local sincronizado por WebSocket.

## Stack

Node.js ≥ 24 (ESM) · Express 5 · Awilix (DI) · Zod · Drizzle ORM + libsql (SQLite) ·
ExcelJS · PDFKit / pdfmake · Socket.IO (`tracking-common`) · Vitest · pnpm

## Setup

```bash
pnpm install                 # tracking-common es dependencia local: file:../tracking-common
cp .env.example .env
pnpm dev
```

> Requiere que exista el paquete hermano `../tracking-common` en el mismo workspace.

## Variables de entorno

| Variable                    | Default                         | Descripción                                                     |
| --------------------------- | ------------------------------- | --------------------------------------------------------------- |
| `APP_PORT`                  | `10801`                         | Puerto HTTP de la API de reportes                               |
| `WS_PORT`                   | `10701`                         | Puerto del servidor WebSocket de salida (`ws-processor-output`) |
| `WS_GATEWAY_HOST_PROCESSOR` | `localhost`                     | Host del gateway (cliente WS)                                   |
| `WS_GATEWAY_PORT_PROCESSOR` | `7160`                          | Puerto del gateway                                              |
| `DB_URL`                    | `./database/tracking-report.db` | Archivo SQLite local (catálogo de empresas)                     |
| `APP_ID`                    | `REP01`                         | Identificador ante el gateway                                   |
| `APP_NAME`                  | `Tracking-report`               | Nombre de la app                                                |
| `UUID`                      | —                               | Identificador de instancia                                      |
| `TZ`                        | `America/La_Paz`                | Zona horaria por defecto                                        |
| `PING_INTERVAL_MS`          | `5000`                          | Intervalo de ping del cliente WS                                |
| `STORAGE_INTERVAL_HRS`      | `1`                             | Intervalo de tareas de almacenamiento                           |
| `SAVE_INTERVAL_MIN`         | `5`                             | Intervalo de guardado                                           |

## Cómo funciona

```
                     ┌──────────────────────────────────────────┐
                     │  Gateway de tracking (puerto 7160)       │
                     └──────────────┬───────────────────────────┘
                        WS "enterprises" (catálogo de empresas)
                                    ▼
┌──────────────────────── tracking-report ────────────────────────┐
│                                                                │
│  Express :10801                                               │
│      │  GET /api/reports/events?databaseName=...&format=pdf    │
│      ▼                                                         │
│  Controller ── zod ──▶ dateFilterProcess (Temporal)            │
│      │                                                         │
│      ├──▶ getDatabaseConfig(databaseName)                      │
│      │         └──▶ SQLite: enterprise_config_dbs               │
│      │               → { host, port, enterprise }              │
│      │                                                         │
│      ├──▶ *-get-data.js  (axios GET  http://host:port/<db>/<recurso>)
│      │                                                         │
│      └──▶ mapResponseToReport* ──┬──▶ json   (paginado)        │
│                                  ├──▶ excel  (stream, 100/pág)│
│                                  └──▶ pdf    (stream)          │
└────────────────────────────────────────────────────────────────┘
```

**1. Bootstrap** (`src/index.js`) — en orden: aplica migraciones Drizzle, inicializa Express,
levanta el scheduler, el cliente WebSocket del gateway, el servidor WebSocket de salida y por
último escucha en `APP_PORT`. Cualquier fallo termina el proceso con `exit(1)`.

**2. Catálogo multi-tenant** — al conectarse, el gateway emite el evento `enterprises`. Ese
payload se persiste en `enterprises` y `enterprise_config_dbs` (upsert por
`database + referenceId + enterpriseRefId`). Cada request trae `databaseName`; se busca en esa
tabla para obtener el `host`/`port` de la API de la empresa, sin tener nada hardcodeado por tenant.

**3. Filtros** — los query params se validan con Zod. Las fechas se convierten con
`@js-temporal/polyfill` (`Temporal.Instant` → `ZonedDateTime` en la zona del cliente) y se
normalizan a rangos `fromDate`/`toDate` (día completo, mes o año según el filtro usado). Luego se
traducen a la sintaxis del backend: `vehicleId` → `[vehicle_id][equal]`, `fromDate` →
`[date][between][from]`.

**4. Salida** — `json` devuelve una página con su paginación. `excel` y `pdf` recorren el
generador `*-stream.js` (páginas de 100) y escriben directo al `res`, así no se carga todo el
reporte en memoria.

**5. Controllers automáticos** — el contenedor Awilix descubre cualquier
`src/**/*.controller.js` con `listModules()` y los registra bajo `/api`; no hay una lista manual
de rutas.

## API

Todos los endpoints son `GET` y se validan con Zod (los parámetros inválidos devuelven `400`).

| Endpoint                         | Recurso consultado en la BD de la empresa |
| -------------------------------- | ----------------------------------------- |
| `/api/reports/events`            | `registry_events/eventnotification`       |
| `/api/reports/rules`             | `rules`                                   |
| `/api/reports/progress`          | `progress`                                |
| `/api/reports/registry-progress` | `registry_progress`                       |

**Query params comunes**

| Param                                                   | Default       | Descripción                                            |
| ------------------------------------------------------- | ------------- | ------------------------------------------------------ |
| `databaseName`                                          | —             | **Requerido.** Base de datos de la empresa a consultar |
| `format`                                                | `json`        | `json`, `excel` o `pdf`                                |
| `page` / `size`                                         | `0` / `20`    | Paginación (solo `json`)                               |
| `sortBy`                                                | según reporte | Campo de orden                                         |
| `descending`                                            | `true`        | Orden inverso                                          |
| `date` / `fromDate`+`toDate` / `monthDate` / `yearDate` | —             | Filtro temporal (ISO)                                  |
| `zoneId`                                                | `UTC`         | Zona horaria usada para expandir el rango de fechas    |
| `disposition`                                           | `inline`      | `inline` o `attachment` (solo archivos)                |
| `fileName`                                              | `example`     | Nombre del archivo generado                            |
| `filterByLabel`                                         | —             | Etiqueta de la columna a filtrar en el archivo         |

**Filtros específicos** — `events`: `vehicleId`, `ruleId`, `inout`, `geofenceId`, `type`,
`deventId` · `rules`: `keyword`, `type`, `frequencyWeekday` ·
`registry-progress`: `type`, `vehicleId`, `progressId` (todos aceptan valores múltiples).

## Estructura

```
src/
├── index.js                 # bootstrap
├── config/
│   ├── environment.js       # env tipada
│   └── ioc/                 # contenedor Awilix + auto-descubrimiento de controllers
├── core/
│   ├── server-app.js        # Express, CORS, middlewares, estáticos
│   ├── error-handler.js
│   ├── database/            # drizzle, schema, migraciones
│   ├── socket-client/       # cliente/servidor WS y scheduler
│   ├── common/              # logger, fechas, paginación, action helpers
│   ├── excel/  pdf/         # generadores de archivo y plantillas de tabla
├── modules/
│   ├── enterprise/          # catálogo multi-tenant (schema + repositorios)
│   ├── event/  rules/  progress/  registry-progress/
│   │                         # controller · dto · -get-data · -stream · -excel-report · -pdf-report
```

## Comandos

| Comando                 | Descripción                          |
| ----------------------- | ------------------------------------ |
| `pnpm dev`              | Ejecuta con `node --watch src/index` |
| `pnpm test`             | Tests (Vitest)                       |
| `pnpm test:watch`       | Tests en modo watch                  |
| `pnpm lint`             | ESLint                               |
| `pnpm generate:migrate` | Genera migraciones en `drizzle/`     |

## Base de datos

SQLite local con Drizzle. Las migraciones de `drizzle/` se aplican **automáticamente** al
arrancar; solo hace falta `pnpm generate:migrate` tras modificar `schema.js`.

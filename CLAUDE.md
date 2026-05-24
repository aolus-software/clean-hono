# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Runtime & Tooling

Bun is the runtime for everything (dev server, scripts, seeds, ClickHouse migrate script). Do not assume Node — `tsconfig.json` declares `types: ["bun-types"]` and `Bun` is a global in ESLint. Scripts are invoked via `bun run …` or `make …` (the Makefile is a thin wrapper around the `bun run` scripts).

## Common Commands

- `bun run dev` — start the API with hot reload (entry: `src/index.ts` → `src/app.ts`). The BullMQ worker is loaded in-process via `src/bull/index.ts`, so there is no separate `dev:worker` despite what the README implies.
- `bun run build` — `bun build` to `dist/api`, target `node`.
- `bun run start` — production start.
- `bun run lint` / `lint:fix` / `format` — ESLint (typed) and Prettier (tabs, double quotes, 80 cols, LF).
- `bun run typecheck` — `tsc --noEmit`.
- `bun run db:generate` / `db:migrate` / `db:push` / `db:studio` / `db:drop` — Drizzle Kit against PostgreSQL. Schema and migrations live in `src/libs/database/postgres/` (see `drizzle.config.ts`).
- `bun run db:seed` — seeds via `src/libs/database/seed/index.ts`.
- `bun run db:clickhouse:migrate` / `db:clickhouse:status` — custom migrator at `src/libs/database/clickhouse/scripts/migrate.ts`.
- `make fresh` = `db:drop && db:push && db:seed` (dev only). `make reset` = `db:generate && db:migrate && db:seed`.

There is **no test runner configured**; do not invent test commands.

Note: the root `README.md` references `dev:server`, `dev:worker`, `dev:all`, `build:all`, `start:all` — those scripts do **not** exist in `package.json`. Use the commands above.

## Husky Pre-commit

`.husky/pre-commit` runs: `bun install` → `bun run format` → `bun run lint:fix` → `bunx drizzle-kit generate` → `bunx drizzle-kit migrate` → `tsc --noEmit` → `bun run build`. This means a commit will attempt to run real DB migrations against `DATABASE_URL` — keep `.env` pointing at a safe local DB while committing, or expect the hook to fail/migrate.

## Architecture

### Composition pipeline

`src/index.ts` exports `{ port, fetch }` for Bun. `src/app.ts` builds the Hono app and applies middleware in this fixed order — preserve it when adding new ones:

1. `requestIdMiddleware` (must be first; everything downstream reads the ID)
2. `loggerMiddleware`, `performanceMiddleware`
3. `diMiddleware` — injects services from the DI container into `c.var`
4. `bodyLimitMiddleware`, `corsMiddleware`, `securityHeadersMiddleware`, `rateLimiterMiddleware`
5. `registerException(app)` — centralized error handler (see `src/libs/hono/errors/error.handler.ts`)
6. `app.route("/", bootstrap)` mounts `src/modules/index.ts`, which wires `/`, `/auth`, `/profile`, `/settings`, plus `/docs` (Scalar) and `/docs/openapi.json`.

### Dependency injection

Hand-rolled container at `src/libs/hono/core/container.ts` (singleton cache keyed by string name).

- **Register** services once in `src/bootstrap.ts` (`bootstrap()` is called from `app.ts`).
- **Inject** services into the Hono context in `src/libs/hono/middlewares/core/di.middleware.ts` — every registered service must be `c.set(...)` here and typed in `src/libs/types/hono/app.types.ts` (`Variables`).
- **Resolve** in routes via `c.get("authService")` etc. Routes never `new` services directly.

When you add a new service: implement an `IXxxService` interface in `service.interface.ts`, register in `bootstrap.ts`, set in `di.middleware.ts`, add to `Variables`. Forgetting any one of those four steps breaks types or runtime.

### Module layout

Each feature module under `src/modules/<name>/` follows:

- `routes.ts` — `OpenAPIHono` instance, `createRoute` definitions, handlers that pull the service via `c.get(...)`.
- `schema.ts` — Zod request/response schemas (use `.openapi(...)` for docs).
- `service.interface.ts` — interface only (ESLint ignores `**/*.interface.ts`).
- `service.ts` (or `services.ts` in `settings/users`) — implementation; talks to repositories from `@database`.

`src/modules/settings/index.ts` is a sub-router that further mounts `permissions`, `roles`, `users`, `select-options`.

### Data layer

- `src/libs/database/index.ts` re-exports postgres, clickhouse, and redis clients. Always import via `@database` rather than reaching into the subpaths.
- PostgreSQL: Drizzle (`drizzle-orm/node-postgres`) with a shared `pg.Pool`. Schema in `src/libs/database/postgres/schema/`, repositories in `…/repositories/`. Repositories are factory functions (e.g. `UserRepository()`) that accept an optional `DbTransaction` so they compose inside `db.transaction(async trx => …)`.
- ClickHouse migrations are custom (not Drizzle) — script-based.
- Redis is used by both `hono-rate-limiter` and BullMQ.

### Background jobs

`src/bull/queue/*.queue.ts` defines queues; `src/bull/worker/*.worker.ts` defines workers. `src/bull/index.ts` side-effect-imports the workers, so simply importing anything from `@bull` boots the worker in the same process as the API. There is no separate worker entrypoint.

### Authorization

RBAC primitives live in `src/libs/hono/guards/`:

- `roleGuard(roles[])`, `permissionGuard(permissions[])`
- `requireGuards({ roles, permissions })` returns a middleware array to spread.
- `Guards.*` (e.g. `Guards.userManagement.list()`) are named convenience guards backed by string permission keys like `"user list"`, `"role create"`. When adding a new resource, add both the permission strings (seed/migrations) and the `Guards.*` helpers so routes stay declarative.

Routes apply `AuthMiddleware` first, then a `Guards.*` middleware before the handler.

### Errors & responses

- Throw typed errors from `@errors` (`UnprocessableEntityError`, `NotFoundError`, `UnauthorizedError`, …). The handler registered in `app.ts` formats them; never `c.json({error: …}, 400)` by hand.
- `UnprocessableEntityError` takes a field-keyed validation array — match the existing shape so the OpenAPI `commonResponse(...)` examples remain accurate.
- Use `ResponseToolkit.success(c, data, message, status)` for success responses to keep the envelope consistent.
- `defaultHook` from `@errors` is passed to every `new OpenAPIHono({ defaultHook })` so Zod validation failures route through the same formatter.

### Path aliases

Defined in `tsconfig.json` and used pervasively — prefer them over relative paths:

```
@config, @cache, @default, @mail/*, @database, @database/*,
@hono-libs, @hono-libs/*, @errors, @guards,
@utils, @utils/*, @types, @modules, @modules/*, @bull, @bull/*
```

## Conventions

- TypeScript strict mode + ESLint `recommendedTypeChecked`. `any` is an **error**, not a warning; use `unknown` + narrowing. `no-floating-promises` is also an error — `await` or `void` every promise.
- Prettier uses **tabs** (width 2), double quotes, trailing commas, LF endings. The repo is tab-indented; preserve that.
- Don't add inline comments on every line. Comments belong above non-obvious blocks only (per `.github/copilot-instructions.md`).
- Files matching `**/*.interface.ts` and `**/interface(s)/**` are excluded from lint — keep interfaces in those names so they stay declaration-only.
- Console logging triggers `no-console` warnings; existing exceptions use `// eslint-disable-next-line no-console`.

## Docs

Architectural details beyond this file live in `docs/`: `API_DOCUMENTATION.md`, `SECURITY.md`, `MIDDLEWARE.md`, `ERROR_HANDLING.md`, `CONFIGURATION.md`, `PLUGINS.md`. The roadmap is in `TODO.md`.

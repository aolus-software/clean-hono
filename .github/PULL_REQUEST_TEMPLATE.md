## What does this change?

<!-- One or two sentences. What is different after this PR that was not true before? -->

## Why?

<!-- The problem being solved. Link the issue if there is one: Closes #123 -->

## Type of change

- [ ] `feat` — new feature, module, or endpoint
- [ ] `fix` — bug fix
- [ ] `refactor` — restructuring, no behaviour change
- [ ] `docs` — documentation only
- [ ] `chore` — config, dependencies, tooling
- [ ] `db` — schema or migration change

## Checklist

<!-- The repo's standards live in .claude/rules/ and CLAUDE.md. Consult the relevant rule before ticking. -->

- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (see `.github/CONTRIBUTING.md`).
- [ ] `bun run lint`, `bun run format:check`, `bun run typecheck`, and `bun run build` pass locally.
- [ ] Layering respected: `routes.ts` (HTTP only) → `service.ts` (logic, transactions, cache, queue dispatch) → repository (Drizzle only). Routes never import `db` (`.claude/rules/modules.md`, `.claude/rules/repositories.md`).
- [ ] Shared code lives in the right `src/libs/<bucket>/` and is re-exported from that bucket's `index.ts` barrel; no relative imports across modules (`.claude/rules/shared-code.md`).
- [ ] Imports use path aliases (`@config @cache @default @mail/* @database @hono-libs @errors @guards @utils @types @modules @bull @i18n`), never `../../libs/...`.
- [ ] No `any` (`no-explicit-any` is an error); explicit return and parameter types.
- [ ] Every promise is `await`ed or `void`ed (`no-floating-promises` is an error).
- [ ] No `console.*` — used the structured `logger` from `@utils` (pino).
- [ ] New/changed routes are declared with `createRoute(...)`, with `body` / `query` / `params` Zod schemas from the module's `schema.ts`, and every field has a `description` and `example` (`.claude/rules/openapi.md`).
- [ ] New/changed routes declare `responses` covering **every** status code the route can actually return, plus `summary` and `description`.
- [ ] Successful responses go through `ResponseToolkit`; failures `throw` an error class from `@errors` — no hand-crafted envelopes.
- [ ] Authorization is applied through the route's `middleware: [AuthMiddleware, ...guards]` in `createRoute(...)`, never with a `.use()` registered after the handler and never inline in the handler (`.claude/rules/rbac.md`).
- [ ] New module registered in `src/modules/index.ts` (or its group parent); new repository re-exported from `src/libs/database/postgres/repositories/index.ts`.
- [ ] New services are registered in `src/bootstrap.ts`, injected in `diMiddleware`, and typed in `Variables` (`.claude/rules/di.md`).
- [ ] New queue/worker pairs share a queue name and payload type, reuse `RedisClient.getQueueConnection()`, and re-throw on failure so BullMQ retries (`.claude/rules/queue.md`).
- [ ] New user-facing strings added to **both** `src/libs/i18n/locales/en.json` and `id.json`, with `bun run i18n:keys` re-run and the generated keys committed.
- [ ] Any new env var added to `src/libs/config/env.ts` (envalid), surfaced through a `@config` object, and added to `.env.example` and `docs/CONFIGURATION.md` — never read `process.env` directly.
- [ ] Docs my change makes wrong are fixed **in this PR** (`README.md`, `CLAUDE.md`, `docs/`, the matching `.claude/rules/` file).

## Database changes

<!-- Delete this section if the PR touches no schema. -->

- [ ] Schema edited in `src/libs/database/postgres/schema/` (snake_case tables and columns, camelCase on the wire).
- [ ] Migration created with `make db-generate`; the new SQL file and its `meta/` snapshot are committed — CI runs `drizzle-kit check` and migrates a fresh database.
- [ ] No already-applied migration was hand-edited.
- [ ] Migration reviewed for destructive operations (dropped columns, narrowed types, lost data).
- [ ] Soft-deleted users still filtered — reads include `deleted_at IS NULL`.
- [ ] Seed data in `src/libs/database/seed/` updated if the new shape needs it, and still idempotent.

## How was this tested?

<!--
Say what you actually exercised: `bun run test` output, tests added, endpoints hit,
request/response bodies observed. "It builds" is not testing.
-->

## Screenshots or output

<!-- Optional: request/response bodies, /docs screenshots, worker logs. -->

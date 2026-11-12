# Rule: Tests (`tests/`)

Bun's built-in runner. `bunfig.toml` preloads `tests/setup.ts` and writes lcov coverage.
`bun run test:coverage` (what CI runs) then runs `tests/coverage-gate.ts`, which fails when **total**
line coverage is below its `MIN_LINE_COVERAGE` (65%, the current baseline). Bun's own
`coverageThreshold` is per file, so it is not used. Raise the gate when tests land; never lower it.

## Layout

```
tests/
├── setup.ts            # preload: pins NODE_ENV, LOG_LEVEL, JWT secrets, DATABASE_URL, REDIS_DB
├── helpers/
│   ├── app.ts          # mocks @bull, imports src/app, request(method, path, { body, token })
│   ├── database.ts     # resetDatabase(): migrate, truncate, seed, flush Redis
│   └── auth.ts         # login(email) -> token pair
├── unit/               # no database, no Redis
└── integration/        # through app.request, real PostgreSQL + Redis
```

## Rules

1. **Unit tests import from aliases** (`@utils`, `@i18n`) and touch no database or Redis.
2. **Integration tests go through HTTP** (`request(...)`), not services, so guards, validation and
   the envelope are exercised. Assert the status and the envelope fields that matter.
3. **Each integration file calls `resetDatabase()` in `beforeAll`.** Files share one process and one
   pool; never call `client.end()` from a test.
4. **The database name must end in `_test`.** `resetDatabase` refuses anything else, because `bun test`
   also loads `.env`. Point `TEST_DATABASE_URL` at a dedicated database.
5. **Mail is never queued.** `tests/helpers/app.ts` replaces `@bull` with an in-memory
   `sendEmailQueue`; assert on `queuedMails`. Import the app only through that helper.
6. **Users from the seeder** (`superuser@example.com`, `admin@example.com`, password
   `S3crEtP4ssw0rd!`) are the fixtures. A user created through the API is unverified and cannot log
   in; sign an access token with `JWTToolkit.sign(id, "access")` when a test needs one.
7. **The global rate limiter applies** (100 requests / 60 s, one shared key under `app.request`). Keep
   the integration suite well under that, or split it across processes.
8. A new route or a changed service rule comes with its test in the same change.

## Don't

- Don't run integration tests against a development database.
- Don't add a test runner or assertion library; `bun:test` covers it.
- Don't cite the suite as proof for code it does not exercise.

# Deployment

The app is built into a single bundle, `dist/index.js` (`bun run build`, which also copies the mail
templates to `dist/templates`), and started with `bun run start`. It needs PostgreSQL and Redis; ClickHouse is optional.

## 1. Single process

```bash
bun install
bun run build
bun run db:migrate
bun run start
```

## 2. Cluster mode (built in)

```bash
APP_CLUSTER_MODE=true APP_CLUSTER_WORKERS=0 bun run start   # 0 -> one worker per CPU core
```

`src/index.ts` runs `src/cluster.ts`, which spawns `APP_CLUSTER_WORKERS` Bun child processes running
the same entry. Each worker serves on `APP_PORT` with `reusePort`, and the kernel balances
connections (Linux). A crashed worker is respawned after 1 s; `SIGINT` / `SIGTERM` to the primary
stops every worker. Each worker also runs the BullMQ mail worker, keeps its own in-memory rate
limit counter, and opens its own PostgreSQL pool of `DB_POOL_MAX` connections: keep
`workers x DB_POOL_MAX` under the server's `max_connections`.

## 3. Reuse-port without cluster mode

`APP_REUSE_PORT=true` binds with `SO_REUSEPORT`, so you can start N processes yourself (a process
manager, systemd, or `docker compose up --scale app=N` behind a load balancer) on one port. Do not
combine it with cluster mode.

## 4. Docker

The `Dockerfile` is multi-stage on `oven/bun:1.3-alpine`:

| Stage         | Purpose                                                                |
| ------------- | ---------------------------------------------------------------------- |
| `install`     | dev and prod `node_modules`, cached on `bun.lock`                      |
| `development` | full source, `bun run dev`                                             |
| `build`       | `bun run build` (typecheck + bundle)                                   |
| `migrator`    | drizzle-kit with dev deps; default command `bun run db:migrate`        |
| `release`     | prod deps + `dist/`, non-root `bun` user, runs `bun run dist/index.js` |

```bash
docker build --target release -t clean-hono .
docker run --env-file .env -p 3000:3000 clean-hono
```

### Compose

`docker-compose.yml` runs `postgres`, `redis`, `clickhouse`, and `app` (the `release` target) on the
`app_network` bridge. `app` reads `.env`; inside the network use service hostnames:

```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hono_clean
REDIS_HOST=redis
CLICKHOUSE_HOST=http://clickhouse:8123
```

```bash
make docker-up        # docker compose up -d --build
make docker-migrate   # build the migrator image, run db:migrate on the compose network
make docker-seed      # same image, runs bun run db:seed
make docker-logs
make docker-down
```

`docker-migrate` and `docker-seed` join `<directory>_app_network`; pass `DOCKER_NETWORK=...` if you
renamed the directory.

### Git-pull deployment

```bash
make docker-deploy    # git pull, docker compose up -d --build, docker-migrate
```

## Migrations

- `drizzle-kit migrate` (`make db-migrate`, the migrator image) applies pending SQL files from
  `src/libs/database/postgres/migrations/` and never generates new ones.
- `drizzle-kit generate` (`make db-generate`) writes a new migration from the schema; run it locally
  and commit the result. `db:push` is development-only.
- Run migrations before starting the new release.

## Checklist

See the deployment checklist in [`SECURITY.md`](./SECURITY.md).

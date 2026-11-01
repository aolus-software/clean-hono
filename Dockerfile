# Bun + Hono + Drizzle — multi-stage. The release image runs the bundled dist/.
# Bun >= 1.2 is required for the native RedisClient used by src/libs/database/redis.
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# ===================================================
# Stage 1: Install dependencies (cached on lockfile)
# ===================================================
FROM base AS install
# --ignore-scripts skips the "prepare" lifecycle (husky); git hooks do not
# exist inside an image.
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile --ignore-scripts

RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production --ignore-scripts

# ===================================================
# Stage 2: Development (hot reload)
# ===================================================
FROM base AS development
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
ENV NODE_ENV=development
EXPOSE 3000/tcp
CMD ["bun", "run", "dev"]

# ===================================================
# Stage 3: Build (typecheck + bundle to dist/)
# ===================================================
FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN bun run build

# ===================================================
# Stage 4: Migrator (drizzle-kit needs dev deps)
#   docker build --target migrator -t clean-hono:migrator .
#   docker run --rm --env-file .env clean-hono:migrator
#   docker run --rm --env-file .env clean-hono:migrator bun run db:seed
# ===================================================
FROM base AS migrator
COPY --from=install /temp/dev/node_modules node_modules
COPY src ./src
COPY tsconfig.json package.json drizzle.config.ts ./
ENV NODE_ENV=production
CMD ["bun", "run", "db:migrate"]

# ===================================================
# Stage 5: Production release (bundle + prod deps, non-root)
# ===================================================
FROM base AS release
ENV NODE_ENV=production
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# pino writes to storage/logs/ relative to cwd; it must exist and be writable
# by the non-root `bun` user.
RUN mkdir -p storage/logs && chown -R bun:bun storage

USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "run", "dist/index.js"]

.PHONY: help install dev-server dev-worker dev-all build-server build-worker build-all start-server start-worker start-all lint lint-fix format db-generate db-migrate db-push db-pull db-studio db-drop db-seed db-clickhouse-migrate db-clickhouse-status fresh reset

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "  Setup:"
	@echo "    install             - Install dependencies"
	@echo ""
	@echo "  Development:"
	@echo "    dev-server          - Start API server with hot reload"
	@echo "    dev-worker          - Start worker with hot reload"
	@echo "    dev-all             - Run server and worker concurrently"
	@echo ""
	@echo "  Build:"
	@echo "    build-server        - Build the API server"
	@echo "    build-worker        - Build the worker"
	@echo "    build-all           - Build server and worker concurrently"
	@echo ""
	@echo "  Production:"
	@echo "    start-server        - Start API server in production"
	@echo "    start-worker        - Start worker in production"
	@echo "    start-all           - Run server and worker in production"
	@echo ""
	@echo "  Code Quality:"
	@echo "    lint                - Run ESLint"
	@echo "    lint-fix            - Fix ESLint issues"
	@echo "    format              - Format code with Prettier"
	@echo ""
	@echo "  Database (PostgreSQL/Drizzle):"
	@echo "    db-generate         - Generate migration files"
	@echo "    db-migrate          - Run pending migrations"
	@echo "    db-push             - Push schema to database (dev only)"
	@echo "    db-pull             - Pull schema from database"
	@echo "    db-studio           - Open Drizzle Studio"
	@echo "    db-drop             - Drop all tables (dangerous!)"
	@echo "    db-seed             - Seed database with initial data"
	@echo ""
	@echo "  Database (ClickHouse):"
	@echo "    db-clickhouse-migrate - Run ClickHouse migrations"
	@echo "    db-clickhouse-status  - Check ClickHouse migration status"
	@echo ""
	@echo "  Workflows:"
	@echo "    fresh               - Drop, push schema, and seed (dev only)"
	@echo "    reset               - Generate, migrate, and seed"

install:
	bun install

# Development commands
dev-server:
	bun run dev:server

dev-worker:
	bun run dev:worker

dev-all:
	bun run dev:all

# Build commands
build-server:
	bun run build:server

build-worker:
	bun run build:worker

build-all:
	bun run build:all

# Production commands
start-server:
	bun run start:server

start-worker:
	bun run start:worker

start-all:
	bun run start:all

# Code quality
lint:
	bun run lint

lint-fix:
	bun run lint:fix

format:
	bun run format

typecheck:
	bun run typecheck

# Database (PostgreSQL/Drizzle)
db-generate:
	bun run db:generate

db-migrate:
	bun run db:migrate

db-push:
	bun run db:push

db-pull:
	bun run db:pull

db-studio:
	bun run db:studio

db-drop:
	bun run db:drop

db-seed:
	bun run db:seed

# Database (ClickHouse)
db-clickhouse-migrate:
	bun run db:clickhouse:migrate

db-clickhouse-status:
	bun run db:clickhouse:status

# Combined workflows
fresh: db-drop db-push db-seed
	@echo "Database refreshed and seeded!"

reset: db-generate db-migrate db-seed
	@echo "Database migrated and seeded!"
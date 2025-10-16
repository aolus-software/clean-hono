.PHONY: help install dev-api build-api start lint lint-fix format format-check clean test

# Default target
help:
	@echo "Available commands:"
	@echo "  make install       - Install dependencies"
	@echo "  make dev-api       - Run API development server"
	@echo "  make build-api     - Build the API application"
	@echo "  make start         - Start production server"
	@echo "  make lint          - Run ESLint"
	@echo "  make lint-fix      - Fix ESLint issues"
	@echo "  make format        - Format code with Prettier"
	@echo "  make format-check  - Check code formatting"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean dependencies and build artifacts"
	@echo ""
	@echo "  Database (Drizzle):"
	@echo "    db-generate - Generate migration files"
	@echo "    db-migrate  - Run pending migrations"
	@echo "    db-push     - Push schema to database (dev only)"
	@echo "    db-pull     - Pull schema from database"
	@echo "    db-studio   - Open Drizzle Studio"
	@echo "    db-drop     - Drop all tables (dangerous!)"
	@echo "    db-seed     - Seed the database with initial data"
	@echo "    fresh       - Drop, push schema, and seed the database"
	@echo "    reset       - Generate, migrate, and seed the database"
	@echo ""

# Install dependencies
install:
	bun install

# Run API development server with hot reload
dev-api:
	bun run dev:api

# Build the API application
build-api:
	bun run build:api

# Start production server
start:
	bun run apps/api/serve.ts

# Run linter
lint:
	bun run lint

# Fix linting issues
lint-fix:
	bun run lint:fix

# Format code
format:
	bun run format

# Check code formatting
format-check:
	bun run format:check

# Run tests
test:
	bun test

# Clean dependencies and build artifacts
clean:
	rm -rf node_modules dist
	rm -f bun.lockb

db-generate:
	npx drizzle-kit generate

db-migrate:
	npx drizzle-kit migrate

db-push:
	npx drizzle-kit push

db-pull:
	npx drizzle-kit introspect

db-studio:
	npx drizzle-kit studio

db-drop:
	npx drizzle-kit drop

db-seed:
	bun run db:postgres:seed

# Combined commands for common workflows
fresh: db-drop db-push seed
	@echo "Database refreshed and seeded!"

reset: db-generate db-migrate seed
	@echo "Database migrated and seeded!"

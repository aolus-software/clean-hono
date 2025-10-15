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

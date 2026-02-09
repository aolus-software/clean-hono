# Clean Hono

A clean architecture backend API built with Hono, TypeScript, and Bun.

## Features

- Clean architecture pattern with separation of concerns
- Hono web framework with Zod OpenAPI integration
- PostgreSQL with Drizzle ORM
- Redis for caching and rate limiting
- BullMQ for background job processing
- ClickHouse for analytics (optional)
- Comprehensive authentication and authorization (RBAC)
- API documentation with Scalar
- Docker support

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Language**: TypeScript
- **Databases**: PostgreSQL, Redis, ClickHouse
- **ORM**: Drizzle
- **Queue**: BullMQ
- **Validation**: Zod
- **API Docs**: Zod OpenAPI + Scalar

## Prerequisites

- Bun 1.x or higher
- PostgreSQL
- Redis
- Docker (optional)

## Installation

Install dependencies:

```sh
bun install
```

## Configuration

Copy the example environment file and configure your environment variables:

```sh
cp .env.example .env
```

Configure the following environment variables:

- Database connections (PostgreSQL, Redis, ClickHouse)
- Mail settings
- JWT secrets
- Application settings

## Database Setup

Generate and run PostgreSQL migrations:

```sh
bun run db:generate
bun run db:migrate
```

Seed the database with initial data:

```sh
bun run db:seed
```

For development, you can also use:

```sh
bun run db:push  # Push schema directly without migrations
```

Open Drizzle Studio to view and edit data:

```sh
bun run db:studio
```

Run ClickHouse migrations:

```sh
bun run db:clickhouse:migrate
```

Check ClickHouse migration status:

```sh
bun run db:clickhouse:status
```

## Development

Run the API server in development mode:

```sh
bun run dev:server
```

Run the worker in development mode:

```sh
bun run dev:worker
```

Run both server and worker concurrently:

```sh
bun run dev:all
```

The API will be available at http://localhost:3000

## Production

Build the application:

```sh
bun run build:all
```

Start the production server:

```sh
bun run start:all
```

## Docker

Build and run with Docker Compose:

```sh
docker-compose up -d
```

## Project Structure

```
src/
├── app.ts                 # Application setup
├── bootstrap.ts           # Bootstrap configuration
├── index.ts              # Entry point
├── bull/                 # Background jobs
│   ├── queue/           # Job queues
│   └── worker/          # Job workers
├── libs/                 # Shared libraries
│   ├── cache/           # Cache utilities
│   ├── config/          # Configuration
│   ├── database/        # Database clients and repositories
│   ├── hono/            # Hono framework utilities
│   ├── mail/            # Email service
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
└── modules/              # Feature modules
    ├── auth/            # Authentication
    ├── profile/         # User profile
    └── settings/        # Application settings
```

## Code Quality

Run linting:

```sh
bun run lint
```

Fix linting issues:

```sh
bun run lint:fix
```

Format code:

```sh
bun run format
```

## API Documentation

Once the server is running, access the API documentation at:

```
http://localhost:3000/docs
```

## Scripts

### Development

- `bun run dev:server` - Run API server with hot reload
- `bun run dev:worker` - Run worker with hot reload
- `bun run dev:all` - Run both server and worker concurrently

### Build

- `bun run build:server` - Build API server
- `bun run build:worker` - Build worker
- `bun run build:all` - Build both server and worker concurrently

### Production

- `bun run start:server` - Start API server in production
- `bun run start:worker` - Start worker in production
- `bun run start:all` - Start both in production concurrently

### Code Quality

- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint issues
- `bun run format` - Format code with Prettier

### Database (PostgreSQL/Drizzle)

- `bun run db:generate` - Generate migration files from schema
- `bun run db:migrate` - Apply pending migrations
- `bun run db:push` - Push schema to database (development only)
- `bun run db:pull` - Pull schema from database
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:drop` - Drop all tables (dangerous!)
- `bun run db:seed` - Seed database with initial data

### Database (ClickHouse)

- `bun run db:clickhouse:migrate` - Run ClickHouse migrations
- `bun run db:clickhouse:status` - Check migration status

### Makefile Commands

You can also use `make` commands:

- `make help` - Show all available commands
- `make dev-all` - Start development environment
- `make fresh` - Drop, push schema, and seed (development)
- `make reset` - Generate migrations, migrate, and seed

## Roadmap & Improvements

See [TODO.md](./TODO.md) for a comprehensive list of planned improvements and enhancements.

Key upcoming improvements:
- Add comprehensive test suite
- Enhance ESLint configuration
- Reorganize utils structure
- Add more middleware documentation
- Improve OpenAPI schema examples

Compare with clean-elysia implementation: [COMPARISON.md](../COMPARISON.md)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please read our Contributing Guidelines and Code of Conduct.

## License

This project is licensed under the MIT License.

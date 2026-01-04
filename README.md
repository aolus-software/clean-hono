# Clean Hono

A production-ready starter template for building scalable web applications with [Hono](https://hono.dev/) and [Bun](https://bun.sh/). Built with clean architecture principles, TypeScript, and modern development practices.

## Features

### Core Stack

- Hono framework with Bun runtime
- TypeScript with strict type checking
- Modular monorepo structure
- Clean architecture with separation of concerns

### Database & Storage

- PostgreSQL with Drizzle ORM
- ClickHouse for analytics and time-series data
- Redis for caching and session management
- Type-safe database operations and migrations
- Database seeding support

### API Features

- OpenAPI/Swagger documentation with Scalar UI
- Zod schema validation
- JWT authentication
- RBAC (Role-Based Access Control) with guards
- CORS configuration
- Rate limiting
- Request/response logging with Pino
- Performance monitoring middleware
- Request ID tracking
- Body size limits
- Secure headers

### Background Processing

- BullMQ for job queues
- Worker processes for background tasks
- Email queue system

### Security

- Bcrypt password hashing
- Crypto-JS encryption/decryption
- Authentication middleware
- Permission and role guards
- Secure headers with Helmet

### Development

- Hot reload with Bun watch mode
- Docker and Docker Compose support
- ESLint and Prettier configuration
- Husky for Git hooks
- Makefile for common tasks
- Concurrent development workflows

## Prerequisites

- Bun (latest version)
- PostgreSQL (v14 or higher)
- ClickHouse
- Redis (v6 or higher)
- Docker (optional)
- Make (optional)

## Installation

1. Clone the repository

```bash
git clone https://github.com/aolus-software/clean-hono.git
cd clean-hono
```

2. Install dependencies

```bash
bun install
```

3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up databases

```bash
make db-migrate      # Run PostgreSQL migrations
make db-seed         # Seed database
make migrate-clickhouse  # Run ClickHouse migrations
```

5. Start development server

```bash
make dev-all         # Start API and worker
```

## Quick Start

### Using Bun Scripts

```bash
# API Server
bun run dev:api      # Development
bun run build:api    # Build
bun run start:api    # Production

# Worker
bun run dev:worker   # Development
bun run build:worker # Build
bun run start:worker # Production

# Run both
bun run dev:all      # Development mode
bun run build:all    # Build all
bun run start:all    # Production mode
```

### Using Make

```bash
# View all commands
make help

# Development
make dev-api         # Start API with hot reload
make dev-worker      # Start worker with hot reload
make dev-all         # Run both concurrently

# Production
make start-api       # Start API server
make start-worker    # Start worker service
make start-all       # Run both concurrently

# Database
make db-generate     # Generate migration files
make db-migrate      # Run pending migrations
make db-push         # Push schema to database (dev)
make db-studio       # Open Drizzle Studio
make db-seed         # Seed database

# ClickHouse
make migrate-clickhouse        # Run migrations
make migrate-clickhouse-status # Check migration status

# Code Quality
make lint            # Run ESLint
make format          # Format with Prettier
```

### Using Docker

```bash
docker-compose up --build    # Build and run
docker-compose up -d         # Run in background
docker-compose down          # Stop services
```

## Project Structure

```
clean-hono/
├── apps/                    # Applications
│   ├── api/                # Main API application
│   │   ├── app.ts         # Hono app configuration
│   │   ├── bootstrap.ts   # Service initialization
│   │   ├── serve.ts       # Server entry point
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Authentication
│   │   │   ├── home/      # Home routes
│   │   │   ├── profile/   # User profiles
│   │   │   └── settings/  # Settings
│   │   └── types/         # Type definitions
│   └── worker/            # Background workers
│       ├── queue/         # Queue handlers
│       └── worker/        # Worker implementations
├── config/                # Application configuration
│   ├── app.config.ts      # App settings
│   ├── cors.config.ts     # CORS settings
│   ├── database.config.ts # Database config
│   ├── mail.config.ts     # Email config
│   ├── redis.config.ts    # Redis config
│   └── env.ts             # Environment validation
├── infra/                 # Infrastructure
│   ├── clickhouse/        # ClickHouse setup
│   │   ├── client/        # Client configuration
│   │   ├── migrations/    # Migrations
│   │   ├── repositories/  # Data access
│   │   └── services/      # Business logic
│   ├── postgres/          # PostgreSQL setup
│   │   ├── migrations/    # Migrations
│   │   ├── repositories/  # Data access
│   │   └── schema/        # Drizzle schemas
│   ├── redis/             # Redis client
│   └── seed/              # Database seeding
├── packages/              # Shared packages
│   ├── cache/            # Caching utilities
│   ├── core/             # Core functionality
│   ├── default/          # Default values
│   ├── errors/           # Error handling
│   ├── guards/           # Auth guards
│   ├── logger/           # Logging
│   ├── mail/             # Email service
│   ├── middlewares/      # Middleware functions
│   ├── schemas/          # Validation schemas
│   ├── security/         # Security utilities
│   ├── toolkit/          # Helper functions
│   └── types/            # Shared types
├── storage/              # Storage directory
│   └── logs/            # Application logs
├── docs/                 # Documentation
│   ├── guards/          # Guard documentation
│   └── validation/      # Validation docs
└── todos/                # Project todos
```

## Environment Configuration

Required environment variables (see `.env.example`):

### Application

```env
APP_NAME=Hono App
APP_PORT=3000
APP_URL=http://localhost:3000
APP_ENV=development
APP_TIMEZONE=UTC
APP_SECRET=your-app-secret
APP_JWT_SECRET=your-jwt-secret
APP_JWT_EXPIRES_IN=3600
```

### Database

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

### ClickHouse

```env
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
CLICKHOUSE_DATABASE=analytics
```

### Redis

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Email

```env
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your-user
MAIL_PASSWORD=your-password
MAIL_FROM=noreply@example.com
```

## API Documentation

Once the server is running, access the interactive API documentation:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Module Structure

Each module in `apps/api/modules/` follows a consistent pattern:

- Routes definition and registration
- Request/response schemas with Zod
- OpenAPI documentation
- Middleware and guards integration

Example modules:

- `auth/` - Authentication endpoints (login, register, logout)
- `home/` - Public endpoints
- `profile/` - User profile management
- `settings/` - Application settings

## Guards and Permissions

The template includes a robust guard system:

### Role Guard

```typescript
import { roleGuard } from "@packages/guards";

// Require admin role
app.get("/admin", roleGuard("admin"), (c) => {
	// Handler
});
```

### Permission Guard

```typescript
import { permissionGuard } from "@packages/guards";

// Require specific permission
app.post("/posts", permissionGuard("posts.create"), (c) => {
	// Handler
});
```

## Error Handling

Centralized error handling with custom error classes:

- `ForbiddenError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `UnauthorizedError` - 401 Unauthorized
- `UnprocessableEntityError` - 422 Validation Error

Example:

```typescript
import { NotFoundError } from "@packages/errors";

throw new NotFoundError("User not found");
```

## Background Jobs

Create workers in `apps/worker/queue/`:

```typescript
export const sendEmailQueue = async (job: Job) => {
	const { to, subject, html } = job.data;
	// Send email logic
};
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/name`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/name`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

- Open an issue on GitHub
- Check the documentation in the `docs/` directory

<!-- _Clean Architecture: Separation between API layer, Application services, and Infrastructure components_ -->

## Acknowledgments

- [Hono](https://hono.dev/) - The web framework
- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database toolkit

## Support

If you have any questions or issues, please:

- Open an [issue](https://github.com/aolus-software/clean-hono/issues)
- Start a [discussion](https://github.com/aolus-software/clean-hono/discussions)

---

Made by [Aolus Software](https://github.com/aolus-software)

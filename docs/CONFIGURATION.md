# Configuration Documentation

## Overview

The application uses a comprehensive configuration system with:

- **Environment Variables**: Validated with envalid
- **Type Safety**: Strict TypeScript typing for all configs
- **Runtime Validation**: Additional validation layer for production safety
- **Centralized Management**: All configs in `src/libs/config/`

## Configuration Files

### Environment Variables (`env.ts`)

Base environment variable validation using envalid.

**Location**: `src/libs/config/env.ts`

### Application Config (`app.config.ts`)

Core application settings.

**Type**: `AppConfig`

| Variable             | Type          | Default         | Description                                    |
| -------------------- | ------------- | --------------- | ---------------------------------------------- |
| `APP_NAME`           | `string`      | `"Hono App"`    | Application name                               |
| `APP_PORT`           | `number`      | `3000`          | HTTP server port                               |
| `APP_URL`            | `URL`         | Required        | Public application URL                         |
| `APP_ENV`            | `Environment` | `"development"` | Environment (development, staging, production) |
| `APP_TIMEZONE`       | `string`      | `"UTC"`         | Application timezone (IANA format)             |
| `APP_SECRET`         | `string`      | Required        | Application secret key (min 32 chars)          |
| `APP_JWT_SECRET`     | `string`      | Required        | JWT signing secret (min 32 chars)              |
| `APP_JWT_EXPIRES_IN` | `number`      | `3600`          | JWT expiration time in seconds                 |
| `LOG_LEVEL`          | `LogLevel`    | `"info"`        | Logging level (info, warn, debug, error)       |
| `CLIENT_URL`         | `URL`         | Required        | Frontend/client application URL                |

**Example `.env`**:

```bash
APP_NAME="My Hono API"
APP_PORT=3000
APP_URL=http://localhost:3000
APP_ENV=development
APP_TIMEZONE=UTC
APP_SECRET=your-super-secret-key-min-32-chars
APP_JWT_SECRET=your-jwt-secret-key-min-32-chars
APP_JWT_EXPIRES_IN=3600
LOG_LEVEL=info
CLIENT_URL=http://localhost:5173
```

**Validation Rules**:

- `APP_NAME`: Must be non-empty string
- `APP_PORT`: Valid port number (1-65535)
- `APP_URL`: Valid URL format
- `APP_ENV`: Must be "development", "staging", or "production"
- `APP_TIMEZONE`: Valid IANA timezone identifier
- `APP_SECRET`: Minimum 32 characters
- `APP_JWT_SECRET`: Minimum 32 characters
- `APP_JWT_EXPIRES_IN`: Positive number
- `LOG_LEVEL`: Must be "info", "warn", "debug", or "error"
- `CLIENT_URL`: Valid URL format

### Database Config (`database.config.ts`)

PostgreSQL database configuration.

**Type**: `DatabaseConfig`

| Variable       | Type  | Description                  |
| -------------- | ----- | ---------------------------- |
| `DATABASE_URL` | `URL` | PostgreSQL connection string |

**Example**:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

**Validation Rules**:

- Must be valid URL format
- Must start with `postgres://` or `postgresql://`

### Redis Config (`redis.config.ts`)

Redis cache and queue configuration.

**Type**: `RedisConfig`

| Variable         | Type     | Default       | Description                 |
| ---------------- | -------- | ------------- | --------------------------- |
| `REDIS_HOST`     | `string` | `"localhost"` | Redis server hostname       |
| `REDIS_PORT`     | `number` | `6379`        | Redis server port           |
| `REDIS_PASSWORD` | `string` | `""`          | Redis password (optional)   |
| `REDIS_DB`       | `number` | `0`           | Redis database index (0-15) |

**Example**:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

**Validation Rules**:

- `REDIS_HOST`: Non-empty string
- `REDIS_PORT`: Valid port number (1-65535)
- `REDIS_DB`: Number between 0 and 15

### ClickHouse Config (`clickhouse.config.ts`)

ClickHouse analytics database configuration.

**Type**: `ClickHouseConfig`

| Variable              | Type     | Description              |
| --------------------- | -------- | ------------------------ |
| `CLICKHOUSE_HOST`     | `URL`    | ClickHouse server URL    |
| `CLICKHOUSE_USER`     | `string` | ClickHouse username      |
| `CLICKHOUSE_PASSWORD` | `string` | ClickHouse password      |
| `CLICKHOUSE_DATABASE` | `string` | ClickHouse database name |

**Example**:

```bash
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-clickhouse-password
CLICKHOUSE_DATABASE=analytics
```

**Validation Rules**:

- `CLICKHOUSE_HOST`: Valid URL format
- `CLICKHOUSE_USER`: Non-empty string
- `CLICKHOUSE_DATABASE`: Non-empty string

###Mail Config (`mail.config.ts`)

SMTP mail server configuration.

**Type**: `MailConfig`

| Variable      | Type      | Default                 | Description          |
| ------------- | --------- | ----------------------- | -------------------- |
| `MAIL_HOST`   | `string`  | `""`                    | SMTP server hostname |
| `MAIL_PORT`   | `number`  | `587`                   | SMTP server port     |
| `MAIL_SECURE` | `boolean` | `false`                 | Use TLS/SSL          |
| `MAIL_USER`   | `string`  | `""`                    | SMTP username        |
| `MAIL_PASS`   | `string`  | `""`                    | SMTP password        |
| `MAIL_FROM`   | `Email`   | `"noreply@example.com"` | Default sender email |

**Example**:

```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=noreply@yourdomain.com
```

**Validation Rules**:

- `MAIL_HOST`: Valid hostname or empty string
- `MAIL_PORT`: Valid port number (1-65535)
- `MAIL_FROM`: Valid email format

### CORS Config (`cors.config.ts`)

Cross-Origin Resource Sharing configuration.

**Type**: `CorsConfig`

| Variable               | Type      | Default   | Description                        |
| ---------------------- | --------- | --------- | ---------------------------------- |
| `CORS_ORIGIN`          | `string`  | `"*"`     | Allowed origins (comma-separated)  |
| `CORS_METHODS`         | `string`  | See below | Allowed HTTP methods               |
| `CORS_ALLOWED_HEADERS` | `string`  | See below | Allowed request headers            |
| `CORS_EXPOSED_HEADERS` | `string`  | See below | Exposed response headers           |
| `CORS_MAX_AGE`         | `number`  | `3600`    | Preflight cache duration (seconds) |
| `CORS_CREDENTIALS`     | `boolean` | `true`    | Allow credentials                  |

**Defaults**:

- Methods: `GET,POST,PUT,PATCH,DELETE,OPTIONS`
- Allowed Headers: `Content-Type,Authorization`
- Exposed Headers: `Content-Type,Authorization`

**Example**:

```bash
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
CORS_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,X-Requested-With
CORS_EXPOSED_HEADERS=Content-Type,Authorization
CORS_MAX_AGE=3600
CORS_CREDENTIALS=true
```

**Production Warning**: Never use `*` for `CORS_ORIGIN` in production. The system will automatically fallback to `CLIENT_URL` if wildcard is detected in production.

## Type Safety

### Type Definitions

All configuration types are defined in `src/libs/types/config.types.ts`.

**Import types**:

```typescript
import type {
	AppConfig,
	DatabaseConfig,
	RedisConfig,
	ClickHouseConfig,
	MailConfig,
	CorsConfig,
	EnvironmentConfig,
} from "@types";
```

### Common Types

The application provides comprehensive common types in `src/libs/types/common.types.ts`:

**Utility Types**:

- `DeepPartial<T>`: Recursive partial
- `DeepRequired<T>`: Recursive required
- `Nullable<T>`: T | null
- `Optional<T>`: T | null | undefined

**Entity Types**:

- `BaseEntity`: id + timestamps
- `SoftDeletableEntity`: BaseEntity + soft delete
- `Timestamps`: created_at, updated_at

**Response Types**:

- `SuccessResponse<T>`: Standardized success response
- `ErrorResponse`: Standardized error response
- `ApiResponse<T>`: Union of success and error
- `PaginatedData<T>`: Paginated response structure

**And many more**! See `common.types.ts` for the complete list.

## Runtime Validation

### Validation Functions

**Location**: `src/libs/config/config.validator.ts`

Available validators:

- `validateAppConfig(config: AppConfig)`
- `validateDatabaseConfig(config: DatabaseConfig)`
- `validateRedisConfig(config: RedisConfig)`
- `validateClickHouseConfig(config: ClickHouseConfig)`
- `validateMailConfig(config: MailConfig)`
- `validateAllConfig(allConfigs)`

### Automatic Validation

Validation runs automatically when importing config files. In production, validation failures will throw errors and prevent startup.

**Example**:

```typescript
// Automatically validated on import
import { AppConfig } from "@config";

// AppConfig is guaranteed to be valid here
console.log(AppConfig.APP_NAME);
```

### Manual Validation

You can manually validate configurations:

```typescript
import { validateAppConfig, validateConfigWithLogging } from "@config";
import { AppConfig } from "@config";

const result = validateAppConfig(AppConfig);

if (!result.valid) {
	console.error("Invalid configuration:", result.errors);
}

// With automatic logging
validateConfigWithLogging(result, "App", true);
```

### Validation Errors

Validation errors include:

- `key`: Configuration key that failed
- `value`: Actual value (sensitive values masked)
- `expected`: Expected format/type
- `message`: Human-readable error message

**Example error**:

```json
{
	"key": "APP_PORT",
	"value": 70000,
	"expected": "valid port (1-65535)",
	"message": "Invalid port number"
}
```

## Usage Examples

### Accessing Configuration

```typescript
import { AppConfig, DatabaseConfig } from "@config";

console.log(`Server running on port ${AppConfig.APP_PORT}`);
console.log(`Database: ${DatabaseConfig.DATABASE_URL}`);
console.log(`Environment: ${AppConfig.APP_ENV}`);
```

### Type-Safe Config Access

```typescript
import type { AppConfig as IAppConfig } from "@types";

function useConfig(config: IAppConfig) {
	// TypeScript enforces correct types
	const port: number = config.APP_PORT;
	const env: "development" | "staging" | "production" = config.APP_ENV;
}
```

### Conditional Logic Based on Environment

```typescript
import { AppConfig } from "@config";

if (AppConfig.APP_ENV === "production") {
	// Production-specific logic
	console.log("Running in production mode");
} else {
	// Development logic
	console.log("Running in development mode");
}
```

## Best Practices

### 1. Never Commit Secrets

❌ **Bad**:

```bash
APP_SECRET=my-secret-key
```

✅ **Good**: Use environment-specific `.env` files:

- `.env.development` (git ignored)
- `.env.staging` (git ignored)
- `.env.production` (git ignored)
- `.env.example` (committed, no secrets)

### 2. Use Strong Secrets

```bash
# Generate strong secrets
openssl rand -hex 32
```

### 3. Validate in Production

Always enable strict validation in production:

```typescript
validateConfigWithLogging(
	validationResult,
	"App",
	AppConfig.APP_ENV === "production", // Throws on error in production
);
```

### 4. Use Type Imports

```typescript
// Prefer type imports for types
import type { AppConfig } from "@types";

// Regular imports for values
import { AppConfig } from "@config";
```

### 5. Document New Config Options

When adding new configuration:

1. Add to `env.ts` with envalid validation
2. Add type definition to `config.types.ts`
3. Create/update config file in `src/libs/config/`
4. Add runtime validation
5. Document in this file

## Troubleshooting

### Configuration Validation Failed

**Symptom**: Application fails to start with configuration errors

**Solution**:

1. Check the error message for specific fields
2. Verify `.env` file has all required variables
3. Ensure values match expected formats
4. Check for typos in variable names

### Type Errors in Configuration

**Symptom**: TypeScript errors when accessing config

**Solution**:

1. Ensure config types are imported from `@types`
2. Update type definitions if adding new config options
3. Run `bun run typecheck` to verify types

### CORS Issues in Production

**Symptom**: CORS errors in production despite configuration

**Solution**:

1. Never use `*` for `CORS_ORIGIN` in production
2. Set specific domains: `CORS_ORIGIN=https://domain1.com,https://domain2.com`
3. Verify CLIENT_URL is set correctly

### Missing Environment Variables

**Symptom**: Envalid throws errors about missing variables

**Solution**:

1. Copy `.env.example` to `.env`
2. Fill in all required values
3. Restart the application

## Further Reading

- [Envalid Documentation](https://github.com/af/envalid)
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Environment Variables Best Practices](https://12factor.net/config)
- [CORS Configuration Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

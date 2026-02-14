# Error Handling Documentation

## Overview

This application implements a comprehensive, centralized error handling system that provides:

- **Consistent Error Responses**: All errors follow the same structure
- **Type Safety**: TypeScript error classes with proper typing
- **Error Codes**: Centralized error code constants for easy tracking
- **Request Tracing**: Every error includes a request ID for debugging
- **Developer-Friendly**: Stack traces in development, clean messages in production

## Error Response Format

All errors return a consistent JSON structure:

```json
{
	"success": false,
	"message": "Human-readable error message",
	"code": "ERROR_CODE",
	"errors": [],
	"data": null,
	"requestId": "abc-123-def",
	"trace": "Stack trace (development only)"
}
```

### Response Fields

| Field       | Type      | Description                                          |
| ----------- | --------- | ---------------------------------------------------- |
| `success`   | `boolean` | Always `false` for errors                            |
| `message`   | `string`  | Human-readable error description                     |
| `code`      | `string`  | Error code constant for programmatic handling        |
| `errors`    | `array`   | Detailed error information (e.g., validation errors) |
| `data`      | `null`    | Always null for error responses                      |
| `requestId` | `string`  | Unique request identifier for tracing                |
| `trace`     | `string?` | Stack trace (only in development mode)               |

## Error Codes

All error codes are centralized in `src/libs/hono/errors/error-codes.constant.ts`.

### Authentication & Authorization (4xx)

| Code                  | HTTP Status | Description                       |
| --------------------- | ----------- | --------------------------------- |
| `UNAUTHORIZED`        | 401         | User not authenticated            |
| `FORBIDDEN`           | 403         | User lacks required permissions   |
| `TOKEN_EXPIRED`       | 401         | JWT token has expired             |
| `TOKEN_INVALID`       | 401         | JWT token is malformed or invalid |
| `INVALID_CREDENTIALS` | 401         | Incorrect username or password    |

### Resource Errors (4xx)

| Code                 | HTTP Status | Description                 |
| -------------------- | ----------- | --------------------------- |
| `NOT_FOUND`          | 404         | Generic resource not found  |
| `RESOURCE_NOT_FOUND` | 404         | Specific resource not found |
| `ROUTE_NOT_FOUND`    | 404         | API endpoint does not exist |

### Validation Errors (4xx)

| Code                     | HTTP Status | Description                  |
| ------------------------ | ----------- | ---------------------------- |
| `VALIDATION_ERROR`       | 422         | Input validation failed      |
| `INVALID_INPUT`          | 422         | Invalid input format or type |
| `MISSING_REQUIRED_FIELD` | 422         | Required field is missing    |

### Request Errors (4xx)

| Code                     | HTTP Status | Description                         |
| ------------------------ | ----------- | ----------------------------------- |
| `BAD_REQUEST`            | 400         | Malformed or invalid request        |
| `CONFLICT`               | 409         | Resource conflict (e.g., duplicate) |
| `DUPLICATE_ENTRY`        | 409         | Resource already exists             |
| `PAYLOAD_TOO_LARGE`      | 413         | Request body exceeds size limit     |
| `UNSUPPORTED_MEDIA_TYPE` | 415         | Content-Type not supported          |
| `TOO_MANY_REQUESTS`      | 429         | Rate limit exceeded                 |
| `METHOD_NOT_ALLOWED`     | 405         | HTTP method not allowed             |

### Server Errors (5xx)

| Code                     | HTTP Status | Description                     |
| ------------------------ | ----------- | ------------------------------- |
| `INTERNAL_ERROR`         | 500         | Unexpected server error         |
| `SERVICE_UNAVAILABLE`    | 503         | Service temporarily unavailable |
| `DATABASE_ERROR`         | 500         | Database operation failed       |
| `EXTERNAL_SERVICE_ERROR` | 500         | External API call failed        |

### Generic Errors

| Code            | HTTP Status | Description            |
| --------------- | ----------- | ---------------------- |
| `HTTP_ERROR`    | Various     | Generic HTTP error     |
| `UNKNOWN_ERROR` | 500         | Unknown error occurred |

## Error Classes

All error classes extend the base `AppError` class and are located in `src/libs/hono/errors/`.

### Available Error Classes

#### UnauthorizedError (401)

User is not authenticated or has invalid credentials.

```typescript
import { UnauthorizedError } from "@errors";

throw new UnauthorizedError("Invalid token");
throw new UnauthorizedError("User not found");
throw new UnauthorizedError(); // Default: "Unauthorized"
```

**Response**:

```json
{
	"success": false,
	"message": "Invalid token",
	"code": "UNAUTHORIZED",
	"errors": [],
	"data": null,
	"requestId": "abc-123"
}
```

#### ForbiddenError (403)

User is authenticated but lacks required permissions.

```typescript
import { ForbiddenError } from "@errors";

throw new ForbiddenError("Insufficient permissions");
throw new ForbiddenError("Admin access required");
throw new ForbiddenError(); // Default: "Forbidden"
```

**Use Case**: User tries to access a resource they don't have permission for.

#### NotFoundError (404)

Requested resource does not exist.

```typescript
import { NotFoundError } from "@errors";

throw new NotFoundError("User not found");
throw new NotFoundError("Post with ID 123 not found");
throw new NotFoundError(); // Default: "Resource not found"
```

**Use Case**: Database query returns no results, file doesn't exist, etc.

#### BadRequestError (400)

Malformed or invalid request.

```typescript
import { BadRequestError } from "@errors";

throw new BadRequestError("Invalid request format");
throw new BadRequestError("Missing required parameters");
throw new BadRequestError(); // Default: "Bad request"
```

**Use Case**: Request data is malformed or doesn't meet basic requirements.

#### UnprocessableEntityError (422)

Validation failed on input data.

```typescript
import { UnprocessableEntityError } from "@errors";

throw new UnprocessableEntityError("Validation failed", [
	{ field: "email", message: "Invalid email format" },
	{ field: "age", message: "Must be 18 or older" },
]);
```

**Response**:

```json
{
	"success": false,
	"message": "Validation failed",
	"code": "VALIDATION_ERROR",
	"errors": [
		{ "field": "email", "message": "Invalid email format" },
		{ "field": "age", "message": "Must be 18 or older" }
	],
	"data": null,
	"requestId": "abc-123"
}
```

**Use Case**: Data passes basic format checks but fails business logic validation.

#### ConflictError (409)

Resource conflict, typically a duplicate entry.

```typescript
import { ConflictError } from "@errors";

throw new ConflictError("Email already exists");
throw new ConflictError("Username is taken");
throw new ConflictError(); // Default: "Resource already exists"
```

**Use Case**: Creating a resource that violates a unique constraint.

#### ServiceUnavailableError (503)

Service is temporarily unavailable.

```typescript
import { ServiceUnavailableError } from "@errors";

throw new ServiceUnavailableError("Database connection failed");
throw new ServiceUnavailableError("External API unavailable");
throw new ServiceUnavailableError(); // Default: "Service unavailable"
```

**Use Case**: Database is down, external service timeout, maintenance mode.

## Using Error Classes

### Basic Usage

```typescript
import { UnauthorizedError, NotFoundError } from "@errors";

// In a service
async getUserById(id: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id)
  });

  if (!user) {
    throw new NotFoundError(`User with ID ${id} not found`);
  }

  return user;
}

// In authentication middleware
async authenticate(token: string) {
  if (!token) {
    throw new UnauthorizedError("No token provided");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    throw new UnauthorizedError("Invalid token");
  }

  return payload;
}
```

### With Additional Details

Pass additional error details as the second parameter:

```typescript
import { UnprocessableEntityError } from "@errors";

const validationErrors = [
	{ field: "email", message: "Email is required" },
	{ field: "password", message: "Password must be at least 8 characters" },
];

throw new UnprocessableEntityError("Validation failed", validationErrors);
```

### Catching and Re-throwing

```typescript
try {
	await externalApiCall();
} catch (error) {
	logger.error(error, "External API call failed");
	throw new ServiceUnavailableError("Unable to connect to external service");
}
```

## Validation Errors

### Zod Validation

Zod validation errors are automatically formatted and returned with a `VALIDATION_ERROR` code:

```typescript
// Schema definition
const createUserSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	age: z.number().min(18),
});

// Automatic validation in route
app.post("/users", async (c) => {
	const body = await c.req.json();
	const result = createUserSchema.safeParse(body);

	if (!result.success) {
		// Automatically handled by error handler
		throw new ZodError(result.error);
	}
});
```

**Response**:

```json
{
	"success": false,
	"message": "Validation failed",
	"code": "VALIDATION_ERROR",
	"errors": [
		{
			"field": "email",
			"message": "Invalid email"
		},
		{
			"field": "password",
			"message": "String must contain at least 8 character(s)"
		},
		{
			"field": "age",
			"message": "Number must be greater than or equal to 18"
		}
	],
	"data": null,
	"requestId": "abc-123"
}
```

### OpenAPI Validation

With Zod OpenAPI, validation happens automatically:

```typescript
import { createRoute } from "@hono/zod-openapi";

const route = createRoute({
	method: "post",
	path: "/users",
	request: {
		body: {
			content: {
				"application/json": {
					schema: createUserSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "User created",
		},
		422: {
			description: "Validation error",
		},
	},
});

// Validation errors are automatically thrown
app.openapi(route, async (c) => {
	// If we reach here, validation passed
	const body = c.req.valid("json");
});
```

## Error Logging

All errors are automatically logged with context:

```typescript
// Logged error context includes:
{
  method: "POST",
  url: "/api/users",
  userAgent: "Mozilla/5.0...",
  ip: "192.168.1.1",
  timestamp: "2024-02-09T12:34:56.789Z",
  requestId: "abc-123-def",
  error: {
    name: "NotFoundError",
    message: "User not found",
    stack: "Error: User not found\n  at..."
  }
}
```

### Log Levels by Error Type

- **4xx errors**: `info` level (expected errors)
- **5xx errors**: `error` level (unexpected errors)
- **Validation errors**: `warn` level

## Creating Custom Error Classes

### Basic Custom Error

```typescript
// src/libs/hono/errors/payment-error.ts
import { AppError } from "./base.error";
import { ERROR_CODES, HTTP_STATUS } from "./error-codes.constant";

export class PaymentError extends AppError {
	statusCode = HTTP_STATUS.BAD_REQUEST;
	errorCode = ERROR_CODES.PAYMENT_FAILED; // Add to constants first

	constructor(message = "Payment processing failed", details?: unknown) {
		super(message, details);
	}
}
```

### Adding Error Codes

First, add your error code to the constants file:

```typescript
// src/libs/hono/errors/error-codes.constant.ts
export const ERROR_CODES = {
	// ... existing codes

	// Payment Errors
	PAYMENT_FAILED: "PAYMENT_FAILED",
	INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
	INVALID_CARD: "INVALID_CARD",
} as const;
```

### Complex Custom Error

```typescript
import { AppError } from "./base.error";
import { HTTP_STATUS } from "./error-codes.constant";

export class RateLimitError extends AppError {
	statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
	errorCode = "RATE_LIMIT_EXCEEDED";

	constructor(
		message = "Rate limit exceeded",
		public retryAfter?: number, // Seconds until retry
	) {
		super(message, { retryAfter });
	}
}
```

### Exporting Custom Errors

Add your error to the exports:

```typescript
// src/libs/hono/errors/index.ts
export * from "./payment-error";
export * from "./rate-limit-error";
```

## Error Handler Internals

The error handler (`error.handler.ts`) processes errors in this order:

1. **HTTPException with 422**: Validation error from Hono
2. **ZodError**: Validation error from Zod
3. **AppError**: Custom application errors (your error classes)
4. **HTTPException 404**: Route not found
5. **HTTPException (other)**: Other Hono HTTP errors
6. **Generic Error**: Unexpected errors (500)

### Error Handler Flow

```
Error thrown
    ↓
Is it HTTPException 422? → Return validation error (422)
    ↓
Is it ZodError? → Format and return validation error (422)
    ↓
Is it AppError? → Return custom error with status code
    ↓
Is it HTTPException 404? → Return route not found (404)
    ↓
Is it HTTPException? → Return HTTP error
    ↓
Generic error → Return internal server error (500)
```

## Best Practices

### 1. Use Specific Error Classes

✅ **Good**:

```typescript
if (!user) {
	throw new NotFoundError("User not found");
}

if (user.role !== "admin") {
	throw new ForbiddenError("Admin access required");
}
```

❌ **Bad**:

```typescript
if (!user) {
	throw new Error("Not found"); // Generic Error
}

if (user.role !== "admin") {
	throw new UnauthorizedError("Admin access required"); // Wrong error type
}
```

### 2. Provide Context in Error Messages

✅ **Good**:

```typescript
throw new NotFoundError(`User with ID ${userId} not found`);
throw new ConflictError(`Email ${email} is already registered`);
```

❌ **Bad**:

```typescript
throw new NotFoundError("Not found");
throw new ConflictError("Conflict");
```

### 3. Include Validation Details

✅ **Good**:

```typescript
const errors = [
	{ field: "email", message: "Invalid email format" },
	{ field: "age", message: "Must be 18 or older" },
];
throw new UnprocessableEntityError("Validation failed", errors);
```

❌ **Bad**:

```typescript
throw new UnprocessableEntityError("Invalid input");
```

### 4. Log Before Throwing (for debugging)

```typescript
try {
	await externalService.call();
} catch (error) {
	logger.error({ error }, "External service failed");
	throw new ServiceUnavailableError("External service unavailable");
}
```

### 5. Don't Expose Sensitive Information

✅ **Good**:

```typescript
if (!isValidPassword(password)) {
	throw new UnauthorizedError("Invalid credentials");
}
```

❌ **Bad**:

```typescript
if (!isValidPassword(password)) {
	throw new UnauthorizedError(`Password ${password} is incorrect`);
}
```

### 6. Use Error Codes for Client-Side Handling

Clients can handle errors programmatically:

```typescript
// Client-side
try {
	await api.createUser(data);
} catch (error) {
	switch (error.code) {
		case "DUPLICATE_ENTRY":
			showMessage("Email already exists");
			break;
		case "VALIDATION_ERROR":
			showValidationErrors(error.errors);
			break;
		default:
			showMessage("An error occurred");
	}
}
```

## Testing Error Handling

### Unit Tests

```typescript
import { describe, it, expect } from "bun:test";
import { NotFoundError } from "@errors";

describe("NotFoundError", () => {
	it("should have correct status code", () => {
		const error = new NotFoundError("User not found");
		expect(error.statusCode).toBe(404);
	});

	it("should have correct error code", () => {
		const error = new NotFoundError("User not found");
		expect(error.errorCode).toBe("NOT_FOUND");
	});

	it("should accept custom message", () => {
		const error = new NotFoundError("Custom message");
		expect(error.message).toBe("Custom message");
	});
});
```

### Integration Tests

```typescript
import { describe, it, expect } from "bun:test";
import app from "../app";

describe("Error Handling", () => {
	it("should return 404 for non-existent route", async () => {
		const res = await app.request("/non-existent");
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.code).toBe("ROUTE_NOT_FOUND");
	});

	it("should return 401 for missing auth token", async () => {
		const res = await app.request("/api/protected");
		expect(res.status).toBe(401);

		const body = await res.json();
		expect(body.code).toBe("UNAUTHORIZED");
	});
});
```

## Troubleshooting

### Stack Traces Not Showing

**Issue**: Stack traces missing in development

**Solution**: Check `APP_ENV` environment variable:

```bash
APP_ENV=development bun run dev
```

### Error Codes Not Matching

**Issue**: Client receives different error codes than expected

**Solution**:

1. Verify error code constants are imported
2. Check error class uses correct constant
3. Ensure error handler is registered

### Validation Errors Not Formatted

**Issue**: Zod errors return raw format

**Solution**: Ensure error handler catches ZodError before generic errors.

### Request ID Missing

**Issue**: `requestId` is undefined in error response

**Solution**: Ensure `requestIdMiddleware` runs first:

```typescript
app.use("*", requestIdMiddleware); // Must be first
```

## Further Reading

- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Error Handling Best Practices](https://www.rfc-editor.org/rfc/rfc7807)
- [Zod Documentation](https://zod.dev/)
- [Hono Error Handling](https://hono.dev/guides/error-handling)

# Middleware Documentation

## Overview

This application uses a well-organized middleware architecture divided into two main categories:

1. **Core Middleware**: Essential middleware that runs on every request
2. **Security Middleware**: Security-focused middleware for authentication, authorization, and protection

## Middleware Categories

### Core Middleware

Core middleware is essential for all requests and provides fundamental functionality like logging, request tracking, and dependency injection.

Location: `src/libs/hono/middlewares/core/`

#### Request ID Middleware

**File**: `request-id.middleware.ts`

Generates or retrieves a unique request ID for tracing and debugging.

- **Order**: First middleware (must run before all others)
- **Purpose**: Request tracing and correlation
- **Headers Added**: `X-Request-ID`
- **Context Variable**: `requestId`

**Usage in logs**:

```typescript
const requestId = c.get("requestId");
logger.info({ requestId }, "Processing request");
```

#### Logger Middleware

**File**: `logger.middleware.ts`

Provides structured logging using Pino logger for all HTTP requests.

- **Order**: Second (after request ID)
- **Purpose**: HTTP request/response logging
- **Features**:
  - Automatic request logging
  - Response time tracking
  - Status code logging
  - Request ID correlation

**Log Example**:

```json
{
  "level": 30,
  "time": 1676123456789,
  "req": {
    "method": "GET",
    "url": "/api/users",
    "headers": {...}
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 45,
  "requestId": "abc123"
}
```

#### Performance Middleware

**File**: `performance.middleware.ts`

Monitors request duration and warns about slow requests.

- **Purpose**: Performance monitoring and optimization
- **Thresholds**:
  - `> 1000ms`: Warning logged
  - `> 500ms`: Info logged
  - `< 500ms`: Debug logged

**Usage**:
The middleware automatically logs all requests with their duration. Review logs to identify slow endpoints.

#### Dependency Injection Middleware

**File**: `di.middleware.ts`

Injects registered services into the Hono context for easy access in route handlers.

- **Purpose**: Dependency injection pattern
- **Injected Services**:
  - `authService`: Authentication service
  - `userService`: User management service
  - `roleService`: Role management service
  - `permissionService`: Permission management service
  - `profileService`: User profile service
  - `settingSelectOption`: Select options service

**Usage in Routes**:

```typescript
const userService = c.get("userService");
const users = await userService.getAllUsers();
```

### Security Middleware

Security middleware handles authentication, authorization, rate limiting, and various security headers.

Location: `src/libs/hono/middlewares/security/`

#### Authentication Middleware

**File**: `auth.middleware.ts`

Validates JWT tokens and loads user information.

- **Purpose**: User authentication
- **Token Source**: `Authorization` header (Bearer token)
- **Context Variable**: `currentUser`
- **Features**:
  - JWT token validation
  - User information caching
  - Automatic token expiration handling

**Usage**:

```typescript
import { AuthMiddleware } from "@hono-libs/middlewares";

// Apply to protected routes
app.get("/protected", AuthMiddleware, async (c) => {
	const user = c.get("currentUser");
	return c.json({ user });
});
```

**Error Responses**:

- `401 UNAUTHORIZED`: No token provided
- `401 UNAUTHORIZED`: Invalid token
- `401 UNAUTHORIZED`: User not found

#### CORS Middleware

**File**: `cors.middleware.ts`

Configures Cross-Origin Resource Sharing for API access from different origins.

- **Purpose**: Control cross-origin requests
- **Configuration**: Loaded from `@config/cors.config.ts`
- **Headers Managed**:
  - `Access-Control-Allow-Origin`
  - `Access-Control-Allow-Methods`
  - `Access-Control-Allow-Headers`
  - `Access-Control-Expose-Headers`
  - `Access-Control-Max-Age`

**Configuration**:
Edit `src/libs/config/cors.config.ts` to customize CORS settings.

#### Security Headers Middleware

**File**: `security-headers.middleware.ts`

Adds security-related HTTP headers to protect against common vulnerabilities.

- **Purpose**: Web security best practices
- **Headers Added**:
  - `Content-Security-Policy`: Prevents XSS attacks
  - `Strict-Transport-Security`: Forces HTTPS
  - `X-Content-Type-Options`: Prevents MIME sniffing
  - `X-Frame-Options`: Prevents clickjacking
  - `Referrer-Policy`: Controls referrer information
  - `Permissions-Policy`: Controls browser features

**Security Features**:

- HSTS with 1 year max-age
- Removes `X-Powered-By` header
- Cross-origin isolation
- Origin agent clustering

#### Rate Limiter Middleware

**File**: `rate-limiter.middleware.ts`

Prevents API abuse by limiting requests per IP address.

- **Purpose**: DDoS protection and abuse prevention
- **Default Limits**:
  - **Window**: 15 minutes
  - **Max Requests**: 100 per window
- **Key**: Client IP address (from `x-forwarded-for` header)

**Response on Limit Exceeded**:

```json
{
	"success": false,
	"message": "Too many requests, please try again later.",
	"code": "TOO_MANY_REQUESTS",
	"statusCode": 429
}
```

**Customization**:
Edit the middleware file to adjust limits for specific routes:

```typescript
// Example: Custom rate limit for specific endpoint
app.post(
	"/api/login",
	rateLimiter({
		windowMs: 15 * 60 * 1000,
		limit: 5, // Only 5 login attempts per 15 minutes
		keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "",
	}),
	loginHandler,
);
```

#### Body Limit Middleware

**File**: `body-limit.middleware.ts`

Restricts the maximum size of request payloads to prevent memory exhaustion attacks.

- **Purpose**: Prevent large payload attacks
- **Default Limit**: 100KB
- **Applies To**: All request bodies (JSON, form data, etc.)

**Error Response**:

```json
{
	"success": false,
	"message": "Payload too large",
	"code": "PAYLOAD_TOO_LARGE",
	"statusCode": 413
}
```

**Customization for File Uploads**:

```typescript
// Example: Higher limit for file upload endpoint
app.post(
	"/api/upload",
	bodyLimit({ maxSize: 10 * 1024 * 1024 }), // 10MB
	uploadHandler,
);
```

## Middleware Execution Order

The order of middleware is critical for proper application functionality:

```
1. Request ID Middleware       ← Generate/retrieve request ID
2. Logger Middleware           ← Start request logging
3. Performance Middleware      ← Start performance monitoring
4. DI Middleware              ← Inject services into context
5. Body Limit Middleware      ← Check payload size
6. CORS Middleware            ← Handle CORS headers
7. Security Headers Middleware ← Add security headers
8. Rate Limiter Middleware    ← Check rate limits
9. Route-specific middleware   ← Auth, guards, etc.
10. Route Handler             ← Your business logic
```

## Creating Custom Middleware

### Core Middleware

Create core middleware for functionality needed by all requests:

```typescript
// src/libs/hono/middlewares/core/my-middleware.ts
import { Context, Next } from "hono";

export const myMiddleware = async (c: Context, next: Next) => {
	// Before request
	console.log("Before request");

	await next();

	// After request
	console.log("After request");
};
```

### Security Middleware

Create security middleware for authentication/authorization concerns:

```typescript
// src/libs/hono/middlewares/security/my-security.ts
import { UnauthorizedError } from "@errors";
import { Context, Next } from "hono";

export const mySecurityMiddleware = async (c: Context, next: Next) => {
	const token = c.req.header("X-Custom-Token");

	if (!token) {
		throw new UnauthorizedError("Custom token required");
	}

	// Validate token...

	await next();
};
```

### Adding to Index

Update the appropriate index file:

```typescript
// src/libs/hono/middlewares/core/index.ts or security/index.ts
export * from "./my-middleware";
```

## Best Practices

### 1. Keep Middleware Focused

Each middleware should have a single responsibility:

✅ **Good**:

```typescript
// Focused on request ID generation
export const requestIdMiddleware = async (c: Context, next: Next) => {
	const requestId = getOrGenerateRequestId(c.req.header("x-request-id"));
	c.set("requestId", requestId);
	await next();
};
```

❌ **Bad**:

```typescript
// Mixing multiple concerns
export const setupMiddleware = async (c: Context, next: Next) => {
	const requestId = generateId();
	c.set("requestId", requestId);

	const user = await validateUser(c);
	c.set("user", user);

	await logRequest(c);
	await next();
};
```

### 2. Use Type Safety

Always type your middleware with proper Hono types:

```typescript
import type { MiddlewareHandler } from "hono";
import { Env } from "@types";

export const myMiddleware: MiddlewareHandler<Env> = async (c, next) => {
	// TypeScript knows about your context variables
	const requestId = c.get("requestId"); // ✅ Type-safe
	await next();
};
```

### 3. Handle Errors Consistently

Use custom error classes for consistent error responses:

```typescript
import { UnauthorizedError, BadRequestError } from "@errors";

export const authMiddleware = async (c: Context, next: Next) => {
	const token = c.req.header("authorization");

	if (!token) {
		throw new UnauthorizedError("No token provided");
	}

	if (!isValidToken(token)) {
		throw new UnauthorizedError("Invalid token");
	}

	await next();
};
```

### 4. Document Your Middleware

Add comprehensive JSDoc comments:

````typescript
/**
 * Rate limiter middleware
 * Prevents API abuse by limiting requests per IP address
 *
 * @example
 * ```typescript
 * app.use("*", rateLimiterMiddleware);
 * ```
 */
export const rateLimiterMiddleware = ...
````

### 5. Test Your Middleware

Write unit tests for custom middleware:

```typescript
import { describe, it, expect } from "bun:test";
import { myMiddleware } from "./my-middleware";

describe("myMiddleware", () => {
	it("should add custom header", async () => {
		// Test implementation
	});
});
```

## Troubleshooting

### Middleware Not Running

**Symptom**: Middleware doesn't seem to execute

**Solutions**:

1. Check middleware order in `app.ts`
2. Ensure middleware is imported correctly
3. Verify middleware calls `await next()`
4. Check for errors thrown before middleware execution

### Context Variables Not Available

**Symptom**: `c.get("variable")` returns undefined

**Solutions**:

1. Ensure DI middleware runs before your handler
2. Check middleware execution order
3. Verify the variable is set in previous middleware

### Rate Limiting Issues

**Symptom**: Rate limiter blocks legitimate requests

**Solutions**:

1. Check `keyGenerator` configuration
2. Verify proxy headers (`x-forwarded-for`)
3. Adjust `windowMs` and `limit` values
4. Consider per-user rate limiting instead of per-IP

### CORS Errors

**Symptom**: Browser shows CORS errors

**Solutions**:

1. Check `cors.config.ts` configuration
2. Verify `origin` matches client domain
3. Ensure preflight requests (OPTIONS) are handled
4. Check `allowedHeaders` includes required headers

## Further Reading

- [Hono Middleware Guide](https://hono.dev/guides/middleware)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

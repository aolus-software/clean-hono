# TODO: Implement Hono Best Practices

## Priority: Medium

## Current State

Analysis of current implementation:

- ✅ Using `pinoLogger` for structured logging
- ✅ CORS properly configured
- ✅ Custom error handling with `registerException`
- ⚠️ Type safety could be improved with Hono's typed routes
- ⚠️ Context variables not type-safe
- ⚠️ Handlers using `Context` type directly instead of typed context
- ⚠️ Route grouping could be more modular

## Goal

Implement Hono best practices for type safety, performance, and maintainability.

## Tasks

### 1. Typed App and Context

- [ ] Create typed Hono app with proper context variables
- [ ] Add type definitions for context variables (`currentUser`, etc.)

```typescript
// apps/api/types/app.types.ts
import { Hono } from "hono";
import { UserInformation } from "./UserInformation";

export type Variables = {
	currentUser: UserInformation;
};

export type Env = {
	Variables: Variables;
};

export type AppType = Hono<Env>;
```

```typescript
// apps/api/app.ts
import { Hono } from "hono";
import type { Env } from "./types/app.types";

const app = new Hono<Env>();

// Now c.get("currentUser") is properly typed
```

### 2. Typed Route Handlers

- [ ] Use typed handlers instead of `Context`
- [ ] Leverage TypeScript inference

```typescript
// Before
export const AuthHandler = {
  login: async (c: Context) => { ... }
};

// After
import type { Env } from "../types/app.types";

export const AuthHandler = {
  login: async (c: Context<Env>) => {
    const user = c.get("currentUser"); // Properly typed!
    // ...
  }
};
```

### 3. Use Factory Pattern for Handler Creation

- [ ] Create handler factory for better type inference
- [ ] Reduce boilerplate in handlers

```typescript
// packages/toolkit/handler-factory.ts
import { Env } from "@api/types/app.types";
import { Context } from "hono";

export const createHandler = <T>(handler: (c: Context<Env>) => Promise<T>) =>
	handler;
```

### 4. Streaming Responses (Where Applicable)

- [ ] Use `c.stream()` for large responses
- [ ] Implement SSE for real-time features if needed

```typescript
// Example: Large data export
app.get("/export", async (c) => {
	return c.stream(async (stream) => {
		for await (const chunk of generateData()) {
			await stream.write(chunk);
		}
	});
});
```

### 5. Middleware Optimization

- [ ] Use `hono/timing` for performance monitoring
- [ ] Add request ID middleware for tracing
- [ ] Implement cache middleware for appropriate routes

```typescript
import { timing, startTime, endTime } from "hono/timing";

app.use("*", timing());

app.get("/data", async (c) => {
	startTime(c, "db", "Database Query");
	const data = await db.query();
	endTime(c, "db");
	return c.json(data);
});
```

### 6. Request ID and Tracing

- [ ] Add request ID middleware
- [ ] Include request ID in all logs
- [ ] Return request ID in responses for debugging

```typescript
// apps/api/middlewares/request-id.middleware.ts
import { nanoid } from "nanoid";

export const requestIdMiddleware: MiddlewareHandler = async (c, next) => {
	const requestId = c.req.header("x-request-id") || nanoid();
	c.set("requestId", requestId);
	c.header("X-Request-ID", requestId);
	await next();
};
```

### 7. Better Route Organization

- [ ] Use route groups more effectively
- [ ] Implement versioned API routes

```typescript
// apps/api/routes/v1/index.ts
const v1 = new Hono();
v1.route("/auth", authRoutes);
v1.route("/users", userRoutes);
v1.route("/settings", settingsRoutes);

// apps/api/routes/index.ts
const routes = new Hono();
routes.route("/v1", v1);
routes.get("/health", healthCheck);
```

### 8. Graceful Shutdown

- [ ] Implement proper shutdown handling
- [ ] Close database connections gracefully
- [ ] Drain existing requests

```typescript
// apps/api/serve.ts
const shutdown = async () => {
	console.log("Shutting down gracefully...");
	await db.$disconnect();
	await redis.quit();
	process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
```

### 9. Compression Middleware

- [ ] Add compression for responses
- [ ] Only compress appropriate content types

```typescript
import { compress } from "hono/compress";

app.use("*", compress());
```

### 10. ETag Support

- [ ] Add ETag middleware for caching
- [ ] Implement conditional responses

```typescript
import { etag } from "hono/etag";

app.use("*", etag());
```

## Resources

- [Hono Documentation](https://hono.dev/)
- [Hono Best Practices](https://hono.dev/docs/guides/best-practices)
- [Hono Middleware](https://hono.dev/docs/middleware/builtin)

## Success Criteria

- [ ] All context variables are type-safe
- [ ] Handlers use typed context
- [ ] Request IDs in all requests/responses
- [ ] Performance timing in place
- [ ] Compression enabled
- [ ] Graceful shutdown implemented

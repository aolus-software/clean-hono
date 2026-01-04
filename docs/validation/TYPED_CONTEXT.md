# Typed Context in Hono - Benefits & Examples

## What Changed?

### Before (Untyped Context) ❌

```typescript
// app.ts
const app: Hono = new Hono();

// middleware
export const AuthMiddleware: MiddlewareHandler = async (c, next) => {
	c.set("currentUser", user); // No type checking
	await next();
};

// handler
ProfileRoutes.openapi(GetProfileRoute, (c) => {
	// Manual type annotation required
	const user: UserInformation | null = c.get("currentUser");

	// Need to check for null
	if (!user) {
		return ResponseToolkit.error(c, "Unauthorized", 401);
	}

	return ResponseToolkit.success(c, user, "Success", 200);
});
```

### After (Typed Context) ✅

```typescript
// app.ts
import type { Env } from "./types/app.types";
const app = new Hono<Env>();

// middleware
export const AuthMiddleware = async (
	c: Context<Env>,
	next: () => Promise<void>,
) => {
	c.set("currentUser", user); // ✨ Type checked!
	await next();
};

// handler
ProfileRoutes.openapi(GetProfileRoute, (c) => {
	// ✨ Automatically typed as UserInformation
	const user = c.get("currentUser");

	// No need for null check - middleware guarantees it exists
	return ResponseToolkit.success(c, user, "Success", 200);
});
```

---

## Benefits

### 1. **Type Safety** 🔒

```typescript
// ❌ Before: No error if you make a typo
const user = c.get("curentUser"); // Returns undefined, no warning

// ✅ After: TypeScript catches typos
const user = c.get("curentUser"); // ❌ Error: Property 'curentUser' does not exist
const user = c.get("currentUser"); // ✅ Correct
```

### 2. **Autocomplete** 💡

```typescript
// Type 'c.get(' and your IDE will suggest:
c.get("currentUser"); // ✨ Autocompleted!

// No more guessing what variables are in context
```

### 3. **No Manual Type Annotations** 🎯

```typescript
// ❌ Before: Manual annotation on every use
const user: UserInformation | null = c.get("currentUser");

// ✅ After: Inferred automatically
const user = c.get("currentUser"); // Type: UserInformation
```

### 4. **Refactoring Safety** 🛡️

```typescript
// If you change the variable name in types/app.types.ts:
export type Variables = {
	authenticatedUser: UserInformation; // Changed from 'currentUser'
};

// All usages of c.get("currentUser") will show errors
// You can't forget to update any file!
```

### 5. **Better IntelliSense** 🧠

```typescript
const user = c.get("currentUser");
user.id; // ✨ Autocompletes all UserInformation properties
user.email; // ✨ TypeScript knows the type
user.roles; // ✨ Full IDE support
```

---

## How It Works

### 1. Define Your Context Variables

```typescript
// apps/api/types/app.types.ts
export type Variables = {
	currentUser: UserInformation;
	requestId?: string; // Optional variables
	startTime?: number;
};

export type Env = {
	Variables: Variables;
};
```

### 2. Use It in Your App

```typescript
// apps/api/app.ts
import type { Env } from "./types/app.types";

const app = new Hono<Env>();
```

### 3. Use It in Middleware

```typescript
// packages/middlewares/auth.middleware.ts
import { Context } from "hono";
import type { Env } from "../../apps/api/types/app.types";

export const AuthMiddleware = async (
	c: Context<Env>,
	next: () => Promise<void>,
) => {
	// ... auth logic
	c.set("currentUser", user); // ✨ Type safe!
	await next();
};
```

### 4. Use It in Routes

```typescript
// apps/api/modules/profile/routes.ts
import type { Env } from "../../types/app.types";

const ProfileRoutes = new OpenAPIHono<Env>({ defaultHook });

ProfileRoutes.openapi(GetProfileRoute, (c) => {
	const user = c.get("currentUser"); // ✨ Typed as UserInformation
	// ... use user
});
```

---

## Example: Adding More Context Variables

Want to add request ID tracking?

```typescript
// 1. Add to types/app.types.ts
export type Variables = {
	currentUser: UserInformation;
	requestId: string; // ✨ New variable
};

// 2. Set it in middleware
app.use("*", async (c, next) => {
	c.set("requestId", crypto.randomUUID());
	await next();
});

// 3. Use it anywhere with full type safety
app.use("*", async (c, next) => {
	const requestId = c.get("requestId"); // ✨ Typed as string
	logger.info({ requestId }, "Processing request");
	await next();
});
```

---

## Common Pattern: Request Metadata

```typescript
// types/app.types.ts
export type Variables = {
	currentUser: UserInformation;
	requestId: string;
	startTime: number;
	userAgent: string;
	ipAddress: string;
};

// middleware
app.use("*", async (c, next) => {
	c.set("requestId", crypto.randomUUID());
	c.set("startTime", Date.now());
	c.set("userAgent", c.req.header("user-agent") || "unknown");
	c.set("ipAddress", c.req.header("x-forwarded-for") || "unknown");
	await next();
});

// Now all handlers can access this with full type safety!
```

---

## Files Updated

✅ Created: [apps/api/types/app.types.ts](apps/api/types/app.types.ts)  
✅ Updated: [apps/api/app.ts](apps/api/app.ts) - Added typed Env  
✅ Updated: [packages/middlewares/auth.middleware.ts](packages/middlewares/auth.middleware.ts) - Typed context  
✅ Updated: [apps/api/modules/profile/routes.ts](apps/api/modules/profile/routes.ts) - Removed manual annotations

---

## Summary

**Typed Context** means TypeScript knows exactly what variables you can store and retrieve from `c.get()` and `c.set()`, giving you:

- 🔒 **Type safety** - catch errors at compile time
- 💡 **Autocomplete** - faster development
- 🎯 **No manual types** - less boilerplate
- 🛡️ **Refactoring safety** - confident changes
- 🧠 **Better IDE support** - full IntelliSense

Instead of treating the context like a mystery box, TypeScript now knows exactly what's inside!

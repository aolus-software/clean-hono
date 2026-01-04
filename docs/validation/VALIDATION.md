# Input Validation with Zod

This project uses **Zod** for robust, type-safe input validation integrated with Hono via `@hono/zod-openapi`.

## Overview

✅ **Type-safe validation** - TypeScript knows your data types  
✅ **Automatic OpenAPI docs** - Schemas generate API documentation  
✅ **Centralized schemas** - Reusable validation patterns  
✅ **Runtime + compile-time safety** - Validated at both levels

---

## Quick Start

### 1. Define Your Schema

```typescript
// apps/api/modules/auth/schema.ts
import { z } from "zod";
import { EmailSchema, StrongPasswordSchema } from "@packages/schemas";

export const LoginSchema = z.object({
	email: EmailSchema,
	password: z.string().min(8),
});
```

### 2. Use in Route Definition

```typescript
// apps/api/modules/auth/routes.ts
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { LoginSchema } from "./schema";

const loginRoute = createRoute({
	method: "post",
	path: "/login",
	request: {
		body: {
			content: {
				"application/json": {
					schema: LoginSchema, // ✨ Schema here
				},
			},
		},
	},
	responses: {
		// ... response definitions
	},
});
```

### 3. Access Validated Data

```typescript
AuthRoutes.openapi(loginRoute, async (c) => {
	// ✨ Automatically validated and typed!
	const { email, password } = c.req.valid("json");

	// TypeScript knows: email is string, password is string
	const result = await authService.login(email, password);

	return ResponseToolkit.success(c, result, "Login successful", 200);
});
```

---

## Common Reusable Schemas

Located in [packages/schemas/common.schemas.ts](packages/schemas/common.schemas.ts):

### Basic Fields

```typescript
import {
	EmailSchema,
	PasswordSchema,
	StrongPasswordSchema,
	UUIDSchema,
	NameSchema,
	OptionalRemarksSchema,
} from "@packages/schemas";

// Use in your schemas
const UserSchema = z.object({
	name: NameSchema, // string, min 1, max 255
	email: EmailSchema, // valid email, max 255
	password: StrongPasswordSchema, // strong password regex
});
```

### Pagination & Sorting

```typescript
import { PaginatedQuerySchema, SortQuerySchema } from "@packages/schemas";

// Query params: ?page=1&limit=10&sortBy=name&sortOrder=asc
const getUsersRoute = createRoute({
	method: "get",
	path: "/users",
	request: {
		query: PaginatedQuerySchema,
	},
	// ...
});

// In handler
const { page, limit, sortBy, sortOrder } = c.req.valid("query");
```

### UUID Parameters

```typescript
import { UUIDParamSchema } from "@packages/schemas";

// Route: /users/:id
const getUserRoute = createRoute({
	method: "get",
	path: "/users/{id}",
	request: {
		params: UUIDParamSchema,
	},
	// ...
});

// In handler
const { id } = c.req.valid("param"); // Validated UUID
```

---

## Validation Patterns

### Request Body Validation

```typescript
const createRoute = createRoute({
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateUserSchema,
				},
			},
		},
	},
});

// Access validated body
const body = c.req.valid("json");
```

### Query Parameter Validation

```typescript
const listRoute = createRoute({
	request: {
		query: PaginationQuerySchema,
	},
});

// Access validated query params
const query = c.req.valid("query");
```

### Path Parameter Validation

```typescript
const getByIdRoute = createRoute({
	request: {
		params: z.object({ id: z.string().uuid() }),
	},
});

// Access validated path params
const params = c.req.valid("param");
```

### Header Validation

```typescript
const secureRoute = createRoute({
	request: {
		headers: z.object({
			"x-api-key": z.string(),
		}),
	},
});

// Access validated headers
const headers = c.req.valid("header");
```

---

## Advanced Validation

### Custom Validators

```typescript
import { z } from "zod";

// Custom email domain validator
const CorporateEmailSchema = z
	.string()
	.email()
	.refine(
		(email) => email.endsWith("@company.com"),
		"Must be a corporate email",
	);

// Password match validation
const PasswordChangeSchema = z
	.object({
		password: StrongPasswordSchema,
		password_confirmation: z.string(),
	})
	.refine((data) => data.password === data.password_confirmation, {
		message: "Passwords do not match",
		path: ["password_confirmation"],
	});
```

### Async Validation (Database Checks)

```typescript
import { z } from "zod";
import { UserRepository } from "@postgres/repositories";

// Check if email is unique
const UniqueEmailSchema = z
	.string()
	.email()
	.refine(
		async (email) => {
			const user = await UserRepository().findByEmail(email);
			return !user; // Returns true if email is unique
		},
		{
			message: "Email already exists",
		},
	);

const RegisterSchema = z.object({
	email: UniqueEmailSchema,
	// ... other fields
});
```

### Transformations

```typescript
// Trim and lowercase email
const EmailSchema = z
	.string()
	.email()
	.transform((val) => val.trim().toLowerCase());

// Parse JSON string to object
const MetadataSchema = z.string().transform((val) => {
	try {
		return JSON.parse(val);
	} catch {
		throw new Error("Invalid JSON");
	}
});
```

### Conditional Validation

```typescript
// Optional field that becomes required based on another field
const ConditionalSchema = z
	.object({
		type: z.enum(["user", "admin"]),
		adminCode: z.string().optional(),
	})
	.refine(
		(data) => {
			if (data.type === "admin") {
				return data.adminCode !== undefined;
			}
			return true;
		},
		{
			message: "Admin code is required for admin users",
			path: ["adminCode"],
		},
	);
```

---

## Schema Composition

### Extending Schemas

```typescript
const BaseUserSchema = z.object({
	name: z.string(),
	email: z.string().email(),
});

// Add more fields
const FullUserSchema = BaseUserSchema.extend({
	password: z.string().min(8),
	role: z.enum(["user", "admin"]),
});
```

### Picking Fields

```typescript
// Only name and email
const UserProfileSchema = FullUserSchema.pick({
	name: true,
	email: true,
});
```

### Omitting Fields

```typescript
// Everything except password
const PublicUserSchema = FullUserSchema.omit({
	password: true,
});
```

### Partial (All Optional)

```typescript
// Make all fields optional for update
const UpdateUserSchema = FullUserSchema.partial();
```

### Merging Schemas

```typescript
const AddressSchema = z.object({
	street: z.string(),
	city: z.string(),
});

const UserWithAddressSchema = BaseUserSchema.merge(AddressSchema);
```

---

## Type Inference

Zod automatically infers TypeScript types from schemas:

```typescript
const UserSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string().email(),
	age: z.number().optional(),
});

// Infer the TypeScript type
type User = z.infer<typeof UserSchema>;
// Result:
// {
//   id: string;
//   name: string;
//   email: string;
//   age?: number | undefined;
// }

// Use in functions
function createUser(data: User) {
	// TypeScript knows all the types!
}
```

---

## Error Handling

Zod validation errors are automatically handled by the error handler:

```typescript
// packages/errors/error.handler.ts
if (err instanceof ZodError) {
	return c.json(
		{
			success: false,
			message: "Validation failed",
			errors: formatZodError(err),
			data: null,
		},
		422,
	);
}
```

Error response format:

```json
{
	"success": false,
	"message": "Validation failed",
	"errors": [
		{
			"field": "email",
			"message": "Invalid email format"
		},
		{
			"field": "password",
			"message": "Password must be at least 8 characters"
		}
	],
	"data": null
}
```

---

## Best Practices

### ✅ DO

1. **Use common schemas** for consistency

   ```typescript
   import { EmailSchema, UUIDSchema } from "@packages/schemas";
   ```

2. **Define schemas in module's `schema.ts`**

   ```
   apps/api/modules/auth/schema.ts
   apps/api/modules/users/schema.ts
   ```

3. **Keep schemas close to routes** for easy maintenance

4. **Use type inference** instead of manual types

   ```typescript
   type LoginPayload = z.infer<typeof LoginSchema>;
   ```

5. **Add meaningful error messages**
   ```typescript
   z.string().min(8, "Password must be at least 8 characters");
   ```

### ❌ DON'T

1. **Don't define schemas inline** - use separate schema files

   ```typescript
   // ❌ Bad
   createRoute({
   	request: {
   		body: z.object({ email: z.string() }),
   	},
   });

   // ✅ Good
   createRoute({
   	request: {
   		body: { schema: LoginSchema },
   	},
   });
   ```

2. **Don't duplicate validation logic** - use common schemas

3. **Don't use `any` or skip validation** - defeats the purpose

4. **Don't forget to export schemas** for reuse

---

## Migration from VineJS

VineJS is **NOT** used in this project. Everything is Zod! 🎉

If you see VineJS references in todos or old docs, ignore them - the codebase is already fully Zod-based.

---

## Available Common Schemas

See [packages/schemas/common.schemas.ts](packages/schemas/common.schemas.ts):

- `EmailSchema`
- `PasswordSchema`
- `StrongPasswordSchema`
- `UUIDSchema`
- `NameSchema`
- `OptionalRemarksSchema`
- `PaginationQuerySchema`
- `SortQuerySchema`
- `PaginatedQuerySchema`
- `UUIDParamSchema`
- `SlugParamSchema`
- `DateSchema`
- `DateRangeSchema`
- `UserStatusSchema`
- `SearchQuerySchema`
- `FilterQuerySchema`
- `TokenSchema`
- `PasswordConfirmationSchema`
- `BulkIdSchema`

See [packages/schemas/validation.helpers.ts](packages/schemas/validation.helpers.ts) for utilities:

- `InferSchema<T>` - Type inference helper
- `urlValidator` - URL validation
- `phoneValidator` - Phone number validation
- `slugValidator` - URL-friendly slug validation
- `trimmedString` - Auto-trim whitespace
- `lowercaseString` - Auto-lowercase
- And many more!

---

## Examples

### Complete Auth Example

```typescript
// schema.ts
import { EmailSchema, StrongPasswordSchema } from "@packages/schemas";
import { z } from "zod";

export const LoginSchema = z.object({
	email: EmailSchema,
	password: z.string().min(8),
});

export const RegisterSchema = z.object({
	name: z.string().min(3).max(255),
	email: EmailSchema,
	password: StrongPasswordSchema,
});

// routes.ts
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { LoginSchema, RegisterSchema } from "./schema";

const loginRoute = createRoute({
	method: "post",
	path: "/login",
	request: {
		body: {
			content: {
				"application/json": {
					schema: LoginSchema,
				},
			},
		},
	},
	responses: {
		// ... responses
	},
});

AuthRoutes.openapi(loginRoute, async (c) => {
	const { email, password } = c.req.valid("json");
	// Validated and type-safe!
	const result = await authService.login(email, password);
	return ResponseToolkit.success(c, result, "Success", 200);
});
```

---

## Summary

- ✅ **Zod is already set up** - no need to install anything
- ✅ **Common schemas created** - in `packages/schemas/`
- ✅ **Type-safe validation** - automatic with `c.req.valid()`
- ✅ **OpenAPI integration** - schemas auto-generate docs
- ✅ **Consistent patterns** - reusable across modules

Your validation setup is production-ready! 🚀

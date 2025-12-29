# TODO: Improve Input Validation

## Priority: Medium

## Current State

- Using VineJS for validation (`@vinejs/vine`)
- Validation schemas defined inline in handlers
- No centralized schema management
- Validation happens manually inside handlers

## Goal

Improve input validation with better organization, type inference, and Hono middleware integration.

## Tasks

### 1. Centralize Validation Schemas

- [ ] Create `apps/api/schemas/` directory
- [ ] Move all validation schemas from handlers
- [ ] Export schemas with consistent naming

```
apps/api/schemas/
├── auth.schema.ts
├── profile.schema.ts
├── settings/
│   ├── role.schema.ts
│   └── permission.schema.ts
└── index.ts
```

```typescript
// apps/api/schemas/auth.schema.ts
import vine from "@vinejs/vine";
import { StrongPassword } from "@default/strong-password";

export const loginSchema = vine.object({
	email: vine.string().email(),
	password: vine.string(),
});

export const registerSchema = vine.object({
	name: vine.string().maxLength(255),
	email: vine.string().email().maxLength(255),
	password: vine.string().regex(StrongPassword).confirmed(),
});

// ... etc
```

### 2. Create Validation Middleware

- [ ] Create reusable validation middleware
- [ ] Integrate with Hono's middleware system
- [ ] Type-safe validated data access

```typescript
// apps/api/middlewares/validate.middleware.ts
import vine, { VineValidator } from "@vinejs/vine";
import { MiddlewareHandler } from "hono";

export const validate = <T>(schema: VineValidator<T>): MiddlewareHandler => {
	return async (c, next) => {
		const body = await c.req.json();
		const validated = await vine.validate({
			schema,
			data: body,
		});
		c.set("validatedData", validated);
		await next();
	};
};

// Usage in routes
import { loginSchema } from "../schemas/auth.schema";
import { validate } from "../middlewares/validate.middleware";

authRoutes.post("/login", validate(loginSchema), AuthHandler.login);
```

### 3. Add Request Body Type Inference

- [ ] Create type helpers for VineJS schemas
- [ ] Enable TypeScript inference from schemas

```typescript
// packages/toolkit/validation.ts
import { Infer } from "@vinejs/vine";

// Type inference helper
export type SchemaType<T> = Infer<typeof T>;

// In handler
import { loginSchema } from "../schemas/auth.schema";
type LoginPayload = SchemaType<typeof loginSchema>;
```

### 4. Query Parameter Validation

- [ ] Add validation for query parameters
- [ ] Create query validation schemas
- [ ] Handle type coercion (string to number, etc.)

```typescript
// apps/api/schemas/common.schema.ts
import vine from "@vinejs/vine";

export const paginationSchema = vine.object({
	page: vine.number().min(1).optional(),
	limit: vine.number().min(1).max(100).optional(),
	sortBy: vine.string().optional(),
	sortOrder: vine.enum(["asc", "desc"]).optional(),
});

// Query validation middleware
export const validateQuery = <T>(
	schema: VineValidator<T>,
): MiddlewareHandler => {
	return async (c, next) => {
		const query = c.req.query();
		const validated = await vine.validate({
			schema,
			data: query,
		});
		c.set("validatedQuery", validated);
		await next();
	};
};
```

### 5. Path Parameter Validation

- [ ] Validate path parameters (UUIDs, etc.)
- [ ] Create reusable param validators

```typescript
// apps/api/schemas/params.schema.ts
import vine from "@vinejs/vine";

export const uuidParamSchema = vine.object({
	id: vine.string().uuid(),
});

// apps/api/middlewares/validate-params.middleware.ts
export const validateParams = <T>(
	schema: VineValidator<T>,
): MiddlewareHandler => {
	return async (c, next) => {
		const params = c.req.param();
		const validated = await vine.validate({
			schema,
			data: params,
		});
		c.set("validatedParams", validated);
		await next();
	};
};
```

### 6. Custom Validation Rules

- [ ] Create common custom rules
- [ ] Add rule for unique email check
- [ ] Add rule for existing resource check

```typescript
// packages/default/validation-rules.ts
import vine from "@vinejs/vine";
import { FieldContext } from "@vinejs/vine/types";
import { UserRepository } from "@api/repositories";

// Unique email rule
const uniqueEmail = vine.createRule(
	async (value: unknown, _options, field: FieldContext) => {
		if (typeof value !== "string") return;

		const exists = await UserRepository().findByEmail(value);
		if (exists) {
			field.report("Email already exists", "unique", field);
		}
	},
);

// Usage
vine.string().email().use(uniqueEmail());
```

### 7. Error Message Customization

- [ ] Customize validation error messages
- [ ] Support i18n for error messages
- [ ] Consistent error format

```typescript
// config/validation-messages.ts
export const validationMessages = {
	required: "The {{ field }} field is required",
	email: "Please provide a valid email address",
	minLength: "The {{ field }} must be at least {{ min }} characters",
	maxLength: "The {{ field }} cannot exceed {{ max }} characters",
	confirmed: "The {{ field }} confirmation does not match",
	// ... etc
};
```

### 8. Sanitization

- [ ] Add input sanitization
- [ ] Trim strings
- [ ] Normalize email addresses
- [ ] Remove HTML tags where appropriate

```typescript
// Using VineJS transforms
const userSchema = vine.object({
	email: vine
		.string()
		.email()
		.transform((val) => val.toLowerCase().trim()),
	name: vine.string().trim().escape(),
});
```

## Resources

- [VineJS Documentation](https://vinejs.dev/)
- [Hono Validation](https://hono.dev/docs/guides/validation)
- [Zod (Alternative)](https://zod.dev/)

## Success Criteria

- [ ] All schemas in dedicated files
- [ ] Validation middleware in use
- [ ] Type-safe validated data access
- [ ] Query and param validation implemented
- [ ] Custom validation rules documented
- [ ] Consistent error messages

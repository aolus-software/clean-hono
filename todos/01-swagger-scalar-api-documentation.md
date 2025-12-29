# TODO: Implement Swagger with Scalar for API Documentation

## Priority: High

## Current State

- Currently using Postman collection for API documentation (`docs/Clean Hono.postman_collection.json`)
- No interactive API documentation available
- No OpenAPI/Swagger specification

## Goal

Implement comprehensive API documentation using Hono's OpenAPI integration with Scalar UI for a beautiful, interactive documentation experience.

## Tasks

### 1. Install Required Dependencies

```bash
bun add @hono/swagger-ui @hono/zod-openapi zod
# Or for Scalar (recommended):
bun add @scalar/hono-api-reference hono-zod-openapi
```

### 2. Define OpenAPI Schemas

- [ ] Create `apps/api/schemas/` directory for Zod schemas
- [ ] Convert VineJS validations to Zod schemas (or use alongside)
- [ ] Create schemas for:
  - [ ] Auth schemas (login, register, verify, forgot/reset password)
  - [ ] User/Profile schemas
  - [ ] Settings schemas (roles, permissions)
  - [ ] Common response schemas

### 3. Create OpenAPI Route Definitions

- [ ] Refactor routes to use `createRoute` from `@hono/zod-openapi`
- [ ] Add proper request/response types
- [ ] Add descriptions and examples for each endpoint
- [ ] Group routes by tags (auth, users, settings, etc.)

### 4. Setup Scalar UI

- [ ] Create `apps/api/docs/openapi.ts` for OpenAPI configuration
- [ ] Add Scalar reference route at `/docs` or `/api-docs`
- [ ] Configure Scalar theme to match project branding
- [ ] Add authentication support (Bearer token input)

### 5. Document All Endpoints

- [ ] `POST /auth/login` - Login with email/password
- [ ] `POST /auth/register` - Register new user
- [ ] `POST /auth/resend-verification` - Resend email verification
- [ ] `POST /auth/verify-email` - Verify email with token
- [ ] `POST /auth/forgot-password` - Request password reset
- [ ] `POST /auth/reset-password` - Reset password with token
- [ ] Profile endpoints
- [ ] Settings endpoints (roles, permissions)

### 6. Add Examples and Error Responses

- [ ] Add request examples for each endpoint
- [ ] Document all error response codes (400, 401, 403, 404, 422, 500)
- [ ] Add validation error response examples

## Example Implementation

```typescript
// apps/api/docs/openapi.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";

const app = new OpenAPIHono();

// OpenAPI spec endpoint
app.doc("/openapi.json", {
	openapi: "3.0.0",
	info: {
		title: "Clean Hono API",
		version: "1.0.0",
		description: "Clean Architecture API built with Hono",
	},
	servers: [
		{ url: "http://localhost:3000", description: "Development" },
		{ url: "https://api.example.com", description: "Production" },
	],
});

// Scalar UI
app.get(
	"/docs",
	apiReference({
		spec: { url: "/openapi.json" },
		theme: "purple",
	}),
);
```

## Resources

- [Hono OpenAPI Documentation](https://hono.dev/examples/zod-openapi)
- [Scalar API Reference](https://github.com/scalar/scalar)
- [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)

## Success Criteria

- [ ] Interactive API documentation available at `/docs`
- [ ] All endpoints documented with examples
- [ ] Postman collection can be retired or auto-generated
- [ ] New developers can onboard quickly using documentation
